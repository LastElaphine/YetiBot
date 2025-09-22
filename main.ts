import { Client, Events, GatewayIntentBits } from "discord";
import config from "./config.json" with { type: "json" };

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(config.token);
