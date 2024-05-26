import { Channel } from "./channel";

const channel = new Channel<string>();
channel.receive((msg) => console.log("Message received => ", msg), {
  timeout: 7000,
});
channel.send("Hello there-1");
channel.send("Hello there-2");
channel.send("Hello there-3");

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
