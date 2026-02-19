import {
	type CommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord";
import { Command } from "../../command.ts";
import { DatabaseManager } from "../../utils/database-manager.ts";

class Leaderboard extends Command {
	public override get data(): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName("leaderboard")
			.setDescription("Shows who has held the amulet the longest");
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
			const dbManager = DatabaseManager.getInstance(interaction.client);
			const guildData = await dbManager.getGuildData(guildId);

			if (!guildData || guildData.users.size === 0) {
				await interaction.reply("No one has held the amulet yet!");
				return;
			}

			const formatDuration = (ms: number): string => {
				const seconds = Math.floor(ms / 1000);
				const minutes = Math.floor(seconds / 60);
				const hours = Math.floor(minutes / 60);
				const days = Math.floor(hours / 24);

				if (days > 0) {
					return `${days}d ${hours % 24}h`;
				}
				if (hours > 0) {
					return `${hours}h ${minutes % 60}m`;
				}
				if (minutes > 0) {
					return `${minutes}m ${seconds % 60}s`;
				}
				return `${seconds}s`;
			};

			const gameState = guildData.gameState;
			const currentHolderId = gameState.amulet?.currentHolder;
			const currentHolderTime =
				currentHolderId && gameState.amulet?.lastTransferred
					? Date.now() - new Date(gameState.amulet.lastTransferred).getTime()
					: 0;

			const usersWithCurrentTime = Array.from(guildData.users.values())
				.map((user) => {
					let totalTime = user.stats.amuletHeldTimeMs;
					if (user.id === currentHolderId) {
						totalTime += currentHolderTime;
					}
					return { ...user, totalTime };
				})
				.filter((u) => u.totalTime > 0)
				.sort((a, b) => b.totalTime - a.totalTime);

			if (usersWithCurrentTime.length === 0) {
				await interaction.reply("No one has held the amulet yet!");
				return;
			}

			const lines = usersWithCurrentTime.slice(0, 10).map((user, index) => {
				const displayName = user.displayName || user.username;
				const duration = formatDuration(user.totalTime);
				const count = user.stats.amuletHeldCount;
				const countStr = count === 1 ? "1 time" : `${count} times`;
				const isCurrentHolder = user.id === currentHolderId ? " 🟢" : "";
				return {
					name: `#${index + 1} ${displayName}${isCurrentHolder}`,
					value: `${duration} (${countStr})`,
				};
			});

			const embed = new EmbedBuilder()
				.setTitle("🏆 Amulet Leaderboard")
				.setColor(0x9b59b6)
				.addFields(lines);

			await interaction.reply({ embeds: [embed] });
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
