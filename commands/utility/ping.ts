import { type CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../command.js";

class Ping extends Command {
	public override get data(): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName("ping")
			.setDescription("Replies with Pong!");
	}

	public override async execute(
		interaction: CommandInteraction,
	): Promise<void> {
		await interaction.reply("Pong!");
	}
}

export const command = new Ping();
