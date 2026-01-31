import { atom, useAtomValue } from "jotai";
import { getUserCredentialsAction } from "@/server-actions/user-credentials";
import { AIAgent } from "@scout/agent/types";
import { UserCredentials } from "@scout/shared";

export const userCredentialsAtom = atom<UserCredentials | null>(null);

export const userCredentialsRefetchAtom = atom(null, async (_get, set) => {
  const credentialsResult = await getUserCredentialsAction();
  if (!credentialsResult.success) {
    console.error(credentialsResult.errorMessage);
    return;
  }
  set(userCredentialsAtom, credentialsResult.data);
});

type CredentialInfo = {
  canInvokeAgent: boolean;
  hasCredentials: boolean;
};

export function useCredentialInfoForAgent(
  agent: AIAgent,
): CredentialInfo | null {
  const credentials = useAtomValue(userCredentialsAtom);
  if (!credentials) {
    return null;
  }
  let hasCredentials = false;
  switch (agent) {
    case "claudeCode":
      hasCredentials = credentials.hasClaude;
      break;
    case "amp":
      hasCredentials = credentials.hasAmp;
      break;
    case "codex":
      hasCredentials = credentials.hasOpenAI;
      break;
    default:
      const _exhaustiveCheck: never = agent;
      console.warn("Unknown agent", _exhaustiveCheck);
      break;
  }

  return {
    canInvokeAgent: hasCredentials,
    hasCredentials,
  };
}
