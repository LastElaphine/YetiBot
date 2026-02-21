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
					<div className="text-center text-secondary">Loading...</div>
				) : guilds.length === 0 ? (
					<div className="text-center text-muted py-5">
						<p>No servers found</p>
					</div>
				) : (
					<div className="row g-4">
						{guilds.map((guild) => (
							<div key={guild.id} className="col-md-6 col-lg-4">
								<Link
									to={`/guilds/${guild.id}`}
									className="text-decoration-none"
								>
									<div className="card h-100">
										<div className="card-body">
											<h5 className="card-title">{guild.name}</h5>
											<p className="card-text text-secondary">
												{guild.totalUsers} users
											</p>
										</div>
									</div>
								</Link>
							</div>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
