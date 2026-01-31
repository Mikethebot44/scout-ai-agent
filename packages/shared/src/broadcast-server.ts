import {
  BroadcastChannelUser,
  BroadcastUserMessage,
  getBroadcastChannelStr,
} from "@scout/types/broadcast";
import { env } from "@scout/env/pkg-shared";
import { publicBroadcastUrl } from "@scout/env/next-public";

export async function publishBroadcastUserMessage(
  message: BroadcastUserMessage,
) {
  // Skip publishing broadcast messages in tests
  if (process.env.NODE_ENV === "test") {
    return;
  }
  const partySocketUrl = publicBroadcastUrl();
  if (!partySocketUrl) {
    console.warn("Party socket URL not set");
    return;
  }
  const channel: BroadcastChannelUser = {
    type: "user",
    id: message.id,
  };
  await fetch(
    `${partySocketUrl}/parties/main/${getBroadcastChannelStr(channel)}`,
    {
      method: "POST",
      body: JSON.stringify(message),
      headers: {
        "X-Scout-Secret": env.INTERNAL_SHARED_SECRET!,
      },
    },
  );
}
