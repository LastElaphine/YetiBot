import { assertEquals, assertExists, assertGreater } from "@std/assert";
import { StatsUtil } from "../../utils/stats-util.ts";

const createMockDbManager = () => {
	const guildData = {
		users: new Map([
			[
				"111111111111111111",
				{
					id: "111111111111111111",
					username: "alice",
					displayName: "Alice",
					guildId: "123456789012345678",
					joinedAt: new Date("2024-01-01"),
					lastSeen: new Date(),
					stats: {
						amuletHeldCount: 10,
						amuletHeldTimeMs: 600000,
						longestHoldTimeMs: 120000,
						passesGiven: 5,
						passesReceived: 10,
						gamesPlayed: 20,
						commandUses: new Map(),
					},
					statsHistory: [],
					preferences: { notifications: true },
					achievements: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			[
				"222222222222222222",
				{
					id: "222222222222222222",
					username: "bob",
					displayName: "Bob",
					guildId: "123456789012345678",
					joinedAt: new Date("2024-01-01"),
					lastSeen: new Date(),
					stats: {
						amuletHeldCount: 5,
						amuletHeldTimeMs: 300000,
						longestHoldTimeMs: 90000,
						passesGiven: 3,
						passesReceived: 5,
						gamesPlayed: 10,
						commandUses: new Map(),
					},
					statsHistory: [],
					preferences: { notifications: true },
					achievements: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
		]),
		gameState: {
			guildId: "123456789012345678",
			amulet: {
				currentHolder: "111111111111111111",
				channelId: "999999999999999999",
				timeoutMs: 60000,
				lastTransferred: new Date(),
				transferHistory: [],
			},
			settings: {
				amuletTimeoutMs: 60000,
				enableNotifications: true,
				gameChannels: [],
				adminRoles: [],
			},
			isActive: true,
			lastActivity: new Date(),
			updatedAt: new Date(),
		},
		leaderboards: {},
		metadata: {
			createdAt: new Date(),
			lastActivity: new Date(),
			totalUsers: 2,
			version: "1.0.0",
		},
	};

	return {
		getGuildData: () => Promise.resolve(guildData),
		getUserProfile: () => Promise.resolve(null),
		recordStatsSnapshot: () => Promise.resolve(),
		getStatsHistory: () => Promise.resolve([]),
	};
};

Deno.test("StatsUtil export exists", () => {
	assertExists(StatsUtil);
});

Deno.test("StatsUtil getInstanceWithDb returns instance", () => {
	const mockDb = createMockDbManager() as never;
	const util = StatsUtil.getInstanceWithDb(mockDb);
	assertExists(util);
});

Deno.test("UserRank interface has required fields", () => {
	const rank = {
		category: "Total Hold Time",
		rank: 1,
		total: 10,
		score: 600000,
		percentage: 66.67,
	};
	assertExists(rank.category);
	assertExists(rank.rank);
	assertExists(rank.total);
	assertExists(rank.score);
	assertExists(rank.percentage);
});

Deno.test("UserComparison interface has required fields", () => {
	const comparison = {
		user1: {
			id: "111111111111111111",
			username: "alice",
			stats: {
				amuletHeldCount: 10,
				amuletHeldTimeMs: 600000,
				longestHoldTimeMs: 120000,
				passesGiven: 5,
				passesReceived: 10,
				gamesPlayed: 20,
				commandUses: new Map(),
			},
		},
		user2: {
			id: "222222222222222222",
			username: "bob",
			stats: {
				amuletHeldCount: 5,
				amuletHeldTimeMs: 300000,
				longestHoldTimeMs: 90000,
				passesGiven: 3,
				passesReceived: 5,
				gamesPlayed: 10,
				commandUses: new Map(),
			},
		},
		comparisons: [
			{
				category: "Total Hold Time",
				winner: "user1" as const,
				user1Value: 600000,
				user2Value: 300000,
			},
		],
	};
	assertExists(comparison.user1);
	assertExists(comparison.user2);
	assertExists(comparison.comparisons);
	assertEquals(comparison.comparisons.length, 1);
});

Deno.test("PersonalStatsCard interface has required fields", () => {
	const card = {
		userId: "111111111111111111",
		username: "alice",
		displayName: "Alice",
		joinedAt: new Date(),
		lastSeen: new Date(),
		stats: {
			amuletHeldCount: 10,
			amuletHeldTimeMs: 600000,
			longestHoldTimeMs: 120000,
			passesGiven: 5,
			passesReceived: 10,
			gamesPlayed: 20,
			commandUses: new Map(),
		},
		ranks: [],
		percentiles: {
			amuletHeldTimeMs: 95,
			amuletHeldCount: 90,
			passesGiven: 85,
			passesReceived: 95,
		},
	};
	assertExists(card.userId);
	assertExists(card.username);
	assertExists(card.stats);
	assertExists(card.ranks);
	assertExists(card.percentiles);
});

Deno.test("TrendData interface has required fields", () => {
	const trend = {
		category: "amuletHeldTimeMs",
		snapshots: [
			{ timestamp: new Date("2024-01-01"), value: 100000 },
			{ timestamp: new Date("2024-01-02"), value: 200000 },
		],
		change: 100000,
		changePercent: 100,
	};
	assertExists(trend.category);
	assertExists(trend.snapshots);
	assertGreater(trend.snapshots.length, 0);
	assertExists(trend.change);
	assertExists(trend.changePercent);
});
