import { TextAttributes } from "@opentui/core";
import type { Message } from "../types";

interface ChatBoxProps {
  messages: Message[];
  currentTyping: string;
}

export function ChatBox({ messages, currentTyping }: ChatBoxProps) {
  return (
    <box
      style={{ border: true, borderStyle: "rounded", borderColor: "#00d4ff" }}
      flexGrow={1}
      flexDirection="column"
      padding={1}
      marginBottom={1}
      overflow="hidden"
    >
      <scrollbox flexGrow={1} overflow="scroll">
        {messages.map((msg: Message) => (
          <box key={msg.id} marginBottom={1}>
            {msg.type === "user" ? (
              <box flexDirection="column" alignItems="flex-end">
                <text fg="#ffffff">
                  <span fg="#888888">&gt; </span>
                  <span fg="#00ff00">{msg.content}</span>
                </text>
              </box>
            ) : (
              <box flexDirection="column">
                <text fg="#00d4ff" attributes={TextAttributes.BOLD}>
                  ARTHUR:
                </text>
                <text fg="#c0c0c0">{msg.content}</text>
              </box>
            )}
          </box>
        ))}
        {currentTyping && (
          <box flexDirection="column">
            <text fg="#00d4ff" attributes={TextAttributes.BOLD}>
              ARTHUR:
            </text>
            <text fg="#c0c0c0">
              {currentTyping}
              <span fg="#00d4ff">▋</span>
            </text>
          </box>
        )}
      </scrollbox>
    </box>
  );
}
