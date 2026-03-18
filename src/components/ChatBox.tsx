import { TextAttributes } from "@opentui/core";
import type { Message } from "../types";

interface ChatBoxProps {
  messages: Message[];
  currentTyping: string;
}

export function ChatBox({ messages, currentTyping }: ChatBoxProps) {
  return (
    <box
      flexGrow={1}
      flexDirection="column"
      padding={1}
      overflow="hidden"
    >
      <scrollbox flexGrow={1} overflow="scroll">
        {messages.map((msg: Message) => (
          <box key={msg.id} marginBottom={2}>
            {msg.type === "user" ? (
              <box flexDirection="column" alignItems="flex-end" width="100%">
                <text fg="#666666" attributes={TextAttributes.DIM}>
                  You
                </text>
                <box
                  paddingX={2}
                  paddingY={1}
                  maxWidth="75%"
                >
                  <text fg="#e0e0e0">{msg.content}</text>
                </box>
              </box>
            ) : (
              <box flexDirection="column" width="100%">
                <text fg="#00d4ff" attributes={TextAttributes.BOLD}>
                  ◇ ARTHUR
                </text>
                <box paddingY={0}>
                  <text fg="#b0b0b0">{msg.content}</text>
                </box>
              </box>
            )}
          </box>
        ))}
        {currentTyping && (
          <box marginBottom={2}>
            <text fg="#00d4ff" attributes={TextAttributes.BOLD}>
              ◇ ARTHUR
            </text>
            <box paddingY={0}>
              <text fg="#b0b0b0">
                {currentTyping}
                <span fg="#00d4ff" attributes={TextAttributes.BLINK}> ▊</span>
              </text>
            </box>
          </box>
        )}
        {messages.length === 1 && (
          <box flexDirection="column" alignItems="center" marginTop={2}>
            <text fg="#444444" attributes={TextAttributes.DIM}>
              ─────────────────────────────────────
            </text>
            <box marginTop={1}>
              <text fg="#666666">Try: </text>
              <text fg="#00d4ff">"help"</text>
              <text fg="#666666">, </text>
              <text fg="#00d4ff">"brain status"</text>
              <text fg="#666666">, or </text>
              <text fg="#00d4ff">"who are you"</text>
            </box>
            <box marginTop={1}>
              <text fg="#666666" attributes={TextAttributes.DIM}>
                Or just chat with me directly
              </text>
            </box>
          </box>
        )}
      </scrollbox>
    </box>
  );
}
