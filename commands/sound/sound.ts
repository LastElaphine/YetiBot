import {
	type CommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../command.js";
import type { SoundClip } from "../../types/database.js";
import { DatabaseManager } from "../../utils/database-manager.js";
import { logger } from "../../utils/logger.js";
import { soundUtil } from "../../utils/sound-util.js";
import { playSound } from "../../utils/voice-handler.js";

const MAX_SOUNDS_PER_GUILD = 50;

class Sound extends Command {
	public override get data(): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName("sound")
			.setDescription("Manage sound clips for this server")
			.addSubcommand((subcommand) =>
				subcommand
					.setName("upload")
					.setDescription("Upload a sound clip")
					.addStringOption((option) =>
						option
							.setName("name")
							.setDescription("Name for this sound clip")
							.setRequired(true)
							.setMaxLength(50),
					)
					.addAttachmentOption((option) =>
						option
							.setName("file")
							.setDescription("Audio file (mp3, wav, ogg, flac, m4a)")
							.setRequired(true),
					),
			)
			.addSubcommand((subcommand) =>
				subcommand
					.setName("list")
					.setDescription("List all sound clips for this server"),
			)
			.addSubcommand((subcommand) =>
				subcommand
					.setName("delete")
					.setDescription("Delete a sound clip")
					.addStringOption((option) =>
						option
							.setName("id")
							.setDescription("Sound ID to delete")
							.setRequired(true),
					),
			)
			.addSubcommand((subcommand) =>
				subcommand
					.setName("set-default")
					.setDescription("Set the default sound for join events")
					.addStringOption((option) =>
						option
							.setName("id")
							.setDescription("Sound ID to set as default")
							.setRequired(true),
					),
			)
			.addSubcommand((subcommand) =>
				subcommand
					.setName("play")
					.setDescription("Play a sound clip in your voice channel")
					.addStringOption((option) =>
						option
							.setName("sound")
							.setDescription("Sound ID or name to play")
							.setRequired(true),
					),
			);
	}

	public override async execute(
		interaction: CommandInteraction,
	): Promise<void> {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		const subcommand = interaction.options.getSubcommand();

		if (!interaction.guildId) {
			await interaction.reply({
				content: "This command can only be used in a server.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const guildId = interaction.guildId;

		switch (subcommand) {
			case "upload":
				await this.handleUpload(interaction, guildId);
				break;
			case "list":
				await this.handleList(interaction, guildId);
				break;
			case "delete":
				await this.handleDelete(interaction, guildId);
				break;
			case "set-default":
				await this.handleSetDefault(interaction, guildId);
				break;
			case "play":
				await this.handlePlay(interaction, guildId);
				break;
		}
	}

	private async handleUpload(
		interaction: CommandInteraction,
		guildId: string,
	): Promise<void> {
		const name = interaction.options.getString("name", true);
		const attachment = interaction.options.getAttachment("file");

		if (!attachment) {
			await interaction.reply({
				content: "Please attach an audio file.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const validation = soundUtil.isValidSoundFile(
			attachment.filename,
			attachment.contentType,
			attachment.size,
		);
		if (!validation.valid) {
			await interaction.reply({
				content: validation.error,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await interaction.deferReply();

		try {
			const dbManager = DatabaseManager.getExistingInstance();
			if (!dbManager) {
				await interaction.editReply("Database not initialized.");
				return;
			}

			const existingSounds = await dbManager.getSounds(guildId);
			if (existingSounds.length >= MAX_SOUNDS_PER_GUILD) {
				await interaction.editReply(
					`Maximum of ${MAX_SOUNDS_PER_GUILD} sounds per server reached.`,
				);
				return;
			}

			const soundId = soundUtil.generateSoundId();

			const { filename } = await soundUtil.saveSoundFile(
				guildId,
				soundId,
				attachment,
			);

			const soundClip = soundUtil.createSoundClip(
				soundId,
				name,
				filename,
				interaction.user.id,
				attachment.size,
			);

			await dbManager.addSound(guildId, soundClip);

			logger.info("Sound uploaded", {
				command: "sound upload",
				guildId,
				soundId,
				name,
				uploadedBy: interaction.user.id,
			});

			await interaction.editReply(
				`✅ Sound "${name}" uploaded successfully!\nID: \`${soundId.slice(0, 8)}\``,
			);
		} catch (error) {
			console.error("Error uploading sound:", error);
			logger.error("Error uploading sound", {
				command: "sound upload",
				error: error instanceof Error ? error.message : String(error),
			});
			await interaction.editReply("Failed to upload sound. Please try again.");
		}
	}

	private async handleList(
		interaction: CommandInteraction,
		guildId: string,
	): Promise<void> {
		await interaction.deferReply();

		try {
			const dbManager = DatabaseManager.getExistingInstance();
			if (!dbManager) {
				await interaction.editReply("Database not initialized.");
				return;
			}

			const sounds = await dbManager.getSounds(guildId);
			const defaultSound = await dbManager.getDefaultSound(guildId);

			if (sounds.length === 0) {
				await interaction.editReply(
					"No sound clips yet. Use `/sound upload` to add one!",
				);
				return;
			}

			const embed = {
				title: "Sound Clips",
				description: `Total: ${sounds.length} sound(s)`,
				color: 0x5865f2,
				fields: sounds.map((sound) => {
					const isDefault = defaultSound?.id === sound.id;
					return {
						name: `${sound.name}${isDefault ? " ⭐" : ""}`,
						value: `ID: \`${sound.id.slice(0, 8)}\`\nSize: ${soundUtil.formatFileSize(sound.fileSize)}\nUploaded: <t:${Math.floor(new Date(sound.uploadedAt).getTime() / 1000)}:R>`,
						inline: true,
					};
				}),
			};

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error("Error listing sounds:", error);
			await interaction.editReply("Failed to list sounds.");
		}
	}

	private async handleDelete(
		interaction: CommandInteraction,
		guildId: string,
	): Promise<void> {
		const soundId = interaction.options.getString("id", true);

		await interaction.deferReply();

		try {
			const dbManager = DatabaseManager.getExistingInstance();
			if (!dbManager) {
				await interaction.editReply("Database not initialized.");
				return;
			}

			const sound = await dbManager.getSound(guildId, soundId);
			if (!sound) {
				await interaction.editReply("Sound not found.");
				return;
			}

			await soundUtil.deleteSoundFile(guildId, sound.filename);
			await dbManager.deleteSound(guildId, soundId);

			logger.info("Sound deleted", {
				command: "sound delete",
				guildId,
				soundId,
				deletedBy: interaction.user.id,
			});

			await interaction.editReply(`✅ Sound "${sound.name}" deleted.`);
		} catch (error) {
			console.error("Error deleting sound:", error);
			logger.error("Error deleting sound", {
				command: "sound delete",
				error: error instanceof Error ? error.message : String(error),
			});
			await interaction.editReply("Failed to delete sound.");
		}
	}

	private async handleSetDefault(
		interaction: CommandInteraction,
		guildId: string,
	): Promise<void> {
		const soundId = interaction.options.getString("id", true);

		await interaction.deferReply();

		try {
			const dbManager = DatabaseManager.getExistingInstance();
			if (!dbManager) {
				await interaction.editReply("Database not initialized.");
				return;
			}

			const sound = await dbManager.getSound(guildId, soundId);
			if (!sound) {
				await interaction.editReply("Sound not found.");
				return;
			}

			const success = await dbManager.setDefaultSound(guildId, soundId);
			if (success) {
				logger.info("Default sound set", {
					command: "sound set-default",
					guildId,
					soundId,
					setBy: interaction.user.id,
				});
				await interaction.editReply(`⭐ "${sound.name}" set as default sound.`);
			} else {
				await interaction.editReply("Failed to set default sound.");
			}
		} catch (error) {
			console.error("Error setting default sound:", error);
			await interaction.editReply("Failed to set default sound.");
		}
	}

	private async handlePlay(
		interaction: CommandInteraction,
		guildId: string,
	): Promise<void> {
		const soundInput = interaction.options.getString("sound");

		const member = interaction.member;
		if (!member || !("voice" in member) || !member.voice?.channelId) {
			await interaction.reply({
				content: "You must be in a voice channel to play a sound.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const voiceChannelId = member.voice.channelId;

		await interaction.deferReply();

		try {
			const dbManager = DatabaseManager.getExistingInstance();
			if (!dbManager) {
				await interaction.editReply("Database not initialized.");
				return;
			}

			let sound: SoundClip | null = null;
			if (soundInput) {
				sound = await dbManager.getSound(guildId, soundInput);
				if (!sound) {
					const sounds = await dbManager.getSounds(guildId);
					const lowerInput = soundInput.toLowerCase();
					sound =
						sounds.find((s) => s.name.toLowerCase().includes(lowerInput)) ??
						null;
				}
			} else {
				sound = await dbManager.getDefaultSound(guildId);
			}

			if (!sound) {
				await interaction.editReply(
					soundInput
						? "Sound not found."
						: "No default sound set. Use `/sound set-default` first.",
				);
				return;
			}

			const success = await playSound(guildId, voiceChannelId, sound.filename);

			if (success) {
				logger.info("Playing sound", {
					command: "sound play",
					guildId,
					soundId: sound.id,
					channelId: voiceChannelId,
				});
				await interaction.editReply(`🔊 Playing "${sound.name}"...`);
			} else {
				await interaction.editReply("Failed to play sound.");
			}
		} catch (error) {
			console.error("Error playing sound:", error);
			await interaction.editReply("Failed to play sound.");
		}
	}
}

export const command = new Sound();
