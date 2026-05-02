require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("verificacao")
    .setDescription("Painel de verificação"),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Painel de atendimento"),

  new SlashCommandBuilder()
    .setName("pagamentos")
    .setDescription("Enviar painel de pagamentos"),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("✅ Comandos atualizados");
  } catch (err) {
    console.log(err);
  }
})();