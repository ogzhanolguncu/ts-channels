import { Signal, ChannelState } from "./constants";
import type {
  ChannelOptions,
  InternalChannelOptions,
  ReceiveOptions,
} from "./types";
import { appendDefaultChannelOpts } from "./utils";

/**
 * Class representing a cancellation token to abort ongoing operations.
 */
export class CancellationToken {
  private isCancelled = false;

  /**
   * Cancels the token, marking it as cancelled.
   */
  cancel() {
    this.isCancelled = true;
  }

  /**
   * Checks if the token has been cancelled.
   * @returns A boolean indicating if the token is cancelled.
   */
  get cancelled() {
    return this.isCancelled;
  }
}

export class Channel<TData> {
  private opts: ChannelOptions;
  /**
   * This queue stores messages when there are no active pending receivers
   */
  private queue: TData[] = [];
  /**
   * This queue stores functions of pending receivers (i.e., promises that are waiting for data).
   */
  private pendingReceivers: ((value: TData | Signal) => void)[] = [];

  /**
   * Simple toggle to prevent openning and closing the by request.
   */
  private state: ChannelState = ChannelState.OPEN;

  /**
   * Creates a new Channel instance.
   * @param opts - Optional internal channel options.
   * @param opts.minQueueLengthForProcessing - Minimum queue length required to start processing messages. @default 1
   * @param opts.bufferSize - Ensures there are enough messages in the queue before processing. @default 0
   * @param opts.maxQueueSize - Maximum queue size to handle backpressure. @default 10
   */
  constructor(opts?: InternalChannelOptions) {
    this.opts = appendDefaultChannelOpts(opts);
  }

  /**
   * Send a value to the channel.
   * @param value - The value to send.
   * @param cancelToken - Optional cancellation token to abort the send operation.
   * @returns A promise that resolves when the value is sent, or rejects if the operation is cancelled or closed.
   */
  send(value: TData, cancelToken?: CancellationToken): Promise<void> {
    // If the channel is closed, reject with the CLOSE signal.
    if (this.state === ChannelState.CLOSED) {
      return Promise.reject(Signal.CLOSE);
    }

    // If the queue is full, reject with the BACK_PRESSURE signal.
    if (this.queue.length >= this.opts.maxQueueSize) {
      return Promise.reject(Signal.BACK_PRESSURE);
    }

    // If the cancellation token is already cancelled, reject with the CANCELLED signal.
    if (cancelToken?.cancelled) {
      return Promise.reject(Signal.CANCELLED);
    }

    this.queue.push(value);

    // If there are pending receivers and the queue length satisfies the minimum length for processing,
    // process the pending receivers.
    if (
      this.queue.length >= this.opts.minQueueLengthForProcessing &&
      this.pendingReceivers.length > 0
    ) {
      this.processPendingReceivers();
    }

    // Resolve the promise indicating the value has been successfully sent.
    return Promise.resolve();
  }

  /**
   * Receive a value from the channel.
   * @param cb - The callback to handle the received message.
   * @param opts - Options for receiving the message. `ReceiveOptions`
   */
  async receive(cb?: (message: TData | Signal) => void, opts?: ReceiveOptions) {
    for await (const message of this.iter(opts)) {
      cb?.(message);
    }
  }

  /**
   * Close the channel. This will drain all the messages from queue, then, reject all pending receivers and stop any further sends.
   */
  async close() {
    if (this.state === ChannelState.CLOSED) {
      return;
    }

    this.state = ChannelState.CLOSED;

    // Drain the queue and notify pending receivers with queued values
    while (this.queue.length > 0 && this.pendingReceivers.length > 0) {
      const resolve = this.pendingReceivers.shift();
      const queuedValue = this.queue.shift();
      resolve?.(queuedValue!);
    }

    // Notify remaining pending receivers that the channel is closed
    while (this.pendingReceivers.length > 0) {
      const resolve = this.pendingReceivers.shift();
      resolve?.(Signal.CLOSE);
    }
  }

  /**
   * Internal receive method to handle received messages.
   * @param opts - Options for receiving the message.
   * @returns A promise that resolves with the received message or rejects with a signal.
   */
  private _receive(opts?: ReceiveOptions): Promise<TData | Signal> {
    // If there are enough items in the queue we'll keep resolving messages from queue.
    // `bufferSize` indicates minimum amount of items in the queue to start processing.
    if (this.queue.length > this.opts.bufferSize) {
      return Promise.resolve(this.queue.shift()!);
    }

    // If the channel is closed, reject with the CLOSE signal.
    if (this.state === ChannelState.CLOSED) {
      return Promise.reject(Signal.CLOSE);
    }

    // If the cancellation token is cancelled, reject with the CANCELLED signal.
    if (opts?.cancelToken?.cancelled) {
      return Promise.reject(Signal.CANCELLED);
    }

    return new Promise((resolve, reject) => {
      const timer = opts?.timeout
        ? setTimeout(() => reject(Signal.TIMEOUT), opts.timeout)
        : null;

      this.pendingReceivers.push((data) => {
        if (timer) clearTimeout(timer);
        resolve(data);
      });
    });
  }

  /**
   * Internal async generator to yield received messages.
   * @param opts - Options for receiving the message.
   */
  private async *iter(opts?: ReceiveOptions) {
    while (true) {
      yield await this._receive(opts);
    }
  }

  /**
   * Process pending receivers by resolving their promises with queued values.
   */
  private processPendingReceivers() {
    while (this.pendingReceivers.length > 0 && this.queue.length > 0) {
      const resolve = this.pendingReceivers.shift();
      const queuedValue = this.queue.shift();
      resolve?.(queuedValue!);
    }
  }
}
