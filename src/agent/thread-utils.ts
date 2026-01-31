import { ThreadInfo } from "@scout/shared";

export function getThreadTitle(thread: Pick<ThreadInfo, "name">) {
  if (thread.name) {
    return thread.name;
  }
  return "Untitled";
}

export function getThreadDocumentTitle(
  thread: Pick<ThreadInfo, "name" | "isUnread">,
) {
  if (thread.isUnread) {
    return `(1) ${getThreadTitle(thread)} | Scout`;
  }
  return `${getThreadTitle(thread)} | Scout`;
}
