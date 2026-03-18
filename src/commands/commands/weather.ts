import type { Command } from "../../types";

const conditions = ["Clear skies", "Partly cloudy", "Overcast", "Light drizzle"];

export const weatherCommand: Command = {
  name: "weather",
  description: "Weather report",
  execute: () => {
    const condition = conditions[Math.floor(Math.random() * conditions.length)] ?? "Unknown";
    const temp = Math.floor(Math.random() * 30) + 50;
    return `Weather Report:
  • Condition: ${condition}
  • Temperature: ${temp}°F
  • Humidity: ${Math.floor(Math.random() * 40) + 40}%
  • Wind: ${Math.floor(Math.random() * 15)} mph

The weather appears favorable, sir.`;
  },
};
