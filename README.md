# YetiBot 🤖

My personal Discord bot. Written in TypeScript and constantly evolving based on whatever cool ideas I have.

## Features

- 📿 **Amulet Game** - Pass the cursed amulet around, track holding times
- 🏆 **Leaderboards** - See who has held the amulet the longest
- 📊 **User Stats** - Track amulet holds and time statistics

## Commands

| Command | Description |
|---------|-------------|
| `/give` | Give the amulet to a user |
| `/who` | Shows who currently has the amulet |
| `/leaderboard` | Shows ranking by time held |
| `/reset` | Force reset the amulet (moderator) |
| `/ping` | Pong! |
| `/user` | User info |

## Quick Start

### Development

```bash
# Install dependencies and run with hot-reload
mise run dev

# Run tests
mise run test

# Lint
mise run lint
```

### Deploying Slash Commands

```bash
# Deploy commands to test server (guild in config.json)
mise run deploy-dev-commands
# or
deno run --allow-all deploy-commands.ts
```

Commands are automatically registered when the bot starts.

## Tech Stack

- ⚡ [Deno](https://deno.land/) (runtime)
- 🦸 TypeScript
- 💬 [Discord.js](https://discord.js.org/)
- 🔧 [Biome](https://biomejs.dev/) (linting/formatting)
- 💾 [LowDB](https://github.com/typicode/lowdb) (JSON database)
