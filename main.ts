import { Client, Events, GatewayIntentBits, MessageFlags } from "discord";
import { type Command, loadCommands } from "./command.ts";
import config from "./config.json" with { type: "json" };
import { initializeAmuletUtil } from "./utils/amulet-util.ts";
import { ChannelHelper } from "./utils/channel-helper.ts";
import { DatabaseManager } from "./utils/database-manager.ts";
import { logger } from "./utils/logger.ts";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

ChannelHelper.getInstance(client);
const dbManager = DatabaseManager.getInstance(client);
await dbManager.initialize();

initializeAmuletUtil(client);

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
		guildId: interaction.guildId,
	});

	try {
		await command.execute(interaction);
	} catch (error) {
		logger.error("Command execution failed", {
			commandName: interaction.commandName,
			error: String(error),
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
