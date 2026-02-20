import { Low } from "npm:lowdb";
import type { Client } from "discord";
import type {
	DatabaseSchema,
	GuildDatabase,
	GuildGameState,
	LeaderboardEntry,
	UserProfile,
} from "../types/database.ts";
import { AtomicJSONFile } from "./atomic-json-adapter.ts";
import { ensureDirectories, paths } from "./path-config.ts";

class DatabaseManager {
	private static instance: DatabaseManager;
	private db: Low<DatabaseSchema>;
	private client: Client;

	private constructor(client: Client) {
		this.client = client;
		const adapter = new AtomicJSONFile<DatabaseSchema>(paths.dbFile);
		this.db = new Low(adapter, this.getDefaultSchema());
	}

	private getDefaultSchema(): DatabaseSchema {
		return {
			guilds: new Map(),
			globalMetadata: {
				version: "1.0.0",
				totalGuilds: 0,
				totalUsers: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		};
	}

	public static getInstance(client: Client): DatabaseManager {
		if (!DatabaseManager.instance) {
			DatabaseManager.instance = new DatabaseManager(client);
		}
		return DatabaseManager.instance;
	}

	async initialize(): Promise<void> {
		await this.db.read();

		if (!this.db.data) {
			this.db.data = this.getDefaultSchema();
			await this.safeWrite();
		}

		await this.runMigrations();
		await this.ensureDataDirectory();
	}

	// Guild operations
	async getGuildData(guildId: string): Promise<GuildDatabase | null> {
		const guildData = this.db.data?.guilds.get(guildId);
		return guildData || null;
	}

	async createGuildData(
		guildId: string,
		_guildName?: string,
	): Promise<GuildDatabase> {
		if (!this.db.data) {
			throw new Error("Database not initialized");
		}

		const guildData: GuildDatabase = {
			guildId,
			users: new Map(),
			gameState: {
				guildId,
				amulet: {
					currentHolder: null,
					channelId: null,
					timeoutMs: 60000, // 1 minute default
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
			leaderboards: {
				"amulet-time": new Map(),
				"amulet-count": new Map(),
				"games-played": new Map(),
			},
			metadata: {
				createdAt: new Date(),
				lastActivity: new Date(),
				totalUsers: 0,
				version: "1.0.0",
			},
		};

		this.db.data.guilds.set(guildId, guildData);
		this.db.data.globalMetadata.totalGuilds++;
		this.db.data.globalMetadata.updatedAt = new Date();

		await this.safeWrite();
		return guildData;
	}

	async updateGuildData(
		guildId: string,
		updates: Partial<GuildDatabase>,
	): Promise<void> {
		if (!this.db.data) {
			throw new Error("Database not initialized");
		}

		const guildData = this.db.data.guilds.get(guildId);
		if (!guildData) {
			throw new Error(`Guild ${guildId} not found`);
		}

		Object.assign(guildData, updates, { updatedAt: new Date() });
		this.db.data.globalMetadata.updatedAt = new Date();

		await this.safeWrite();
	}

	// User operations
	async getUserProfile(
		userId: string,
		guildId: string,
	): Promise<UserProfile | null> {
		const guildData = await this.getGuildData(guildId);
		return guildData?.users.get(userId) || null;
	}

	async createOrUpdateUserProfile(
		userId: string,
		guildId: string,
		updates: Partial<UserProfile>,
	): Promise<UserProfile> {
		let guildData = await this.getGuildData(guildId);
		if (!guildData) {
			guildData = await this.createGuildData(guildId);
		}

		let userProfile = guildData.users.get(userId);

		if (!userProfile) {
			if (!this.db.data) {
				throw new Error("Database not initialized");
			}

			let username = "Unknown";
			try {
				const discordUser = await this.client.users.fetch(userId);
				username = discordUser.username;
			} catch {
				console.warn(`Could not fetch user ${userId}, using fallback username`);
			}

			userProfile = {
				id: userId,
				username,
				guildId,
				joinedAt: new Date(),
				lastSeen: new Date(),
				stats: {
					amuletHeldCount: 0,
					amuletHeldTimeMs: 0,
					longestHoldTimeMs: 0,
					passesGiven: 0,
					passesReceived: 0,
					gamesPlayed: 0,
					commandUses: new Map(),
				},
				preferences: {
					notifications: true,
				},
				achievements: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				...updates,
			};

			guildData.metadata.totalUsers++;
			this.db.data.globalMetadata.totalUsers++;
		} else {
			Object.assign(userProfile, updates, { updatedAt: new Date() });
		}

		guildData.users.set(userId, userProfile);
		guildData.metadata.lastActivity = new Date();
		this.db.data.globalMetadata.updatedAt = new Date();

		await this.safeWrite();
		return userProfile;
	}

	// Game state operations
	async getGameState(guildId: string): Promise<GuildGameState | null> {
		const guildData = await this.getGuildData(guildId);
		return guildData?.gameState || null;
	}

	async updateGameState(
		guildId: string,
		updates: Partial<GuildGameState>,
	): Promise<void> {
		await this.updateGuildData(guildId, {
			gameState: { ...updates, guildId } as GuildGameState,
		});
	}

	// Leaderboard operations
	async updateLeaderboard(
		guildId: string,
		category: string,
		userId: string,
		username: string,
		score: number,
	): Promise<void> {
		const guildData = await this.getGuildData(guildId);
		if (!guildData) {
			throw new Error(`Guild ${guildId} not found`);
		}

		if (!guildData.leaderboards[category]) {
			guildData.leaderboards[category] = new Map();
		}

		guildData.leaderboards[category].set(userId, {
			userId,
			username,
			score,
			rank: 0, // Will be recalculated
			lastUpdated: new Date(),
		});

		// Recalculate ranks
		await this.recalculateLeaderboardRanks(guildId, category);

		await this.safeWrite();
	}

	async getLeaderboard(
		guildId: string,
		category: string,
	): Promise<LeaderboardEntry[]> {
		const guildData = await this.getGuildData(guildId);
		const entries = guildData?.leaderboards[category] || new Map();

		return Array.from(entries.values())
			.sort((a, b) => b.score - a.score)
			.map((entry, index) => ({ ...entry, rank: index + 1 }));
	}

	private async recalculateLeaderboardRanks(
		guildId: string,
		category: string,
	): Promise<void> {
		const guildData = this.db.data?.guilds.get(guildId);
		if (!guildData || !guildData.leaderboards[category]) return;

		const sortedEntries = Array.from(
			guildData.leaderboards[category].values(),
		).sort((a, b) => b.score - a.score);

		guildData.leaderboards[category].clear();
		sortedEntries.forEach((entry, index) => {
			guildData.leaderboards[category].set(entry.userId, {
				...entry,
				rank: index + 1,
			});
		});
	}

	// Utility operations
	async createBackup(): Promise<string> {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const backupPath = `${paths.backupDir}/backup-${timestamp}.json`;

		await ensureDirectories();

		const data = await Deno.readTextFile(paths.dbFile);
		await Deno.writeTextFile(backupPath, data);

		if (this.db.data) {
			this.db.data.globalMetadata.lastBackup = new Date();
			await this.safeWrite();
		}

		return backupPath;
	}

	async runMigrations(): Promise<void> {
		// Future migration logic
		console.log("Database migrations completed");
	}

	private async ensureDataDirectory(): Promise<void> {
		await ensureDirectories();
	}

	// Cleanup operations
	async cleanupInactiveGames(): Promise<void> {
		// Future cleanup logic
		console.log("Game cleanup completed");
	}

	// Getter for external access (for AmuletUtil, etc.)
	getLowInstance(): Low<DatabaseSchema> {
		return this.db;
	}

	async loadData(): Promise<DatabaseSchema | null> {
		await this.db.read();
		return this.db.data || null;
	}

	getDbData(): DatabaseSchema | null {
		return this.db.data || null;
	}

	async saveGameState(
		guildId: string,
		gameState: Partial<GuildGameState>,
	): Promise<void> {
		await this.updateGameState(guildId, gameState);
	}

	async saveLeaderboard(
		guildId: string,
		category: string,
		userId: string,
		username: string,
		score: number,
	): Promise<void> {
		await this.updateLeaderboard(guildId, category, userId, username, score);
	}

	private async safeWrite(): Promise<void> {
		try {
			await this.db.write();
		} catch (error) {
			console.error("Failed to write to database:", error);
			throw error;
		}
	}
}

export { DatabaseManager };
