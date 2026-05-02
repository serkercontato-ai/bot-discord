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

// 1. SERVIDOR WEB IMEDIATO (Para o Render não dar erro de porta)
const app = express();
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => res.send("Purple Store Online!"));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Servidor Web ativo na porta ${PORT}`);
});

// 2. CONFIGURAÇÃO DO BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, 
  ],
});

const verificacoes = new Map();

client.once(Events.ClientReady, () => {
  console.log(`✅ BOT CONECTADO: ${client.user.tag}`);
});

// 3. LÓGICA DE INTERAÇÃO (Botões e Comandos)
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === "verificacao") {
      const embed = new EmbedBuilder()
        .setTitle("🔐 Sistema de Verificação")
        .setDescription("Clique abaixo para se verificar.")
        .setColor("#7d3cff");
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("iniciar_verificacao").setLabel("Verificar").setStyle(ButtonStyle.Primary)
      );
      return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (interaction.isButton()) {
      if (interaction.customId === "iniciar_verificacao") {
        const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let codigo = "";
        for (let i = 0; i < 4; i++) codigo += letras[Math.floor(Math.random() * letras.length)];
        
        verificacoes.set(interaction.user.id, codigo);

        const opcoes = [codigo];
        while (opcoes.size < 4) {
            let cap = "";
            for (let i = 0; i < 4; i++) cap += letras[Math.floor(Math.random() * letras.length)];
            opcoes.push(cap);
        }
        const botoes = [...new Set(opcoes)].slice(0,4).sort(() => Math.random() - 0.5);

        const row = new ActionRowBuilder().addComponents(
          botoes.map(opt => new ButtonBuilder().setCustomId(`v_${opt}`).setLabel(opt).setStyle(ButtonStyle.Secondary))
        );

        return interaction.reply({ content: `Confirme o código: **${codigo}**`, components: [row], ephemeral: true });
      }

      if (interaction.customId.startsWith("v_")) {
        const escolhido = interaction.customId.replace("v_", "");
        const correto = verificacoes.get(interaction.user.id);

        if (escolhido !== correto) return interaction.reply({ content: "❌ Errado.", ephemeral: true });

        const cargo = interaction.guild.roles.cache.get(process.env.VERIFICADO_ROLE_ID);
        if (cargo) await interaction.member.roles.add(cargo);
        
        return interaction.reply({ content: "✅ Verificado!", ephemeral: true });
      }
    }
  } catch (err) { console.error(err); }
});

// 4. LOGIN (Em paralelo)
console.log("🔑 Tentando logar bot...");
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error("❌ Erro no login do Discord:", err.message);
});
