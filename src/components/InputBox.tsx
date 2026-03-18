interface InputBoxProps {
  value: string;
  onInput: (value: string) => void;
  onSubmit: () => void;
}

export function InputBox({ value, onInput, onSubmit }: InputBoxProps) {
  return (
    <box
      style={{ border: true, borderStyle: "rounded", borderColor: "#00d4ff" }}
      padding={1}
    >
      <text fg="#00d4ff" marginRight={1}>&gt;</text>
      <input
        placeholder="Enter command or question..."
        value={value}
        onInput={(val: string) => onInput(val)}
        onSubmit={onSubmit}
        flexGrow={1}
      />
      <text fg="#888888" marginLeft={1}>[Enter]</text>
    </box>
  );
}
