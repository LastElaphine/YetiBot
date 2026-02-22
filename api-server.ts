import express from "express";
import { Low } from "lowdb";
import type { DatabaseSchema, UserProfile } from "./types/database.js";
import { AtomicJSONFile } from "./utils/atomic-json-adapter.js";
import { paths } from "./utils/path-config.js";

interface GuildUser {
	id: string;
	username: string;
	displayName?: string;
	amuletHeldCount: number;
	amuletHeldTimeMs: number;
	gamesPlayed: number;
}

interface Guild {
	id: string;
	name: string;
	icon?: string;
	totalUsers: number;
	users: GuildUser[];
}

const adapter = new AtomicJSONFile<DatabaseSchema>(paths.dbFile);
const db = new Low(adapter, {
	guilds: new Map(),
	globalMetadata: {
		version: "1.0.0",
		totalGuilds: 0,
		totalUsers: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
});

const app = express();
app.use(express.json());

async function getGuilds(): Promise<Guild[]> {
	await db.read();
	const guilds = db.data?.guilds;
	if (!guilds) return [];

	return Array.from(guilds.entries()).map(([id, data]) => ({
		id,
		name: `Server ${id}`,
		totalUsers:
			(data as { metadata?: { totalUsers?: number } }).metadata?.totalUsers ??
			0,
		users: [],
	}));
}

async function getGuild(id: string): Promise<Guild | null> {
	await db.read();
	const guildData = db.data?.guilds?.get(id);
	if (!guildData) return null;

	const data = guildData as {
		metadata?: { totalUsers?: number };
		users?: Map<string, UserProfile>;
	};

	const users: GuildUser[] = Array.from(
		(data.users as Map<string, UserProfile>)?.entries() ?? [],
	)
		.map(([userId, profile]) => ({
			id: userId,
			username: profile.username,
			displayName: profile.displayName,
			amuletHeldCount: profile.stats?.amuletHeldCount ?? 0,
			amuletHeldTimeMs: profile.stats?.amuletHeldTimeMs ?? 0,
			gamesPlayed: profile.stats?.gamesPlayed ?? 0,
		}))
		.sort((a, b) => b.amuletHeldCount - a.amuletHeldCount);

	return {
		id,
		name: `Server ${id}`,
		totalUsers: data.metadata?.totalUsers ?? 0,
		users,
	};
}

app.get("/api/guilds", async (_req, res) => {
	const guilds = await getGuilds();
	res.json({ guilds });
});

app.get("/api/guilds/:id", async (req, res) => {
	const guild = await getGuild(req.params.id);
	if (!guild) {
		res.status(404).json({ guild: null });
		return;
	}
	res.json({ guild });
});

app.listen(3000, () => {
	console.log("API server running on http://localhost:3000");
});
