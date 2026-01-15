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

class DatabaseManager {
	private static instance: DatabaseManager;
	private db: Low<DatabaseSchema>;
	private client: Client;

	private constructor(client: Client) {
		this.client = client;
		const adapter = new AtomicJSONFile<DatabaseSchema>("data/db.json");
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
			await this.db.write();
		}

		await this.runMigrations();
		await this.ensureDataDirectory();
	}

	// Guild operations
	async getGuildData(guildId: string): Promise<GuildDatabase | null> {
		const guildData = this.db.data!.guilds.get(guildId);
		return guildData || null;
	}

	async createGuildData(
		guildId: string,
		guildName?: string,
	): Promise<GuildDatabase> {
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

		this.db.data!.guilds.set(guildId, guildData);
		this.db.data!.globalMetadata.totalGuilds++;
		this.db.data!.globalMetadata.updatedAt = new Date();

		await this.db.write();
		return guildData;
	}

	async updateGuildData(
		guildId: string,
		updates: Partial<GuildDatabase>,
	): Promise<void> {
		const guildData = this.db.data!.guilds.get(guildId);
		if (!guildData) {
			throw new Error(`Guild ${guildId} not found`);
		}

		Object.assign(guildData, updates, { updatedAt: new Date() });
		this.db.data!.globalMetadata.updatedAt = new Date();

		await this.db.write();
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
			// Get Discord user data
			const discordUser = await this.client.users.fetch(userId);
			userProfile = {
				id: userId,
				username: discordUser.username,
				guildId,
				joinedAt: new Date(),
				lastSeen: new Date(),
				stats: {
					amuletHeldCount: 0,
					amuletHeldTimeMs: 0,
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
			this.db.data!.globalMetadata.totalUsers++;
		} else {
			Object.assign(userProfile, updates, { updatedAt: new Date() });
		}

		guildData.users.set(userId, userProfile);
		guildData.metadata.lastActivity = new Date();
		this.db.data!.globalMetadata.updatedAt = new Date();

		await this.db.write();
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

		await this.db.write();
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
		const guildData = this.db.data!.guilds.get(guildId);
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
		const backupDir = "data/backups";
		const backupPath = `${backupDir}/backup-${timestamp}.json`;

		await Deno.mkdir(backupDir, { recursive: true });

		const data = await Deno.readTextFile("data/db.json");
		await Deno.writeTextFile(backupPath, data);

		// Store backup timestamp in metadata
		this.db.data!.globalMetadata.lastBackup = new Date();
		await this.db.write();

		return backupPath;
	}

	async runMigrations(): Promise<void> {
		// Future migration logic
		console.log("Database migrations completed");
	}

	private async ensureDataDirectory(): Promise<void> {
		await Deno.mkdir("data", { recursive: true });
		await Deno.mkdir("data/backups", { recursive: true });
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
}

export { DatabaseManager };
