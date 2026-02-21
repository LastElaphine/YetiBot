import { Low } from "npm:lowdb";
import type { DatabaseSchema, UserProfile } from "./types/database.ts";
import { AtomicJSONFile } from "./utils/atomic-json-adapter.ts";
import { paths } from "./utils/path-config.ts";

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

const _server = Deno.serve({ port: 3000 }, async (req) => {
	const start = Date.now();
	const url = new URL(req.url);

	try {
		if (url.pathname === "/api/guilds") {
			const guilds = await getGuilds();
			return new Response(JSON.stringify({ guilds }), {
				headers: { "Content-Type": "application/json" },
			});
		}

		const guildMatch = url.pathname.match(/^\/api\/guilds\/([^/]+)$/);
		if (guildMatch) {
			const guild = await getGuild(guildMatch[1]);
			if (!guild) {
				return new Response(JSON.stringify({ guild: null }), {
					status: 404,
					headers: { "Content-Type": "application/json" },
				});
			}
			return new Response(JSON.stringify({ guild }), {
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response("Not Found", { status: 404 });
	} finally {
		const duration = Date.now() - start;
		console.log(`${req.method} ${url.pathname} - ${duration}ms`);
	}
});

console.log("API server running on http://localhost:3000");
