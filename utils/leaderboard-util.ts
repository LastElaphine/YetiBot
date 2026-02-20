import type { UserProfile } from "../types/database.ts";

export type LeaderboardCategory = "time" | "count" | "passes" | "longest";

export interface CategoryConfig {
	key: LeaderboardCategory;
	label: string;
	description: string;
	color: number;
	sortDescending: boolean;
	getValue: (stats: UserProfile["stats"]) => number;
	formatValue: (value: number) => string;
}

export const CATEGORIES: CategoryConfig[] = [
	{
		key: "time",
		label: "Total Hold Time",
		description: "Who has held the amulet the longest",
		color: 0x9b59b6,
		sortDescending: true,
		getValue: (stats) => stats.amuletHeldTimeMs,
		formatValue: formatDuration,
	},
	{
		key: "count",
		label: "Hold Count",
		description: "Who has held the amulet the most times",
		color: 0x3498db,
		sortDescending: true,
		getValue: (stats) => stats.amuletHeldCount,
		formatValue: (v) => `${v} time${v === 1 ? "" : "s"}`,
	},
	{
		key: "passes",
		label: "Passes Given",
		description: "Who has passed the amulet to others the most",
		color: 0x2ecc71,
		sortDescending: true,
		getValue: (stats) => stats.passesGiven,
		formatValue: (v) => `${v} pass${v === 1 ? "" : "es"}`,
	},
	{
		key: "longest",
		label: "Longest Hold",
		description: "Who has held the amulet the longest in one go",
		color: 0xe74c3c,
		sortDescending: true,
		getValue: (stats) => stats.longestHoldTimeMs,
		formatValue: formatDuration,
	},
];

export function getCategoryConfig(
	category: LeaderboardCategory,
): CategoryConfig {
	return CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];
}

export function getCategoryIndex(category: LeaderboardCategory): number {
	return CATEGORIES.findIndex((c) => c.key === category);
}

export function getNextCategory(
	current: LeaderboardCategory,
): LeaderboardCategory {
	const idx = getCategoryIndex(current);
	return CATEGORIES[(idx + 1) % CATEGORIES.length].key;
}

export function getPreviousCategory(
	current: LeaderboardCategory,
): LeaderboardCategory {
	const idx = getCategoryIndex(current);
	return CATEGORIES[(idx - 1 + CATEGORIES.length) % CATEGORIES.length].key;
}

export function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) {
		return `${days}d ${hours % 24}h`;
	}
	if (hours > 0) {
		return `${hours}h ${minutes % 60}m`;
	}
	if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	}
	return `${seconds}s`;
}

export function getRankEmoji(rank: number): string {
	switch (rank) {
		case 1:
			return "🥇";
		case 2:
			return "🥈";
		case 3:
			return "🥉";
		default:
			return `#${rank}`;
	}
}

export function getRankColor(rank: number): number {
	switch (rank) {
		case 1:
			return 0xffd700;
		case 2:
			return 0xc0c0c0;
		case 3:
			return 0xcd7f32;
		default:
			return 0xffffff;
	}
}
