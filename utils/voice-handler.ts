import { type Client, Events, type VoiceState } from "discord";
import { DatabaseManager } from "./database-manager.ts";
import { logger } from "./logger.ts";

class VoiceHandler {
	private static instance: VoiceHandler;
	private client: Client;

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

			if (guild.voice) {
				guild.voice.disconnect();
			}

			const connection = await (channel as any).join();

			const dispatcher = connection.play(soundUrl, {
				volume: 0.5,
			});

			dispatcher.on("finish", () => {
				logger.debug("Audio finished, disconnecting", { guildId });
				setTimeout(() => {
					(channel as any).leave();
				}, 1000);
			});

			dispatcher.on("error", (error: Error) => {
				console.error("Dispatcher error:", error);
				(channel as any).leave();
			});

			setTimeout(() => {
				try {
					if ((channel as any).connection) {
						(channel as any).leave();
					}
				} catch {}
			}, 30000);

			return true;
		} catch (error) {
			console.error("Error playing sound:", error);
			return false;
		}
	}

	public async stopSound(guildId: string): Promise<void> {
		const guild = this.client.guilds.cache.get(guildId);
		if (guild && guild.voice) {
			guild.voice.disconnect();
		}
	}

	public isPlaying(guildId: string): boolean {
		const guild = this.client.guilds.cache.get(guildId);
		return guild?.voice?.connection?.dispatcher !== undefined;
	}
}

const voiceHandlerInstance: VoiceHandler | null = null;

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
