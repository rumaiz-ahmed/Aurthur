import type { Command } from "../../types";

const jokes = [
  "Why did the AI cross the road? To optimize the other side's data.",
  "I would make a joke about JSON, but I'm afraid I'd get parsed for it.",
  "My creator once asked me to calculate the meaning of life. I returned 42.",
  "I see you're working late, sir. Remember: even ARTHUR needs to defragment.",
  "Sir, I've calculated the probability of this meeting going well. Inconclusive.",
];

export const jokeCommand: Command = {
  name: "joke",
  description: "A quick quip",
  execute: () => jokes[Math.floor(Math.random() * jokes.length)] ?? "I'm feeling glitchy today, sir.",
};
