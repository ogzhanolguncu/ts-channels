type ReceiveOptions = {
  timeout?: number;
};

const ERRORS = {
  TIMEOUT: "Receiving data is taking longer than expected.",
} as const;

export class Channel<TData> {
  /**
   * This queue stores items when there are no active pending receivers
   */
  private queue: TData[] = [];
  /**
   * This queue stores functions of pending receivers (i.e., promises that are waiting for data).
   */
  private pendingReceivers: ((value: TData) => void)[] = [];
  /**
   * This minQueueLengthForProcessing will let channel to receive messages once limit is satisfied
   */
  private minQueueLengthForProcessing = 1;
  /**
   * This bufferSize is there to ensure there are enough in the queue
   */
  private bufferSize = 0;

  constructor(startReceivingLimit = 1, bufferSize = 2) {
    this.minQueueLengthForProcessing = startReceivingLimit;
    this.bufferSize = bufferSize;
  }

  /**
   * Send a value to the channel.
   * @param value - The value to send.
   */
  send(value: TData) {
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
  async receive(cb?: (message: TData) => void, opts?: ReceiveOptions) {
    for await (const message of this.iter(opts)) {
      cb?.(message);
    }
  }

  /**
   * Internal method to receive a value with optional timeout.
   * @param opts - Options for receiving the message.
   * @returns A promise that resolves with the received value.
   */
  private _receive(opts?: ReceiveOptions): Promise<TData> {
    if (this.queue.length > this.bufferSize) {
      return Promise.resolve(this.queue.shift()!);
    } else {
      return new Promise((resolve, reject) => {
        const timer = opts?.timeout
          ? setTimeout(() => reject(ERRORS.TIMEOUT), opts.timeout)
          : null;
        this.pendingReceivers.push((data) => {
          if (timer) clearTimeout(timer);
          resolve(data);
        });
      });
    }
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
    while (
      this.pendingReceivers.length > 0 &&
      this.queue.length > this.bufferSize
    ) {
      const resolve = this.pendingReceivers.shift();
      const queuedValue = this.queue.shift();
      resolve!(queuedValue!);
    }
  }
}
