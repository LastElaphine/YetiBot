import { z } from "zod";

export const UserProfileSchema = z.object({
	id: z.string(),
	username: z.string(),
	displayName: z.string().optional(),
	guildId: z.string(),
	joinedAt: z.date(),
	lastSeen: z.date(),
	stats: z.object({
		amuletHeldCount: z.number().int().min(0),
		amuletHeldTimeMs: z.number().int().min(0),
		gamesPlayed: z.number().int().min(0),
		commandUses: z.record(z.string(), z.number().int()),
	}),
	preferences: z.object({
		notifications: z.boolean(),
		timezone: z.string().optional(),
	}),
	achievements: z.array(z.string()),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type UserProfileInput = z.input<typeof UserProfileSchema>;

export const TransferRecordSchema = z.object({
	fromUserId: z.string().nullable(),
	toUserId: z.string(),
	transferredAt: z.date(),
	channelId: z.string(),
});

export const AmuletStateSchema = z.object({
	currentHolder: z.string().nullable(),
	channelId: z.string().nullable(),
	timeoutMs: z.number().int().positive(),
	lastTransferred: z.date(),
	transferHistory: z.array(TransferRecordSchema),
});

export const TagStateSchema = z.object({
	currentIt: z.string().nullable(),
	gameStartTime: z.date(),
	scores: z.record(z.string(), z.number()),
});

export const GameSettingsSchema = z.object({
	amuletTimeoutMs: z.number().int().positive(),
	enableNotifications: z.boolean(),
	gameChannels: z.array(z.string()),
	adminRoles: z.array(z.string()),
});

export const GuildGameStateSchema = z.object({
	guildId: z.string(),
	amulet: AmuletStateSchema,
	tag: TagStateSchema.optional(),
	settings: GameSettingsSchema,
	isActive: z.boolean(),
	lastActivity: z.date(),
	updatedAt: z.date(),
});

export const LeaderboardEntrySchema = z.object({
	userId: z.string(),
	username: z.string(),
	score: z.number(),
	rank: z.number().int().min(0),
	lastUpdated: z.date(),
});

export const GuildDatabaseSchema = z.object({
	guildId: z.string(),
	users: z.record(z.string(), UserProfileSchema),
	gameState: GuildGameStateSchema,
	leaderboards: z.record(
		z.string(),
		z.record(z.string(), LeaderboardEntrySchema),
	),
	metadata: z.object({
		createdAt: z.date(),
		lastActivity: z.date(),
		totalUsers: z.number().int().min(0),
		version: z.string(),
	}),
});

export const GlobalMetadataSchema = z.object({
	version: z.string(),
	totalGuilds: z.number().int().min(0),
	totalUsers: z.number().int().min(0),
	lastBackup: z.date().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const DatabaseSchema = z.object({
	guilds: z.record(z.string(), GuildDatabaseSchema),
	globalMetadata: GlobalMetadataSchema,
});

export function validateUserProfile(data: unknown): UserProfileInput {
	return UserProfileSchema.parse(data);
}

export function validateGuildDatabase(data: unknown) {
	return GuildDatabaseSchema.parse(data);
}

export function validateDatabaseSchema(data: unknown) {
	return DatabaseSchema.parse(data);
}

export function safeValidateUserProfile(data: unknown) {
	return UserProfileSchema.safeParse(data);
}

export function safeValidateGuildDatabase(data: unknown) {
	return GuildDatabaseSchema.safeParse(data);
}

export function safeValidateDatabaseSchema(data: unknown) {
	return DatabaseSchema.safeParse(data);
}
