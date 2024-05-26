import type { CancellationToken } from "./channel";

type NonNullableField<T> = {
  [P in keyof T]-?: NonNullableField<NonNullable<T[P]>>;
};

export type ChannelOptions = NonNullableField<InternalChannelOptions>;

export type InternalChannelOptions = {
  /**
   * This minQueueLengthForProcessing will let channel to receive messages once limit is satisfied
   * @default 1
   */
  minQueueLengthForProcessing?: number;
  /**
   * @default 0
   * This bufferSize is there to ensure there are enough messages in the queue
   */
  bufferSize?: number;
  /**
   * @default 10
   * Variable to handle backpressure of channel queue
   */
  maxQueueSize?: number;
};

export type ReceiveOptions = {
  timeout?: number;
  cancelToken?: CancellationToken;
};
