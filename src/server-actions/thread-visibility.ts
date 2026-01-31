"use server";

import { updateThreadVisibility } from "@scout/shared/model/thread-visibility";
import { userOnlyAction } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { ThreadVisibility } from "@scout/shared/db/types";

export const updateThreadVisibilityAction = userOnlyAction(
  async function updateThreadVisibilityAction(
    userId: string,
    {
      threadId,
      visibility,
    }: {
      threadId: string;
      visibility: ThreadVisibility;
    },
  ) {
    await updateThreadVisibility({ db, userId, threadId, visibility });
  },
  { defaultErrorMessage: "Failed to update task visibility" },
);
