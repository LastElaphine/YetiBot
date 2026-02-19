import { type CommandInteraction, SlashCommandBuilder } from "discord";
import { Command } from "../../command.ts";
import { tagUtil } from "../../utils/tag-util.ts";

class Who extends Command {
	public override get data(): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName("who")
			.setDescription("Shows who is currently it in the tag game");
	}

	public override async execute(
		interaction: CommandInteraction,
	): Promise<void> {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		if (!interaction.guildId) {
			await interaction.reply({
				content: "This command can only be used in a server.",
				flags: 64,
			});
			return;
		}

		const guildId = interaction.guildId;

		try {
			const currentIt = await tagUtil.getCurrentIt(guildId);

			if (!currentIt) {
				await interaction.reply("No active tag game. Use /tag @user to start!");
				return;
			}

			const scores = await tagUtil.getScores(guildId);
			const score = scores.get(currentIt.id) || 0;

			const displayName = currentIt.displayName || currentIt.username;

			await interaction.reply(
				`🏷️ **${displayName}** is currently it! (Score: ${score})`,
			);
		} catch (error) {
			console.error("Error in who command:", error);
			await interaction.reply({
				content: "An error occurred. Please try again.",
				flags: 64,
			});
		}
	}
}

export const command = new Who();
