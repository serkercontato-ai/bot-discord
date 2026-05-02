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

// ===== WEB SERVER (Para manter o Render ativo) =====
const app = express();
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("Purple Store online!");
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor Web rodando na porta ${PORT}`);
});

// ===== DISCORD BOT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Necessário para gerenciar cargos
  ],
});

const verificacoes = new Map();

client.once(Events.ClientReady, () => {
  console.log(`✅ Logado como ${client.user.tag}`);
  client.user.setActivity('Purple Store');
});

// ===== FUNÇÕES AUXILIARES =====
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

// ===== TRATAMENTO DE INTERAÇÕES =====
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // 1. Comandos de Barra (Slash Commands)
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "verificacao") {
        const embed = new EmbedBuilder()
          .setTitle("🔐 Sistema de Verificação")
          .setDescription("Clique no botão abaixo para iniciar sua verificação na **Purple Store**.")
          .setColor("#7d3cff");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("iniciar_verificacao")
            .setLabel("Verificar")
            .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
      }
      
      // Adicione aqui a lógica para /ticket e /pagamentos se desejar futuramente
    }

    // 2. Botões
    if (interaction.isButton()) {
      // Iniciar processo
      if (interaction.customId === "iniciar_verificacao") {
        const codigo = gerarCodigo();
        const opcoes = gerarOpcoes(codigo);

        verificacoes.set(interaction.user.id, codigo);

        const embed = new EmbedBuilder()
          .setTitle("🔐 Confirme o código")
          .setDescription(`Selecione o código correspondente: **${codigo}**`)
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

      // Validar código selecionado
      if (interaction.customId.startsWith("verificar_")) {
        const escolhido = interaction.customId.replace("verificar_", "");
        const correto = verificacoes.get(interaction.user.id);

        if (escolhido !== correto) {
          return interaction.reply({
            content: "❌ Código incorreto. Tente iniciar a verificação novamente.",
            ephemeral: true,
          });
        }

        const cargoId = process.env.VERIFICADO_ROLE_ID;
        const cargo = interaction.guild.roles.cache.get(cargoId);

        if (!cargo) {
          return interaction.reply({
            content: "❌ Erro: Cargo de verificação não encontrado. Verifique o ID no painel do Render.",
            ephemeral: true,
          });
        }

        await interaction.member.roles.add(cargo);
        verificacoes.delete(interaction.user.id);

        return interaction.reply({
          content: "✅ Verificação concluída com sucesso! Bem-vindo(a).",
          ephemeral: true,
        });
      }
    }
  } catch (err) {
    console.error("Erro na Interação:", err);
  }
});

// ===== INICIALIZAÇÃO =====
async function iniciarBot() {
  if (!process.env.DISCORD_TOKEN) {
    console.error("❌ Erro: DISCORD_TOKEN não configurado nas variáveis de ambiente.");
    return;
  }

  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (err) {
    console.error("❌ Falha ao logar:", err);
    setTimeout(iniciarBot, 10000); // Tenta novamente em 10 segundos
  }
}

iniciarBot();
