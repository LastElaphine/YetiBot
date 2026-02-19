import type {
	Guild,
	GuildMember,
	MessagePayload,
	Role,
	Snowflake,
	TextBasedChannel,
	User,
} from "discord.js";
import { Collection } from "discord.js";

export class MockUser implements User {
	public readonly id: string;
	public readonly username: string;
	public readonly discriminator: string;
	public readonly avatar: string | null;
	public readonly bot: boolean;

	constructor(options: { id?: string; username?: string; bot?: boolean } = {}) {
		this.id = options.id ?? "111111111111111111";
		this.username = options.username ?? "testuser";
		this.discriminator = "0001";
		this.avatar = null;
		this.bot = options.bot ?? false;
	}

	public displayName(): string {
		return this.username;
	}

	public toString(): string {
		return `<@${this.id}>`;
	}

	public dmChannel: unknown = null;
	public flags: unknown = null;
	public system: boolean = false;
	public ticker: unknown = null;

	async fetch(_force?: boolean): Promise<User> {
		return this;
	}
}

export class MockGuildMember implements GuildMember {
	public readonly id: string;
	public readonly user: User | null;
	public readonly guild: Guild;
	public readonly nickname: string | null;
	public readonly roles: Collection<Snowflake, Role>;
	public readonly joinedAt: Date | null;
	public readonly pending: boolean;

	constructor(
		guild: Guild,
		options: { id?: string; username?: string; nickname?: string } = {},
	) {
		this.id = options.id ?? "111111111111111111";
		this.user = new MockUser({
			id: this.id,
			username: options.username ?? "testuser",
		});
		this.guild = guild;
		this.nickname = options.nickname ?? null;
		this.roles = new Collection();
		this.joinedAt = new Date();
		this.pending = false;
	}

	public displayName(): string {
		return this.nickname ?? this.user?.username ?? "Unknown";
	}

	public toString(): string {
		return `<@${this.id}>`;
	}

	public avatarDecoration: unknown = null;
	public communicationDisabledUntil: unknown = null;
	public flags: unknown = null;
	public isCommunicationDisabled: boolean = false;
	public isPending: boolean = false;
	public manager: unknown = null;
	public permissions: unknown = new Set();

	async fetch(_force?: boolean): Promise<GuildMember> {
		return this;
	}
}

export class MockGuild implements Guild {
	public readonly id: string;
	public readonly name: string;
	public readonly icon: string | null;

	constructor(options: { id?: string; name?: string } = {}) {
		this.id = options.id ?? "123456789012345678";
		this.name = options.name ?? "Test Guild";
		this.icon = null;
	}

	public get nameAcronym(): string {
		return this.name
			.split(" ")
			.map((w) => w[0])
			.join("");
	}

	public get createdAt(): Date {
		return new Date("2024-01-01");
	}

	public get memberCount(): number {
		return 10;
	}

	public get presenceCache(): Collection<Snowflake, unknown> {
		return new Collection();
	}

	public get voiceStates(): Collection<Snowflake, unknown> {
		return new Collection();
	}

	public iconURL(_options?: unknown): string | null {
		return null;
	}

	public toString(): string {
		return this.name;
	}

	public members: Collection<Snowflake, GuildMember> = new Collection();
	public channels: Collection<Snowflake, TextBasedChannel> = new Collection();
	public roles: Collection<Snowflake, Role> = new Collection();
	public emojis: Collection<Snowflake, unknown> = new Collection();
	public stickers: Collection<Snowflake, unknown> = new Collection();
	public shards: unknown = null;
	public status: unknown = null;

	async fetch(_options?: unknown): Promise<Guild> {
		return this;
	}
}

export class MockTextChannel implements TextBasedChannel {
	public readonly id: string;
	public readonly type: number;
	public readonly guild: Guild | null;
	public readonly name: string;

	constructor(
		guild: Guild | null = null,
		options: { id?: string; name?: string } = {},
	) {
		this.id = options.id ?? "999999999999999999";
		this.type = 0;
		this.guild = guild;
		this.name = options.name ?? "test-channel";
	}

	public get url(): string {
		return `https://discord.com/channels/${this.guild?.id ?? "@me"}/${this.id}`;
	}

	public send(_options: string | MessagePayload | unknown): unknown {
		return Promise.resolve({});
	}

	public lastMessage: unknown = null;
	public lastMessageId: Snowflake | null = null;
	public messages: unknown = { cache: new Collection() };
	public nsfw: boolean = false;
	public topic: string | null = null;
	public rateLimitPerUser: number = 0;
	public parentId: Snowflake | null = null;
	public defaultReactionEmoji: unknown = null;
	public defaultThreadRateLimitPerUser: number = 0;
	public defaultAutoArchiveDuration: unknown = null;
	public rtcRegion: unknown = null;
	public videoQualityMode: unknown = null;
	public isSendable: boolean = true;
	public isTextBased: boolean = true;
	public availableTags: unknown = [];
	public setName(_name: string): Promise<this> {
		return Promise.resolve(this as this);
	}
	public setTopic(_topic: string): Promise<this> {
		return Promise.resolve(this as this);
	}

	async fetch(): Promise<unknown> {
		return this;
	}
}

export class MockRole implements Role {
	public readonly id: string;
	public readonly name: string;
	public readonly guild: Guild;
	public readonly color: number;
	public readonly hoist: boolean;
	public readonly position: number;

	constructor(
		guild: Guild,
		options: { id?: string; name?: string; color?: number } = {},
	) {
		this.id = options.id ?? "555555555555555555";
		this.name = options.name ?? "Test Role";
		this.guild = guild;
		this.color = 0;
		this.hoist = false;
		this.position = 0;
	}

	public toString(): string {
		return `<@&${this.id}>`;
	}

	public readonly permissions: unknown = new Set();
	public readonly managed: boolean = false;
	public readonly editable: boolean = true;
	public readonly tags: unknown = null;

	async fetch(): Promise<Role> {
		return this;
	}
}

export function createMockCommandInteraction(
	overrides: Partial<{
		commandName: string;
		userId: string;
		guildId: string;
		channelId: string;
	}> = {},
) {
	const guild = new MockGuild({
		id: overrides.guildId ?? "123456789012345678",
	});
	const channel = new MockTextChannel(guild, {
		id: overrides.channelId ?? "999999999999999999",
	});
	const user = new MockUser({ id: overrides.userId ?? "111111111111111111" });

	return {
		commandName: overrides.commandName ?? "test",
		user,
		guild,
		channel,
		member: new MockGuildMember(guild, {
			id: user.id,
			username: user.username,
		}),
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
			console.log("Mock reply:", options);
			return {};
		},
		followUp: async (options: unknown) => {
			console.log("Mock followUp:", options);
			return {};
		},
		deferReply: async (options?: unknown) => {
			console.log("Mock deferReply:", options);
			return {};
		},
		editReply: async (options: unknown) => {
			console.log("Mock editReply:", options);
			return {};
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
	};
}

export const discordMocks = {
	user: MockUser,
	guildMember: MockGuildMember,
	guild: MockGuild,
	channel: MockTextChannel,
	role: MockRole,
	createCommandInteraction: createMockCommandInteraction,
};
