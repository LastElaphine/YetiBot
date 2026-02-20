import type {
	DatabaseSchema,
	GuildDatabase,
	GuildGameState,
	LeaderboardEntry,
	UserProfile,
} from "../types/database.ts";

export const TEST_GUILD_ID = "123456789012345678";
export const TEST_USER_ID_1 = "111111111111111111";
export const TEST_USER_ID_2 = "222222222222222222";
export const TEST_USER_ID_3 = "333333333333333333";
export const TEST_CHANNEL_ID = "999999999999999999";

export function createTestUserProfile(
	overrides: Partial<UserProfile> = {},
): UserProfile {
	return {
		id: TEST_USER_ID_1,
		username: "testuser",
		displayName: "Test User",
		guildId: TEST_GUILD_ID,
		joinedAt: new Date("2024-01-01T00:00:00Z"),
		lastSeen: new Date("2024-06-15T12:00:00Z"),
		stats: {
			amuletHeldCount: 5,
			amuletHeldTimeMs: 300000,
			longestHoldTimeMs: 120000,
			passesGiven: 3,
			passesReceived: 5,
			gamesPlayed: 10,
			commandUses: new Map([
				["amulet", 3],
				["ping", 2],
			]),
		},
		preferences: {
			notifications: true,
			timezone: "America/New_York",
		},
		achievements: ["first-catch", "amulet-master"],
		createdAt: new Date("2024-01-01T00:00:00Z"),
		updatedAt: new Date("2024-06-15T12:00:00Z"),
		...overrides,
	};
}

export function createTestGuildGameState(
	overrides: Partial<GuildGameState> = {},
): GuildGameState {
	return {
		guildId: TEST_GUILD_ID,
		amulet: {
			currentHolder: TEST_USER_ID_1,
			channelId: TEST_CHANNEL_ID,
			timeoutMs: 60000,
			lastTransferred: new Date("2024-06-15T12:00:00Z"),
			transferHistory: [
				{
					fromUserId: null,
					toUserId: TEST_USER_ID_1,
					transferredAt: new Date("2024-06-15T11:00:00Z"),
					channelId: TEST_CHANNEL_ID,
				},
				{
					fromUserId: TEST_USER_ID_1,
					toUserId: TEST_USER_ID_2,
					transferredAt: new Date("2024-06-15T12:00:00Z"),
					channelId: TEST_CHANNEL_ID,
				},
			],
		},
		tag: {
			currentIt: TEST_USER_ID_2,
			gameStartTime: new Date("2024-06-15T11:30:00Z"),
			scores: new Map([
				[TEST_USER_ID_1, 10],
				[TEST_USER_ID_2, 5],
				[TEST_USER_ID_3, 3],
			]),
		},
		settings: {
			amuletTimeoutMs: 60000,
			enableNotifications: true,
			gameChannels: [TEST_CHANNEL_ID],
			adminRoles: ["role-1", "role-2"],
		},
		isActive: true,
		lastActivity: new Date("2024-06-15T12:00:00Z"),
		updatedAt: new Date("2024-06-15T12:00:00Z"),
		...overrides,
	};
}

export function createTestLeaderboardEntry(
	overrides: Partial<LeaderboardEntry> = {},
): LeaderboardEntry {
	return {
		userId: TEST_USER_ID_1,
		username: "testuser",
		score: 100,
		rank: 1,
		lastUpdated: new Date("2024-06-15T12:00:00Z"),
		...overrides,
	};
}

