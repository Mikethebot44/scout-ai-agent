import { IntegrationsSettings } from "@/components/settings/tab/integrations";
import { getUserIdOrRedirect } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { getSlackAccounts } from "@scout/shared/model/slack";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations Settings | Scout",
};

export default async function IntegrationsSettingsPage() {
  const userId = await getUserIdOrRedirect();
  const slackAccounts = await getSlackAccounts({ db, userId });
  return <IntegrationsSettings slackAccounts={slackAccounts} />;
}
