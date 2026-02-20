import { assertEquals } from "@std/assert";
import {
	CATEGORIES,
	formatDuration,
	getCategoryConfig,
	getNextCategory,
	getPreviousCategory,
	getRankEmoji,
} from "../../utils/leaderboard-util.ts";

Deno.test("CATEGORIES has 4 categories", () => {
	assertEquals(CATEGORIES.length, 4);
});

Deno.test("Categories include time, count, passes, longest", () => {
	const keys = CATEGORIES.map((c) => c.key);
	assertEquals(keys.includes("time"), true);
	assertEquals(keys.includes("count"), true);
	assertEquals(keys.includes("passes"), true);
	assertEquals(keys.includes("longest"), true);
});

Deno.test("getCategoryConfig returns correct config for time", () => {
	const config = getCategoryConfig("time");
	assertEquals(config.key, "time");
	assertEquals(config.label, "Total Hold Time");
	assertEquals(config.sortDescending, true);
});

Deno.test("getNextCategory cycles correctly", () => {
	assertEquals(getNextCategory("time"), "count");
	assertEquals(getNextCategory("count"), "passes");
	assertEquals(getNextCategory("passes"), "longest");
	assertEquals(getNextCategory("longest"), "time");
});

Deno.test("getPreviousCategory cycles correctly", () => {
	assertEquals(getPreviousCategory("time"), "longest");
	assertEquals(getPreviousCategory("longest"), "passes");
	assertEquals(getPreviousCategory("passes"), "count");
	assertEquals(getPreviousCategory("count"), "time");
});

Deno.test("getRankEmoji returns correct emojis for top 3", () => {
	assertEquals(getRankEmoji(1), "🥇");
	assertEquals(getRankEmoji(2), "🥈");
	assertEquals(getRankEmoji(3), "🥉");
});

Deno.test("getRankEmoji returns rank number for 4+", () => {
	assertEquals(getRankEmoji(4), "#4");
	assertEquals(getRankEmoji(10), "#10");
});

Deno.test("formatDuration formats correctly", () => {
	assertEquals(formatDuration(0), "0s");
	assertEquals(formatDuration(5000), "5s");
	assertEquals(formatDuration(60000), "1m 0s");
	assertEquals(formatDuration(90000), "1m 30s");
	assertEquals(formatDuration(3600000), "1h 0m");
	assertEquals(formatDuration(3660000), "1h 1m");
	assertEquals(formatDuration(86400000), "1d 0h");
	assertEquals(formatDuration(90000000), "1d 1h");
});

Deno.test("Each category has unique color", () => {
	const colors = CATEGORIES.map((c) => c.color);
	const uniqueColors = new Set(colors);
	assertEquals(uniqueColors.size, colors.length);
});
