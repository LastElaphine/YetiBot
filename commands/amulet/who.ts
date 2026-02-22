import { type CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../command.js";
import { amuletUtil } from "../../utils/amulet-util.js";
import { DatabaseManager } from "../../utils/database-manager.js";

class Who extends Command {
	public override get data(): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName("who")
			.setDescription("Shows who currently has the amulet");
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
			const currentHolder = await amuletUtil.getCurrentHolder(guildId);

			if (!currentHolder) {
				await interaction.reply(
					"The amulet is currently free! Use /give @user to assign it.",
				);
				return;
			}

			const dbManager = DatabaseManager.getInstance(interaction.client);
			const gameState = await dbManager.getGameState(guildId);

			let timeHeld = "";
			if (gameState?.amulet?.lastTransferred) {
				const timeHeldMs =
					Date.now() - new Date(gameState.amulet.lastTransferred).getTime();
				const seconds = Math.floor(timeHeldMs / 1000);
				const minutes = Math.floor(seconds / 60);
				const hours = Math.floor(minutes / 60);

				if (hours > 0) {
					timeHeld = ` (${hours}h ${minutes % 60}m)`;
				} else if (minutes > 0) {
					timeHeld = ` (${minutes}m ${seconds % 60}s)`;
				} else {
					timeHeld = ` (${seconds}s)`;
				}
			}

			const displayName = currentHolder.displayName || currentHolder.username;

			await interaction.reply(
				`🏷️ **${displayName}** currently has the amulet!${timeHeld}`,
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
