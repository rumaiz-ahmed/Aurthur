import type { Command } from "../../types";

export const aboutCommand: Command = {
  name: "who are you",
  aliases: ["about", "info"],
  description: "About ARTHUR",
  execute: () => `I am ARTHUR. A Remarkably Thoughtful Helper, Unwavering Resource.
I was created to assist with various tasks and provide information.
I can help with system commands, answer questions, and engage in conversation.
Simply tell me what you need, sir.`,
};
