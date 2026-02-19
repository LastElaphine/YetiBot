# YetiBot
My personal Discord bot. Written in TypeScript and constantly evolving based on whatever cool ideas I have.

## Objectives
- [x] Setup Deno
- [x] Setup Biome
- [ ] Configure OpenTelemetry
- [x] Setup Discord.js with a simple bot
- [x] Create an easy dev environment
- [ ] Create an easy update process
- [x] Setup Biome CI integrations for github
- [x] Setup testing environment with Deno

## Quick Start

### Development
```bash
# Install dependencies
mise run dev

# Run tests
mise run test

# Lint
mise run lint
```

### Docker
```bash
# Production
docker-compose up bot

# Development with hot-reload
docker-compose up dev
```

### Deploying Slash Commands

```bash
# Deploy commands to test server (guild in config.json)
mise run deploy-dev-commands
# or
deno run --allow-all deploy-commands.ts
```

Commands are automatically registered when the bot starts.

## Features
- Slash commands
- Amulet game
- Tag game
- User stats and leaderboards

## Tech Stack
- Deno (runtime)
- TypeScript
- Discord.js
- Biome (linting/formatting)
- LowDB (JSON database)
