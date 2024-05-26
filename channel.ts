import { Signals, ChannelState } from "./constants";
import type {
  ChannelOptions,
  InternalChannelOptions,
  ReceiveOptions,
} from "./types";
import { appendDefaultChannelOpts } from "./utils";

export class Channel<TData> {
  private opts: ChannelOptions;
  /**
   * This queue stores messages when there are no active pending receivers
   */
  private queue: TData[] = [];
  /**
   * This queue stores functions of pending receivers (i.e., promises that are waiting for data).
   */
  private pendingReceivers: ((value: TData | Signals) => void)[] = [];

  /**
   * Simple toggle to prevent openning and closing the by request.
   */
  private state: ChannelState = ChannelState.OPEN;

  constructor(opts?: InternalChannelOptions) {
    this.opts = appendDefaultChannelOpts(opts);
  }

  /**
   * Send a value to the channel.
   * @param value - The value to send.
   */
  send(value: TData): Promise<void> {
    if (this.state === ChannelState.CLOSED) {
      return Promise.reject(Signals.CLOSE);
    }

    if (this.queue.length >= this.opts.maxQueueSize) {
      return Promise.reject(Signals.BACK_PRESSURE);
    }

    this.queue.push(value);

    if (
      this.queue.length >= this.opts.minQueueLengthForProcessing &&
      this.pendingReceivers.length > 0
    ) {
      this.processPendingReceivers();
    }

    return Promise.resolve();
  }

  /**
   * Receive a value from the channel.
   * @param cb - The callback to handle the received message.
   * @param opts - Options for receiving the message.
   */
  async receive(
    cb?: (message: TData | Signals) => void,
    opts?: ReceiveOptions
  ) {
    for await (const message of this.iter(opts)) {
      cb?.(message);
    }
  }

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
      resolve?.(Signals.CLOSE);
    }
  }

  private _receive(opts?: ReceiveOptions): Promise<TData | Signals> {
    if (this.queue.length > this.opts.bufferSize) {
      return Promise.resolve(this.queue.shift()!);
    }

    if (this.state === ChannelState.CLOSED) {
      return Promise.reject(Signals.CLOSE);
    }

    return new Promise((resolve, reject) => {
      const timer = opts?.timeout
        ? setTimeout(() => reject(Signals.TIMEOUT), opts.timeout)
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
