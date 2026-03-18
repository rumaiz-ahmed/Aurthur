import { TextAttributes } from "@opentui/core";
import { useState, useCallback, useRef } from "react";
import type { Message } from "../types";
import { commandRegistry } from "../commands";
import { Header } from "./Header";
import { ChatBox } from "./ChatBox";
import { InputBox } from "./InputBox";

const INITIAL_MESSAGE: Message = {
  id: 0,
  type: "arthur",
  content:
    "Initializing ARTHUR interface...\nAll systems online.\n\nGood evening, sir. I am ARTHUR. How may I assist you today?",
  timestamp: new Date(),
};

export function ArthurApp() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTyping, setCurrentTyping] = useState("");
  const inputRef = useRef("");

  const typeResponse = useCallback(async (text: string) => {
    setCurrentTyping("");
    await new Promise((resolve) => setTimeout(resolve, 300));

    const chars = text.split("");
    for (let i = 0; i < chars.length; i++) {
      setCurrentTyping((prev: string) => prev + chars[i]);
      if (chars[i] === "\n") {
        await new Promise((r) => setTimeout(r, 100));
      } else {
        await new Promise((r) => setTimeout(r, 8));
      }
    }
    await new Promise((r) => setTimeout(r, 200));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    inputRef.current = input;
    setInput("");
    setIsProcessing(true);

    const response = await commandRegistry.execute(inputRef.current);

    if (inputRef.current.toLowerCase() === "clear") {
      setMessages([]);
      setCurrentTyping("");
      setIsProcessing(false);
      return;
    }

    if (inputRef.current.toLowerCase() === "exit" || inputRef.current.toLowerCase() === "quit") {
      await typeResponse(response);
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    } else {
      await typeResponse(response);
    }

    const arthurMessage: Message = {
      id: Date.now() + 1,
      type: "arthur",
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, arthurMessage]);
    setCurrentTyping("");
    setIsProcessing(false);
  }, [input, isProcessing, typeResponse]);

  return (
    <box flexGrow={1} flexDirection="column" padding={1}>
      <Header />

      <ChatBox messages={messages} currentTyping={currentTyping} />

      <InputBox value={input} onInput={setInput} onSubmit={handleSubmit} />

      <text fg="#444444" attributes={TextAttributes.DIM}>
        Type "help" for available commands
      </text>
    </box>
  );
}
