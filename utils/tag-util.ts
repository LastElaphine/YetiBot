import type { Client, User } from "discord";
import type { UserProfile } from "../types/database.ts";
import { ChannelHelper } from "./channel-helper.ts";
import { DatabaseManager } from "./database-manager.ts";

class TagUtil {
	private static instance: TagUtil;
	private dbManager: DatabaseManager;
	private client: Client;

	private constructor(dbManager: DatabaseManager, client: Client) {
		this.dbManager = dbManager;
		this.client = client;
	}

	public static getInstance(
		dbManager: DatabaseManager,
		client: Client,
	): TagUtil {
		if (!TagUtil.instance) {
			TagUtil.instance = new TagUtil(dbManager, client);
		}
		return TagUtil.instance;
	}

	async tag(
		targetUser: User,
		taggerUser: User,
		channelId: string,
		guildId: string,
	): Promise<{ success: boolean; message: string }> {
		try {
			let gameState = await this.dbManager.getGameState(guildId);
			if (!gameState) {
				await this.dbManager.createGuildData(guildId);
				gameState = await this.dbManager.getGameState(guildId);
			}

			if (!gameState?.tag) {
				await this.startNewGame(guildId, targetUser.id);
				return {
					success: true,
					message: `🎮 New tag game started! ${targetUser.username} is now "it"!`,
				};
			}

			if (gameState.tag.currentIt === targetUser.id) {
				return {
					success: false,
					message: "You can't tag yourself!",
				};
			}

			if (gameState.tag.currentIt === taggerUser.id) {
				const scores = new Map(gameState.tag.scores);
				const currentScore = scores.get(taggerUser.id) || 0;
				scores.set(taggerUser.id, currentScore + 1);

				await this.dbManager.updateGameState(guildId, {
					tag: {
						currentIt: targetUser.id,
						gameStartTime: gameState.tag.gameStartTime,
						scores,
					},
					lastActivity: new Date(),
				});

				await this.dbManager.updateLeaderboard(
					guildId,
					"tag-scores",
					taggerUser.id,
					taggerUser.username,
					currentScore + 1,
				);

				await ChannelHelper.getInstance(this.client).sendToChannel(
					channelId,
					`🏷️ ${taggerUser.username} tagged ${targetUser.username}! +1 point!`,
				);

				return {
					success: true,
					message: `🏷️ You tagged ${targetUser.username}!`,
				};
			}

			return {
				success: false,
				message: "You're not the one who is it!",
			};
		} catch (error) {
			console.error(`Failed to tag user:`, error);
			return {
				success: false,
				message: "An error occurred. Please try again.",
			};
		}
	}

	private async startNewGame(guildId: string, firstIt: string): Promise<void> {
		await this.dbManager.updateGameState(guildId, {
			tag: {
				currentIt: firstIt,
				gameStartTime: new Date(),
				scores: new Map([[firstIt, 0]]),
			},
			lastActivity: new Date(),
		});
	}

	async getCurrentIt(guildId: string): Promise<UserProfile | null> {
		const gameState = await this.dbManager.getGameState(guildId);
		if (!gameState?.tag?.currentIt) return null;

		return await this.dbManager.getUserProfile(
			gameState.tag.currentIt,
			guildId,
		);
	}

	async getScores(guildId: string): Promise<Map<string, number>> {
		const gameState = await this.dbManager.getGameState(guildId);
		return gameState?.tag?.scores || new Map();
	}
}

let tagUtil: TagUtil;

export const initializeTagUtil = (client: Client) => {
	tagUtil = TagUtil.getInstance(DatabaseManager.getInstance(client), client);
};

export { TagUtil, tagUtil };
