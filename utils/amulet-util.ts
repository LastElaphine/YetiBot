import { clearTimeout, setTimeout } from "node:timers";
import type { Client, User } from "discord";
import type { UserProfile } from "../types/database.ts";
import { ChannelHelper } from "./channel-helper.ts";
import { DatabaseManager } from "./database-manager.ts";
import { logger } from "./logger.ts";

const BEADS_EMOJI = "📿";
const BEADS_ROLE_NAME = "beads";

class AmuletUtil {
	private static instance: AmuletUtil;
	private dbManager: DatabaseManager;
	private client: Client;
	private timeouts: Map<string, number> = new Map();

	private constructor(dbManager: DatabaseManager, client: Client) {
		this.dbManager = dbManager;
		this.client = client;
	}

	public static getInstance(
		dbManager: DatabaseManager,
		client: Client,
	): AmuletUtil {
		if (!AmuletUtil.instance) {
			AmuletUtil.instance = new AmuletUtil(dbManager, client);
		}
		return AmuletUtil.instance;
	}

	async give(user: User, channelId: string, guildId: string): Promise<boolean> {
		try {
			let gameState = await this.dbManager.getGameState(guildId);
			if (!gameState) {
				await this.dbManager.createGuildData(guildId);
				gameState = await this.dbManager.getGameState(guildId);
			}

			if (!gameState) {
				console.error("Failed to get game state after creation");
				return false;
			}

			const amuletState = gameState.amulet || {
				currentHolder: null,
				channelId: null,
				timeoutMs: 60000,
				lastTransferred: new Date(),
				transferHistory: [],
			};

			if (amuletState.currentHolder) {
				return false;
			}

			// Clear existing timeout for this guild
			const existingTimeout = this.timeouts.get(guildId);
			if (existingTimeout) {
				clearTimeout(existingTimeout);
			}

			// Update game state
			const transferRecord = {
				fromUserId: amuletState.currentHolder || null,
				toUserId: user.id,
				transferredAt: new Date(),
				channelId,
			};

			await this.dbManager.updateGameState(guildId, {
				amulet: {
					...amuletState,
					currentHolder: user.id,
					channelId,
					lastTransferred: new Date(),
					transferHistory: [...amuletState.transferHistory, transferRecord],
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
				gameState.settings?.amuletTimeoutMs || amuletState.timeoutMs || 60000;
			const timeoutId = setTimeout(
				() => this.clearAmulet(user.id, channelId, guildId),
				timeoutMs,
			) as unknown as number;
			this.timeouts.set(guildId, timeoutId);

			// Update nickname and role
			await this.updateHolderStatus(user.id, guildId);

			return true;
		} catch (error) {
			logger.error(`Failed to give amulet to user ${user.id}`, {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				userId: user.id,
				guildId,
			});
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

			// Clear nickname and role
			await this.clearHolderStatus(userId, guildId);

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

			await ChannelHelper.getInstance(this.client).sendToChannel(
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

	private async updateHolderStatus(
		userId: string,
		guildId: string,
	): Promise<void> {
		const guild = this.client.guilds.cache.get(guildId);
		if (!guild) return;

		const member = await guild.members.fetch(userId);
		if (!member) return;

		try {
			const role =
				guild.roles.cache.find((r) => r.name === BEADS_ROLE_NAME) ||
				(await guild.roles.create({
					name: BEADS_ROLE_NAME,
					reason: "Role for amulet holder",
				}));

			await member.roles.add(role);

			if (!member.nickname?.startsWith(BEADS_EMOJI)) {
				await member.setNickname(
					`${BEADS_EMOJI} ${member.nickname || member.user.username}`,
				);
			}
		} catch (error) {
			console.error("Failed to update holder status:", error);
		}
	}

	private async clearHolderStatus(
		userId: string,
		guildId: string,
	): Promise<void> {
		const guild = this.client.guilds.cache.get(guildId);
		if (!guild) return;

		const member = await guild.members.fetch(userId);
		if (!member) return;

		try {
			const role = guild.roles.cache.find((r) => r.name === BEADS_ROLE_NAME);
			if (role) {
				await member.roles.remove(role);
			}

			if (member.nickname?.startsWith(BEADS_EMOJI)) {
				const newNickname = member.nickname.slice(BEADS_EMOJI.length + 1);
				await member.setNickname(newNickname || null);
			}
		} catch (error) {
			console.error("Failed to clear holder status:", error);
		}
	}
}

let amuletUtil: AmuletUtil;

export const initializeAmuletUtil = (client: Client) => {
	amuletUtil = AmuletUtil.getInstance(
		DatabaseManager.getInstance(client),
		client,
	);
};

export { AmuletUtil, amuletUtil };
