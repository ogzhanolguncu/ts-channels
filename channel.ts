import { log } from "./utils";

type ReceiveOptions = {
  timeout?: number;
};

const ERRORS = {
  TIMEOUT: "Receiving data is taking longer than expected.",
} as const;
export class Channel<TData> {
  private queue: TData[] = [];
  private resolveQueue: ((value: TData) => void)[] = [];

  send(value: TData) {
    if (this.resolveQueue.length > 0) {
      log.info(`${value}`);
      const resolve = this.resolveQueue.shift();
      resolve!(value);
    } else {
      this.queue.push(value);
    }
  }

  _receive(opts?: ReceiveOptions): Promise<TData> {
    if (this.queue.length > 0) {
      return Promise.resolve(this.queue.shift()!);
    } else {
      return new Promise((resolve, reject) => {
        const timer = opts?.timeout
          ? setTimeout(() => reject(ERRORS.TIMEOUT), opts.timeout)
          : null;
        this.resolveQueue.push((data) => {
          if (timer) clearTimeout(timer);
          resolve(data);
        });
      });
    }
  }

  async *iter(opts?: ReceiveOptions) {
    while (true) {
      yield await this._receive(opts);
    }
  }

  async receive(cb?: (message: TData) => void, opts?: ReceiveOptions) {
    for await (const message of this.iter(opts)) {
      log.warning(`${message}`);
      cb?.(message);
    }
  }
}
