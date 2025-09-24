import { type CommandInteraction, SlashCommandBuilder } from "discord";
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
		await interaction.reply(`Giving ${user} the amulet`);

		if (user) {
			const success = amuletUtil.give(user);
			console.log(`Gave amulet ${success}`);
		}
	}
}

export const command = new Give();
