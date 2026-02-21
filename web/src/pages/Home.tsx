import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Guild {
	id: string;
	name: string;
	totalUsers: number;
}

export default function Home() {
	const [guilds, setGuilds] = useState<Guild[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("http://localhost:3000/api/guilds")
			.then((res) => res.json())
			.then((data) => {
				setGuilds(data.guilds || []);
				setLoading(false);
			})
			.catch(() => {
				setLoading(false);
			});
	}, []);

	return (
		<div className="min-vh-100">
			<nav className="navbar navbar-light bg-light border-bottom">
				<div className="container">
					<span className="navbar-brand mb-0 h1">YetiBot Dashboard</span>
				</div>
			</nav>
			<main className="container py-4">
				<h2 className="mb-4">Servers</h2>
				{loading ? (
					<div className="text-center text-muted">Loading...</div>
				) : guilds.length === 0 ? (
					<div className="text-center text-muted">No servers</div>
				) : (
					<ul className="list-group">
						{guilds.map((guild) => (
							<Link
								key={guild.id}
								to={`/guilds/${guild.id}`}
								className="list-group-item list-group-item-action"
							>
								{guild.name}
							</Link>
						))}
					</ul>
				)}
			</main>
		</div>
	);
}
