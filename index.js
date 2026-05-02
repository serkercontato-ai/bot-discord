require("dotenv").config();

const express = require("express");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
} = require("discord.js");

// ===== CONFIGURAÇÃO DO BOT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Essencial para dar cargos
  ],
});

const verificacoes = new Map();

// ===== SERVIDOR WEB (RENDER) =====
const app = express();
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("Purple Store online!");
});

// ===== FUNÇÕES DE VERIFICAÇÃO =====
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
client.once(Events.ClientReady, () => {
  console.log(`✅ Purple Store logado como ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Comando /verificacao
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "verificacao") {
        const embed = new EmbedBuilder()
          .setTitle("🔐 Sistema de Verificação")
          .setDescription("Clique no botão abaixo para verificar sua conta na **Purple Store**.")
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

    // Lógica dos Botões
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

        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }

      if (interaction.customId.startsWith("verificar_")) {
        const escolhido = interaction.customId.replace("verificar_", "");
        const correto = verificacoes.get(interaction.user.id);

        if (escolhido !== correto) {
          return interaction.reply({ content: "❌ Código errado.", ephemeral: true });
        }

        const cargoId = process.env.VERIFICADO_ROLE_ID;
        const cargo = interaction.guild.roles.cache.get(cargoId);

        if (!cargo) {
          return interaction.reply({ content: "❌ Cargo não encontrado. Verifique o ID no Render.", ephemeral: true });
        }

        await interaction.member.roles.add(cargo);
        return interaction.reply({ content: "✅ Verificado!", ephemeral: true });
      }
    }
  } catch (err) {
    console.error("ERRO:", err);
  }
});

// ===== INICIALIZAÇÃO (ORDEM CORRETA PARA O RENDER) =====
const ligarTudo = async () => {
  try {
    console.log("🔑 Tentando logar bot...");
    await client.login(process.env.DISCORD_TOKEN);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🌐 Web rodando na porta ${PORT}`);
      console.log("🤖 Purple Store pronta para uso.");
    });
  } catch (err) {
    console.error("❌ Falha crítica ao iniciar:");
    console.error(err);
    setTimeout(ligarTudo, 10000); // Tenta reconectar se o Render oscilar
  }
};

ligarTudo();
