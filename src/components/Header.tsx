import { TextAttributes } from "@opentui/core";
import { useEffect, useState } from "react";
import { createBrainEngine } from "../brain/engine";

export function Header() {
  const [stats, setStats] = useState<{
    provider: string;
    model: string;
    brainEnabled: boolean;
    connected: boolean;
  }>({ provider: "", model: "", brainEnabled: false, connected: false });

  useEffect(() => {
    try {
      const brain = createBrainEngine();
      const s = brain.getStats();
      setStats({
        provider: s.provider,
        model: s.model,
        brainEnabled: true,
        connected: s.provider !== "Command-only",
      });
    } catch {
      setStats({
        provider: "Offline",
        model: "No brain",
        brainEnabled: false,
        connected: false,
      });
    }
  }, []);

  return (
    <box flexDirection="column" alignItems="center" marginBottom={2}>
      <box marginBottom={1}>
        <text fg="#00d4ff" attributes={TextAttributes.BOLD}>
          ┌───────────────────────────────┐
        </text>
      </box>
      <box>
        <text fg="#00d4ff" attributes={TextAttributes.BOLD}>│  </text>
        <text fg="#00d4ff" attributes={TextAttributes.BOLD}>  ARTHUR  </text>
        <text fg="#00d4ff" attributes={TextAttributes.BOLD}>  │</text>
      </box>
      <box marginBottom={1}>
        <text fg="#00d4ff" attributes={TextAttributes.BOLD}>
          └───────────────────────────────┘
        </text>
      </box>
      <box gap={2}>
        <box>
          <text fg={stats.connected ? "#00ff88" : "#ff6b6b"}>
            {stats.connected ? "●" : "○"}
          </text>
          <text fg="#888888" marginLeft={1}>
            {stats.brainEnabled ? stats.provider : "Command Mode"}
          </text>
        </box>
        {stats.brainEnabled && (
          <text fg="#666666">
            {stats.model}
          </text>
        )}
      </box>
    </box>
  );
}
