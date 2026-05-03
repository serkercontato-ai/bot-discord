require("dotenv").config();

const express = require("express");
const { Client, GatewayIntentBits, Events } = require("discord.js");

// ================= WEB =================
const app = express();

app.get("/", (req, res) => {
  res.send("Bot online!");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Servidor web rodando na porta ${PORT}`);
});

// ================= BOT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, () => {
  console.log(`🤖 LOGADO COMO: ${client.user.tag}`);
});

// ================= LOGIN =================
console.log("🔑 Tentando logar no Discord...");

client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log("✅ LOGIN REALIZADO COM SUCESSO");
  })
  .catch((err) => {
    console.log("❌ ERRO NO LOGIN:");
    console.log(err);
  });
