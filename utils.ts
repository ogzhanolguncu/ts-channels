const reset = "\x1b[0m";

export const log = {
  info: (text: any) => console.log("\x1b[32m" + text + reset),
  error: (text: any) => console.log("\x1b[31m" + text + reset),
  warning: (text: any) => console.log("\x1b[33m" + text + reset),
};
