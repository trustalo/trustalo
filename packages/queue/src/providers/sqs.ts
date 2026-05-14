import {
  SQSClient,
  SendMessageCommand,
  SendMessageBatchCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  DeleteMessageBatchCommand,
  CreateQueueCommand,
  DeleteQueueCommand,
  GetQueueUrlCommand,
  type MessageAttributeValue,
  type SendMessageBatchRequestEntry,
  type DeleteMessageBatchRequestEntry,
} from "@aws-sdk/client-sqs";
import type {
  QueueProvider,
  QueueConfig,
  QueueMessage,
  ReceivedMessage,
  MessageHandler,
  Subscription,
  QueueOptions,
} from "../interface.js";

const DEFAULT_WAIT_TIME_SECONDS = 20;
const DEFAULT_MAX_MESSAGES = 10;
const SQS_MAX_BATCH_SIZE = 10;

function toMessageAttributes(attrs: Record<string, string>): Record<string, MessageAttributeValue> {
  const result: Record<string, MessageAttributeValue> = {};
  for (const [key, value] of Object.entries(attrs)) {
    result[key] = { DataType: "String", StringValue: value };
  }
  return result;
}

function fromMessageAttributes(
  attrs: Record<string, MessageAttributeValue> | undefined,
): Record<string, string> {
  if (!attrs) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value.StringValue !== undefined) {
      result[key] = value.StringValue;
    }
  }
  return result;
}

export class SQSQueueProvider implements QueueProvider {
  private readonly client: SQSClient;

  constructor(config: QueueConfig) {
    this.client = new SQSClient({
      region: config.region ?? "us-east-1",
      ...(config.endpoint && { endpoint: config.endpoint }),
      ...(config.accessKeyId &&
        config.secretAccessKey && {
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
        }),
    });
  }

