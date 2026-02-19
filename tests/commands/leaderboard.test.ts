import { assertEquals, assertExists } from "@std/assert";

Deno.test("Leaderboard command has correct name and description", async () => {
	const { command } = await import("../../commands/tag/leaderboard.ts");

	assertEquals(command.data.name, "leaderboard");
	assertEquals(command.data.description, "Shows the tag game leaderboard");
});

Deno.test("Leaderboard command has category option", async () => {
	const { command } = await import("../../commands/tag/leaderboard.ts");

	const options = command.data.options;
	assertExists(options);
	assertEquals(options.length, 1);
	assertEquals(options[0]?.name, "category");
	assertEquals(options[0]?.description, "Leaderboard category");
});

Deno.test("Leaderboard command has correct choices", async () => {
	const { command } = await import("../../commands/tag/leaderboard.ts");

	const options = command.data.options;
	const option = options[0];
	assertExists(option);
	assertEquals(option?.name, "category");

	const choices = (option as { choices?: unknown[] }).choices;
	assertExists(choices);
	assertEquals(choices?.length, 4);
});
