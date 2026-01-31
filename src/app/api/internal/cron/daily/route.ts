import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { env } from "@scout/env/apps-www";
import {
  getStalledThreads,
  stopStalledThreads,
  getScheduledThreadChatsDueToRun,
  getUserIdsWithThreadsReadyToProcess,
  getUserIdsWithThreadsStuckInQueue,
} from "@scout/shared/model/threads";
import { getScheduledAutomationsDueToRun } from "@scout/shared/model/automations";
import { maybeHibernateSandboxById } from "@/agent/sandbox";
import { internalPOST } from "@/server-lib/internal-request";
import { sandboxCreationRateLimit } from "@/lib/rate-limit";
import { getPostHogServer } from "@/lib/posthog-server";
import { runAutomation } from "@/server-lib/automations";

const BATCH_SIZE = 5;

async function sleep(ms: number = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runStalledTasks() {
  console.log("[Daily Cron] Processing stalled threads");
  const stalledThreads = await getStalledThreads({ db });
  console.log(`[Daily Cron] Found ${stalledThreads.length} stalled threads`);
  if (stalledThreads.length === 0) {
    return;
  }

  await stopStalledThreads({
    db,
    threadIds: stalledThreads.map((thread) => thread.id),
  });

  console.log("[Daily Cron] Hibernating sandboxes");
  for (let i = 0; i < stalledThreads.length; i += 10) {
    const batch = stalledThreads.slice(i, i + 10);
    await Promise.all(
      batch.map(async (thread) => {
        if (thread.codesandboxId) {
          try {
            await maybeHibernateSandboxById({
              threadId: thread.id,
              userId: thread.userId,
              sandboxId: thread.codesandboxId,
              sandboxProvider: thread.sandboxProvider,
            });
          } catch (error) {
            // Ignore errors
          }
        }
      }),
    );
    await sleep();
  }
}

async function runScheduledTasks() {
  console.log("[Daily Cron] Processing scheduled tasks");
  const dueThreadChats = await getScheduledThreadChatsDueToRun({ db });
  console.log(
    `[Daily Cron] Found ${dueThreadChats.length} thread chats due to run`,
  );

  for (let i = 0; i < dueThreadChats.length; i += BATCH_SIZE) {
    const batch = dueThreadChats.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (threadChat) => {
        await internalPOST(
          `process-scheduled-task/${threadChat.userId}/${threadChat.threadId}/${threadChat.threadChatId}`,
        );
      }),
    );
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;
    console.log(
      `[Daily Cron] Scheduled tasks batch completed. Success: ${successCount}, Failed: ${failureCount}`,
    );
    await sleep();
  }
}

async function runQueuedTasks() {
  console.log("[Daily Cron] Processing queued tasks");

  // Process rate-limited queues
  const userIds = await getUserIdsWithThreadsReadyToProcess({ db });
  console.log(
    `[Daily Cron] Found ${userIds.length} users with rate-limited threads`,
  );

  if (userIds.length > 0) {
    getPostHogServer().capture({
      distinctId: "system",
      event: "cron_queue_processing",
      properties: {
        usersWithRateLimitedThreads: userIds.length,
        queueType: "other_rate_limit",
      },
    });
  }

  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10);
    await Promise.allSettled(
      batch.map(async (userId) => {
        const rateLimitResult =
          await sandboxCreationRateLimit.getRemaining(userId);
        if (rateLimitResult.remaining === 0) {
          return;
        }
        await internalPOST(`process-thread-queue/${userId}`);
      }),
    );
    await sleep();
  }

  // Process concurrency-limited queues
  const stuckUserIds = await getUserIdsWithThreadsStuckInQueue({ db });
  console.log(
    `[Daily Cron] Found ${stuckUserIds.length} users with stuck threads`,
  );

  if (stuckUserIds.length > 0) {
    getPostHogServer().capture({
      distinctId: "system",
      event: "cron_queue_stuck_users",
      properties: {
        stuckUserCount: stuckUserIds.length,
        queueType: "tasks_concurrency",
      },
    });
  }

  for (let i = 0; i < stuckUserIds.length; i += 10) {
    const batch = stuckUserIds.slice(i, i + 10);
    await Promise.allSettled(
      batch.map(async (userId) => {
        await internalPOST(`process-thread-queue/${userId}`);
      }),
    );
    await sleep();
  }
}

async function runAutomations() {
  console.log("[Daily Cron] Processing automations");
  const dueAutomations = await getScheduledAutomationsDueToRun({ db });
  console.log(
    `[Daily Cron] Found ${dueAutomations.length} automations due to run`,
  );

  for (let i = 0; i < dueAutomations.length; i += BATCH_SIZE) {
    const batch = dueAutomations.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (automation) => {
        await runAutomation({
          automationId: automation.id,
          userId: automation.userId,
          source: "automated",
        });
      }),
    );
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;
    console.log(
      `[Daily Cron] Automations batch completed. Success: ${successCount}, Failed: ${failureCount}`,
    );
    await sleep();
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("[Daily Cron] Daily cron task triggered");

  try {
    // Always run stalled tasks cleanup
    await runStalledTasks();

    // Run scheduled tasks (checks DB for due items)
    await runScheduledTasks();

    // Run queued tasks (checks DB for pending items)
    await runQueuedTasks();

    // Run automations (checks DB for due automations)
    await runAutomations();

    console.log("[Daily Cron] Daily cron task completed");
    return Response.json({ success: true });
  } catch (error) {
    console.error("[Daily Cron] Error in daily cron task:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
