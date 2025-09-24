import { REST, Routes } from "discord";
import { type Command, loadCommands } from "./command.ts";
import config from "./config.json" with { type: "json" };

const commands = await loadCommands();

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.token);

// and deploy your commands!
(async () => {
	try {
		console.log(
			`Started refreshing ${commands.size} application (/) commands.`,
		);

		const data = await rest.put(
			Routes.applicationGuildCommands(config.clientId, config.guildId),
			{ body: commands.map((value: Command) => value.data) },
		);

		console.log(`Successfully reloaded ${data} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
