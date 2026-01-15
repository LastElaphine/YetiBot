import {
	type CommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord";
import { Command } from "../../command.ts";
import { amuletUtil } from "../../utils/amulet-util.ts";

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

		const guildId = interaction.guildId!;
		const channelId = interaction.channelId;

		// Show immediate feedback
		await interaction.deferReply();

		try {
			const success = await amuletUtil.give(user, channelId, guildId);

			if (success) {
				await interaction.editReply(
					`✅ Successfully gave the amulet to ${user.username}!`,
				);
			} else {
				// Check who currently has the amulet
				const currentHolder = await amuletUtil.getCurrentHolder(guildId);
				const holderName =
					currentHolder?.displayName || currentHolder?.username || "someone";

				await interaction.editReply({
					content: `❌ Cannot give the amulet. It's currently held by ${holderName}.`,
				});
			}
		} catch (error) {
			console.error("Error in give command:", error);
			await interaction.editReply({
				content: "An error occurred while giving the amulet. Please try again.",
			});
		}
	}
}

export const command = new Give();
