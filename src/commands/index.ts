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

export { commandRegistry };
