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

	if (loading) {
		return (
			<div className="min-vh-100 bg-dark-custom">
				<nav className="navbar navbar-dark bg-dark border-bottom border-secondary">
					<div className="container">
						<span className="navbar-brand mb-0 h1">YetiBot Dashboard</span>
					</div>
				</nav>
				<main className="container py-4">
					<Link to="/" className="text-decoration-none text-secondary">
						← Back
					</Link>
					<div className="text-center text-secondary mt-4">Loading...</div>
				</main>
			</div>
		);
	}

	if (!guild) {
		return (
			<div className="min-vh-100 bg-dark-custom">
				<nav className="navbar navbar-dark bg-dark border-bottom border-secondary">
					<div className="container">
						<span className="navbar-brand mb-0 h1">YetiBot Dashboard</span>
					</div>
				</nav>
				<main className="container py-4">
					<Link to="/" className="text-decoration-none text-secondary">
						← Back
					</Link>
					<div className="text-center text-secondary py-5">
						<p>Guild not found</p>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-vh-100 bg-dark-custom">
			<nav className="navbar navbar-dark bg-dark border-bottom border-secondary">
				<div className="container">
					<span className="navbar-brand mb-0 h1">YetiBot Dashboard</span>
				</div>
			</nav>
			<main className="container py-4">
				<Link
					to="/"
					className="text-decoration-none text-secondary d-block mb-4"
				>
					← Back
				</Link>
				<h2 className="mb-4">{guild.name}</h2>
				<div className="row g-4 mb-4">
					<div className="col-md-6">
						<div className="card">
							<div className="card-body">
								<h5 className="card-title text-secondary">Total Users</h5>
								<p className="card-text display-4">{guild.totalUsers}</p>
							</div>
						</div>
					</div>
					<div className="col-md-6">
						<div className="card">
							<div className="card-body">
								<h5 className="card-title text-secondary">
									Leaderboard Entries
								</h5>
								<p className="card-text display-4">
									{guild.leaderboard?.length || 0}
								</p>
							</div>
						</div>
					</div>
				</div>
				<h3 className="mb-3">Leaderboard</h3>
				{guild.leaderboard?.length === 0 ? (
					<div className="text-center text-secondary py-4">
						<p>No leaderboard data</p>
					</div>
				) : (
					<table className="table table-dark table-striped">
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
			</main>
		</div>
	);
}
