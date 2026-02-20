import { assertEquals } from "@std/assert";

Deno.test("Leaderboard command has correct name and description", async () => {
	const { command } = await import("../../commands/amulet/leaderboard.ts");

	assertEquals(command.data.name, "leaderboard");
	assertEquals(command.data.description, "Shows amulet leaderboard stats");
});

Deno.test("Leaderboard command has category option", async () => {
	const { command } = await import("../../commands/amulet/leaderboard.ts");

	const options = command.data.options;
	const categoryOption = options?.find((opt) => opt.name === "category");
	assertEquals(categoryOption?.name, "category");
	assertEquals(categoryOption?.description, "Which leaderboard to show");
});
