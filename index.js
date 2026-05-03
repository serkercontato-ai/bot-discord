require("dotenv").config();

const express = require("express");
const {
  Client,
  GatewayIntentBits,
  Events,
} = require("discord.js");

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

// DEBUG TOKEN
console.log("🔍 TOKEN existe?", !!process.env.DISCORD_TOKEN);
console.log("🔍 TOKEN começo:", process.env.DISCORD_TOKEN?.slice(0, 10));

// EVENTOS
client.once(Events.ClientReady, () => {
  console.log(`🤖 LOGADO COMO: ${client.user.tag}`);
});

client.on("error", (err) => {
  console.log("❌ ERRO NO CLIENT:");
  console.log(err);
});

client.on("shardError", (err) => {
  console.log("❌ ERRO DE SHARD:");
  console.log(err);
});

process.on("unhandledRejection", (err) => {
  console.log("❌ ERRO NÃO TRATADO:");
  console.log(err);
});

// ================= LOGIN =================
console.log("🔑 Tentando logar no Discord...");

client.login(process.env.DISCORD_TOKEN?.trim());
