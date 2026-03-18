import { TextAttributes } from "@opentui/core";

interface InputBoxProps {
  value: string;
  onInput: (value: string) => void;
  onSubmit: () => void;
}

export function InputBox({ value, onInput, onSubmit }: InputBoxProps) {
  return (
    <box
      style={{ border: true, borderStyle: "rounded", borderColor: "#1a1a2e" }}
      padding={1}
    >
      <text fg="#00d4ff" marginRight={1}>›</text>
      <input
        placeholder="Ask ARTHUR anything..."
        value={value}
        onInput={(val: string) => onInput(val)}
        onSubmit={onSubmit}
        flexGrow={1}
      />
      <text fg="#666666" marginLeft={1} attributes={TextAttributes.DIM}>
        [Enter]
      </text>
    </box>
  );
}
