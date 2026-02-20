import {
	type CommandInteraction,
	EmbedBuilder,
	MessageFlags,
	SlashCommandBuilder,
} from "discord";
import { Command } from "../../command.ts";
import { DatabaseManager } from "../../utils/database-manager.ts";
import {
	CATEGORIES,
	getCategoryConfig,
	getNextCategory,
	getPreviousCategory,
	getRankEmoji,
	type LeaderboardCategory,
} from "../../utils/leaderboard-util.ts";

const LEADERBOARD_LIMIT = 10;
const REACTION_TIMEOUT_MS = 120000;

class Leaderboard extends Command {
	public override get data(): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName("leaderboard")
			.setDescription("Shows amulet leaderboard stats")
			.addStringOption((option) =>
				option
					.setName("category")
					.setDescription("Which leaderboard to show")
					.addChoices(
						{ name: "Total Hold Time", value: "time" },
						{ name: "Hold Count", value: "count" },
						{ name: "Passes Given", value: "passes" },
						{ name: "Longest Hold", value: "longest" },
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
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const categoryOption = interaction.options.getString(
			"category",
		) as LeaderboardCategory | null;
		const initialCategory = categoryOption || "time";

		try {
			await this.showLeaderboard(interaction, initialCategory);
		} catch (error) {
			console.error("Error in leaderboard command:", error);
			if (!interaction.replied) {
				await interaction.reply({
					content: "An error occurred. Please try again.",
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	}

	private async showLeaderboard(
		interaction: CommandInteraction,
		category: LeaderboardCategory,
	): Promise<void> {
		const guildId = interaction.guildId;
		if (!guildId) return;

		const dbManager = DatabaseManager.getInstance(interaction.client);
		const guildData = await dbManager.getGuildData(guildId);

		if (!guildData || guildData.users.size === 0) {
			await interaction.reply("No one has held the amulet yet!");
			return;
		}

		const config = getCategoryConfig(category);
		const gameState = guildData.gameState;
		const currentHolderId = gameState.amulet?.currentHolder;

		const usersWithValues = Array.from(guildData.users.values())
			.map((user) => {
				let value = config.getValue(user.stats);
				if (
					category === "time" &&
					user.id === currentHolderId &&
					gameState.amulet?.lastTransferred
				) {
					const currentHolderTime =
						Date.now() - new Date(gameState.amulet.lastTransferred).getTime();
					value += currentHolderTime;
				}
				return { user, value };
			})
			.filter((u) => u.value > 0)
			.sort((a, b) => b.value - a.value);

		if (usersWithValues.length === 0) {
			await interaction.reply("No data available for this leaderboard yet!");
			return;
		}

		const rankedUsers = usersWithValues
			.slice(0, LEADERBOARD_LIMIT)
			.map((u, i) => ({
				...u,
				rank: i + 1,
			}));

		const embed = await this.buildEmbed(rankedUsers, category, currentHolderId);

		const reply = await interaction.reply({
			embeds: [embed],
			fetchReply: true,
		});

		if ("react" in reply) {
			await reply.react("⬅️");
			await reply.react("➡️");

			const filter = (reaction: { emoji: { name: string } }) =>
				reaction.emoji.name === "⬅️" || reaction.emoji.name === "➡️";

			const collector = reply.createReactionCollector({
				filter,
				time: REACTION_TIMEOUT_MS,
			});

			collector.on("collect", async (reaction, user) => {
				if (user.id === interaction.user.id) {
					const newCategory =
						reaction.emoji.name === "➡️"
							? getNextCategory(category)
							: getPreviousCategory(category);

					await reaction.users.remove(user.id);

					const newConfig = getCategoryConfig(newCategory);
					const newUsersWithValues = Array.from(guildData.users.values())
						.map((user) => {
							let value = newConfig.getValue(user.stats);
							if (
								newCategory === "time" &&
								user.id === currentHolderId &&
								gameState.amulet?.lastTransferred
							) {
								const currentHolderTime =
									Date.now() -
									new Date(gameState.amulet.lastTransferred).getTime();
								value += currentHolderTime;
							}
							return { user, value };
						})
						.filter((u) => u.value > 0)
						.sort((a, b) => b.value - a.value);

					if (newUsersWithValues.length === 0) {
						return;
					}

					const newRankedUsers = newUsersWithValues
						.slice(0, LEADERBOARD_LIMIT)
						.map((u, i) => ({
							...u,
							rank: i + 1,
						}));

					const newEmbed = await this.buildEmbed(
						newRankedUsers,
						newCategory,
						currentHolderId,
					);

					await reply.edit({ embeds: [newEmbed] });

					(category as string) = newCategory;
				}
			});

			collector.on("end", async () => {
				try {
					await reply.reactions.removeAll();
				} catch {
					// Ignore cleanup errors
				}
			});
		}
	}

	private async buildEmbed(
		rankedUsers: Array<{
			user: import("../../types/database.ts").UserProfile;
			value: number;
			rank: number;
		}>,
		category: LeaderboardCategory,
		currentHolderId: string | null,
	): Promise<EmbedBuilder> {
		const config = getCategoryConfig(category);

		const fields = rankedUsers.map((entry) => {
			const { user, rank, value } = entry;
			const displayName = user.displayName || user.username;
			const rankEmoji = getRankEmoji(rank);
			const isCurrentHolder = user.id === currentHolderId ? " 🟢" : "";
			const formattedValue = config.formatValue(value);

			const name = `${rankEmoji} ${displayName}${isCurrentHolder}`;
			const valueStr = `${formattedValue}`;

			return {
				name,
				value: valueStr,
				inline: true,
			};
		});

		const embed = new EmbedBuilder()
			.setTitle(`🏆 ${config.label} Leaderboard`)
			.setDescription(config.description)
			.setColor(config.color)
			.addFields(fields);

		const categoryList = CATEGORIES.map((c) =>
			c.key === category ? `**${c.label}**` : c.label,
		).join(" • ");
		embed.setFooter({ text: `${categoryList}\nUse ⬅️ ➡️ to change categories` });

		return embed;
	}
}

export const command = new Leaderboard();
