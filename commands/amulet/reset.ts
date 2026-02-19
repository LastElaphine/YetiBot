import { type CommandInteraction, SlashCommandBuilder } from "discord";
import { Command } from "../../command.ts";
import { amuletUtil } from "../../utils/amulet-util.ts";

class Reset extends Command {
	public override get data(): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName("reset")
			.setDescription(
				"Force reset the amulet - removes it from current holder",
			);
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

		await interaction.deferReply();

		try {
			const success = await amuletUtil.reset(guildId);

			if (success) {
				await interaction.editReply("✅ The amulet has been reset!");
			} else {
				await interaction.editReply(
					"There is no one currently holding the amulet.",
				);
			}
		} catch (error) {
			console.error("Error in reset command:", error);
			await interaction.editReply({
				content: "An error occurred. Please try again.",
			});
		}
	}
}

export const command = new Reset();
