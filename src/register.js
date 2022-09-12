require("dotenv").config();
const { SlashCommandBuilder, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");

const { DISCORD_BOT_TOKEN, DISCORD_APP_ID, DISCORD_GUILD_ID } = process.env;

const commands = {
  global: [
    new SlashCommandBuilder().setName("ping").setDescription("Pong!"),
  ].map((command) => command.toJSON()),
  guild: [
    new SlashCommandBuilder()
      .setName("hello")
      .setDescription("Pleased to meet you!"),
  ].map((command) => command.toJSON()),
};

const rest = new REST({ version: "10" }).setToken(DISCORD_BOT_TOKEN);

rest
  .put(Routes.applicationCommands(DISCORD_APP_ID), {
    body: commands.global,
  })
  .then((data) =>
    console.log(
      `Successfully registered ${data.length} global application commands, it may take a while to update on Discord.`
    )
  )
  .catch(console.error);

rest
  .put(Routes.applicationGuildCommands(DISCORD_APP_ID, DISCORD_GUILD_ID), {
    body: commands.guild,
  })
  .then((data) =>
    console.log(
      `Successfully registered ${data.length} guild application commands for ${data[0].guild_id}.`
    )
  )
  .catch(console.error);
