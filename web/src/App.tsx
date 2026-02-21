import { Route, Routes } from "react-router-dom";
import GuildDetail from "./pages/GuildDetail";
import Home from "./pages/Home";

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/guilds/:id" element={<GuildDetail />} />
		</Routes>
	);
}
