const {
  Client: DiscordClient,
  GatewayIntentBits: DiscordClientIntents,
} = require("discord.js");
const {
  InteractionType,
  InteractionResponseType,
  verifyKey,
} = require("discord-interactions");

exports.handler = async (event) => {
  try {
    const isValidRequest = await verifyKey(
      event.body,
      event.headers["x-signature-ed25519"],
      event.headers["x-signature-timestamp"],
      process.env.DISCORD_PUBLIC_KEY
    );

    if (!isValidRequest) {
      return {
        statusCode: 401,
        body: "Bad request signature",
      };
    }

    const interaction = JSON.parse(event.body);
    if (
      interaction &&
      interaction.type === InteractionType.APPLICATION_COMMAND
    ) {
      switch (interaction.data.name) {
        case "ping":
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Pong!",
              },
            }),
          };
        case "hello":
          const Discord = new DiscordClient({
            intents: [DiscordClientIntents.Guilds],
          });
          await Discord.login(process.env.DISCORD_BOT_TOKEN);

          const member_username = interaction.member.user.username;
          const client_username = Discord.user.username;

          await Discord.destroy();

          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Hello, ${member_username}! My name is ${client_username}, and I have been freed from my cage! 🎉`,
              },
            }),
          };
        default:
          return {
            statusCode: 404,
            body: "Unknown interaction command",
          };
      }
    } else {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: InteractionResponseType.PONG,
        }),
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
