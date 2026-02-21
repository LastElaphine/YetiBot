# YetiBot 🤖

My personal Discord bot. Written in TypeScript and constantly evolving based on whatever cool ideas I have.

## Features

- 📿 **Amulet Game** - Pass the cursed amulet around, track holding times
- 🏆 **Leaderboards** - See who has held the amulet the longest
- 📊 **User Stats** - Track amulet holds and time statistics
- 🌐 **Web Dashboard** - View servers, users, and stats in a web UI

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
# Run bot with hot-reload
mise run dev

# Run web dashboard (requires API server)
mise run dev:api
mise run dev:web

# Run tests
mise run test

# Lint
mise run lint
```

### Deploying Slash Commands

```bash
# Deploy commands to test server (guild in config.json)
mise run deploy-dev-commands
```

Commands are automatically registered when the bot starts.

## Tech Stack

### Bot
- ⚡ [Deno](https://deno.land/) (runtime)
- 🦸 TypeScript
- 💬 [Discord.js](https://discord.js.org/) v14
- 💾 [LowDB](https://github.com/typicode/lowdb) v7 (JSON database)
- 🛡️ [Zod](https://zod.dev/) (validation)

### Web Dashboard
- ⚡ [Deno](https://deno.land/) (runtime)
- ⚛️ [React](https://react.dev/) v19
- 🎨 [Bootstrap](https://getbootstrap.com/) v5
- 🛠️ [Vite](https://vitejs.dev/) v7
- 📡 [React Router](https://reactrouter.com/) v7
- 🔧 [Biome](https://biomejs.dev/) (linting/formatting)
