import { log } from "./utils";

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

  _receive(): Promise<TData> {
    if (this.queue.length > 0) {
      return Promise.resolve(this.queue.shift()!);
    } else {
      return new Promise((resolve) => {
        this.resolveQueue.push(resolve);
      });
    }
  }

  async *iter() {
    while (true) {
      yield await this._receive();
    }
  }

  async receive(cb?: (message: TData) => void) {
    for await (const message of this.iter()) {
      log.warning(`${message}`);
      cb?.(message);
    }
  }
}
