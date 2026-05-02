require("dotenv").config();

const express = require("express");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionsBitField,
  Events,
  AttachmentBuilder,
} = require("discord.js");

// ===== WEB SERVER (Render) =====
const app = express();

app.get("/", (req, res) => {
  res.send("Purple Store online!");
});

app.get("/status", (req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Purple Store web ligada na porta ${PORT}`);
});

// ===== DISCORD BOT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const verificacoes = new Map();

client.once(Events.ClientReady, () => {
  console.log(`✅ Purple Store logado como ${client.user.tag}`);
});

// ===== FUNÇÕES =====
function gerarCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  for (let i = 0; i < 4; i++) {
    codigo += letras[Math.floor(Math.random() * letras.length)];
  }
  return codigo;
}

function gerarOpcoes(codigoCorreto) {
  const opcoes = new Set([codigoCorreto]);
  while (opcoes.size < 4) opcoes.add(gerarCodigo());
  return [...opcoes].sort(() => Math.random() - 0.5);
}

// ===== EVENTOS =====
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "verificacao") {
        const embed = new EmbedBuilder()
          .setTitle("🔐 Sistema de Verificação")
          .setDescription(
            "Clique no botão abaixo para verificar sua conta."
          )
          .setColor("#7d3cff");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("iniciar_verificacao")
            .setLabel("Verificar")
            .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({ embeds: [embed], components: [row] });
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "iniciar_verificacao") {
        const codigo = gerarCodigo();
        const opcoes = gerarOpcoes(codigo);

        verificacoes.set(interaction.user.id, codigo);

        const embed = new EmbedBuilder()
          .setTitle("🔐 Confirme o código")
          .setDescription(`Código: **${codigo}**`)
          .setColor("#7d3cff");

        const row = new ActionRowBuilder().addComponents(
          ...opcoes.map((opcao) =>
            new ButtonBuilder()
              .setCustomId(`verificar_${opcao}`)
              .setLabel(opcao)
              .setStyle(ButtonStyle.Secondary)
          )
        );

        return interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true,
        });
      }

      if (interaction.customId.startsWith("verificar_")) {
        const escolhido = interaction.customId.replace("verificar_", "");
        const correto = verificacoes.get(interaction.user.id);

        if (escolhido !== correto) {
          return interaction.reply({
            content: "❌ Código errado.",
            ephemeral: true,
          });
        }

        const cargo = await interaction.guild.roles.fetch(
          process.env.VERIFICADO_ROLE_ID
        );

        await interaction.member.roles.add(cargo);

        return interaction.reply({
          content: "✅ Verificado!",
          ephemeral: true,
        });
      }
    }
  } catch (err) {
    console.log("ERRO:", err);
  }
});

// ===== LOGIN COM RECONEXÃO =====
async function iniciarBot() {
  if (!process.env.DISCORD_TOKEN) {
    console.log("❌ TOKEN NÃO ENCONTRADO");
    return;
  }

  try {
    console.log("🔑 Tentando logar...");
    await client.login(process.env.DISCORD_TOKEN);
    console.log("🤖 BOT LOGADO COM SUCESSO");
  } catch (err) {
    console.log("❌ ERRO AO LOGAR, tentando novamente em 5s...");
    setTimeout(iniciarBot, 5000);
  }
}

iniciarBot();
