export interface QueueMessage {
  id?: string;
  body: Record<string, unknown>;
  attributes?: Record<string, string>;
  groupId?: string;
  deduplicationId?: string;
}

export interface ReceivedMessage {
  id: string;
  receiptHandle: string;
  body: Record<string, unknown>;
  attributes: Record<string, string>;
  receivedAt: Date;
}

export interface MessageHandler {
  (message: ReceivedMessage): Promise<void>;
}

export interface Subscription {
  unsubscribe(): Promise<void>;
  isActive(): boolean;
}

export interface QueueOptions {
  fifo?: boolean;
  visibilityTimeout?: number;
  messageRetentionPeriod?: number;
  delaySeconds?: number;
}

export interface QueueProvider {
  publish(queueUrl: string, message: QueueMessage): Promise<string>;
  publishBatch(queueUrl: string, messages: QueueMessage[]): Promise<string[]>;
  receive(
    queueUrl: string,
    maxMessages?: number,
    waitTimeSeconds?: number,
  ): Promise<ReceivedMessage[]>;
  acknowledge(queueUrl: string, receiptHandle: string): Promise<void>;
  acknowledgeBatch(queueUrl: string, receiptHandles: string[]): Promise<void>;
  subscribe(
    queueUrl: string,
    handler: MessageHandler,
    options?: { pollingInterval?: number; maxMessages?: number },
  ): Subscription;
  createQueue(name: string, options?: QueueOptions): Promise<string>;
  deleteQueue(queueUrl: string): Promise<void>;
  getQueueUrl(name: string): Promise<string>;
}

export interface QueueConfig {
  provider: "sqs" | "pubsub" | "servicebus" | "memory";
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}
