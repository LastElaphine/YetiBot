import { getDatabaseReader } from "./util/db.ts";

export interface WebConfig {
	port: number;
	enabled: boolean;
}

let cachedConfig: WebConfig | null = null;

export function getWebConfig(): WebConfig {
	if (cachedConfig) return cachedConfig;

	try {
		const configText = Deno.readTextFileSync("./config.json");
		const config = JSON.parse(configText) as {
			web?: { enabled?: boolean; port?: number };
		};

		cachedConfig = {
			enabled: config.web?.enabled ?? false,
			port: config.web?.port ?? 8080,
		};
	} catch {
		cachedConfig = { enabled: false, port: 8080 };
	}

	return cachedConfig;
}

export async function startWebServer(): Promise<void> {
	const config = getWebConfig();

	if (!config.enabled) {
		console.log("Web dashboard is disabled");
		return;
	}

	const dbReader = getDatabaseReader();
	console.log(`Starting web dashboard on http://localhost:${config.port}`);

	const handler = async (req: Request): Promise<Response> => {
		const url = new URL(req.url);
		const path = url.pathname;

		if (path === "/api/health") {
			return Response.json({
				status: "ok",
				timestamp: new Date().toISOString(),
			});
		}

		if (path === "/api/guilds") {
			const guilds = await dbReader.getGuilds();
			if (!guilds) {
				return Response.json({ guilds: [] });
			}
			const guildList = Array.from(guilds.entries()).map(([id, data]) => ({
				id,
				name: data.metadata?.totalUsers ? `Server ${id}` : `Server ${id}`,
				totalUsers: data.metadata?.totalUsers ?? 0,
			}));
			return Response.json({ guilds: guildList });
		}

		const guildMatch = path.match(/^\/api\/guilds\/(\d+)$/);
		if (guildMatch) {
			const guildId = guildMatch[1];
			const guild = await dbReader.getGuild(guildId);
			if (!guild) {
				return Response.json({ error: "Guild not found" }, { status: 404 });
			}
			return Response.json({ guild });
		}

		const holderMatch = path.match(/^\/api\/guilds\/(\d+)\/holder$/);
		if (holderMatch) {
			const guildId = holderMatch[1];
			const gameState = await dbReader.getGameState(guildId);
			if (!gameState) {
				return Response.json({ error: "Guild not found" }, { status: 404 });
			}
			const holder = gameState.amulet?.currentHolder;
			const users = await dbReader.getUsers(guildId);
			const holderUser = holder && users ? users.get(holder) : null;

			return Response.json({
				currentHolder: holder,
				holderName:
					holderUser?.displayName || holderUser?.username || "Unknown",
				channelId: gameState.amulet?.channelId,
				lastTransferred: gameState.amulet?.lastTransferred,
			});
		}

		const leaderboardMatch = path.match(
			/^\/api\/guilds\/(\d+)\/leaderboard(?:\/(\w+))?$/,
		);
		if (leaderboardMatch) {
			const guildId = leaderboardMatch[1];
			const category = leaderboardMatch[2] || "amulet-time";

			const guild = await dbReader.getGuild(guildId);
			if (!guild) {
				return Response.json({ error: "Guild not found" }, { status: 404 });
			}

			const leaderboard = guild.leaderboards[category];
			if (!leaderboard) {
				return Response.json({ entries: [] });
			}

			const entries = Array.from(leaderboard.entries()).map(
				([userId, entry]) => ({
					userId,
					username: entry.username,
					score: entry.score,
					rank: entry.rank,
				}),
			);

			return Response.json({ category, entries });
		}

		const historyMatch = path.match(/^\/api\/guilds\/(\d+)\/history$/);
		if (historyMatch) {
			const guildId = historyMatch[1];
			const history = await dbReader.getTransferHistory(guildId);

			if (!history) {
				return Response.json({ error: "Guild not found" }, { status: 404 });
			}

			const transfers = history.map((t) => ({
				fromUserId: t.fromUserId,
				toUserId: t.toUserId,
				transferredAt: t.transferredAt,
				channelId: t.channelId,
			}));

			return Response.json({ transfers: transfers.reverse() });
		}

		if (path === "/" || path === "/index.html") {
			return new Response(INDEX_HTML, {
				headers: { "Content-Type": "text/html" },
			});
		}

		if (path === "/style.css") {
			return new Response(STYLE_CSS, {
				headers: { "Content-Type": "text/css" },
			});
		}

		if (path === "/app.js") {
			return new Response(APP_JS, {
				headers: { "Content-Type": "application/javascript" },
			});
		}

		return Response.json({ error: "Not found" }, { status: 404 });
	};

	Deno.serve({ port: config.port }, handler);
}

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>YetiBot Dashboard</title>
	<link rel="stylesheet" href="/style.css">
</head>
<body>
	<header>
		<h1>🏆 YetiBot Dashboard</h1>
	</header>
	<main>
		<section id="servers-section">
			<h2>Servers</h2>
			<div id="servers-list" class="servers-grid"></div>
		</section>
		<section id="details-section" class="hidden">
			<button id="back-btn">← Back to Servers</button>
			<h2 id="server-title">Server Details</h2>
			
			<div class="card">
				<h3>Current Holder</h3>
				<div id="current-holder"></div>
			</div>

			<div class="tabs">
				<button class="tab-btn active" data-tab="leaderboard">Leaderboard</button>
				<button class="tab-btn" data-tab="history">History</button>
			</div>

			<div id="leaderboard-tab" class="tab-content">
				<select id="leaderboard-category">
					<option value="amulet-time">Total Hold Time</option>
					<option value="amulet-count">Hold Count</option>
					<option value="amulet-passes">Passes Given</option>
				</select>
				<div id="leaderboard-entries"></div>
			</div>

			<div id="history-tab" class="tab-content hidden">
				<div id="history-entries"></div>
			</div>
		</section>
	</main>
	<script src="/app.js"></script>
