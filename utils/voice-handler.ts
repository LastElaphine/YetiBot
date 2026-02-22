import {
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel,
	type VoiceConnection,
} from "@discordjs/voice";
import { type Client, Events, type VoiceState } from "discord";
import { DatabaseManager } from "./database-manager.ts";
import { logger } from "./logger.ts";
import { soundUtil } from "./sound-util.ts";

class VoiceHandler {
	private static instance: VoiceHandler;
	private client: Client;
	private connections: Map<string, VoiceConnection> = new Map();

	private constructor(client: Client) {
		this.client = client;
	}

	public static async initialize(client: Client): Promise<VoiceHandler> {
		if (!VoiceHandler.instance) {
			VoiceHandler.instance = new VoiceHandler(client);
			VoiceHandler.instance.setupEventListeners();
			voiceHandlerInstance = VoiceHandler.instance;
		}
		return VoiceHandler.instance;
	}

	private setupEventListeners(): void {
		this.client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
			await this.handleVoiceStateUpdate(oldState, newState);
		});
	}

	private async handleVoiceStateUpdate(
		oldState: VoiceState,
		newState: VoiceState,
	): Promise<void> {
		if (!newState.guild) return;

		const guildId = newState.guild.id;
		const userId = newState.member?.id;
		if (!userId) return;

		const wasInVoice = oldState.channelId !== null;
		const isInVoice = newState.channelId !== null;

		if (!wasInVoice && isInVoice && newState.channelId) {
			await this.handleUserJoin(guildId, userId, newState.channelId);
		}
	}

	private async handleUserJoin(
		guildId: string,
		userId: string,
		channelId: string,
	): Promise<void> {
		try {
			const dbManager = DatabaseManager.getExistingInstance();
			if (!dbManager) return;

			const defaultSound = await dbManager.getDefaultSound(guildId);
			if (!defaultSound) return;

			await this.playSound(guildId, channelId, defaultSound.filename);

			logger.info("Playing join sound", {
				guildId,
				userId,
				channelId,
				soundId: defaultSound.id,
			});
		} catch (error) {
			console.error("Error playing join sound:", error);
			logger.error("Error playing join sound", {
				guildId,
				userId,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	public async playSound(
		guildId: string,
		channelId: string,
		filename: string,
	): Promise<boolean> {
		try {
			const guild = this.client.guilds.cache.get(guildId);
			if (!guild) {
				console.error(`Guild ${guildId} not found`);
				return false;
			}

			const channel = guild.channels.cache.get(channelId);
			if (!channel || channel.type !== 2) {
				console.error(`Voice channel ${channelId} not found`);
				return false;
			}

			const existingConnection = this.connections.get(guildId);
			if (existingConnection) {
				existingConnection.destroy();
			}

			const connection = joinVoiceChannel({
				channelId: channel.id,
				guildId: guild.id,
				adapterCreator: guild.voiceAdapterCreator,
			});

			const filepath = soundUtil.getSoundPath(guildId, filename);
			const player = createAudioPlayer();
			const resource = createAudioResource(filepath);

			player.play(resource);
			connection.subscribe(player);

			player.on(AudioPlayerStatus.Idle, () => {
				logger.debug("Audio finished, disconnecting", { guildId });
				setTimeout(() => {
					connection.destroy();
					this.connections.delete(guildId);
				}, 1000);
			});

			player.on("error", (error) => {
				console.error("Player error:", error);
				connection.destroy();
				this.connections.delete(guildId);
			});

			setTimeout(() => {
				if (this.connections.has(guildId)) {
					connection.destroy();
					this.connections.delete(guildId);
				}
			}, 30000);

			return true;
		} catch (error) {
			console.error("Error playing sound:", error);
			return false;
		}
	}

	public async stopSound(guildId: string): Promise<void> {
		const connection = this.connections.get(guildId);
		if (connection) {
			connection.destroy();
			this.connections.delete(guildId);
		}
	}

	public isPlaying(guildId: string): boolean {
		return this.connections.has(guildId);
	}
}

let voiceHandlerInstance: VoiceHandler | null = null;

export async function initializeVoiceHandler(client: Client): Promise<void> {
	await VoiceHandler.initialize(client);
}

export async function playSound(
	guildId: string,
	channelId: string,
	soundUrl: string,
): Promise<boolean> {
	if (!voiceHandlerInstance) {
		console.error("Voice handler not initialized");
		return false;
	}
	return voiceHandlerInstance.playSound(guildId, channelId, soundUrl);
}

export { VoiceHandler };
