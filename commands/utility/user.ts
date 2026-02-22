import {
	type CommandInteraction,
	GuildMember,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../command.js";

class User extends Command {
	public override get data(): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName("user")
			.setDescription("Provides information about the user.");
	}

	public override async execute(
		interaction: CommandInteraction,
	): Promise<void> {
		if (interaction.member instanceof GuildMember) {
			await interaction.reply(
				`This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`,
			);
		}
	}
}

export const command = new User();
