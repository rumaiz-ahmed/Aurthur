import type { Skill, SkillContext } from "./types";

export const webSearchSkill: Skill = {
  name: "webSearch",
  description: "Search the web for information",
  triggers: ["search", "find", "look up", "google", "web search", "?"],
  
  async execute(input: string, _context: SkillContext): Promise<string> {
    const query = input
      .replace(/search\s*(for)?/i, "")
      .replace(/find\s*(for)?/i, "")
      .replace(/look\s*up/i, "")
      .replace(/google/i, "")
      .trim();
    
    if (!query) {
      return "What would you like me to search for?";
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
        return `Search failed with status ${response.status}.`;
      }
      
      const html = await response.text();
      
      const results: Array<{ title: string; snippet: string; url: string }> = [];
      const resultRegex = /<a class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      
      let match;
      while ((match = resultRegex.exec(html)) !== null && results.length < 5) {
        results.push({
          url: match[1] ?? "",
          title: (match[2] ?? "").replace(/<[^>]+>/g, ""),
          snippet: (match[3] ?? "").replace(/<[^>]+>/g, "").trim(),
        });
      }
      
      if (results.length === 0) {
        return `No results found for "${query}".`;
      }
      
      const lines = [`Search results for "${query}":`, ""];
      results.forEach((r, i) => {
        lines.push(`${i + 1}. ${r.title}`);
        lines.push(`   ${r.snippet}`);
        // SECURITY: Display URL but warn users not to click untrusted links
        lines.push(`   [URL hidden for safety - view in browser]`);
        lines.push("");
      });
      
      return lines.join("\n").trim();
    } catch (error) {
      return `Search error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
};
