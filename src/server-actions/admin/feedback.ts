"use server";

import { adminOnly } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { User } from "@scout/shared";
import {
  getFeedbackListForAdmin,
  updateFeedbackStatusForAdmin,
} from "@scout/shared/model/feedback";

export const getFeedbackList = adminOnly(async function getFeedbackList() {
  return await getFeedbackListForAdmin({ db });
});

export const updateFeedbackStatus = adminOnly(
  async function updateFeedbackStatus(
    adminUser: User,
    feedbackId: string,
    resolved: boolean,
  ) {
    await updateFeedbackStatusForAdmin({ db, feedbackId, resolved });
    return { success: true };
  },
);