</body>
</html>`;

const STYLE_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #eee; min-height: 100vh; }
header { background: #16213e; padding: 1rem 2rem; border-bottom: 2px solid #0f3460; }
header h1 { color: #e94560; }
main { padding: 2rem; max-width: 1200px; margin: 0 auto; }
section { margin-bottom: 2rem; }
h2 { color: #e94560; margin-bottom: 1rem; }
.hidden { display: none !important; }
.servers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
.server-card { background: #16213e; padding: 1.5rem; border-radius: 8px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; border: 2px solid transparent; }
.server-card:hover { transform: translateY(-2px); border-color: #e94560; }
.server-card h3 { color: #fff; margin-bottom: 0.5rem; }
.server-card p { color: #888; font-size: 0.9rem; }
#back-btn { background: #0f3460; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-bottom: 1rem; }
.card { background: #16213e; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; }
.card h3 { color: #e94560; margin-bottom: 0.5rem; }
#current-holder { font-size: 1.2rem; }
.tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.tab-btn { background: #0f3460; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; }
.tab-btn.active { background: #e94560; }
#leaderboard-category { background: #0f3460; color: #fff; border: none; padding: 0.5rem; border-radius: 4px; margin-bottom: 1rem; }
#leaderboard-entries, #history-entries { background: #16213e; border-radius: 8px; overflow: hidden; }
.leaderboard-entry { display: flex; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #0f3460; }
.leaderboard-entry:last-child { border-bottom: none; }
.rank { width: 40px; font-weight: bold; color: #e94560; }
.username { flex: 1; }
.score { color: #888; }
.history-entry { padding: 0.75rem 1rem; border-bottom: 1px solid #0f3460; }
.history-entry:last-child { border-bottom: none; }
.history-time { color: #888; font-size: 0.85rem; }
.history-users { margin-top: 0.25rem; }`;

const APP_JS = `let currentGuildId = null;

async function fetchJSON(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(res.statusText);
	return res.json();
}

async function loadServers() {
	const { guilds } = await fetchJSON('/api/guilds');
	const container = document.getElementById('servers-list');
	container.innerHTML = guilds.map(g => \`
		<div class="server-card" data-id="\${g.id}">
			<h3>Server \${g.id}</h3>
			<p>\${g.totalUsers} users</p>
		</div>
	\`).join('');
	container.querySelectorAll('.server-card').forEach(card => {
		card.addEventListener('click', () => loadServerDetails(card.dataset.id));
	});
}

async function loadServerDetails(guildId) {
	currentGuildId = guildId;
	document.getElementById('servers-section').classList.add('hidden');
	document.getElementById('details-section').classList.remove('hidden');
	document.getElementById('server-title').textContent = \`Server \${guildId}\`;

	const { currentHolder, holderName, lastTransferred } = await fetchJSON(\`/api/guilds/\${guildId}/holder\`);
	document.getElementById('current-holder').innerHTML = currentHolder
		? \`🏷️ <strong>\${holderName}</strong> has the amulet!\`
		: 'No one has the amulet';

	loadLeaderboard();
	loadHistory();
}

async function loadLeaderboard() {
	const category = document.getElementById('leaderboard-category').value;
	const { entries } = await fetchJSON(\`/api/guilds/\${currentGuildId}/leaderboard/\${category}\`);
	const container = document.getElementById('leaderboard-entries');
	
	if (!entries.length) {
		container.innerHTML = '<p style="padding:1rem;color:#888">No data yet</p>';
		return;
	}

	container.innerHTML = entries.map(e => \`
		<div class="leaderboard-entry">
			<span class="rank">#\${e.rank}</span>
			<span class="username">\${e.username}</span>
			<span class="score">\${formatTime(e.score)}</span>
		</div>
	\`).join('');
}

async function loadHistory() {
	const { transfers } = await fetchJSON(\`/api/guilds/\${currentGuildId}/history\`);
	const container = document.getElementById('history-entries');
	
	if (!transfers.length) {
		container.innerHTML = '<p style="padding:1rem;color:#888">No history yet</p>';
		return;
	}

	container.innerHTML = transfers.map(t => \`
		<div class="history-entry">
			<div class="history-time">\${new Date(t.transferredAt).toLocaleString()}</div>
			<div class="history-users">\${t.fromUserId ? '→ ' + t.toUserId : t.toUserId}</div>
		</div>
	\`).join('');
}

function formatTime(ms) {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	if (days > 0) return \`\${days}d \${hours % 24}h\`;
	if (hours > 0) return \`\${hours}h \${minutes % 60}m\`;
	if (minutes > 0) return \`\${minutes}m \${seconds % 60}s\`;
	return \`\${seconds}s\`;
}

document.getElementById('back-btn').addEventListener('click', () => {
	currentGuildId = null;
	document.getElementById('details-section').classList.add('hidden');
	document.getElementById('servers-section').classList.remove('hidden');
	loadServers();
});

document.querySelectorAll('.tab-btn').forEach(btn => {
	btn.addEventListener('click', () => {
		document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
		document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
		btn.classList.add('active');
		document.getElementById(\`\${btn.dataset.tab}-tab\`).classList.remove('hidden');
	});
});

document.getElementById('leaderboard-category').addEventListener('change', loadLeaderboard);

loadServers();`;
