import type { Command } from "../../types";

export const dateCommand: Command = {
  name: "date",
  description: "Display current date",
  execute: () => {
    const now = new Date();
    return `Today's date: ${now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`;
  },
};
