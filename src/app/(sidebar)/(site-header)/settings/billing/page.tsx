import { getUserIdOrRedirect } from "@/lib/auth-server";
import { BillingSettings } from "@/components/settings/tab/billing";
import type { Metadata } from "next";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { billingInfoQueryOptions } from "@/queries/billing-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Billing | Scout",
};

export default async function BillingSettingsPage() {
  await getUserIdOrRedirect();
  // Prefetch billing status so the page has data on first render
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(billingInfoQueryOptions());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BillingSettings />
    </HydrationBoundary>
  );
}
