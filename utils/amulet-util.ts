import { clearTimeout, setTimeout } from "node:timers";
import type { User } from "discord";
import type { UserProfile } from "../types/database.ts";
import { ChannelHelper } from "./channel-helper.ts";
import { DatabaseManager } from "./database-manager.ts";

class AmuletUtil {
	private static instance: AmuletUtil;
	private dbManager: DatabaseManager;
	private timeouts: Map<string, number> = new Map(); // guildId -> timeoutId

	private constructor(dbManager: DatabaseManager) {
		this.dbManager = dbManager;
	}

	public static getInstance(dbManager: DatabaseManager): AmuletUtil {
		if (!AmuletUtil.instance) {
			AmuletUtil.instance = new AmuletUtil(dbManager);
		}
		return AmuletUtil.instance;
	}

	async give(user: User, channelId: string, guildId: string): Promise<boolean> {
		try {
			let gameState = await this.dbManager.getGameState(guildId);
			if (!gameState) {
				// Create guild data if it doesn't exist
				await this.dbManager.createGuildData(guildId);
				gameState = await this.dbManager.getGameState(guildId);
			}

			// Check if amulet is currently held
			if (gameState?.amulet.currentHolder) {
				return false; // Amulet is already held
			}

			// Clear existing timeout for this guild
			const existingTimeout = this.timeouts.get(guildId);
			if (existingTimeout) {
				clearTimeout(existingTimeout);
			}

			// Update game state
			const transferRecord = {
				fromUserId: gameState?.amulet.currentHolder || null,
				toUserId: user.id,
				transferredAt: new Date(),
				channelId,
			};

			await this.dbManager.updateGameState(guildId, {
				amulet: {
					...gameState!.amulet,
					currentHolder: user.id,
					channelId,
					lastTransferred: new Date(),
					transferHistory: [
						...(gameState?.amulet.transferHistory || []),
						transferRecord,
					],
				},
				lastActivity: new Date(),
			});

			// Update user stats
			let userProfile = await this.dbManager.getUserProfile(user.id, guildId);
			if (!userProfile) {
				userProfile = await this.dbManager.createOrUpdateUserProfile(
					user.id,
					guildId,
					{
						lastSeen: new Date(),
					},
				);
			}

			await this.dbManager.createOrUpdateUserProfile(user.id, guildId, {
				stats: {
					...userProfile.stats,
					amuletHeldCount: userProfile.stats.amuletHeldCount + 1,
				},
			});

			// Set new timeout using number ID
			const timeoutMs =
				gameState?.settings.amuletTimeoutMs ||
				gameState?.amulet.timeoutMs ||
				60000;
			const timeoutId = setTimeout(
				() => this.clearAmulet(user.id, channelId, guildId),
				timeoutMs,
			) as unknown as number;
			this.timeouts.set(guildId, timeoutId);

			return true;
		} catch (error) {
			console.error(`Failed to give amulet to user ${user.id}:`, error);
			return false;
		}
	}

	private async clearAmulet(
		userId: string,
		channelId: string,
		guildId: string,
	): Promise<void> {
		try {
			const userProfile = await this.dbManager.getUserProfile(userId, guildId);
			if (!userProfile) return;

			const gameState = await this.dbManager.getGameState(guildId);
			if (!gameState?.amulet.lastTransferred) return;

			// Calculate time held
			const timeHeld = Date.now() - gameState.amulet.lastTransferred.getTime();

			// Update user stats
			await this.dbManager.createOrUpdateUserProfile(userId, guildId, {
				stats: {
					...userProfile.stats,
					amuletHeldTimeMs: userProfile.stats.amuletHeldTimeMs + timeHeld,
				},
			});

			// Update leaderboard
			const username = userProfile.displayName || userProfile.username;
			await this.dbManager.updateLeaderboard(
				guildId,
				"amulet-time",
				userId,
				username,
				userProfile.stats.amuletHeldTimeMs + timeHeld,
			);

			// Clear game state
			await this.dbManager.updateGameState(guildId, {
				amulet: {
					...gameState.amulet,
					currentHolder: null,
					channelId: null,
				},
				lastActivity: new Date(),
			});

			this.timeouts.delete(guildId);

			// Notify channel about timeout
			await ChannelHelper.getInstance((globalThis as any).client).sendToChannel(
				channelId,
				`${userProfile.displayName || userProfile.username} has lost the amulet! It's now available for anyone to claim.`,
			);
		} catch (error) {
			console.error(`Failed to clear amulet for user ${userId}:`, error);
		}
	}

	async getCurrentHolder(guildId: string): Promise<UserProfile | null> {
		const gameState = await this.dbManager.getGameState(guildId);
		if (!gameState?.amulet.currentHolder) return null;

		return await this.dbManager.getUserProfile(
			gameState.amulet.currentHolder,
			guildId,
		);
	}
}

let amuletUtil: AmuletUtil;

export const initializeAmuletUtil = (client: any) => {
	amuletUtil = AmuletUtil.getInstance(DatabaseManager.getInstance(client));
};

export { AmuletUtil, amuletUtil };
