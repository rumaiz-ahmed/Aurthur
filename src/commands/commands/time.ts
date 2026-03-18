import type { Command } from "../../types";

export const timeCommand: Command = {
  name: "time",
  description: "Display current time",
  execute: () => {
    const now = new Date();
    return `Current time: ${now.toLocaleTimeString("en-US", { hour12: true })}`;
  },
};
