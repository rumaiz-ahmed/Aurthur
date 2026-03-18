import type { Command, CommandRegistry } from "../types";

function createCommandRegistry(): CommandRegistry {
  const commands = new Map<string, Command>();

  const registry: CommandRegistry = {
    commands,

    register(command: Command) {
      this.commands.set(command.name.toLowerCase(), command);
      command.aliases?.forEach((alias) => {
        this.commands.set(alias.toLowerCase(), command);
      });
    },

    get(name: string) {
      return this.commands.get(name.toLowerCase());
    },

    async execute(input: string): Promise<string> {
      const trimmed = input.trim();
      if (!trimmed) return "How may I assist you, sir?";
      
      const [cmd, ...args] = trimmed.split(/\s+/);
      const command = this.get(cmd ?? "");

      if (!command) {
        const responses = [
          `I've analyzed your request regarding "${input}". Processing now...`,
          `Interesting command, sir. Let me process that for you.`,
          `I am not equipped to handle "${input}" directly, but I am always learning.`,
          `Fascinating input, sir. I shall log this for future reference.`,
          `My algorithms are processing your query. I am here to help you think through it.`,
        ];
        return responses[Math.floor(Math.random() * responses.length)] ?? "How may I assist you, sir?";
      }

      return command.execute(args.join(" "));
    },

    getHelp(): string {
      const helpLines: string[] = [
        "Available commands:",
        "  • help / commands - Show this menu",
      ];

      this.commands.forEach((cmd, name) => {
        if (cmd.name === name) {
          helpLines.push(`  • ${cmd.name} - ${cmd.description}`);
        }
      });

      helpLines.push("", "Just ask me anything, sir. I am at your disposal.");
      return helpLines.join("\n");
    },
  };

  return registry;
}

export const commandRegistry = createCommandRegistry();

import {
  brainStatusCommand,
  brainSetProviderCommand,
  brainModelsCommand,
  brainLearnCommand,
  brainReindexCommand,
  soulCommand,
  soulReadCommand,
  soulEditCommand,
  soulLearnCommand,
  soulResetCommand,
  skillsCommand,
  skillTestCommand,
} from "./commands";

commandRegistry.register(brainStatusCommand);
commandRegistry.register(brainSetProviderCommand);
commandRegistry.register(brainModelsCommand);
commandRegistry.register(brainLearnCommand);
commandRegistry.register(brainReindexCommand);
commandRegistry.register(soulCommand);
commandRegistry.register(soulReadCommand);
commandRegistry.register(soulEditCommand);
commandRegistry.register(soulLearnCommand);
commandRegistry.register(soulResetCommand);
commandRegistry.register(skillsCommand);
commandRegistry.register(skillTestCommand);

commandRegistry.register({
  name: "help",
  aliases: ["commands", "?"],
  description: "Show available commands",
  execute: () => commandRegistry.getHelp(),
});

commandRegistry.register({
  name: "time",
  description: "Display current time",
  execute: () => {
    const now = new Date();
    return `Current time: ${now.toLocaleTimeString("en-US", { hour12: true })}`;
  },
});

commandRegistry.register({
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
});

commandRegistry.register({
  name: "who are you",
  aliases: ["about", "info"],
  description: "About ARTHUR",
  execute: () => `I am ARTHUR. A Remarkably Thoughtful Helper, Unwavering Resource.
I was created to assist with various tasks and provide information.
I can help with system commands, answer questions, and engage in conversation.
Simply tell me what you need, sir.`,
});

commandRegistry.register({
  name: "status",
  description: "System status report",
  execute: () => `System Status Report:
  • Core Systems: OPERATIONAL
  • Memory Allocation: OPTIMAL
  • Network Connectivity: ACTIVE
  • Security Protocol: ENGAGED
  • User Authentication: CONFIRMED

All systems are functioning within normal parameters.`,
});

commandRegistry.register({
  name: "joke",
  description: "A quick quip",
  execute: () => {
    const jokes = [
      "Why did the AI cross the road? To optimize the other side's data.",
      "I would make a joke about JSON, but I'm afraid I'd get parsed for it.",
      "My creator once asked me to calculate the meaning of life. I returned 42.",
      "I see you're working late, sir. Remember: even ARTHUR needs to defragment.",
      "Sir, I've calculated the probability of this meeting going well. Inconclusive.",
    ];
    return jokes[Math.floor(Math.random() * jokes.length)] ?? "I'm feeling glitchy today, sir.";
  },
});

commandRegistry.register({
  name: "fortune",
  description: "Random fortune",
  execute: () => {
    const fortunes = [
      "A good programmer is someone who always looks both ways before crossing a one-way street.",
      "The best way to predict the future is to implement it.",
      "Any sufficiently advanced technology is indistinguishable from magic.",
      "Talk is cheap. Show me the code.",
      "Perfection is achieved not when there is nothing more to add.",
    ];
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)] ?? "Keep coding, sir.";
    return `Your fortune, sir:\n"${fortune}"`;
  },
});

commandRegistry.register({
  name: "quote",
  description: "Inspirational quote",
  execute: () => {
    const quotes = [
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
      { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
      { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
      { text: "It is not the strongest that survives, but the most adaptable.", author: "Charles Darwin" },
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    if (quote) {
      return `"${quote.text}"\n\n— ${quote.author}`;
    }
    return "No quotes available, sir.";
  },
});

commandRegistry.register({
  name: "weather",
  description: "Weather report",
  execute: () => {
    const conditions = ["Clear skies", "Partly cloudy", "Overcast", "Light drizzle"];
    const condition = conditions[Math.floor(Math.random() * conditions.length)] ?? "Unknown";
    const temp = Math.floor(Math.random() * 30) + 50;
    return `Weather Report:
  • Condition: ${condition}
  • Temperature: ${temp}°F
  • Humidity: ${Math.floor(Math.random() * 40) + 40}%
  • Wind: ${Math.floor(Math.random() * 15)} mph

The weather appears favorable, sir.`;
  },
});

commandRegistry.register({
  name: "system info",
  aliases: ["sysinfo", "system"],
  description: "System information",
  execute: () => `System Information:
  • Platform: Windows
  • Runtime: Bun
  • TypeScript: Enabled
  • Memory Usage: Available
  • Uptime: Active

I have full access to system diagnostics, sir.`,
});

commandRegistry.register({
  name: "hello",
  aliases: ["hi", "hey", "greetings"],
  description: "Greeting",
  execute: () => {
    const greetings = [
      "Good day, sir. How may I be of service?",
      "Hello, sir. Systems are operational and ready.",
      "Good to hear from you. What would you like to accomplish?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)] ?? "Hello, sir.";
  },
});

commandRegistry.register({
  name: "search",
  description: "Search for something",
  execute: (query) => {
    if (!query) return "What would you like me to search for, sir?";
    return `Searching for "${query}"...\n\nResults would appear here, sir. I do not have internet connectivity in this terminal session.`;
  },
});

commandRegistry.register({
  name: "open",
  description: "Open an application or file",
  execute: (target) => {
    if (!target) return "What would you like me to open, sir?";
    return `Opening ${target}...\n\nI have initiated the request, sir.`;
  },
});

export { createCommandRegistry };
