import { setTimeout } from "node:timers";
import type { User } from "discord";

class AmuletUtil {
	private static instance: AmuletUtil;

	private constructor() {}

	public static getInstance(): AmuletUtil {
		if (!AmuletUtil.instance) {
			AmuletUtil.instance = new AmuletUtil();
		}
		return AmuletUtil.instance;
	}

	private userId: string | null = null;
	// private amuletTimeout: NodeJS.Timeout | null = null;
	private static TIMEOUT_DURATION_MS = 1000;

	/*
	 * Attempts to give a user the amulet.
	 * @return true if susccessful
	 */
	public give(user: User): boolean {
		if (!this.userId) {
			this.userId = user.id;
			//this.amuletTimeout =
			setTimeout(
				() => this.clearAmulet(user.id),
				AmuletUtil.TIMEOUT_DURATION_MS,
			);
			return true;
		}
		return false;
	}

	private clearAmulet(userId: string): void {
		if (this.userId === userId) {
			console.log(`clearedAmulet for ${userId}`);
			this.userId = null;
		}
	}
}

const amuletUtil = AmuletUtil.getInstance();

export { amuletUtil };
