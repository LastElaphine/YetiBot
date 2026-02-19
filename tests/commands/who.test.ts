import { assertEquals, assertExists } from "@std/assert";

Deno.test("Who command has correct name and description", async () => {
	const { command } = await import("../../commands/amulet/who.ts");

	assertEquals(command.data.name, "who");
	assertEquals(command.data.description, "Shows who currently has the amulet");
});

Deno.test("Who command has no options", async () => {
	const { command } = await import("../../commands/amulet/who.ts");

	const options = command.data.options;
	assertExists(options);
	assertEquals(options.length, 0);
});
