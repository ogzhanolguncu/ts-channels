import { describe, test, expect } from "bun:test";
import { CancellationToken, Channel } from "./channel";
import { Signal } from "./constants";

describe("Channel", () => {
  test("should return timeout error", () => {
    const throwable = async () => {
      const channel = new Channel<string>();

      async () => {
        setInterval(async () => {
          const data = await fetch("https://api.chucknorris.io/jokes/random");
          const joke = await data.json();

          channel.send(joke.value);
        }, 5000);
      };
      ``;
      await channel.receive(console.log, { timeout: 2000 });
    };

    expect(throwable).toThrow(Signal.TIMEOUT);
  });

  test("should return closed message", async () => {
    const channel = new Channel<string>({ maxQueueSize: 10 });

    const throwable = async () => {
      await channel.send("Hello there1");
      await channel.send("Hello there2");
      await channel.send("Hello there3");
      await channel.close();
      await channel.send("Hello there!");
      await channel.send("Hello there!");
      await channel.receive(undefined, { timeout: 2000 });
    };

    expect(throwable()).rejects.toEqual(Signal.CLOSE);
  });

  test("should return chanel is full", async () => {
    const channel = new Channel<string>({ maxQueueSize: 3 });

    const throwable = async () => {
      await channel.send("Hello there1");
      await channel.send("Hello there2");
      await channel.send("Hello there3");
      await channel.send("Hello there1");
      await channel.send("Hello there2");
      await channel.receive(console.log, { timeout: 2000 });
    };

    expect(throwable()).rejects.toEqual(Signal.BACK_PRESSURE);
  });

  test("should cancel the receive operation with CancellationToken", async () => {
    const channel = new Channel<string>();
    const cancelToken = new CancellationToken();

    const receiveOperation = async () => {
      await channel.receive(undefined, { cancelToken, timeout: 5000 });
    };

    // Start the receive operation and cancel it after a short delay
    cancelToken.cancel();

    expect(receiveOperation()).rejects.toEqual(Signal.CANCELLED);
  });

  test("should cancel the send operation with CancellationToken", async () => {
    const channel = new Channel<string>();
    const cancelToken = new CancellationToken();

    const sendOperation = async () => {
      await channel.send("Test message", cancelToken);
    };

    cancelToken.cancel();

    expect(sendOperation()).rejects.toEqual(Signal.CANCELLED);
  });
});
