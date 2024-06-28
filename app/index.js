require("dotenv").config();
const fs = require("fs");
const config = require("./config.json");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  Partials,
} = require("discord.js");

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.GuildMember],
});

// Log in to Discord
client.login(process.env.TOKEN).catch((error) => {
  console.error("Failed to login:", error);
});

// Bot is ready
client.once("ready", () => {
  console.log("Bot is Ready!");
  console.log("Code by GHERNAT FETHI");
  console.log("discord.gg/wicks");
});

// Handle message creation
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("/grt") || message.author.bot) return;

  const allowedRoleId = process.env.ALLOWED_ROLE_ID || config.allowedRoleId;
  const member = message.guild.members.cache.get(message.author.id);

  if (!hasPermission(member, allowedRoleId)) {
    return message.reply({
      content: "⛔ليس لديك صلاحية لاستخدام هذا الامر!",
      ephemeral: true,
    });
  }

  const embed = await createEmbed(message.guild);
  const row = createActionRow();

  await message.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
});

// Handle interactions
client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    }
  } catch (error) {
    console.error("Error in interactionCreate event:", error);
    await interaction.reply({
      content: "حدث خطأ أثناء معالجة التفاعل.",
      ephemeral: true,
    });
  }
});

// Function to check permissions
function hasPermission(member, allowedRoleId) {
  return (
    member.roles.cache.has(allowedRoleId) ||
    member.permissions.has(PermissionsBitField.Flags.Administrator)
  );
}

// Function to create embed message
async function createEmbed(guild) {
  const { onlineCount, offlineCount } = await getOnlineOfflineCounts(guild);

  return new EmbedBuilder()
    .setColor("#00ff00")
    .setTitle("Steam")
    .setURL("https://2u.pw/xXcZgVXS")
    .setAuthor({
      name: "Facebook",
      iconURL: "https://img.icons8.com/?size=100&id=13912&format=png&color=000000",
      url: "https://bit.ly/3XDhpDk",
    })
    .setDescription(`الرجاء اختيار نوع الارسال للاعضاء.\n\nالأعضاء المتصلين: ${onlineCount}\nالأعضاء غير المتصلين: ${offlineCount}`)
    .setThumbnail("https://j.top4top.io/p_30913rquz1.png")
    .setImage("https://a.top4top.io/p_3098arx7m1.jpg")
    .setFooter({
      text: "Developed by GHERNAT FETHI",
      iconURL: "https://k.top4top.io/p_3096rmb6x1.gif",
    })
    .setTimestamp();
}

// Function to get the counts of online and offline members
async function getOnlineOfflineCounts(guild) {
  const members = await guild.members.fetch();
  let onlineCount = 0;
  let offlineCount = 0;

  members.forEach(member => {
    if (member.user.bot) return;
    if (member.presence && member.presence.status !== "offline") {
      onlineCount++;
    } else {
      offlineCount++;
    }
  });

  return { onlineCount, offlineCount };
}

// Function to create action row with buttons
function createActionRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("send_all")
      .setLabel("📩 ارسل للجميع")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("send_online")
      .setLabel("📩 ارسل للمتصلين")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("send_offline")
      .setLabel("📩 ارسل للغير المتصلين")
      .setStyle(ButtonStyle.Danger)
  );
}

// Handle button interactions
async function handleButtonInteraction(interaction) {
  const customIdMap = {
    send_all: "modal_all",
    send_online: "modal_online",
    send_offline: "modal_offline",
  };

  const customId = customIdMap[interaction.customId];
  if (!customId) return;

  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle("Type your message");

  const messageInput = new TextInputBuilder()
    .setCustomId("messageInput")
    .setLabel("✒️ اكتب رسالتك هنا")
    .setStyle(TextInputStyle.Paragraph);

  modal.addComponents(new ActionRowBuilder().addComponents(messageInput));

  await interaction.showModal(modal);
}

// Handle modal submissions
async function handleModalSubmit(interaction) {
  const message = interaction.fields.getTextInputValue("messageInput");
  const guild = interaction.guild;
  if (!guild) return;

  await interaction.deferReply({
    ephemeral: true,
  });

  const membersToSend = filterMembers(guild.members.cache, interaction.customId);

  const sendMessages = membersToSend.map(async (member) => {
    try {
      await member.send({
        content: `${message}\n<@${member.user.id}>`,
        allowedMentions: { parse: ["users"] },
      });
    } catch (error) {
      console.error(`Error sending message to ${member.user.tag}:`, error);
    }
  });

  await Promise.all(sendMessages);

  await interaction.editReply({
    content: "تم ارسال رسالتك الى الاعضاء بنجاح✅.",
  });
}

// Function to filter members based on interaction type
function filterMembers(members, customId) {
  return members.filter((member) => {
    if (member.user.bot) return false;
    if (customId === "modal_all") return true;
    if (customId === "modal_online") {
      return member.presence && member.presence.status !== "offline";
    }
    if (customId === "modal_offline") {
      return !member.presence || member.presence.status === "offline";
    }
  });
}
