import { type CommandInteraction, SlashCommandBuilder } from "discord";
import { Command } from "../../command.ts";

class Give extends Command {
  public override get data(): SlashCommandBuilder {
    const command = new SlashCommandBuilder()
      .setName("give")
      .setDescription("Give someone the amulet");
    command.addUserOption((option) =>
      option.setName("target")
        .setDescription("Who deserves the amulet?")
        .setRequired(true)
    );
    return command;
  }

  public override async execute(
    interaction: CommandInteraction,
  ): Promise<void> {
    if (!interaction.isChatInputCommand()) {
      return;
    }
    await interaction.reply(
      `Giving ${interaction.options.getUser("target")} the amulet`,
    );
  }
}

export const command = new Give();
