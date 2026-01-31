export type SubscriptionPlanId = "core" | "pro" | "enterprise";

export interface SubscriptionPlanConfig {
  id: SubscriptionPlanId;
  name: string;
  price: string;
  period?: string;
  description: string;
  billingBlurb?: string;
  features: string[];
  badge?: string;
}

export const SUBSCRIPTION_PLAN_CONFIG: Record<
  SubscriptionPlanId,
  SubscriptionPlanConfig
> = {
  core: {
    id: "core",
    name: "Core",
    price: "$25",
    period: "per month",
    description:
      "Ideal for individuals who want to orchestrate multiple agents.",
    billingBlurb: "For individuals",
    features: [
      "3 parallel tasks",
      "5 automations",
      "GitHub integration",
      "Slack integration",
      "Connect ChatGPT or Claude subscription",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: "$50",
    period: "per month",
    description:
      "Built for power users who need more throughput and larger sandboxes.",
    billingBlurb: "For power users",
    features: [
      "10 parallel tasks",
      "Unlimited automations",
      "GitHub integration",
      "Slack integration",
      "Connect ChatGPT or Claude subscription"
    ],
    badge: "Recommended",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: "Contact us",
    description: "For teams",
    features: [
      "Bring Your Own Sandboxes",
      "Team Automations",
      "Team Environments",
      "Custom Integrations",
    ],
  },
};
