"use server";

import { adminOnly } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { User } from "@scout/shared";
import { getAutomationForAdmin as getAutomationForAdminModel } from "@scout/shared/model/automations";

export const getAutomationForAdmin = adminOnly(
  async function getAutomationForAdmin(adminUser: User, automationId: string) {
    return await getAutomationForAdminModel({ db, automationId });
  },
);
