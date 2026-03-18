import { createCommandRegistry } from "./registry";
import type { Command } from "../types";
import {
  timeCommand,
  dateCommand,
  aboutCommand,
  statusCommand,
  jokeCommand,
  fortuneCommand,
  quoteCommand,
  weatherCommand,
  sysinfoCommand,
  helloCommand,
  openCommand,
  searchWebCommand,
} from "./commands";

const commandRegistry = createCommandRegistry();

const helpCommand: Command = {
  name: "help",
  aliases: ["commands", "?"],
  description: "Show available commands",
  execute: () => commandRegistry.getHelp(),
};

commandRegistry.register(helpCommand);
commandRegistry.register(timeCommand);
commandRegistry.register(dateCommand);
commandRegistry.register(aboutCommand);
commandRegistry.register(statusCommand);
commandRegistry.register(jokeCommand);
commandRegistry.register(fortuneCommand);
commandRegistry.register(quoteCommand);
commandRegistry.register(weatherCommand);
commandRegistry.register(sysinfoCommand);
commandRegistry.register(helloCommand);
commandRegistry.register(openCommand);
commandRegistry.register(searchWebCommand);

export { commandRegistry };
