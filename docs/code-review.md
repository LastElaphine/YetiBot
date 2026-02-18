# Code Review - YetiBot

**Date**: 2026-02-17
**Reviewer**: Agent
**Files Reviewed**: main.ts, command.ts, database-manager.ts, give.ts, channel-helper.ts, atomic-json-adapter.ts, types/database.ts

---

## Critical Issues

### 1. Non-null Assertions on `this.db.data` (HIGH SEVERITY)

**Locations**:
- `utils/database-manager.ts:57, 100-102, 112, 118, 169, 176, 244`

**Problem**: Code uses `this.db.data!` throughout, which will throw runtime errors if `initialize()` fails or data is null.

**Example**:
```typescript
const guildData = this.db.data!.guilds.get(guildId);  // Line 57
```

**Fix**: Use optional chaining (`?.`) or add null checks:
```typescript
const guildData = this.db.data?.guilds.get(guildId);
```

---

### 2. Missing Null Check on guildId (HIGH SEVERITY)

**Location**: `commands/amulet/give.ts:39`

**Problem**: `interaction.guildId!` will crash if command is run in DM context.

```typescript
const guildId = interaction.guildId!;  // Crashes in DMs
```

**Fix**: Add early return for DM context:
```typescript
if (!interaction.guildId) {
  await interaction.reply({ content: "This command only works in servers.", flags: MessageFlags.Ephemeral });
  return;
}
```

---

## Medium Issues

### 3. Uncaught User Fetch Failure

**Location**: `utils/database-manager.ts:146`

**Problem**: `await this.client.users.fetch(userId)` can throw if user is not in cache.

```typescript
const discordUser = await this.client.users.fetch(userId);  // Can throw
```

**Fix**: Add try-catch or check cache first.

---

### 4. No Error Handling on db.write()

**Locations**: Throughout `database-manager.ts`

**Problem**: All `await this.db.write()` calls don't handle errors (disk full, permission errors, file locks).

**Fix**: Wrap in try-catch with error logging.

---

## Minor Issues

### 5. Unused Function Parameter

**Location**: `utils/atomic-json-adapter.ts:35`

```typescript
private mapReplacer(key: string, value: any): any  // key is unused
```

**Fix**: Prefix with underscore: `_key: string`

---

### 6. Optional Chain Opportunity

**Location**: `utils/channel-helper.ts:39`

```typescript
if (channel && channel.isSendable())  // Can be: channel?.isSendable()
```

---

## Lint Summary

Biome reports 21 warnings:
- 10x `noNonNullAssertion` 
- 6x `noExplicitAny`
- 1x `noUnusedFunctionParameters`
- 1x `useOptionalChain`
- Plus formatting issues in `data/db.json`

---

## Positive Observations

- Good error handling in `main.ts` with ephemeral error responses
- Proper singleton pattern in utilities
- Command loader has good validation
- Well-structured TypeScript types
- Clean separation of concerns
