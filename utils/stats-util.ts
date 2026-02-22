import type { Client } from "discord.js";
import type { UserProfile } from "../types/database.js";
import { DatabaseManager } from "./database-manager.js";

export interface UserRank {
	category: string;
	rank: number;
	total: number;
	score: number;
	percentage: number;
}

export interface UserComparison {
	user1: {
		id: string;
		username: string;
		stats: UserProfile["stats"];
	};
	user2: {
		id: string;
		username: string;
		stats: UserProfile["stats"];
	};
	comparisons: {
		category: string;
		winner: "user1" | "user2" | "tie";
		user1Value: number;
		user2Value: number;
	}[];
}

export interface PersonalStatsCard {
	userId: string;
	username: string;
	displayName: string;
	joinedAt: Date;
	lastSeen: Date;
	stats: UserProfile["stats"];
	ranks: UserRank[];
	percentiles: {
		amuletHeldTimeMs: number;
		amuletHeldCount: number;
		passesGiven: number;
		passesReceived: number;
	};
}

export interface TrendData {
	category: string;
	snapshots: {
		timestamp: Date;
		value: number;
	}[];
	change: number;
	changePercent: number;
}

class StatsUtil {
	private static instance: StatsUtil;
	private dbManager: DatabaseManager;

	private constructor(dbManager: DatabaseManager) {
		this.dbManager = dbManager;
	}

	public static getInstance(client: Client): StatsUtil {
		if (!StatsUtil.instance) {
			StatsUtil.instance = new StatsUtil(DatabaseManager.getInstance(client));
		}
		return StatsUtil.instance;
	}

	public static getInstanceWithDb(dbManager: DatabaseManager): StatsUtil {
		if (!StatsUtil.instance) {
			StatsUtil.instance = new StatsUtil(dbManager);
		}
		return StatsUtil.instance;
	}

	public async getUserRanks(
		userId: string,
		guildId: string,
	): Promise<UserRank[]> {
		const guildData = await this.dbManager.getGuildData(guildId);
		if (!guildData) return [];

		const users = Array.from(guildData.users.values());
		const user = users.find((u) => u.id === userId);
		if (!user) return [];

		const ranks: UserRank[] = [];
		const categories = [
			{ key: "amuletHeldTimeMs", label: "Total Hold Time" },
			{ key: "amuletHeldCount", label: "Hold Count" },
			{ key: "passesGiven", label: "Passes Given" },
			{ key: "passesReceived", label: "Passes Received" },
			{ key: "longestHoldTimeMs", label: "Longest Hold" },
		];

		for (const cat of categories) {
			const sorted = users
				.map((u) => ({
					id: u.id,
					value: u.stats[cat.key as keyof typeof u.stats] as number,
				}))
				.sort((a, b) => b.value - a.value);

			const rank = sorted.findIndex((u) => u.id === userId) + 1;
			const total = sorted.filter((u) => u.value > 0).length;
			const userValue = user.stats[
				cat.key as keyof typeof user.stats
			] as number;
			const totalValue = sorted.reduce((sum, u) => sum + u.value, 0);

			ranks.push({
				category: cat.label,
				rank,
				total,
				score: userValue,
				percentage: totalValue > 0 ? (userValue / totalValue) * 100 : 0,
			});
		}

		return ranks;
	}

	public async compareUsers(
		userId1: string,
		userId2: string,
		guildId: string,
	): Promise<UserComparison | null> {
		const guildData = await this.dbManager.getGuildData(guildId);
		if (!guildData) return null;

		const user1 = guildData.users.get(userId1);
		const user2 = guildData.users.get(userId2);
		if (!user1 || !user2) return null;

		const comparisons = [];
		const categories = [
			{ key: "amuletHeldTimeMs", label: "Total Hold Time" },
			{ key: "amuletHeldCount", label: "Hold Count" },
			{ key: "passesGiven", label: "Passes Given" },
			{ key: "passesReceived", label: "Passes Received" },
			{ key: "longestHoldTimeMs", label: "Longest Hold" },
		] as const;

		for (const cat of categories) {
			const val1 = user1.stats[cat.key];
			const val2 = user2.stats[cat.key];

			let winner: "user1" | "user2" | "tie" = "tie";
			if (val1 > val2) winner = "user1";
			else if (val2 > val1) winner = "user2";

			comparisons.push({
				category: cat.label,
				winner,
				user1Value: val1,
				user2Value: val2,
			});
		}

		return {
			user1: {
				id: user1.id,
				username: user1.displayName || user1.username,
				stats: user1.stats,
			},
			user2: {
				id: user2.id,
				username: user2.displayName || user2.username,
				stats: user2.stats,
			},
			comparisons,
		};
	}

	public async getPersonalStatsCard(
		userId: string,
		guildId: string,
	): Promise<PersonalStatsCard | null> {
		const guildData = await this.dbManager.getGuildData(guildId);
		if (!guildData) return null;

		const user = guildData.users.get(userId);
		if (!user) return null;

		const ranks = await this.getUserRanks(userId, guildId);
		const users = Array.from(guildData.users.values());

		const getPercentile = (
			value: number,
			key: keyof typeof user.stats,
		): number => {
			const sorted = users
				.map((u) => u.stats[key] as number)
				.filter((v) => v > 0)
				.sort((a, b) => b - a);
			const position = sorted.findIndex((v) => v <= value);
			return sorted.length > 0
				? ((sorted.length - position) / sorted.length) * 100
				: 0;
		};

		return {
			userId: user.id,
			username: user.username,
			displayName: user.displayName || user.username,
			joinedAt: user.joinedAt,
			lastSeen: user.lastSeen,
			stats: user.stats,
			ranks,
			percentiles: {
				amuletHeldTimeMs: getPercentile(
					user.stats.amuletHeldTimeMs,
					"amuletHeldTimeMs",
				),
				amuletHeldCount: getPercentile(
					user.stats.amuletHeldCount,
					"amuletHeldCount",
				),
				passesGiven: getPercentile(user.stats.passesGiven, "passesGiven"),
				passesReceived: getPercentile(
					user.stats.passesReceived,
					"passesReceived",
				),
			},
		};
	}

	public async getTrendData(
		userId: string,
		guildId: string,
		category: keyof UserProfile["stats"],
	): Promise<TrendData | null> {
		const history = await this.dbManager.getStatsHistory(userId, guildId);
		if (history.length < 2) return null;

		const snapshots = history.map((s) => ({
			timestamp: s.timestamp,
			value: s[category] as number,
		}));

		const firstValue = snapshots[0].value;
		const lastValue = snapshots[snapshots.length - 1].value;
		const change = lastValue - firstValue;
		const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;

		return {
			category,
			snapshots,
			change,
			changePercent,
		};
	}

	public async recordSnapshot(userId: string, guildId: string): Promise<void> {
		await this.dbManager.recordStatsSnapshot(userId, guildId);
	}

	public async getAllTrends(
		userId: string,
		guildId: string,
	): Promise<TrendData[]> {
		const categories = [
			"amuletHeldTimeMs",
			"amuletHeldCount",
			"passesGiven",
			"passesReceived",
			"longestHoldTimeMs",
		] as const;

		const trends: TrendData[] = [];
		for (const cat of categories) {
			const trend = await this.getTrendData(userId, guildId, cat);
			if (trend) trends.push(trend);
		}
		return trends;
	}
}

export { StatsUtil };
