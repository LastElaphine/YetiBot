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
		<div className="app">
			<header>
				<h1>YetiBot Dashboard</h1>
			</header>
			<main>
				<section>
					<h2>Servers</h2>
					{loading ? (
						<p>Loading...</p>
					) : guilds.length === 0 ? (
						<p>No servers found</p>
					) : (
						<div className="servers-grid">
							{guilds.map((guild) => (
								<Link
									key={guild.id}
									to={`/guilds/${guild.id}`}
									className="server-card"
								>
									<h3>{guild.name}</h3>
									<p>{guild.totalUsers} users</p>
								</Link>
							))}
						</div>
					)}
				</section>
			</main>
		</div>
	);
}
