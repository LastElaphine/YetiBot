import type { Channel, Client, User } from "discord";

export class ChannelHelper {
	private static instance: ChannelHelper;
	client: Client;

	constructor(client: Client) {
		this.client = client;
	}

	public static getInstance(client: Client): ChannelHelper {
		if (ChannelHelper.instance === null) {
			ChannelHelper.instance = new ChannelHelper(client);
		}
		return ChannelHelper.instance;
	}

	public async getUser(userId: string): Promise<User | null> {
		try {
			return await this.client.users.fetch(userId, { force: true });
		} catch (error) {
			console.error(`Failed to fetch user=${userId}.`, error);
			return null;
		}
	}

	public async getChannel(channelId: string): Promise<Channel | null> {
		try {
			return await this.client.channels.fetch(channelId, { force: true });
		} catch (error) {
			console.error(`Failed to fetch channel=${channelId}.`, error);
			return null;
		}
	}

	public async sendToChannel(channelId: string, content: string) {
		const channel = await this.getChannel(channelId);

		if (channel && channel.isSendable()) {
			try {
				await channel.send(content);
			} catch (error) {
				console.error(
					`Failed to send message=${content} to channelId=${channelId}.`,
					error,
				);
			}
		}
	}
}
