import { Low } from "npm:lowdb";
import type { DatabaseSchema } from "./types/database.ts";
import { AtomicJSONFile } from "./utils/atomic-json-adapter.ts";
import { paths } from "./utils/path-config.ts";

interface Guild {
	id: string;
	name: string;
	totalUsers: number;
	leaderboard?: Array<{ userId: string; username: string; score: number }>;
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
	}));
}

async function getGuild(id: string): Promise<Guild | null> {
	await db.read();
	const guildData = db.data?.guilds?.get(id);
	if (!guildData) return null;

	const data = guildData as {
		metadata?: { totalUsers?: number };
		leaderboards?: {
			"amulet-count"?: Map<string, number>;
		};
	};

	const leaderboard = Array.from(
		data.leaderboards?.["amulet-count"]?.entries() ?? [],
	)
		.map(([userId, score]) => ({ userId, score, username: `User ${userId}` }))
		.sort((a, b) => b.score - a.score)
		.slice(0, 10);

	return {
		id,
		name: `Server ${id}`,
		totalUsers: data.metadata?.totalUsers ?? 0,
		leaderboard,
	};
}

const server = Deno.serve({ port: 3000 }, async (req) => {
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
