import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} from 'discord.js';
import fs from 'fs';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('お問い合わせパネルを作成します')
    .addStringOption(option =>
      option.setName('タイトル')
        .setDescription('パネルのタイトル')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('概要')
        .setDescription('パネルの概要')
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
  opt.setName('image')
    .setDescription('埋め込み画像')
    .setRequired(false)
)
    .addStringOption(option =>
      option.setName('ボタン')
        .setDescription('ボタンのラベル（省略時は「お問い合わせ」）')
        .setRequired(false)
    )
　　.addChannelOption(option =>
 　　 option.setName('カテゴリー')
    　　.setDescription('チケットを作成するカテゴリー')
   　　 .addChannelTypes(ChannelType.GuildCategory)
   　　 .setRequired(false)
　　)
    .addRoleOption(option =>
      option.setName('対応ロール')
        .setDescription('対応者のロール')
        .setRequired(false)
    ),

  async execute(interaction) {
    const title = interaction.options.getString('タイトル') || 'お問い合わせパネル';
    const description = interaction.options.getString('概要') || '以下のボタンを押してお問い合わせできます';
    const imageUrl = interaction.options.getString('画像');
    const buttonLabel = interaction.options.getString('ボタン') || 'お問い合わせ';
    const category = interaction.options.getChannel('カテゴリー');
    const handlerRole = interaction.options.getRole('対応ロール');

    let image = null;
    let imageAttachment = null;

    if (imageUrl) {
      image = imageUrl;
    } else {
      const templateImagePath = path.resolve('assets', 'ticket.png');
      if (fs.existsSync(templateImagePath)) {
        image = 'attachment://ticket.png';
        imageAttachment = { attachment: templateImagePath, name: 'ticket.png' };
      }
    }

    const embed = {
      title,
      description,
      image: image ? { url: image } : undefined,
      footer: handlerRole ? { text: `対応ロール：${handlerRole.name}` } : undefined,
    };

    const button = new ButtonBuilder()
      .setCustomId(JSON.stringify({
        c: 'ticket_open',
        role: handlerRole?.id || null,
        cat: category?.id || null
      }))
      .setLabel(buttonLabel)
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    const payload = {
      embeds: [embed],
      components: [row],
      ephemeral: false,
    };

    if (imageAttachment) {
      payload.files = [imageAttachment];
    }

    await interaction.reply(payload);
  }
};
