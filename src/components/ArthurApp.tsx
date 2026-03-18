import { TextAttributes } from "@opentui/core";
import { useState, useCallback, useRef, useEffect } from "react";
import type { Message } from "../types";
import { commandRegistry } from "../commands";
import { Header } from "./Header";
import { ChatBox } from "./ChatBox";
import { InputBox } from "./InputBox";
import { createBrainEngine } from "../brain/engine";

const INITIAL_MESSAGE: Message = {
  id: 0,
  type: "arthur",
  content: "All systems online. How may I assist you today?",
  timestamp: new Date(),
};

export function ArthurApp() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTyping, setCurrentTyping] = useState("");
  const [brainEnabled, setBrainEnabled] = useState(false);
  const inputRef = useRef("");
  const brainRef = useRef<ReturnType<typeof createBrainEngine> | null>(null);
  const brainInitializedRef = useRef(false);

  useEffect(() => {
    if (brainInitializedRef.current) return;
    brainInitializedRef.current = true;

    try {
      brainRef.current = createBrainEngine();
      brainRef.current.getStats(); // Test connection
      setBrainEnabled(true);
    } catch {
      setBrainEnabled(false);
    }
  }, []);

  const typeResponse = useCallback(async (text: string) => {
    setCurrentTyping("");
    await new Promise((resolve) => setTimeout(resolve, 150));

    const chars = text.split("");
    for (let i = 0; i < chars.length; i++) {
      setCurrentTyping((prev: string) => prev + chars[i]);
      if (chars[i] === "\n") {
        await new Promise((r) => setTimeout(r, 60));
      } else {
        await new Promise((r) => setTimeout(r, 5));
      }
    }
    await new Promise((r) => setTimeout(r, 100));
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

    const commandName = inputRef.current.toLowerCase().split(/\s+/)[0] ?? "";
    const command = commandRegistry.get(commandName);

    let response: string;

    if (command) {
      response = await command.execute(inputRef.current);
    } else if (brainRef.current && brainEnabled) {
      try {
        response = await brainRef.current.think(inputRef.current);
      } catch (error) {
        response = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    } else {
      response = await commandRegistry.execute(inputRef.current);
    }

    if (inputRef.current.toLowerCase() === "clear") {
      setMessages([INITIAL_MESSAGE]);
      setCurrentTyping("");
      setIsProcessing(false);
      return;
    }

    if (inputRef.current.toLowerCase() === "exit" || inputRef.current.toLowerCase() === "quit") {
      await typeResponse(response);
      setTimeout(() => process.exit(0), 2000);
      return;
    }

    await typeResponse(response);

    const arthurMessage: Message = {
      id: Date.now() + 1,
      type: "arthur",
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, arthurMessage]);
    setCurrentTyping("");
    setIsProcessing(false);
  }, [input, isProcessing, typeResponse, brainEnabled]);

  return (
    <box flexGrow={1} flexDirection="column">
      <Header />
      <ChatBox messages={messages} currentTyping={currentTyping} />
      <InputBox value={input} onInput={setInput} onSubmit={handleSubmit} />
      <box justifyContent="center" marginTop={1}>
        <text fg="#444444" attributes={TextAttributes.DIM}>
          {isProcessing ? "Processing..." : `"help" for commands`}
        </text>
      </box>
    </box>
  );
}
