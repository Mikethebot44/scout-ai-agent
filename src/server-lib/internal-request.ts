import { env } from "@scout/env/apps-www";
import { publicAppUrl } from "@scout/env/next-public";

export async function internalPOST(path: string) {
  console.log(`internalPOST ${path}`);
  if (path.startsWith("/") || path.startsWith("http")) {
    throw new Error("Path must not start with / or http");
  }
  return fetch(`${publicAppUrl()}/api/internal/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Scout-Secret": env.INTERNAL_SHARED_SECRET,
    },
  });
}

export async function isAnthropicDownPOST() {
  console.log(`isAnthropicDownPOST`);
  if (!env.IS_ANTHROPIC_DOWN_URL || !env.IS_ANTHROPIC_DOWN_API_SECRET) {
    console.log("IS_ANTHROPIC_DOWN_URL or IS_ANTHROPIC_DOWN_API_SECRET not configured, skipping");
    return;
  }
  try {
    await fetch(`${env.IS_ANTHROPIC_DOWN_URL}/api/internal/report-issue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-SECRET": env.IS_ANTHROPIC_DOWN_API_SECRET,
      },
    });
  } catch (error) {
    console.error("Error reporting issue:", error);
  }
}
