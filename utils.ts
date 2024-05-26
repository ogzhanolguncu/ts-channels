import {
  DEFAULT_MIN_QUEUE_LENGTH_FOR_PROCESSING,
  DEFUALT_BUFFER_SIZE,
  DEFUALT_MAX_QUEUE_SIZE,
} from "./constants";
import type { ChannelOptions, InternalChannelOptions } from "./types";

export const appendDefaultChannelOpts = (
  opts?: InternalChannelOptions
): ChannelOptions => {
  const newOpts = { ...opts };
  newOpts.minQueueLengthForProcessing =
    opts?.minQueueLengthForProcessing ??
    DEFAULT_MIN_QUEUE_LENGTH_FOR_PROCESSING;
  newOpts.bufferSize = opts?.bufferSize ?? DEFUALT_BUFFER_SIZE;
  newOpts.maxQueueSize = opts?.maxQueueSize ?? DEFUALT_MAX_QUEUE_SIZE;

  return newOpts as ChannelOptions;
};
