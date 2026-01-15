import { Client, Events, GatewayIntentBits, MessageFlags } from "discord";
import { type Command, loadCommands } from "./command.ts";
import config from "./config.json" with { type: "json" };
import { initializeAmuletUtil } from "./utils/amulet-util.ts";
import { ChannelHelper } from "./utils/channel-helper.ts";
import { DatabaseManager } from "./utils/database-manager.ts";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

ChannelHelper.getInstance(client);
const dbManager = DatabaseManager.getInstance(client);
await dbManager.initialize();

// Initialize amulet utility after database is ready
initializeAmuletUtil(client);

const commands = await loadCommands();
console.log(
	`Loaded Commands: ${JSON.stringify(
		commands.map((value: Command) => value.data),
		null,
		2,
	)}`,
);

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = commands.get(interaction.commandName) as Command;

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: "There was an error while executing this command!",
				flags: MessageFlags.Ephemeral,
			});
		} else {
			await interaction.reply({
				content: "There was an error while executing this command!",
				flags: MessageFlags.Ephemeral,
			});
		}
	}
});

client.login(config.token);
