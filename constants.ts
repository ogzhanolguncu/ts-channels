export enum ChannelState {
  OPEN = "open",
  CLOSED = "closed",
}

export enum Signals {
  TIMEOUT = "Receiving data is taking longer than expected.",
  CLOSE = "Channel is closed.",
  BACK_PRESSURE = "Channel is full",
}
