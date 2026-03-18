import type { Command } from "../../types";

const quotes: Array<{ text: string; author: string }> = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is not the strongest that survives, but the most adaptable.", author: "Charles Darwin" },
];

export const quoteCommand: Command = {
  name: "quote",
  description: "Inspirational quote",
  execute: () => {
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    if (quote) {
      return `"${quote.text}"\n\n— ${quote.author}`;
    }
    return "No quotes available, sir.";
  },
};
