require("dotenv").config();
const { SlashCommandBuilder, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");

const commands = [
  new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Pleased to meet you!"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_BOT_TOKEN
);

rest
  .put(
    Routes.applicationGuildCommands(
      process.env.DISCORD_APP_ID,
      process.env.DISCORD_GUILD_ID
    ),
    { body: commands }
  )
  .then((data) =>
    console.log(`Successfully registered ${data.length} application commands.`)
  )
  .catch(console.error);
