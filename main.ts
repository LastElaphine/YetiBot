import { Client, Events, GatewayIntentBits, MessageFlags } from "discord";
import { type Command, loadCommands } from "./command.ts";
import config from "./config.json" with { type: "json" };
import { initializeAmuletUtil } from "./utils/amulet-util.ts";
import { ChannelHelper } from "./utils/channel-helper.ts";
import { DatabaseManager } from "./utils/database-manager.ts";
import { logger } from "./utils/logger.ts";
import { getWebConfig, startWebServer } from "./web/server.ts";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

ChannelHelper.getInstance(client);
const dbManager = DatabaseManager.getInstance(client);
await dbManager.initialize();

await initializeAmuletUtil(client);

const commands = await loadCommands();
logger.info("Commands loaded", {
	commandCount: commands.size,
	commands: commands.map((value: Command) => value.data.name),
});

const webConfig = getWebConfig();
if (webConfig.enabled) {
	startWebServer();
}

client.once(Events.ClientReady, (readyClient) => {
	logger.info("Bot ready", {
		tag: readyClient.user.tag,
		id: readyClient.user.id,
	});
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = commands.get(interaction.commandName) as Command;

	if (!command) {
		logger.warn("Command not found", { commandName: interaction.commandName });
		return;
	}

	logger.debug("Command executed", {
		commandName: interaction.commandName,
		userId: interaction.user.id,
		username: interaction.user.username,
		guildId: interaction.guildId,
		channelId: interaction.channelId,
	});

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error("Command execution failed:", error);
		logger.error("Command execution failed", {
			commandName: interaction.commandName,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			userId: interaction.user.id,
			username: interaction.user.username,
			guildId: interaction.guildId,
			channelId: interaction.channelId,
		});
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
