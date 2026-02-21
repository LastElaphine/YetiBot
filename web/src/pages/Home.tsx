import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Guild {
	id: string;
	name: string;
	totalUsers: number;
}

function LoadingSkeleton() {
	return (
		<div className="loading">
			<div className="skeleton skeleton-card" />
			<div className="skeleton skeleton-card" />
			<div className="skeleton skeleton-card" />
		</div>
	);
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
						<LoadingSkeleton />
					) : guilds.length === 0 ? (
						<div className="empty-state">
							<div className="empty-state-icon">🎮</div>
							<h3>No servers found</h3>
							<p>Servers using YetiBot will appear here</p>
						</div>
					) : (
						<div className="servers-grid">
							{guilds.map((guild) => (
								<Link
									key={guild.id}
									to={`/guilds/${guild.id}`}
									className="server-card"
								>
									<div className="server-card-header">
										<div className="server-icon">⚡</div>
										<div>
											<h3>{guild.name}</h3>
											<p>
												<span className="user-count">{guild.totalUsers}</span>{" "}
												users
											</p>
										</div>
									</div>
								</Link>
							))}
						</div>
					)}
				</section>
			</main>
		</div>
	);
}
