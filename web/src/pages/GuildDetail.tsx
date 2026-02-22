import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

interface GuildUser {
	id: string;
	username: string;
	displayName?: string;
	amuletHeldCount: number;
	amuletHeldTimeMs: number;
	gamesPlayed: number;
}

interface GuildSound {
	id: string;
	name: string;
	filename: string;
	uploadedBy: string;
	uploadedAt: string;
	fileSize: number;
}

interface GuildData {
	id: string;
	name: string;
	totalUsers: number;
	users: GuildUser[];
	sounds: GuildSound[];
	defaultSoundId: string | null;
}

function formatTime(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
	return `${seconds}s`;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GuildDetail() {
	const { id } = useParams<{ id: string }>();
	const [guild, setGuild] = useState<GuildData | null>(null);
	const [loading, setLoading] = useState(true);
	const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);

	const playSound = (soundId: string) => {
		if (playingSoundId === soundId) {
			setPlayingSoundId(null);
			return;
		}
		setPlayingSoundId(soundId);
		const audio = new Audio(
			`http://localhost:3000/api/guilds/${id}/sounds/${soundId}/play`,
		);
		audio.play();
		audio.onended = () => setPlayingSoundId(null);
	};

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
			<div className="min-vh-100">
				<nav className="navbar navbar-light bg-light border-bottom">
					<div className="container">
						<span className="navbar-brand mb-0 h1">YetiBot Dashboard</span>
					</div>
				</nav>
				<main className="container py-4">
					<Link to="/" className="text-decoration-none text-muted d-block mb-4">
						← Back
					</Link>
					<div className="text-center text-muted mt-4">Loading...</div>
				</main>
			</div>
		);
	}

	if (!guild) {
		return (
			<div className="min-vh-100">
				<nav className="navbar navbar-light bg-light border-bottom">
					<div className="container">
						<span className="navbar-brand mb-0 h1">YetiBot Dashboard</span>
					</div>
				</nav>
				<main className="container py-4">
					<Link to="/" className="text-decoration-none text-muted">
						← Back
					</Link>
					<div className="text-center text-muted py-5">
						<p>Guild not found</p>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-vh-100">
			<nav className="navbar navbar-light bg-light border-bottom">
				<div className="container">
					<span className="navbar-brand mb-0 h1">YetiBot Dashboard</span>
				</div>
			</nav>
			<main className="container py-4">
				<Link to="/" className="text-decoration-none text-muted d-block mb-4">
					← Back
				</Link>
				<h2 className="mb-4">{guild.name}</h2>
				<h3 className="mb-3">Users</h3>
				{(guild.users ?? []).length === 0 ? (
					<div className="text-center text-muted py-4">
						<p>No users yet</p>
					</div>
				) : (
					<table className="table table-striped">
						<thead>
							<tr>
								<th>User</th>
								<th>Holds</th>
								<th>Time</th>
								<th>Games</th>
							</tr>
						</thead>
						<tbody>
							{(guild.users ?? []).map((user) => (
								<tr key={user.id}>
									<td>{user.displayName || user.username}</td>
									<td>{user.amuletHeldCount}</td>
									<td>{formatTime(user.amuletHeldTimeMs)}</td>
									<td>{user.gamesPlayed}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}

				<h3 className="mb-3 mt-5">Sounds</h3>
				{(guild.sounds ?? []).length === 0 ? (
					<div className="text-center text-muted py-4">
						<p>No sounds uploaded yet</p>
					</div>
				) : (
					<table className="table table-striped">
						<thead>
							<tr>
								<th>Name</th>
								<th>File</th>
								<th>Uploaded By</th>
								<th>Size</th>
								<th>Default</th>
								<th>Play</th>
							</tr>
						</thead>
						<tbody>
							{(guild.sounds ?? []).map((sound) => (
								<tr key={sound.id}>
									<td>{sound.name}</td>
									<td>
										<code className="small">{sound.filename}</code>
									</td>
									<td>{sound.uploadedBy}</td>
									<td>{formatFileSize(sound.fileSize)}</td>
									<td>
										{sound.id === guild.defaultSoundId ? (
											<span className="badge bg-primary">Default</span>
										) : (
											"-"
										)}
									</td>
									<td>
										<button
											type="button"
											className={`btn btn-sm ${
												playingSoundId === sound.id
													? "btn-danger"
													: "btn-primary"
											}`}
											onClick={() => playSound(sound.id)}
										>
											{playingSoundId === sound.id ? "Stop" : "Play"}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</main>
		</div>
	);
}
