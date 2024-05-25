import { Channel } from "./channel";

const channel = new Channel<string>();

async function main() {
  async function doSomeDataFetchingWithInterval() {
    setInterval(async () => {
      const data = await fetch("https://api.chucknorris.io/jokes/random");
      const joke = await data.json();

      channel.send(joke.value);
    }, 7000);
  }

  await doSomeDataFetchingWithInterval();

  await channel.receive(console.log, { timeout: 5000 });
}

main();
