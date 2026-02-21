import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

interface GuildData {
	id: string;
	name: string;
	totalUsers: number;
	leaderboard: Array<{ userId: string; username: string; score: number }>;
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

	if (loading) return <p>Loading...</p>;
	if (!guild) return <p>Guild not found</p>;

	return (
		<div className="guild-detail">
			<header>
				<Link to="/" className="back-link">
					← Back
				</Link>
				<h1>{guild.name}</h1>
			</header>
			<main>
				<section>
					<h2>Stats</h2>
					<p>Total Users: {guild.totalUsers}</p>
				</section>
				<section>
					<h2>Leaderboard</h2>
					{guild.leaderboard?.length === 0 ? (
						<p>No leaderboard data</p>
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
										<td>{index + 1}</td>
										<td>{entry.username}</td>
										<td>{entry.score}</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</section>
			</main>
		</div>
	);
}
