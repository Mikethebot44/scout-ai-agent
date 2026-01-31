import { getAdminUserOrThrow } from "@/lib/auth-server";
import { db } from "@/lib/db";
import * as schema from "@scout/shared/db/schema";
import { inArray, and, gte, countDistinct, eq } from "drizzle-orm";
import { AbuseDetectionTable } from "./table";
import { getUserListForAdminPage, UserForAdminPage } from "@/server-lib/admin";

export interface UserWithSharedRepos extends UserForAdminPage {
  sharedRepos: string[];
  sharedRepoCount: number;
}

export default async function AbuseDetectionPage() {
  await getAdminUserOrThrow();

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Query 1: Find all repos with multiple users in the past month
  const reposWithMultipleUsers = await db
    .select({
      githubRepoFullName: schema.thread.githubRepoFullName,
      userCount: countDistinct(schema.thread.userId),
    })
    .from(schema.thread)
    .where(gte(schema.thread.createdAt, oneMonthAgo))
    .groupBy(schema.thread.githubRepoFullName)
    .having(({ userCount }) => gte(userCount, 2));

  const sharedRepoNames = reposWithMultipleUsers.map(
    (r) => r.githubRepoFullName,
  );

  const threadsOnSharedRepos = await db
    .selectDistinct({
      user: schema.user,
      githubRepoFullName: schema.thread.githubRepoFullName,
    })
    .from(schema.thread)
    .innerJoin(schema.user, eq(schema.thread.userId, schema.user.id))
    .where(
      and(
        inArray(schema.thread.githubRepoFullName, sharedRepoNames),
        gte(schema.thread.createdAt, oneMonthAgo),
      ),
    );

  // Group repos by user
  const userMap = new Map<
    string,
    {
      user: typeof schema.user.$inferSelect;
      repos: Set<string>;
    }
  >();
  for (const row of threadsOnSharedRepos) {
    if (!userMap.has(row.user.id)) {
      userMap.set(row.user.id, {
        user: row.user,
        repos: new Set(),
      });
    }
    userMap.get(row.user.id)!.repos.add(row.githubRepoFullName);
  }

  const users = Array.from(userMap.values()).map((u) => u.user);
  const usersWithAdminData = await getUserListForAdminPage(users);

  // Combine data
  const finalData: UserWithSharedRepos[] = usersWithAdminData.map((user) => {
    const repos = Array.from(userMap.get(user.id)?.repos ?? []).sort();
    return {
      ...user,
      sharedRepos: repos,
      sharedRepoCount: repos.length,
    };
  });

  // Sort by active trial first, then by shared repo count descending
  finalData.sort((a, b) => {
    const aHasTrial = a.signupTrialDaysRemaining > 0 ? 1 : 0;
    const bHasTrial = b.signupTrialDaysRemaining > 0 ? 1 : 0;

    // Active trials first
    if (aHasTrial !== bHasTrial) {
      return bHasTrial - aHasTrial;
    }

    // Then by shared repo count descending
    return b.sharedRepoCount - a.sharedRepoCount;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Abuse Detection</h1>
        <p className="text-sm text-muted-foreground">
          Users working on repositories with multiple users in the last 30 days
          (potential free trial abuse)
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="text-sm text-muted-foreground">
          Found {finalData.length} users working on shared repositories
        </div>
        <AbuseDetectionTable data={finalData} />
      </div>
    </div>
  );
}
