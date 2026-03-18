import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { ArthurApp } from "./components";

async function main() {
  const renderer = await createCliRenderer();
  createRoot(renderer).render(<ArthurApp />);
}

main();
