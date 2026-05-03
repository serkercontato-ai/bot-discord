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

const app = express();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const verificacoes = new Map();

client.once(Events.ClientReady, () => {
  console.log(`✅ Purple Store logado como ${client.user.tag}`);
});

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

async function enviarLog(guild, titulo, descricao, cor = "#7d3cff") {
  const canal = await guild.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
  if (!canal) return;

  const embed = new EmbedBuilder()
    .setTitle(titulo)
    .setDescription(descricao)
    .setColor(cor)
    .setTimestamp();

  canal.send({ embeds: [embed] }).catch(() => {});
}

async function gerarTranscript(channel) {
  const mensagens = await channel.messages.fetch({ limit: 100 }).catch(() => null);

  let texto = `TRANSCRIPT DO TICKET: #${channel.name}\n`;
  texto += `DATA: ${new Date().toLocaleString("pt-BR")}\n`;
  texto += `========================================\n\n`;

  if (!mensagens) {
    texto += "Não foi possível buscar as mensagens.\n";
    return Buffer.from(texto, "utf8");
  }

  const ordenadas = mensagens.sort(
    (a, b) => a.createdTimestamp - b.createdTimestamp
  );

  for (const msg of ordenadas.values()) {
    const data = new Date(msg.createdTimestamp).toLocaleString("pt-BR");
    const autor = `${msg.author.tag} (${msg.author.id})`;
    const conteudo = msg.content || "[sem texto]";

    texto += `[${data}] ${autor}:\n${conteudo}\n`;

    if (msg.attachments.size > 0) {
      texto += `Anexos:\n`;
      msg.attachments.forEach((a) => {
        texto += `- ${a.url}\n`;
      });
    }

    texto += `\n----------------------------------------\n\n`;
  }

  return Buffer.from(texto, "utf8");
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "verificacao") {
        const embed = new EmbedBuilder()
          .setTitle("🔐 Sistema de Verificação")
          .setDescription(
            "Seja bem-vindo!\n\nPara acessar o servidor, clique no botão abaixo e complete a verificação.\n\n• Isso garante mais segurança para todos."
          )
          .setColor("#7d3cff")
          .setFooter({ text: "Purple Store • Sistema Automático" });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("iniciar_verificacao")
            .setLabel("Verificar")
            .setEmoji("✅")
            .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({ embeds: [embed], components: [row] });
      }

      if (interaction.commandName === "ticket") {
        const embed = new EmbedBuilder()
          .setTitle("🎫 Purple Store • Central de Atendimento")
          .setDescription(
            "🎟️ **Central de Atendimento**\n\nSelecione abaixo o tipo de atendimento.\n\nNossa equipe responderá o mais rápido possível."
          )
          .setColor("#7d3cff")
          .setFooter({ text: "Purple Store • Sistema de Tickets" });

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("menu_ticket")
            .setPlaceholder("Escolha uma opção")
            .addOptions(
              {
                label: "Compras",
                description: "Solicitar orçamento ou adquirir serviços",
                value: "compras",
                emoji: "💰",
              },
              {
                label: "Parcerias",
                description: "Interessado em realizar uma parceria",
                value: "parcerias",
                emoji: "🤝",
              },
              {
                label: "Suporte",
                description: "Precisa de ajuda ou reportar problema",
                value: "suporte",
                emoji: "🛠️",
              }
            )
        );

        return interaction.reply({ embeds: [embed], components: [row] });
      }

      if (interaction.commandName === "pagamentos") {
        const pix =
          "00020126580014br.gov.bcb.pix0136d4b9c2d6-9cd3-4cad-9e74-3d115193ea315204000053039865802BR5916SG202501082028146009Sao Paulo610901227-20062240520daqr22003294131437866304B230";

        const qr = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=${encodeURIComponent(
          pix
        )}`;

        const banner =
          "https://cdn.discordapp.com/attachments/1446330885002625064/1499590937788158154/content.png?ex=69f55a64&is=69f408e4&hm=d0668d84cb6b17ce5773df7af88c8bf098d313725a23703bdd0ead471fed87eb&";

        const embedInfo = new EmbedBuilder()
          .setTitle("💳 Purple Store • Pagamentos")
          .setDescription(
            `💰 **Forma de pagamento:** Pix\n\n` +
              `Escaneie o QR Code abaixo ou copie o código Pix.\n\n` +
              `📋 **Pix Copia e Cola:**\n\`\`\`${pix}\`\`\`\n` +
              `⚠️ **Regras importantes:**\n` +
              `• O pagamento deve ser feito pelo próprio comprador.\n` +
              `• Não aceitamos comprovante editado, cortado ou ilegível.\n` +
              `• Após pagar, envie o comprovante neste ticket.\n` +
              `• Aguarde a confirmação da equipe.\n\n` +
              `💜 Obrigado por escolher a Purple Store.`
          )
          .setColor("#7d3cff")
          .setImage(banner);

        const embedQr = new EmbedBuilder()
          .setTitle("📲 QR Code Pix")
          .setDescription("Escaneie o QR Code abaixo para realizar o pagamento.")
          .setColor("#7d3cff")
          .setImage(qr);

        await enviarLog(
          interaction.guild,
          "💳 Pagamentos usado",
          `👤 Usuário: ${interaction.user}\n📍 Canal: ${interaction.channel}`,
          "#7d3cff"
        );

        return interaction.reply({
          embeds: [embedInfo, embedQr],
        });
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "iniciar_verificacao") {
        const codigo = gerarCodigo();
        const opcoes = gerarOpcoes(codigo);

        verificacoes.set(interaction.user.id, codigo);

        setTimeout(() => {
          verificacoes.delete(interaction.user.id);
        }, 2 * 60 * 1000);

        const embed = new EmbedBuilder()
          .setTitle("🔐 Confirmação de Segurança")
          .setDescription(
            `Clique no botão que corresponde ao código abaixo:\n\n` +
              `📝 **Código:** \`${codigo}\`\n\n` +
              `Você tem **2 minutos** para confirmar.\n\n` +
              `Hoje às ${new Date().toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
          )
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

        if (!correto) {
          return interaction.reply({
            content: "❌ Sua verificação expirou.",
            ephemeral: true,
          });
        }

        if (escolhido !== correto) {
          return interaction.reply({
            content: "❌ Código incorreto.",
            ephemeral: true,
          });
        }

        const cargo = await interaction.guild.roles
          .fetch(process.env.VERIFICADO_ROLE_ID)
          .catch(() => null);

        if (!cargo) {
          return interaction.reply({
            content: "❌ Cargo não encontrado.",
            ephemeral: true,
          });
        }

        await interaction.member.roles.add(cargo);
        verificacoes.delete(interaction.user.id);

        await enviarLog(
          interaction.guild,
          "🔐 Usuário verificado",
          `👤 Usuário: ${interaction.user}\n🆔 ID: \`${interaction.user.id}\`\n✅ Cargo entregue: ${cargo}`,
          "#2ecc71"
        );

        return interaction.reply({
          content: "✅ Verificação concluída! Acesso liberado.",
          ephemeral: true,
        });
      }

      if (interaction.customId === "fechar_ticket") {
        await interaction.deferReply({ ephemeral: true });

        const ticketLog = await interaction.guild.channels
          .fetch(process.env.TICKET_LOG_CHANNEL_ID)
          .catch(() => null);

        const buffer = await gerarTranscript(interaction.channel);
        const arquivo = new AttachmentBuilder(buffer, {
          name: `transcript-${interaction.channel.name}.txt`,
        });

        if (ticketLog) {
          const embed = new EmbedBuilder()
            .setTitle("🎫 Ticket fechado")
            .setDescription(
              `📁 Canal: **${interaction.channel.name}**\n` +
                `👤 Fechado por: ${interaction.user}\n` +
                `🕒 Data: <t:${Math.floor(Date.now() / 1000)}:F>`
            )
            .setColor("#e74c3c")
            .setTimestamp();

          await ticketLog.send({
            embeds: [embed],
            files: [arquivo],
          });
        }

        await enviarLog(
          interaction.guild,
          "🔒 Ticket fechado",
          `📁 Canal: **${interaction.channel.name}**\n👤 Fechado por: ${interaction.user}`,
          "#e74c3c"
        );

        await interaction.editReply({
          content: "🔒 Fechando ticket e salvando transcript...",
        });

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 3000);
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "menu_ticket") {
        await interaction.deferReply({ ephemeral: true });

        const categoria = interaction.values[0];

        const existente = interaction.guild.channels.cache.find(
          (c) =>
            c.topic === `ticket:${interaction.user.id}` &&
            c.name.startsWith("ticket-")
        );

        if (existente) {
          return interaction.editReply({
            content: `⚠️ Você já tem um ticket aberto: ${existente}`,
          });
        }

        const nomes = {
          compras: "💰 Compras",
          parcerias: "🤝 Parcerias",
          suporte: "🛠️ Suporte",
        };

        const canal = await interaction.guild.channels.create({
          name: `ticket-${categoria}-${interaction.user.username}`.toLowerCase(),
          type: ChannelType.GuildText,
          topic: `ticket:${interaction.user.id}`,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ],
        });

        const embed = new EmbedBuilder()
          .setTitle("🎫 Ticket Aberto")
          .setDescription(
            `Olá ${interaction.user}, seu ticket foi criado com sucesso.\n\n` +
              `Categoria: **${nomes[categoria]}**\n\n` +
              `Explique sua dúvida com detalhes e aguarde atendimento.`
          )
          .setColor("#7d3cff")
          .setFooter({ text: "Purple Store • Atendimento" });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("fechar_ticket")
            .setLabel("Fechar Ticket")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger)
        );

        await canal.send({
          content: `${interaction.user}`,
          embeds: [embed],
          components: [row],
        });

        await enviarLog(
          interaction.guild,
          "🎫 Ticket criado",
          `👤 Usuário: ${interaction.user}\n📁 Canal: ${canal}\n📌 Categoria: **${nomes[categoria]}**`,
          "#7d3cff"
        );

        return interaction.editReply({
          content: `✅ Ticket criado: ${canal}`,
        });
      }
    }
  } catch (error) {
    console.log("ERRO:", error);

    if (interaction.isRepliable()) {
      if (interaction.deferred) {
        return interaction.editReply({
          content: "❌ Ocorreu um erro interno.",
        }).catch(() => {});
      }

      if (!interaction.replied) {
        return interaction.reply({
          content: "❌ Ocorreu um erro interno.",
          ephemeral: true,
        }).catch(() => {});
      }
    }
  }
});

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

client.login(process.env.DISCORD_TOKEN);
