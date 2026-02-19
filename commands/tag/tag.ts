import {
	type CommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord";
import { Command } from "../../command.ts";
import { logger } from "../../utils/logger.ts";
import { tagUtil } from "../../utils/tag-util.ts";

class Tag extends Command {
	public override get data(): SlashCommandBuilder {
		const command = new SlashCommandBuilder()
			.setName("tag")
			.setDescription("Tag someone in the game");
		command.addUserOption((option) =>
			option.setName("target").setDescription("Who to tag?").setRequired(true),
		);
		return command;
	}

	public override async execute(
		interaction: CommandInteraction,
	): Promise<void> {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		const target = interaction.options.getUser("target");
		if (!target) {
			await interaction.reply({
				content: "Please specify a user to tag.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (!interaction.guildId) {
			await interaction.reply({
				content: "This command can only be used in a server.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const guildId = interaction.guildId;
		const channelId = interaction.channelId;
		const tagger = interaction.user;

		await interaction.deferReply();

		try {
			const result = await tagUtil.tag(target, tagger, channelId, guildId);

			if (result.success) {
				logger.info("Tag successful", {
					command: "tag",
					targetUserId: target.id,
					taggerUserId: tagger.id,
					guildId,
				});
			} else {
				logger.info("Tag failed", {
					command: "tag",
					targetUserId: target.id,
					taggerUserId: tagger.id,
					guildId,
					reason: result.message,
				});
			}

			await interaction.editReply(result.message);
		} catch (error) {
			logger.error("Error in tag command", {
				command: "tag",
				error: String(error),
			});
			await interaction.editReply({
				content: "An error occurred while tagging. Please try again.",
			});
		}
	}
}

export const command = new Tag();
