import {
	type AudioPlayer,
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel,
	type VoiceConnection,
} from "@discordjs/voice";
import { type Client, Events, type VoiceState } from "discord";
import { DatabaseManager } from "./database-manager.ts";
import { logger } from "./logger.ts";

class VoiceHandler {
	private static instance: VoiceHandler;
	private client: Client;
	private connections: Map<string, VoiceConnection> = new Map();
	private players: Map<string, AudioPlayer> = new Map();

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

			await this.playSound(guildId, channelId, defaultSound.url);

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
		soundUrl: string,
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

			const connection = joinVoiceChannel({
				channelId: channel.id,
				guildId: guild.id,
				adapterCreator: guild.voiceAdapterCreator,
			});

			this.connections.set(guildId, connection);

			const player = createAudioPlayer();
			this.players.set(guildId, player);

			const resource = createAudioResource(soundUrl);
			player.play(resource);

			connection.subscribe(player);

			player.on("idle", () => {
				logger.debug("Audio playback idle, disconnecting", { guildId });
				connection.destroy();
				this.connections.delete(guildId);
				this.players.delete(guildId);
			});

			player.on("error", (error) => {
				console.error("Audio player error:", error);
				connection.destroy();
				this.connections.delete(guildId);
				this.players.delete(guildId);
			});

			return true;
		} catch (error) {
			console.error("Error playing sound:", error);
			return false;
		}
	}

	public async stopSound(guildId: string): Promise<void> {
		const connection = this.connections.get(guildId);
		const player = this.players.get(guildId);

		if (player) {
			player.stop();
		}

		if (connection) {
			connection.destroy();
		}

		this.connections.delete(guildId);
		this.players.delete(guildId);
	}

	public isPlaying(guildId: string): boolean {
		const player = this.players.get(guildId);
		return player?.state.status === "playing";
	}
}

export async function initializeVoiceHandler(client: Client): Promise<void> {
	await VoiceHandler.initialize(client);
}

let voiceHandlerInstance: VoiceHandler | null = null;

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
