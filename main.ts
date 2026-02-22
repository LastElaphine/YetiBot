import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { type Command, loadCommands } from "./command.js";
import config from "./config.json" assert { type: "json" };
import { initializeAmuletUtil } from "./utils/amulet-util.js";
import { ChannelHelper } from "./utils/channel-helper.js";
import { DatabaseManager } from "./utils/database-manager.js";
import { logger } from "./utils/logger.js";
import { initializeVoiceHandler } from "./utils/voice-handler.js";

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

ChannelHelper.getInstance(client);
const dbManager = DatabaseManager.getInstance(client);
await dbManager.initialize();

await initializeAmuletUtil(client);

await initializeVoiceHandler(client);

const commands = await loadCommands();
logger.info("Commands loaded", {
	commandCount: commands.size,
	commands: commands.map((value: Command) => value.data.name),
});

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
