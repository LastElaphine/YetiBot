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

All commands run from the project root (`/home/zesty/Documents/YetiBot`). This project uses **mise** for tool management.

### Development

```bash
mise run dev              # Run bot with hot reload (--watch)
mise run deploy-commands  # Deploy slash commands to test server
```

### Linting & Formatting

```bash
mise run lint             # Run Biome check (lint + imports + formatting)
mise run lint:fix         # Run Biome check and auto-fix issues
```

### Running Specific Files

```bash
mise exec -- deno run --allow-all main.ts                           # Run bot
mise exec -- deno run --allow-all deploy-commands.ts                 # Deploy commands
mise exec -- deno run -A npm:@biomejs/biome check <path>             # Lint specific file
mise exec -- deno run -A npm:@biomejs/biome check --write <path>     # Fix specific file
```

### Required Permissions

- `--allow-all` for development (bot needs Guilds intent, config access)
- `--allow-read` for command loading
- `--allow-net` for Discord API communication

## Code Style Guidelines

### Imports

- Use Deno native imports where possible (`@std/*`, `jsr:*`)
- Use npm: prefix for Node.js packages when needed
- Group imports: stdlib → external → relative
- Example:
  ```typescript
  import { readdir } from "node:fs/promises";
  import path from "node:path";
  import { Collection, type CommandInteraction } from "discord";
  import { Command } from "../../command.ts";
  ```

### Formatting

- Biome handles formatting automatically (run `deno task lint-fix`)
- Use tab indentation (2 spaces per tab)
- Double quotes for strings
- Trailing commas in multi-line objects/arrays
- Semicolons required

### Types

- Use TypeScript for all code
- Explicit return types on public functions
- Avoid `any` - use `unknown` or proper generics
- Use `interface` for object shapes, `type` for unions/primitives
- Prefix abstract class properties with `public abstract`

### Naming Conventions

- **Classes**: PascalCase (`class Ping extends Command`)
- **Variables/Functions**: camelCase (`const userId`, `function giveAmulet()`)
- **Constants**: SCREAMING_SNAKE_CASE for values, camelCase for config objects
- **Files**: kebab-case (`channel-helper.ts`, `amulet-util.ts`)
- **Commands**: Folder-based structure under `commands/<category>/<name>.ts`

### Error Handling

- Use `try/catch` for async operations
- Log errors with `console.error()`
- Return `null` or sensible defaults on failure
- Always handle Discord interaction replies with `ephemeral` flag for errors:
  ```typescript
  await interaction.reply({
    content: "Error message",
    flags: MessageFlags.Ephemeral,
  });
  ```

### Project Structure

```
YetiBot/
├── main.ts                 # Bot entry point, event handlers
├── command.ts              # Command base class + loader
├── deploy-commands.ts      # Slash command registration
├── commands/
│   ├── <category>/
│   │   └── <command>.ts    # Implement SlashCommandBuilder + Command
├── utils/
│   └── <name>-util.ts      # Singleton utility classes
├── deno.json               # Tasks, imports, permissions
├── biome.json              # Linter configuration
└── AGENTS.md               # This file
```

### Command Implementation Pattern

```typescript
import { type CommandInteraction, SlashCommandBuilder } from "discord";
import { Command } from "../../command.ts";

class <Name> extends Command {
  public override get data(): SlashCommandBuilder {
    return new SlashCommandBuilder()
      .setName("command-name")
      .setDescription("Description here")
      .addOption(/* options as needed */);
  }

  public override async execute(
    interaction: CommandInteraction,
  ): Promise<void> {
    await interaction.reply("response");
  }
}

export const command = new <Name>();
```

### Singleton Pattern for Utilities

- Use private static `instance` field
- Private constructor
- Public static `getInstance()` method
- Export single instance: `export { utilityName }`

### Discord Best Practices

- Always check `interaction.isChatInputCommand()` before handling
- Handle null checks for optional fields (`interaction.member`, `interaction.options.getUser()`)
- Use `MessageFlags.Ephemeral` for error messages and sensitive data

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- bv-agent-instructions-v1 -->

---

## Beads Workflow Integration

This project uses [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) for issue tracking. Issues are stored in `.beads/` and tracked in git.

### Essential Commands

```bash
# View issues (launches TUI - avoid in automated sessions)
bv

# CLI commands for agents (use these instead)
bd ready              # Show issues ready to work (no blockers)
bd list --status=open # All open issues
bd show <id>          # Full issue details with dependencies
bd create --title="..." --type=task --priority=2
bd update <id> --status=in_progress
bd close <id> --reason="Completed"
bd close <id1> <id2>  # Close multiple issues at once
bd sync               # Commit and push changes
```

### Workflow Pattern

1. **Start**: Run `bd ready` to find actionable work
2. **Claim**: Use `bd update <id> --status=in_progress`
3. **Work**: Implement the task
4. **Complete**: Use `bd close <id>`
5. **Sync**: Always run `bd sync` at session end

### Key Concepts

- **Dependencies**: Issues can block other issues. `bd ready` shows only unblocked work.
- **Priority**: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (use numbers, not words)
- **Types**: task, bug, feature, epic, question, docs
- **Blocking**: `bd dep add <issue> <depends-on>` to add dependencies

### Session Protocol

**Before ending any session, run this checklist:**

```bash
git status              # Check what changed
git add <files>         # Stage code changes
bd sync                 # Commit beads changes
git commit -m "..."     # Commit code
bd sync                 # Commit any new beads changes
git push                # Push to remote
```

### Best Practices

- Check `bd ready` at session start to find available work
- Update status as you work (in_progress → closed)
- Create new issues with `bd create` when you discover tasks
- Use descriptive titles and set appropriate priority/type
- Always `bd sync` before ending session

<!-- end-bv-agent-instructions -->
