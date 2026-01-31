import { daemonAsStr, mcpServerAsStr } from "@scout/bundled";

export function getDaemonFile() {
  return daemonAsStr;
}

export function getMcpServerFile() {
  return mcpServerAsStr;
}

export const sandboxTimeoutMs = 1000 * 60 * 15; // 15 minutes
export const scoutSetupScriptTimeoutMs = 1000 * 60 * 15; // 15 minutes
