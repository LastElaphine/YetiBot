import { assertEquals } from "@std/assert";

Deno.test("Leaderboard command has correct name and description", async () => {
	const { command } = await import("../../commands/amulet/leaderboard.ts");

	assertEquals(command.data.name, "leaderboard");
	assertEquals(
		command.data.description,
		"Shows who has held the amulet the longest",
	);
});
