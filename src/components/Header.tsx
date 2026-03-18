import { TextAttributes } from "@opentui/core";
import { useState, useEffect } from "react";
import { createBrainEngine } from "../brain/engine";

export function Header() {
  const [stats, setStats] = useState<{
    provider: string;
    model: string;
    brainEnabled: boolean;
  } | null>(null);

  useEffect(() => {
    try {
      const brain = createBrainEngine();
      const s = brain.getStats();
      setStats({
        provider: s.provider,
        model: s.model,
        brainEnabled: true,
      });
    } catch {
      setStats({
        provider: "Command-only",
        model: "No brain",
        brainEnabled: false,
      });
    }
  }, []);

  return (
    <box flexDirection="column" alignItems="center" marginBottom={1}>
      <ascii-font font="block" text="ARTHUR" />
      <box marginTop={1}>
        <text fg="#00d4ff" attributes={TextAttributes.BOLD}>
          {stats?.brainEnabled ? "🧠 Brain Active" : "⚡ Command Mode"}
        </text>
        {stats?.brainEnabled && (
          <text fg="#888888" marginLeft={2}>
            {stats.provider} • {stats.model}
          </text>
        )}
      </box>
    </box>
  );
}
