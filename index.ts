import { Channel } from "./channel";

const channel = new Channel<string>(1, 0);
channel.send("Hello there!");
void channel.receive(console.log);

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
