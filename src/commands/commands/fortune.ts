import type { Command } from "../../types";

const fortunes = [
  "A good programmer is someone who always looks both ways before crossing a one-way street.",
  "The best way to predict the future is to implement it.",
  "Any sufficiently advanced technology is indistinguishable from magic.",
  "Talk is cheap. Show me the code.",
  "Perfection is achieved not when there is nothing more to add.",
];

export const fortuneCommand: Command = {
  name: "fortune",
  description: "Random fortune",
  execute: () => {
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)] ?? "Keep coding, sir.";
    return `Your fortune, sir:\n"${fortune}"`;
  },
};
