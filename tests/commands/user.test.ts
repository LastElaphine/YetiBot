import { assertEquals } from "@std/assert";

Deno.test("User command has correct name and description", async () => {
	const { command } = await import("../../commands/utility/user.ts");

	assertEquals(command.data.name, "user");
	assertEquals(
		command.data.description,
		"Provides information about the user.",
	);
});
