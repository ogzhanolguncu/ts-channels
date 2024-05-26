enum ChannelState {
  OPEN = "open",
  CLOSED = "closed",
}

type ReceiveOptions = {
  timeout?: number;
};

export enum SIGNALS {
  TIMEOUT = "Receiving data is taking longer than expected.",
  CLOSE = "Channel is closed.",
}

export class Channel<TData> {
  /**
   * This queue stores items when there are no active pending receivers
   */
  private queue: TData[] = [];
  /**
   * This queue stores functions of pending receivers (i.e., promises that are waiting for data).
   */
  private pendingReceivers: ((value: TData | SIGNALS) => void)[] = [];
  /**
   * This minQueueLengthForProcessing will let channel to receive messages once limit is satisfied
   */
  private minQueueLengthForProcessing = 1;
  /**
   * This bufferSize is there to ensure there are enough in the queue
   */
  private bufferSize = 0;
  private state: ChannelState = ChannelState.OPEN;

  constructor(startReceivingLimit = 1, bufferSize = 0) {
    this.minQueueLengthForProcessing = startReceivingLimit;
    this.bufferSize = bufferSize;
  }

  /**
   * Send a value to the channel.
   * @param value - The value to send.
   */
  send(value: TData) {
    if (this.state === ChannelState.CLOSED) {
      return;
    }
    this.queue.push(value);

    if (
      this.queue.length >= this.minQueueLengthForProcessing &&
      this.pendingReceivers.length > 0
    ) {
      this.processPendingReceivers();
    }
  }

  /**
   * Receive a value from the channel.
   * @param cb - The callback to handle the received message.
   * @param opts - Options for receiving the message.
   */
  async receive(
    cb?: (message: TData | SIGNALS) => void,
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
      resolve?.(SIGNALS.CLOSE);
    }
  }

  private _receive(opts?: ReceiveOptions): Promise<TData | SIGNALS> {
    if (this.queue.length > this.bufferSize) {
      return Promise.resolve(this.queue.shift()!);
    }

    if (this.state === ChannelState.CLOSED) {
      return Promise.resolve(SIGNALS.CLOSE);
    }

    return new Promise((resolve, reject) => {
      const timer = opts?.timeout
        ? setTimeout(() => reject(SIGNALS.TIMEOUT), opts.timeout)
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
      const message = await this._receive(opts);
      if (message === SIGNALS.CLOSE) {
        yield message;
        break;
      }
      yield message;
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
