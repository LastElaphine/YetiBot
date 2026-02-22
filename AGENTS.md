# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Build, Lint, and Test Commands

All commands run from the project root. This project uses **mise** for tool management.

### Development

```bash
npm run dev              # Run bot with hot reload
npm run deploy-commands  # Deploy slash commands to test server
npm start                # Run bot without hot reload
```

### Linting & Formatting

```bash
npm run lint             # Run Biome check (lint + imports + formatting)
npm run lint-fix         # Run Biome check and auto-fix issues
npx @biomejs/biome check <path>    # Lint file
npx @biomejs/biome check --write <path>  # Fix file
```

### Testing

```bash
npm test            # Run all tests
```

Tests are located in `tests/` directory:
- `tests/fixtures/` - Mock objects and test data
- `tests/commands/` - Command unit tests

#### Writing Tests

Use Node.js test runner with `@node:test` and `@node:assert`:

```typescript
import { assertEquals, assertExists } from "@node:assert";
import { test } from "@node:test";

test("Command name is correct", async () => {
  const { command } = await import("./commands/utility/ping.ts");
  assertEquals(command.data.name, "ping");
});
```

#### Mock Objects

Import test fixtures from `tests/fixtures/mod.ts`:

```typescript
import { createMockCommandInteraction, MockUser, MockGuild } from "../fixtures/mod.ts";

const interaction = createMockCommandInteraction({
  commandName: "ping",
  userId: "123",
  guildId: "456",
});
```

#### Running Specific Tests

```bash
node --test tests/commands/ping.test.ts
node --test tests/ -f "ping"
```

## Code Style Guidelines

### Imports

- Use Node.js-style imports
- Group: stdlib → external → relative
  ```typescript
  import { readdir } from "node:fs/promises";
  import { Collection, type CommandInteraction } from "discord";
  import { Command } from "../../command.js";
  ```

### Formatting (Biome)

- Tab indentation (2 spaces per tab)
- Double quotes for strings
- Trailing commas in multi-line objects/arrays
- Semicolons required
- Run `npm run lint-fix` to auto-format

### Types

- Use TypeScript for all code
- Explicit return types on public functions
- Avoid `any` - use `unknown` or proper generics
- Use `interface` for object shapes, `type` for unions/primitives

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `class Ping extends Command` |
| Variables/Functions | camelCase | `const userId`, `function giveAmulet()` |
| Constants | SCREAMING_SNAKE_CASE | `const MAX_COUNT = 10` |
| Files | kebab-case | `channel-helper.ts` |
| Commands | Folder-based | `commands/<category>/<name>.ts` |

### Error Handling

- Use `try/catch` for async operations
- Log errors with `console.error()`
- Return `null` or sensible defaults on failure
- Use `ephemeral` flag for error messages:
  ```typescript
  await interaction.reply({
    content: "Error message",
    flags: MessageFlags.Ephemeral,
  });
  ```

## Project Structure

```
YetiBot/
├── main.ts                 # Bot entry point, event handlers
├── command.ts              # Command base class + loader
├── deploy-commands.ts      # Slash command registration
├── commands/<category>/<name>.ts  # Slash commands
├── utils/<name>-util.ts     # Singleton utilities
├── tests/                   # Test files
│   ├── fixtures/           # Mock objects and test data
│   └── commands/           # Command unit tests
├── package.json             # Dependencies, scripts
├── tsconfig.json            # TypeScript config
├── biome.json               # Linter/formatter config
└── AGENTS.md                # This file
```

## Command Implementation Pattern

```typescript
import { type CommandInteraction, SlashCommandBuilder } from "discord";
import { Command } from "../../command.js";

class <Name> extends Command {
  public override get data(): SlashCommandBuilder {
    return new SlashCommandBuilder()
      .setName("command-name")
      .setDescription("Description here")
      .addOption(/* options */);
  }

  public override async execute(interaction: CommandInteraction): Promise<void> {
    await interaction.reply("response");
  }
}

export const command = new <Name>();
```

### Singleton Pattern for Utilities

- Private static `instance` field
- Private constructor
- Public static `getInstance()` method
- Export single instance: `export { utilityName }`

### Discord Best Practices

- Check `interaction.isChatInputCommand()` before handling
- Handle null checks for optional fields (`interaction.member`, `interaction.options.getUser()`)
- Use `MessageFlags.Ephemeral` for errors and sensitive data

## Session Completion (MANDATORY)

1. Run quality gates: `npm run lint`
2. Update issue status: `bd close <id>`
3. Sync and push:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # Must show "up to date with origin"
   ```

**CRITICAL**: Work is NOT complete until `git push` succeeds.
