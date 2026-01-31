import { AIModel } from "@scout/agent/types";
import { getDefaultModelForAgent } from "@scout/agent/utils";
import { UserCredentials } from "@scout/shared";
import { UserFlags } from "@scout/shared";

export function getDefaultModel({
  userCredentials,
  userFlags,
}: {
  userCredentials: Pick<
    UserCredentials,
    "hasClaude" | "hasOpenAI" | "hasAmp"
  > | null;
  userFlags: UserFlags | null;
}): AIModel {
  if (userFlags?.selectedModel) {
    return userFlags.selectedModel;
  }
  if (!userCredentials?.hasClaude && userCredentials?.hasOpenAI) {
    return getDefaultModelForAgent({ agent: "codex", agentVersion: "latest" });
  }
  if (!userCredentials?.hasClaude && userCredentials?.hasAmp) {
    return getDefaultModelForAgent({ agent: "amp", agentVersion: "latest" });
  }
  return getDefaultModelForAgent({
    agent: "claudeCode",
    agentVersion: "latest",
  });
}

export function getCannotUseOpus({
  userFlags,
}: {
  userFlags: UserFlags | null;
}): boolean {
  // Opus is now available for all Claude Pro subscribers
  return false;
}
