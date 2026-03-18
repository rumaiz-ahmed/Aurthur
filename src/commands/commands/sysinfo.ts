import type { Command } from "../../types";

export const sysinfoCommand: Command = {
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
};