  async publish(queueUrl: string, message: QueueMessage): Promise<string> {
    const result = await this.client.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message.body),
        ...(message.attributes && {
          MessageAttributes: toMessageAttributes(message.attributes),
        }),
        ...(message.groupId && { MessageGroupId: message.groupId }),
        ...(message.deduplicationId && {
          MessageDeduplicationId: message.deduplicationId,
        }),
        ...(message.id && { MessageDeduplicationId: message.id }),
      }),
    );

    if (!result.MessageId) {
      throw new Error("SQS did not return a MessageId");
    }
    return result.MessageId;
  }

  async publishBatch(queueUrl: string, messages: QueueMessage[]): Promise<string[]> {
    const messageIds: string[] = [];

    for (let i = 0; i < messages.length; i += SQS_MAX_BATCH_SIZE) {
      const batch = messages.slice(i, i + SQS_MAX_BATCH_SIZE);
      const entries: SendMessageBatchRequestEntry[] = batch.map((msg, index) => ({
        Id: msg.id ?? `msg-${i + index}`,
        MessageBody: JSON.stringify(msg.body),
        ...(msg.attributes && {
          MessageAttributes: toMessageAttributes(msg.attributes),
        }),
        ...(msg.groupId && { MessageGroupId: msg.groupId }),
        ...(msg.deduplicationId && {
          MessageDeduplicationId: msg.deduplicationId,
        }),
      }));

      const result = await this.client.send(
        new SendMessageBatchCommand({
          QueueUrl: queueUrl,
          Entries: entries,
        }),
      );

      if (result.Failed && result.Failed.length > 0) {
        const failedIds = result.Failed.map((f) => f.Id).join(", ");
        throw new Error(`Failed to send messages: ${failedIds}`);
      }

      const batchIds =
        result.Successful?.map((s) => s.MessageId).filter((id): id is string => id !== undefined) ??
        [];
      messageIds.push(...batchIds);
    }

    return messageIds;
  }

  async receive(
    queueUrl: string,
    maxMessages: number = DEFAULT_MAX_MESSAGES,
    waitTimeSeconds: number = DEFAULT_WAIT_TIME_SECONDS,
  ): Promise<ReceivedMessage[]> {
    const result = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: Math.min(maxMessages, DEFAULT_MAX_MESSAGES),
        WaitTimeSeconds: waitTimeSeconds,
        MessageAttributeNames: ["All"],
        AttributeNames: ["All"],
      }),
    );

    if (!result.Messages) return [];

    return result.Messages.map((msg) => {
      if (!msg.MessageId || !msg.ReceiptHandle || !msg.Body) {
        throw new Error("Received malformed SQS message");
      }
      return {
        id: msg.MessageId,
        receiptHandle: msg.ReceiptHandle,
        body: JSON.parse(msg.Body) as Record<string, unknown>,
        attributes: fromMessageAttributes(msg.MessageAttributes),
        receivedAt: new Date(),
      };
    });
  }

  async acknowledge(queueUrl: string, receiptHandle: string): Promise<void> {
    await this.client.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      }),
    );
  }

  async acknowledgeBatch(queueUrl: string, receiptHandles: string[]): Promise<void> {
    for (let i = 0; i < receiptHandles.length; i += SQS_MAX_BATCH_SIZE) {
      const batch = receiptHandles.slice(i, i + SQS_MAX_BATCH_SIZE);
      const entries: DeleteMessageBatchRequestEntry[] = batch.map((handle, index) => ({
        Id: `del-${i + index}`,
        ReceiptHandle: handle,
      }));

      const result = await this.client.send(
        new DeleteMessageBatchCommand({
          QueueUrl: queueUrl,
          Entries: entries,
        }),
      );

      if (result.Failed && result.Failed.length > 0) {
        const failedIds = result.Failed.map((f) => f.Id).join(", ");
        throw new Error(`Failed to acknowledge messages: ${failedIds}`);
      }
    }
  }

  subscribe(
    queueUrl: string,
    handler: MessageHandler,
    options?: { pollingInterval?: number; maxMessages?: number },
  ): Subscription {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const pollingInterval = options?.pollingInterval ?? 0;
    const maxMessages = options?.maxMessages ?? DEFAULT_MAX_MESSAGES;

    const poll = async (): Promise<void> => {
      if (!active) return;

      try {
        const messages = await this.receive(queueUrl, maxMessages, DEFAULT_WAIT_TIME_SECONDS);

        const processing = messages.map(async (message) => {
          try {
            await handler(message);
            await this.acknowledge(queueUrl, message.receiptHandle);
          } catch (error) {
            console.error(`[SQS] Error processing message ${message.id}:`, error);
          }
        });

        await Promise.allSettled(processing);
      } catch (error) {
        console.error("[SQS] Polling error:", error);
      }

      if (active) {
        timeoutId = setTimeout(() => void poll(), pollingInterval);
      }
    };

    void poll();

    return {
      async unsubscribe(): Promise<void> {
        active = false;
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      },
      isActive(): boolean {
        return active;
      },
    };
  }

  async createQueue(name: string, options?: QueueOptions): Promise<string> {
    const attributes: Record<string, string> = {};

    if (options?.visibilityTimeout !== undefined) {
      attributes["VisibilityTimeout"] = String(options.visibilityTimeout);
    }
    if (options?.messageRetentionPeriod !== undefined) {
      attributes["MessageRetentionPeriod"] = String(options.messageRetentionPeriod);
    }
    if (options?.delaySeconds !== undefined) {
      attributes["DelaySeconds"] = String(options.delaySeconds);
    }
    if (options?.fifo) {
      attributes["FifoQueue"] = "true";
      attributes["ContentBasedDeduplication"] = "true";
    }

    const queueName = options?.fifo && !name.endsWith(".fifo") ? `${name}.fifo` : name;

    const result = await this.client.send(
      new CreateQueueCommand({
        QueueName: queueName,
        Attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      }),
    );

    if (!result.QueueUrl) {
      throw new Error("SQS did not return a QueueUrl");
    }
    return result.QueueUrl;
  }

  async deleteQueue(queueUrl: string): Promise<void> {
    await this.client.send(new DeleteQueueCommand({ QueueUrl: queueUrl }));
  }

  async getQueueUrl(name: string): Promise<string> {
    const result = await this.client.send(new GetQueueUrlCommand({ QueueName: name }));

    if (!result.QueueUrl) {
      throw new Error(`Queue not found: ${name}`);
    }
    return result.QueueUrl;
  }
}
