import { resolve } from "@std/path";
import type {
	DatabaseSchema,
	GuildDatabase,
	GuildGameState,
	UserProfile,
} from "../../types/database.ts";

const DB_FILE = resolve(Deno.cwd(), "data", "db.json");

class DatabaseReader {
	async read(): Promise<DatabaseSchema | null> {
		try {
			const data = await Deno.readTextFile(DB_FILE);
			return this.reviveMaps(JSON.parse(data));
		} catch (error) {
			if (error instanceof Deno.errors.NotFound) {
				return null;
			}
			throw error;
		}
	}

	async getGuilds(): Promise<Map<string, GuildDatabase> | null> {
		const db = await this.read();
		return db?.guilds || null;
	}

	async getGuild(guildId: string): Promise<GuildDatabase | null> {
		const guilds = await this.getGuilds();
		return guilds?.get(guildId) || null;
	}

	async getGameState(guildId: string): Promise<GuildGameState | null> {
		const guild = await this.getGuild(guildId);
		return guild?.gameState || null;
	}

	async getUsers(guildId: string): Promise<Map<string, UserProfile> | null> {
		const guild = await this.getGuild(guildId);
		return guild?.users || null;
	}

	async getUser(userId: string, guildId: string): Promise<UserProfile | null> {
		const users = await this.getUsers(guildId);
		return users?.get(userId) || null;
	}

	async getLeaderboard(
		guildId: string,
		category: string,
	): Promise<Map<string, unknown> | null> {
		const guild = await this.getGuild(guildId);
		return guild?.leaderboards[category] as Map<string, unknown> | null;
	}

	async getTransferHistory(
		guildId: string,
	): Promise<GuildGameState["amulet"]["transferHistory"] | null> {
		const gameState = await this.getGameState(guildId);
		return gameState?.amulet?.transferHistory || null;
	}

	async getAllLeaderboards(
		guildId: string,
	): Promise<GuildDatabase["leaderboards"] | null> {
		const guild = await this.getGuild(guildId);
		return guild?.leaderboards || null;
	}

	private reviveMaps(obj: unknown): unknown {
		if (obj && typeof obj === "object") {
			if (obj._type === "Map") {
				const revived = new Map(obj._value);
				for (const [key, value] of revived) {
					revived.set(key, this.reviveMaps(value));
				}
				return revived;
			}
			for (const key in obj) {
				obj[key] = this.reviveMaps(obj[key]);
			}
		}
		return obj;
	}
}

let dbReader: DatabaseReader | null = null;

export function getDatabaseReader(): DatabaseReader {
	if (!dbReader) {
		dbReader = new DatabaseReader();
	}
	return dbReader;
}

export { DatabaseReader };
