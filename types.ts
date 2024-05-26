type NonNullableField<T> = {
  [P in keyof T]-?: NonNullableField<NonNullable<T[P]>>;
};

export type ChannelOptions = NonNullableField<InternalChannelOptions>;

export type InternalChannelOptions = {
  /**
   * This minQueueLengthForProcessing will let channel to receive messages once limit is satisfied
   */
  minQueueLengthForProcessing?: number;
  /**
   * This bufferSize is there to ensure there are enough messages in the queue
   */
  bufferSize?: number;
  /**
   * Variable to handle backpressure of channel queue
   */
  maxQueueSize?: number;
};

export type ReceiveOptions = {
  timeout?: number;
};
