# ARTHUR

An interactive terminal assistant bot built with OpenTUI and React.

## Getting Started

```bash
pnpm install
pnpm dev
```

## Features

- Interactive CLI interface with typing effect
- Extensible command system
- Modular architecture

## Architecture

```
src/
├── index.tsx           # Entry point
├── types.ts            # TypeScript interfaces
├── commands/
│   └── index.ts        # Command registry
└── components/
    ├── Header.tsx      # ASCII header
    ├── ChatBox.tsx     # Message display
    ├── InputBox.tsx    # Input field
    └── ArthurApp.tsx   # Main app
```

## Commands

Type `help` in the terminal to see available commands.

---

Built with [OpenTUI](https://opentui.com)
