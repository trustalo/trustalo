export {
  type QueueProvider,
  type QueueConfig,
  type QueueMessage,
  type ReceivedMessage,
  type MessageHandler,
  type Subscription,
  type QueueOptions,
} from "./interface.js";
export { SQSQueueProvider } from "./providers/sqs.js";

import type { QueueConfig, QueueProvider } from "./interface.js";
import { SQSQueueProvider } from "./providers/sqs.js";

export function createQueueProvider(config: QueueConfig): QueueProvider {
  switch (config.provider) {
    case "sqs":
      return new SQSQueueProvider(config);
    default:
      throw new Error(`Unsupported queue provider: ${config.provider}. Available: sqs`);
  }
}
