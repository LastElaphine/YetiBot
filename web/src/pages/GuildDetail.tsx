import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

interface GuildData {
	id: string;
	name: string;
	totalUsers: number;
	leaderboard: Array<{ userId: string; username: string; score: number }>;
}

function LoadingSkeleton() {
	return (
		<div className="loading">
			<div className="skeleton skeleton-row" />
			<div className="skeleton skeleton-row" />
			<div className="skeleton skeleton-row" />
		</div>
	);
}

export default function GuildDetail() {
	const { id } = useParams<{ id: string }>();
	const [guild, setGuild] = useState<GuildData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(`http://localhost:3000/api/guilds/${id}`)
			.then((res) => res.json())
			.then((data) => {
				setGuild(data.guild);
				setLoading(false);
			})
			.catch(() => {
				setLoading(false);
			});
	}, [id]);

	if (loading) {
		return (
			<div className="app">
				<header>
					<h1>YetiBot Dashboard</h1>
				</header>
				<main>
					<Link to="/" className="back-link">
						← Back
					</Link>
					<LoadingSkeleton />
				</main>
			</div>
		);
	}

	if (!guild) {
		return (
			<div className="app">
				<header>
					<h1>YetiBot Dashboard</h1>
				</header>
				<main>
					<Link to="/" className="back-link">
						← Back
					</Link>
					<div className="empty-state">
						<div className="empty-state-icon">🔍</div>
						<h3>Guild not found</h3>
						<p>This server doesn't exist or isn't using YetiBot</p>
					</div>
				</main>
			</div>
		);
	}

	const getRankClass = (index: number) => {
		if (index === 0) return "rank-1";
		if (index === 1) return "rank-2";
		if (index === 2) return "rank-3";
		return "rank-other";
	};

	return (
		<div className="app">
			<header>
				<h1>YetiBot Dashboard</h1>
			</header>
			<main>
				<Link to="/" className="back-link">
					← Back
				</Link>
				<div className="guild-detail">
					<header>
						<h1>{guild.name}</h1>
					</header>
					<section>
						<h2>Stats</h2>
						<div className="stats-grid">
							<div className="stat-card">
								<div className="stat-icon">👥</div>
								<div className="stat-info">
									<h4>Total Users</h4>
									<p>{guild.totalUsers}</p>
								</div>
							</div>
							<div className="stat-card">
								<div className="stat-icon">🏆</div>
								<div className="stat-info">
									<h4>Leaderboard Entries</h4>
									<p>{guild.leaderboard?.length || 0}</p>
								</div>
							</div>
						</div>
					</section>
					<section>
						<h2>Leaderboard</h2>
						{guild.leaderboard?.length === 0 ? (
							<div className="empty-state">
								<div className="empty-state-icon">📊</div>
								<h3>No leaderboard data</h3>
								<p>Players will appear here once they start playing</p>
							</div>
						) : (
							<table className="leaderboard">
								<thead>
									<tr>
										<th>Rank</th>
										<th>User</th>
										<th>Score</th>
									</tr>
								</thead>
								<tbody>
									{guild.leaderboard?.map((entry, index) => (
										<tr key={entry.userId}>
											<td>
												<span className={`rank ${getRankClass(index)}`}>
													{index + 1}
												</span>
											</td>
											<td>{entry.username}</td>
											<td className="score">{entry.score}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</section>
				</div>
			</main>
		</div>
	);
}
