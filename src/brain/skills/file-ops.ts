import { existsSync, readFileSync, writeFileSync, statSync } from "fs";
import { resolve } from "path";
import type { Skill, SkillContext } from "./types";

export const fileOpsSkill: Skill = {
  name: "fileOps",
  description: "Read, write, and modify files",
  triggers: [
    "read file", "show file", "cat", "view file",
    "write file", "create file", "save file",
    "edit file", "modify file", "append to file"
  ],
  
  async execute(input: string, context: SkillContext): Promise<string> {
    const workingDir = context.workingDirectory || process.cwd();
    
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.startsWith("read ") || lowerInput.startsWith("show ") || lowerInput.includes("cat ")) {
      const path = extractPath(input, ["read", "show", "cat"]);
      return readFile(path, workingDir);
    }
    
    if (lowerInput.startsWith("write ") || lowerInput.startsWith("create ") || lowerInput.startsWith("save ")) {
      const { path, content } = extractWriteParams(input);
      return writeFile(path, content, workingDir);
    }
    
    if (lowerInput.startsWith("edit ") || lowerInput.startsWith("modify ") || lowerInput.includes("append ")) {
      return `[Skill: fileOps] Edit/modify operations require more context. Try: read file <path>`;
    }
    
    return `[Skill: fileOps] Unknown operation. Try: read file <path>, write file <path> <content>`;
  },
};

function extractPath(input: string, commands: string[]): string {
  for (const cmd of commands) {
    const idx = input.toLowerCase().indexOf(cmd);
    if (idx !== -1) {
      const after = input.slice(idx + cmd.length).trim();
      return after.replace(/^["']|["']$/g, "").trim();
    }
  }
  return input.trim();
}

function extractWriteParams(input: string): { path: string; content: string } {
  const parts = input.split(/\s+/);
  let path = "";
  let content = "";
  
  const fileIdx = parts.findIndex((p) => p.toLowerCase() === "file");
  
    if (fileIdx !== -1 && parts[fileIdx + 1] !== undefined) {
      path = parts[fileIdx + 1] ?? "";
      content = parts.slice(fileIdx + 2).join(" ");
    }
  
  return { path, content };
}

function isPathSafe(resolvedPath: string, workingDir: string): boolean {
  const normalizedResolved = resolvedPath.replace(/\\/g, "/");
  const normalizedWorking = workingDir.replace(/\\/g, "/");
  return normalizedResolved.startsWith(normalizedWorking + "/") || normalizedResolved === normalizedWorking;
}

function readFile(path: string, workingDir: string): string {
  try {
    const resolvedPath = resolve(workingDir, path);
    
    // SECURITY: Prevent path traversal attacks
    if (!isPathSafe(resolvedPath, workingDir)) {
      return `Access denied: Path "${path}" is outside working directory.`;
    }
    
    if (!existsSync(resolvedPath)) {
      return `File not found: ${resolvedPath}`;
    }
    
    const stat = statSync(resolvedPath);
    if (stat.isDirectory()) {
      return `Path is a directory, not a file: ${resolvedPath}`;
    }
    
    const content = readFileSync(resolvedPath, "utf-8");
    const lines = content.split("\n");
    
    if (lines.length > 100) {
      return `File: ${resolvedPath} (${lines.length} lines)\n\n${lines.slice(0, 100).join("\n")}\n\n... (truncated, ${lines.length - 100} more lines)`;
    }
    
    return `File: ${resolvedPath}\n\n${content}`;
  } catch (error) {
    return `Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

function writeFile(path: string, content: string, workingDir: string): string {
  try {
    const resolvedPath = resolve(workingDir, path);
    
    // SECURITY: Prevent path traversal attacks
    if (!isPathSafe(resolvedPath, workingDir)) {
      return `Access denied: Path "${path}" is outside working directory.`;
    }
    
    writeFileSync(resolvedPath, content, "utf-8");
    
    return `File written: ${resolvedPath}`;
  } catch (error) {
    return `Error writing file: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
