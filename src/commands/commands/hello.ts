import type { Command } from "../../types";

const greetings = [
  "Good day, sir. How may I be of service?",
  "Hello, sir. Systems are operational and ready.",
  "Good to hear from you. What would you like to accomplish?",
];

export const helloCommand: Command = {
  name: "hello",
  aliases: ["hi", "hey", "greetings"],
  description: "Greeting",
  execute: () => greetings[Math.floor(Math.random() * greetings.length)] ?? "Hello, sir.",
};
