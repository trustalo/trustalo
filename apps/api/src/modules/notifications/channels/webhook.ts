/**
 * Slack / Microsoft Teams incoming-webhook senders.
 *
 * Payload builders are pure (unit-tested); `postWebhook` does the network
 * call. The webhook URL is a bearer credential — callers decrypt it from the
 * channel's `configEnc` immediately before sending and it is never logged.
 */

import { alertTitle, appBaseUrl, type AlertMessage } from "./types.js";

const WEBHOOK_TIMEOUT_MS = 10_000;

/** Slack incoming-webhook body: plain `text` with mrkdwn formatting. */
export function buildSlackPayload(message: AlertMessage): Record<string, unknown> {
  const link = `${appBaseUrl()}${message.linkPath}`;
  return {
    text: `*${alertTitle(message)}*\n${message.summary}\n<${link}|Open in Trustalo>`,
  };
}

/**
 * Teams incoming-webhook body: a legacy MessageCard, which both the O365
 * connector and Workflows-based webhooks accept.
 */
export function buildTeamsPayload(message: AlertMessage): Record<string, unknown> {
  const link = `${appBaseUrl()}${message.linkPath}`;
  return {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    themeColor: "D97706",
    summary: alertTitle(message),
    title: alertTitle(message),
    text: message.summary,
    potentialAction: [
      {
        "@type": "OpenUri",
        name: "Open in Trustalo",
        targets: [{ os: "default", uri: link }],
      },
    ],
  };
}

/**
 * POST a JSON payload to a stored webhook URL. Throws a sanitized error on
 * non-2xx / network failure — the URL (a credential) is never included in
 * the thrown message.
 */
export async function postWebhook(url: string, payload: Record<string, unknown>): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
  } catch (err) {
    throw new Error(`Webhook request failed: ${err instanceof Error ? err.name : "network error"}`);
  }
  if (!res.ok) {
    throw new Error(`Webhook responded with HTTP ${res.status}`);
  }
}

export async function sendSlackAlert(webhookUrl: string, message: AlertMessage): Promise<void> {
  await postWebhook(webhookUrl, buildSlackPayload(message));
}

export async function sendTeamsAlert(webhookUrl: string, message: AlertMessage): Promise<void> {
  await postWebhook(webhookUrl, buildTeamsPayload(message));
}
