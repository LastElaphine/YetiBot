import { assertEquals } from "@std/assert";

const mockReply = {
	content: "",
	flags: 0,
};

const createMockInteraction = (overrides: Record<string, unknown> = {}) => ({
	commandName: "ping",
	user: {
		username: "testuser",
		id: "111111111111111111",
	},
	options: {
		getString: () => null,
		getInteger: () => null,
		getBoolean: () => null,
		getUser: () => null,
		getChannel: () => null,
		getRole: () => null,
		getNumber: () => null,
		getSubcommand: () => null,
	},
	reply: async (options: unknown) => {
		if (typeof options === "string") {
			mockReply.content = options;
		} else if (options && typeof options === "object") {
			const opts = options as { content?: string; flags?: number };
			if (opts.content) mockReply.content = opts.content;
			if (opts.flags) mockReply.flags = opts.flags;
		}
		return {} as never;
	},
	isChatInputCommand: () => true,
	isContextMenuCommand: () => false,
	isAutocomplete: () => false,
	isButton: () => false,
	isModalSubmit: () => false,
	isSelectMenu: () => false,
	getLocale: () => "en-US",
	getId: () => "mock-interaction-id",
	createdAt: new Date(),
	createdTimestamp: Date.now(),
	...overrides,
});

Deno.test("Ping command returns Pong!", async () => {
	const { command } = await import("../../commands/utility/ping.ts");
	const interaction = createMockInteraction();

	await command.execute(interaction as never);

	assertEquals(mockReply.content, "Pong!");
});

Deno.test("Ping command has correct name and description", async () => {
	const { command } = await import("../../commands/utility/ping.ts");

	assertEquals(command.data.name, "ping");
	assertEquals(command.data.description, "Replies with Pong!");
});
