import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
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
const BUTTON_TIMEOUT_MS = 120000;

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

		const gameState = guildData.gameState;
		const currentHolderId = gameState.amulet?.currentHolder;

		const rankedUsers = this.getRankedUsers(
			guildData,
			category,
			currentHolderId,
		);

		if (rankedUsers.length === 0) {
			await interaction.reply("No data available for this leaderboard yet!");
			return;
		}

		const embed = this.buildEmbed(rankedUsers, category, currentHolderId);
		const components = this.buildButtons(category);

		const { interactionResponse: reply } = await interaction.reply({
			embeds: [embed],
			components: [components],
			withResponse: true,
		});

		if (!reply) return;

		const message = await interaction.channel?.messages.fetch(reply.id);
		if (!message) return;

		const currentCategory = { value: category };

		const collector = message.createMessageComponentCollector({
			filter: (btnInteraction) =>
				btnInteraction.user.id === interaction.user.id,
			time: BUTTON_TIMEOUT_MS,
		});

		collector.on("collect", async (btnInteraction) => {
			if (!btnInteraction.isButton()) return;

			if (btnInteraction.customId === "prev") {
				currentCategory.value = getPreviousCategory(currentCategory.value);
			} else if (btnInteraction.customId === "next") {
				currentCategory.value = getNextCategory(currentCategory.value);
			} else if (btnInteraction.customId.startsWith("cat_")) {
				currentCategory.value = btnInteraction.customId.replace(
					"cat_",
					"",
				) as LeaderboardCategory;
			}

			const newCategory = currentCategory.value;

			const newRankedUsers = this.getRankedUsers(
				guildData,
				newCategory,
				currentHolderId,
			);

			if (newRankedUsers.length === 0) {
				await btnInteraction.reply({
					content: "No data available for this leaderboard!",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const newEmbed = this.buildEmbed(
				newRankedUsers,
				newCategory,
				currentHolderId,
			);
			const newComponents = this.buildButtons(newCategory);

			await btnInteraction.update({
				embeds: [newEmbed],
				components: [newComponents],
			});
		});

		collector.on("end", async () => {
			try {
				const emptyComponents = new ActionRowBuilder<ButtonBuilder>();
				await message.edit({ components: [emptyComponents] });
			} catch {
				// Ignore cleanup errors
			}
		});
	}

	private getRankedUsers(
		guildData: Awaited<
			ReturnType<typeof DatabaseManager.prototype.getGuildData>
		>,
		category: LeaderboardCategory,
		currentHolderId: string | null,
	): Array<{
		user: import("../../types/database.ts").UserProfile;
		value: number;
		rank: number;
	}> {
		if (!guildData) return [];

		const config = getCategoryConfig(category);
		const gameState = guildData.gameState;

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

		return usersWithValues.slice(0, LEADERBOARD_LIMIT).map((u, i) => ({
			...u,
			rank: i + 1,
		}));
	}

	private buildButtons(
		_category: LeaderboardCategory,
	): ActionRowBuilder<ButtonBuilder> {
		return new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("prev")
				.setLabel("◀ Previous")
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId("next")
				.setLabel("Next ▶")
				.setStyle(ButtonStyle.Secondary),
		);
	}

	private buildEmbed(
		rankedUsers: Array<{
			user: import("../../types/database.ts").UserProfile;
			value: number;
			rank: number;
		}>,
		category: LeaderboardCategory,
		currentHolderId: string | null,
	): EmbedBuilder {
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
		embed.setFooter({ text: `${categoryList}` });

		return embed;
	}
}

export const command = new Leaderboard();
