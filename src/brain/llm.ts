import type { ProviderConfig, LLMRequest } from "./types";

export interface LLMClient {
  complete: (prompt: string, systemPrompt?: string) => Promise<string>;
  completeWithHistory: (
    prompt: string,
    systemPrompt: string | undefined,
    history: Array<{ role: "user" | "assistant"; content: string }>
  ) => Promise<string>;
  completeStream: (
    prompt: string,
    systemPrompt: string | undefined,
    onChunk: (chunk: string) => void
  ) => Promise<string>;
  listModels: () => Promise<string[]>;
  isAvailable: () => Promise<boolean>;
}

export function createLLMClient(config: ProviderConfig): LLMClient {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function completeWithHistory(
    prompt: string,
    systemPrompt: string | undefined,
    history: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    
    // Add conversation history
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }
    
    messages.push({ role: "user", content: prompt });

    const request: LLMRequest = {
      model: config.defaultModel,
      messages,
      temperature: 0.7,
      maxTokens: 2048,
    };

    const response = await fetchWithTimeout(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM request failed: ${response.status} - ${error}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || "";
  }

  async function complete(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const request: LLMRequest = {
      model: config.defaultModel,
      messages,
      temperature: 0.7,
      maxTokens: 2048,
    };

    const response = await fetchWithTimeout(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM request failed: ${response.status} - ${error}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || "";
  }

  async function completeStream(
    prompt: string,
    systemPrompt: string | undefined,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const request: LLMRequest = {
      model: config.defaultModel,
      messages,
      temperature: 0.7,
      maxTokens: 2048,
      stream: true,
    };

    const response = await fetchWithTimeout(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { ...headers, Accept: "text/event-stream" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM request failed: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  onChunk(content);
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
        controller.close();
      },
    });

    await new Response(stream).text();
    return fullContent;
  }

  async function listModels(): Promise<string[]> {
    try {
      let url = `${config.baseUrl}/models`;
      if (config.name === "Ollama" || config.name === "LM Studio") {
        url = config.baseUrl.replace("/v1", "/api/tags");
      }

      const response = await fetchWithTimeout(url, { headers }, 5000);
      if (!response.ok) return [config.defaultModel];

      const data = await response.json() as unknown as {
        data?: Array<{ id: string }>;
        models?: Array<{ name: string }>;
      };

      if (data.data) {
        return data.data.map((m) => m.id);
      }
      if (data.models) {
        return data.models.map((m) => m.name);
      }
      if (Array.isArray(data)) {
        return (data as Array<{ id?: string }>).map((m) => m.id || config.defaultModel);
      }

      return [config.defaultModel];
    } catch {
      return [config.defaultModel];
    }
  }

  async function isAvailable(): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(
        `${config.baseUrl}/models`,
        { headers },
        5000
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  return { complete, completeWithHistory, completeStream, listModels, isAvailable };
}
