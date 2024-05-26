import type { ChannelOptions, InternalChannelOptions } from "./types";

export const appendDefaultChannelOpts = (
  opts?: InternalChannelOptions
): ChannelOptions => {
  const newOpts = { ...opts };
  newOpts.minQueueLengthForProcessing = opts?.minQueueLengthForProcessing ?? 1;
  newOpts.bufferSize = opts?.bufferSize ?? 0;
  newOpts.maxQueueSize = opts?.maxQueueSize ?? 10;

  return newOpts as ChannelOptions;
};
