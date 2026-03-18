export interface Message {
  id: number;
  type: "user" | "arthur";
  content: string;
  timestamp: Date;
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  execute: (args?: string) => string | Promise<string>;
}

export interface CommandRegistry {
  commands: Map<string, Command>;
  register: (command: Command) => void;
  get: (name: string) => Command | undefined;
  execute: (input: string) => Promise<string>;
  getHelp: () => string;
}
