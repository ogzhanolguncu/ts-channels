export enum ChannelState {
  OPEN = "open",
  CLOSED = "closed",
}

export enum Signal {
  TIMEOUT = "Receiving data is taking longer than expected.",
  CLOSE = "Channel is closed.",
  BACK_PRESSURE = "Channel is full",
  CANCELLED = "Receiving new messages are cancelled",
}

export const DEFAULT_MIN_QUEUE_LENGTH_FOR_PROCESSING = 1;
export const DEFUALT_BUFFER_SIZE = 0;
export const DEFUALT_MAX_QUEUE_SIZE = 10;
