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

export { createCommandRegistry };
