# YetiBot Web Dashboard

A lightweight web dashboard for viewing YetiBot stats across your Discord servers.

## Overview

The web dashboard runs alongside the Discord bot in the same process, reading from the shared `data/db.json` database. It provides a visual interface for viewing:

- **Current Holder** - Who currently has the amulet in each server
- **Leaderboards** - Rankings by hold time, hold count, passes given, longest hold
- **Server Logs** - Transfer history and activity logs
- **Multi-Server View** - Aggregate stats across all servers

## Configuration

Web settings in `config.json`:

```json
{
  "web": {
    "enabled": true,
    "port": 8080
  }
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Main dashboard page |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/guilds` | List all guilds |
| `GET` | `/api/guilds/:id` | Guild details |
| `GET` | `/api/guilds/:id/holder` | Current amulet holder |
| `GET` | `/api/guilds/:id/leaderboard` | Leaderboard data |
| `GET` | `/api/guilds/:id/history` | Transfer history |

## Running

```bash
# Run both bot and web
deno run -A --watch main.ts

# Web runs on port 8080 by default
```

## Tech Stack

- **Runtime**: Deno
- **HTTP Server**: Deno std/http
- **Frontend**: Vanilla HTML/CSS/JS
- **Database**: Shared JSON file (lowdb)
