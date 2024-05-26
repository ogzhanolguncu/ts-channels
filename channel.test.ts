import { describe, test, expect } from "bun:test";
import { Channel, SIGNALS } from "./channel";

describe("Channel", () => {
  test("should return timeout error", () => {
    const throwable = async () => {
      const channel = new Channel<string>(1, 0);

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

    expect(throwable).toThrow(SIGNALS.TIMEOUT);
  });

  test("should return closed message", async () => {
    let res = "";
    const channel = new Channel<string>(1, 0);

    channel.send("Hello there1");
    channel.send("Hello there2");
    channel.send("Hello there3");
    await channel.close();
    channel.send("Hello there!");
    channel.send("Hello there!");
    await channel.receive(
      (msg) => {
        res = msg;
      },
      { timeout: 2000 }
    );

    expect(res).toEqual(SIGNALS.CLOSE);
  });
});
