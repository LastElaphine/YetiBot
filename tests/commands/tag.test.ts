import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";

const createMockInteraction = (overrides: Record<string, unknown> = {}) => ({
	commandName: "tag",
	user: {
		username: "tagger",
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
	deferReply: async () => ({}),
	editReply: async (_options: unknown) => ({}),
	reply: async (options: unknown) => {
		if (options && typeof options === "object") {
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

const mockReply = {
	content: "",
	flags: 0,
};

Deno.test("Tag command has correct name and description", async () => {
	const { command } = await import("../../commands/tag/tag.ts");

	assertEquals(command.data.name, "tag");
	assertEquals(command.data.description, "Tag someone in the game");
});

Deno.test("Tag command has target user option", async () => {
	const { command } = await import("../../commands/tag/tag.ts");

	const options = command.data.options;
	assertExists(options);
	assertEquals(options.length, 1);
	assertEquals(options[0]?.name, "target");
	assertEquals(options[0]?.description, "Who to tag?");
});

Deno.test("Tag command replies with error when no user specified", async () => {
	const { command } = await import("../../commands/tag/tag.ts");

	const interaction = createMockInteraction({
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
	});

	await command.execute(interaction as never);

	assertStringIncludes(mockReply.content, "specify a user");
});

Deno.test("Tag command replies with error when not in guild", async () => {
	const { command } = await import("../../commands/tag/tag.ts");

	const interaction = createMockInteraction({
		guildId: null,
		options: {
			getString: () => null,
			getInteger: () => null,
			getBoolean: () => null,
			getUser: () => ({ username: "targetuser", id: "222222222222222222" }),
			getChannel: () => null,
			getRole: () => null,
			getNumber: () => null,
			getSubcommand: () => null,
		},
	});

	await command.execute(interaction as never);

	assertStringIncludes(mockReply.content, "server");
});
