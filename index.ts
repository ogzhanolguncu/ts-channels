import { Channel } from "./channel";

const channel = new Channel<string>(1, 0);
void channel.receive(console.log, { timeout: 2000 });
// channel.send("Hello there1");
// channel.send("Hello there2");
// channel.send("Hello there3");
// await channel.close();
// channel.send("Hello there!");
// channel.send("Hello there!");

async function main() {
  async function doSomeDataFetchingWithInterval() {
    setInterval(async () => {
      const data = await fetch("https://api.chucknorris.io/jokes/random");
      const joke = await data.json();

      channel.send(joke.value);
    }, 5000);
  }

  await doSomeDataFetchingWithInterval();
}

main();
