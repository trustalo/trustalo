/**
 * Template for adding a new queue provider.
 *
 * To add a new provider (e.g., GCP Pub/Sub or Azure Service Bus):
 *
 * 1. Copy this file and rename it (e.g., pubsub.ts or servicebus.ts).
 * 2. Install the required SDK package:
 *    - GCP Pub/Sub:      @google-cloud/pubsub
 *    - Azure Service Bus: @azure/service-bus
 * 3. Implement all methods in the QueueProvider interface.
 * 4. Export the new class from src/index.ts.
 * 5. Add a case for the new provider in the createQueueProvider factory.
 * 6. Update QueueConfig["provider"] union type in src/interface.ts if needed.
 */
import type {
  QueueProvider,
  QueueConfig,
  QueueMessage,
  ReceivedMessage,
  MessageHandler,
  Subscription,
  QueueOptions,
} from "../interface.js";

export class TemplateQueueProvider implements QueueProvider {
  constructor(_config: QueueConfig) {
    throw new Error(
      "TemplateQueueProvider is not implemented. Copy this file to create a new provider.",
    );
  }

  async publish(_queueUrl: string, _message: QueueMessage): Promise<string> {
    throw new Error("Not implemented: publish");
  }

  async publishBatch(_queueUrl: string, _messages: QueueMessage[]): Promise<string[]> {
    throw new Error("Not implemented: publishBatch");
  }

  async receive(
    _queueUrl: string,
    _maxMessages?: number,
    _waitTimeSeconds?: number,
  ): Promise<ReceivedMessage[]> {
    throw new Error("Not implemented: receive");
  }

  async acknowledge(_queueUrl: string, _receiptHandle: string): Promise<void> {
    throw new Error("Not implemented: acknowledge");
  }

  async acknowledgeBatch(_queueUrl: string, _receiptHandles: string[]): Promise<void> {
    throw new Error("Not implemented: acknowledgeBatch");
  }

  subscribe(
    _queueUrl: string,
    _handler: MessageHandler,
    _options?: { pollingInterval?: number; maxMessages?: number },
  ): Subscription {
    throw new Error("Not implemented: subscribe");
  }

  async createQueue(_name: string, _options?: QueueOptions): Promise<string> {
    throw new Error("Not implemented: createQueue");
  }

  async deleteQueue(_queueUrl: string): Promise<void> {
    throw new Error("Not implemented: deleteQueue");
  }

  async getQueueUrl(_name: string): Promise<string> {
    throw new Error("Not implemented: getQueueUrl");
  }
}