export function createTestGuildDatabase(
	overrides: Partial<GuildDatabase> = {},
): GuildDatabase {
	const users = new Map<string, UserProfile>();
	users.set(TEST_USER_ID_1, createTestUserProfile({ username: "alice" }));
	users.set(
		TEST_USER_ID_2,
		createTestUserProfile({
			id: TEST_USER_ID_2,
			username: "bob",
			stats: {
				amuletHeldCount: 3,
				amuletHeldTimeMs: 180000,
				longestHoldTimeMs: 90000,
				passesGiven: 2,
				passesReceived: 3,
				gamesPlayed: 7,
				commandUses: new Map(),
			},
		}),
	);
	users.set(
		TEST_USER_ID_3,
		createTestUserProfile({
			id: TEST_USER_ID_3,
			username: "charlie",
			stats: {
				amuletHeldCount: 2,
				amuletHeldTimeMs: 60000,
				longestHoldTimeMs: 40000,
				passesGiven: 1,
				passesReceived: 2,
				gamesPlayed: 4,
				commandUses: new Map(),
			},
		}),
	);

	const leaderboards = {
		"amulet-time": new Map<string, LeaderboardEntry>([
			[
				TEST_USER_ID_1,
				createTestLeaderboardEntry({
					userId: TEST_USER_ID_1,
					username: "alice",
					score: 300000,
					rank: 1,
				}),
			],
			[
				TEST_USER_ID_2,
				createTestLeaderboardEntry({
					userId: TEST_USER_ID_2,
					username: "bob",
					score: 180000,
					rank: 2,
				}),
			],
			[
				TEST_USER_ID_3,
				createTestLeaderboardEntry({
					userId: TEST_USER_ID_3,
					username: "charlie",
					score: 60000,
					rank: 3,
				}),
			],
		]),
		"amulet-count": new Map<string, LeaderboardEntry>([
			[
				TEST_USER_ID_1,
				createTestLeaderboardEntry({
					userId: TEST_USER_ID_1,
					username: "alice",
					score: 5,
					rank: 1,
				}),
			],
			[
				TEST_USER_ID_2,
				createTestLeaderboardEntry({
					userId: TEST_USER_ID_2,
					username: "bob",
					score: 3,
					rank: 2,
				}),
			],
			[
				TEST_USER_ID_3,
				createTestLeaderboardEntry({
					userId: TEST_USER_ID_3,
					username: "charlie",
					score: 2,
					rank: 3,
				}),
			],
		]),
		"games-played": new Map<string, LeaderboardEntry>([
			[
				TEST_USER_ID_1,
				createTestLeaderboardEntry({
					userId: TEST_USER_ID_1,
					username: "alice",
					score: 10,
					rank: 1,
				}),
			],
			[
				TEST_USER_ID_2,
				createTestLeaderboardEntry({
					userId: TEST_USER_ID_2,
					username: "bob",
					score: 7,
					rank: 2,
				}),
			],
			[
				TEST_USER_ID_3,
				createTestLeaderboardEntry({
					userId: TEST_USER_ID_3,
					username: "charlie",
					score: 4,
					rank: 3,
				}),
			],
		]),
	};

	return {
		guildId: TEST_GUILD_ID,
		users,
		gameState: createTestGuildGameState(),
		leaderboards,
		metadata: {
			createdAt: new Date("2024-01-01T00:00:00Z"),
			lastActivity: new Date("2024-06-15T12:00:00Z"),
			totalUsers: 3,
			version: "1.0.0",
		},
		...overrides,
	};
}

export function createTestDatabaseSchema(
	overrides: Partial<DatabaseSchema> = {},
): DatabaseSchema {
	const guilds = new Map<string, GuildDatabase>();
	guilds.set(TEST_GUILD_ID, createTestGuildDatabase());

	return {
		guilds,
		globalMetadata: {
			version: "1.0.0",
			totalGuilds: 1,
			totalUsers: 3,
			createdAt: new Date("2024-01-01T00:00:00Z"),
			updatedAt: new Date("2024-06-15T12:00:00Z"),
		},
		...overrides,
	};
}

export const testFixtures = {
	guildId: TEST_GUILD_ID,
	userIds: [TEST_USER_ID_1, TEST_USER_ID_2, TEST_USER_ID_3],
	channelId: TEST_CHANNEL_ID,
	createUserProfile: createTestUserProfile,
	createGuildGameState: createTestGuildGameState,
	createLeaderboardEntry: createTestLeaderboardEntry,
	createGuildDatabase: createTestGuildDatabase,
	createDatabaseSchema: createTestDatabaseSchema,
};
