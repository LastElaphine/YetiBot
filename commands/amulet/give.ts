import {
	type CommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../command.js";
import { amuletUtil } from "../../utils/amulet-util.js";
import { logger } from "../../utils/logger.js";

class Give extends Command {
	public override get data(): SlashCommandBuilder {
		const command = new SlashCommandBuilder()
			.setName("give")
			.setDescription("Give someone the amulet");
		command.addUserOption((option) =>
			option
				.setName("target")
				.setDescription("Who deserves the amulet?")
				.setRequired(true),
		);
		return command;
	}

	public override async execute(
		interaction: CommandInteraction,
	): Promise<void> {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		const user = interaction.options.getUser("target");
		if (!user) {
			await interaction.reply({
				content: "Please specify a user to give the amulet to.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (!interaction.guildId) {
			await interaction.reply({
				content: "This command can only be used in a server.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const guildId = interaction.guildId;
		const channelId = interaction.channelId;
		const fromUserId = interaction.user.id;

		// Check if user is trying to give to themselves
		if (user.id === fromUserId) {
			await interaction.deferReply();
			const success = await amuletUtil.giveSelf(
				user,
				channelId,
				guildId,
				fromUserId,
			);
			if (success) {
				await interaction.editReply(
					"✅ You really tried to give it to yourself, huh?",
				);
			}
			return;
		}

		await interaction.deferReply();

		try {
			// Get current holder's time held before transfer
			const currentHolder = await amuletUtil.getCurrentHolder(guildId);
			let previousHolderTimeMs: number | undefined;
			if (currentHolder) {
				const gameState = await amuletUtil.getGameState(guildId);
				if (gameState?.amulet?.lastTransferred) {
					previousHolderTimeMs =
						Date.now() - new Date(gameState.amulet.lastTransferred).getTime();
				}
			}

			const success = await amuletUtil.give(
				user,
				channelId,
				guildId,
				fromUserId,
				previousHolderTimeMs,
			);

			if (success) {
				logger.info("Amulet transferred", {
					command: "give",
					targetUserId: user.id,
					guildId,
				});
				await interaction.editReply(
					`✅ Successfully gave the amulet to ${user.username}!`,
				);
			} else {
				const holder = await amuletUtil.getCurrentHolder(guildId);
				const holderName = holder?.displayName || holder?.username || "someone";

				logger.warn("Amulet transfer failed - already held", {
					command: "give",
					targetUserId: user.id,
					currentHolderId: holder?.id,
					guildId,
				});

				await interaction.editReply({
					content: `❌ Cannot give the amulet. It's currently held by ${holderName}.`,
				});
			}
		} catch (error) {
			console.error("Error in give command:", error);
			logger.error("Error in give command", {
				command: "give",
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
			await interaction.editReply({
				content: "An error occurred while giving the amulet. Please try again.",
			});
		}
	}
}

export const command = new Give();
