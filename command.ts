import { readdir } from "node:fs/promises";
import path from "node:path";
import {
	Collection,
	type CommandInteraction,
	type SlashCommandBuilder,
} from "discord";

export abstract class Command {
	public abstract get data(): SlashCommandBuilder;
	public abstract execute(interaction: CommandInteraction): Promise<void>;
}

export const loadCommands = async () => {
	const commands = new Collection();
	const foldersPath = path.join(import.meta.dirname || "", "commands");
	const commandFolders = await readdir(foldersPath);

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = (await readdir(commandsPath)).filter((file) =>
			file.endsWith(".ts"),
		);

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const commandModule = await import(filePath);
			const command: Command = commandModule.command as Command;
			if (command instanceof Command) {
				commands.set(command.data.name, command);
			} else {
				console.warn(
					`[WARN] The file at ${filePath} does not export a valid command!`,
				);
			}
		}
	}
	return commands;
};
