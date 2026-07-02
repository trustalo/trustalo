/**
 * Channel dispatch: decrypts a channel's stored config at the last possible
 * moment and hands the alert to the type-specific sender. Throws on failure —
 * callers (evaluator tick, test-send endpoint) decide how to record it; the
 * decrypted secret never leaves this call stack.
 */

import {
  decryptChannelConfig,
  type EmailChannelConfig,
  type WebhookChannelConfig,
} from "../service.js";
import { sendEmailAlert } from "./email.js";
import { sendSlackAlert, sendTeamsAlert } from "./webhook.js";
import type { AlertMessage } from "./types.js";

export type { AlertMessage } from "./types.js";

export interface DeliverableChannel {
  id: string;
  type: "email" | "slack_webhook" | "teams_webhook";
  name: string;
  configEnc: string;
}

export async function deliverToChannel(
  channel: DeliverableChannel,
  message: AlertMessage,
): Promise<void> {
  const config = decryptChannelConfig(channel.configEnc);
  switch (channel.type) {
    case "email":
      await sendEmailAlert((config as EmailChannelConfig).recipients, message);
      return;
    case "slack_webhook":
      await sendSlackAlert((config as WebhookChannelConfig).url, message);
      return;
    case "teams_webhook":
      await sendTeamsAlert((config as WebhookChannelConfig).url, message);
      return;
  }
}
