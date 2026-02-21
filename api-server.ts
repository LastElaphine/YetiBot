import { Low } from "npm:lowdb";
import type { DatabaseSchema } from "./types/database.ts";
import { AtomicJSONFile } from "./utils/atomic-json-adapter.ts";
import { paths } from "./utils/path-config.ts";

interface Guild {
	id: string;
	name: string;
	totalUsers: number;
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

const server = Deno.serve({ port: 3000 }, async (req) => {
	const url = new URL(req.url);

	if (url.pathname === "/api/guilds") {
		const guilds = await getGuilds();
		return new Response(JSON.stringify({ guilds }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response("Not Found", { status: 404 });
});

console.log("API server running on http://localhost:3000");
