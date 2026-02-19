import { type CommandInteraction, SlashCommandBuilder } from "discord";
import { Command } from "../../command.ts";
import { DatabaseManager } from "../../utils/database-manager.ts";

class Leaderboard extends Command {
	public override get data(): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName("leaderboard")
			.setDescription("Shows the tag game leaderboard")
			.addStringOption((option) =>
				option
					.setName("category")
					.setDescription("Leaderboard category")
					.addChoices(
						{ name: "Tag Scores", value: "tag-scores" },
						{ name: "Amulet Time", value: "amulet-time" },
						{ name: "Amulet Count", value: "amulet-count" },
						{ name: "Games Played", value: "games-played" },
					),
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
		const category = interaction.options.getString("category") || "tag-scores";

		try {
			const dbManager = DatabaseManager.getInstance(null as never);
			const entries = await dbManager.getLeaderboard(guildId, category);

			if (entries.length === 0) {
				await interaction.reply("No leaderboard data yet!");
				return;
			}

			const categoryLabels: Record<string, string> = {
				"tag-scores": "Tag Scores",
				"amulet-time": "Amulet Time",
				"amulet-count": "Amulet Count",
				"games-played": "Games Played",
			};

			const top10 = entries.slice(0, 10);
			const lines = top10
				.map((entry) => `${entry.rank}. **${entry.username}**: ${entry.score}`)
				.join("\n");

			await interaction.reply(
				`📊 **${categoryLabels[category]} Leaderboard**\n\n${lines}`,
			);
		} catch (error) {
			console.error("Error in leaderboard command:", error);
			await interaction.reply({
				content: "An error occurred. Please try again.",
				flags: 64,
			});
		}
	}
}

export const command = new Leaderboard();
