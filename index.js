require("dotenv").config();

const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

// ===== WEB SERVER (Render + Uptime) =====
const app = express();

app.get("/", (req, res) => {
  res.send("OK");
});

app.get("/status", (req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Web OK na porta " + PORT);
});

// ===== DISCORD BOT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Verificação de token
if (!process.env.DISCORD_TOKEN) {
  console.log("❌ TOKEN NÃO ENCONTRADO nas variáveis de ambiente!");
} else {
  console.log("🔑 TOKEN DETECTADO, tentando logar...");

  client.login(process.env.DISCORD_TOKEN)
    .then(() => {
      console.log("🤖 BOT LOGADO COM SUCESSO");
    })
    .catch((err) => {
      console.log("❌ ERRO AO LOGAR:");
      console.log(err);
    });
}

// Evento quando o bot fica online
client.once("ready", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});
