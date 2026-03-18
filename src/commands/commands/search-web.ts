import type { Command } from "../../types";

async function searchWeb(query: string): Promise<string> {
  if (!query.trim()) {
    return "What would you like me to search for, sir?";
  }

  try {
    const encoded = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encoded}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ARTHUR/1.0)",
      },
    });

    if (!response.ok) {
      return `Search failed with status ${response.status}, sir.`;
    }

    const html = await response.text();

    const results: Array<{ title: string; snippet: string; url: string }> = [];
    const resultRegex = /<a class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

    let match;
    while ((match = resultRegex.exec(html)) !== null && results.length < 5) {
      const url = match[1] ?? "";
      const title = (match[2] ?? "").replace(/<[^>]+>/g, "");
      const snippet = (match[3] ?? "").replace(/<[^>]+>/g, "").trim();
      results.push({ url, title, snippet });
    }

    if (results.length === 0) {
      return `No results found for "${query}", sir.`;
    }

    const lines = [`Search results for "${query}":`, ""];
    results.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.title}`);
      lines.push(`   ${r.snippet}`);
      lines.push(`   ${r.url}`);
      lines.push("");
    });

    return lines.join("\n").trim();
  } catch (error) {
    return `Search encountered an error, sir: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

export const searchWebCommand: Command = {
  name: "search-web",
  aliases: ["search", "google"],
  description: "Search the web via DuckDuckGo",
  execute: (args) => searchWeb(args ?? ""),
};
