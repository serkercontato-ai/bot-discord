async function ligarDiscord() {
  try {
    if (!process.env.DISCORD_TOKEN) {
      console.log("❌ DISCORD_TOKEN não encontrado.");
      return;
    }

    console.log("🔑 Tentando conectar no Discord...");

    await client.login(process.env.DISCORD_TOKEN);

    console.log("🤖 Login enviado com sucesso.");
  } catch (err) {
    console.log("❌ Erro ao conectar no Discord:");
    console.log(err);

    console.log("🔁 Tentando novamente em 10 segundos...");
    setTimeout(ligarDiscord, 10000);
  }
}

client.on(Events.ClientReady, () => {
  console.log(`✅ Purple Store online como ${client.user.tag}`);
});

client.on("error", (err) => {
  console.log("❌ Erro do client Discord:", err);
});

client.on("shardError", (err) => {
  console.log("❌ Erro de shard:", err);
});

ligarDiscord();
