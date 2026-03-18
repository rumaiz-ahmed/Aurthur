import type { Command } from "../../types";

export const openCommand: Command = {
  name: "open",
  description: "Open an application or file",
  execute: (target) => {
    if (!target) return "What would you like me to open, sir?";
    return `Opening ${target}...\n\nI have initiated the request, sir.`;
  },
};
