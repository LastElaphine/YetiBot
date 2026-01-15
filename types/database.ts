export interface UserProfile {
	id: string; // Discord user ID
	username: string; // Discord username
	displayName?: string; // Server nickname (guild-specific)
	guildId: string; // Primary guild context
	joinedAt: Date; // When user first interacted in this guild
	lastSeen: Date; // Last interaction timestamp
	stats: {
		amuletHeldCount: number; // Times amulet was held in this guild
		amuletHeldTimeMs: number; // Total time holding amulet in this guild
		gamesPlayed: number; // Total games participated in this guild
		commandUses: Map<string, number>; // Command usage counts
	};
	preferences: {
		notifications: boolean; // DM notifications enabled
		timezone?: string; // User timezone (optional)
	};
	achievements: string[]; // Achievement IDs (guild-specific)
	createdAt: Date;
	updatedAt: Date;
}

export interface GuildGameState {
	guildId: string;
	amulet: {
		currentHolder: string | null; // User ID
		channelId: string | null; // Where amulet is currently held
		timeoutMs: number; // Amulet timeout duration
		lastTransferred: Date; // When last transferred
		transferHistory: Array<{
			fromUserId: string | null;
			toUserId: string;
			transferredAt: Date;
			channelId: string;
		}>;
	};
	tag?: {
		currentIt: string | null;
		gameStartTime: Date;
		scores: Map<string, number>; // User ID -> score
	};
	settings: {
		amuletTimeoutMs: number;
		enableNotifications: boolean;
		gameChannels: string[]; // Channels where games can be played
		adminRoles: string[]; // Roles with game control permissions
	};
	isActive: boolean;
	lastActivity: Date;
	updatedAt: Date;
}

export interface LeaderboardEntry {
	userId: string;
	username: string;
	score: number;
	rank: number;
	lastUpdated: Date;
}

export interface GuildDatabase {
	guildId: string;
	users: Map<string, UserProfile>; // Key: userId
	gameState: GuildGameState;
	leaderboards: {
		[category: string]: Map<string, LeaderboardEntry>; // Key: userId
	};
	metadata: {
		createdAt: Date;
		lastActivity: Date;
		totalUsers: number;
		version: string;
	};
}

export interface DatabaseSchema {
	guilds: Map<string, GuildDatabase>; // Key: guildId
	globalMetadata: {
		version: string;
		totalGuilds: number;
		totalUsers: number;
		lastBackup?: Date;
		createdAt: Date;
		updatedAt: Date;
	};
}
