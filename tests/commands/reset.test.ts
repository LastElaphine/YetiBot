import { assertEquals } from "@std/assert";

Deno.test("Reset command has correct name and description", async () => {
	const { command } = await import("../../commands/amulet/reset.ts");

	assertEquals(command.data.name, "reset");
	assertEquals(
		command.data.description,
		"Force reset the amulet - removes it from current holder",
	);
});
