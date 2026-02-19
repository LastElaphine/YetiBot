import {
	type CommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord";
import { Command } from "../../command.ts";
import { amuletUtil } from "../../utils/amulet-util.ts";
import { logger } from "../../utils/logger.ts";

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

		await interaction.deferReply();

		try {
			const success = await amuletUtil.give(user, channelId, guildId);

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
				const currentHolder = await amuletUtil.getCurrentHolder(guildId);
				const holderName =
					currentHolder?.displayName || currentHolder?.username || "someone";

				logger.warn("Amulet transfer failed - already held", {
					command: "give",
					targetUserId: user.id,
					currentHolderId: currentHolder?.id,
					guildId,
				});

				await interaction.editReply({
					content: `❌ Cannot give the amulet. It's currently held by ${holderName}.`,
				});
			}
		} catch (error) {
			logger.error("Error in give command", {
				command: "give",
				error: String(error),
			});
			await interaction.editReply({
				content: "An error occurred while giving the amulet. Please try again.",
			});
		}
	}
}

export const command = new Give();
