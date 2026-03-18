import { TextAttributes } from "@opentui/core";

interface InputBoxProps {
  value: string;
  onInput: (value: string) => void;
  onSubmit: () => void;
}

export function InputBox({ value, onInput, onSubmit }: InputBoxProps) {
  return (
    <box
      paddingY={1}
      marginTop={1}
    >
      <box
        paddingX={2}
        paddingY={1}
      >
        <text fg="#00d4ff" attributes={TextAttributes.BOLD} marginRight={1}>
          ›
        </text>
        <input
          placeholder="Ask me anything..."
          value={value}
          onInput={(val: string) => onInput(val)}
          onSubmit={onSubmit}
          flexGrow={1}
        />
        <box marginLeft={2}>
          <text fg="#00d4ff" attributes={TextAttributes.DIM}>
            ↵
          </text>
        </box>
      </box>
    </box>
  );
}
