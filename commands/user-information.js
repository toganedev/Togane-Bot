// commands/user-information.js
import {
  SlashCommandBuilder,
  EmbedBuilder,
  codeBlock,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('user-information')
    .setDescription('指定したユーザーIDの情報を表示します')
    .addStringOption(opt =>
      opt
        .setName('user_id')
        .setDescription('ユーザーのID（雪だるまID）')
        .setRequired(true)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const id = interaction.options.getString('user_id', true).trim();

    // IDの簡易バリデーション（18〜20桁の数字）
    if (!/^\d{17,20}$/.test(id)) {
      return interaction.editReply('⚠️ 有効なユーザーIDを入力してください。');
    }

    let user;
    try {
      // グローバルキャッシュから取得→なければAPIフェッチ
      user = await interaction.client.users.fetch(id, { force: true });
    } catch (err) {
      return interaction.editReply(`❌ ユーザーが見つかりませんでした: \`${id}\``);
    }

    // ギルドメンバー情報（在籍していれば追加情報を表示）
    let member = null;
    if (interaction.inGuild()) {
      try {
        member = await interaction.guild.members.fetch(id);
      } catch {
        // 在籍していない/取得できない場合は無視
      }
    }

    // 便利なDiscordタイムスタンプ
    const toDiscordTs = (ms) => `<t:${Math.floor(ms / 1000)}:F> (<t:${Math.floor(ms / 1000)}:R>)`;

    const fields = [
      { name: '表示名 / ユーザー名', value: `${user.displayName ?? user.username} / ${user.username}`, inline: true },
      { name: 'ユーザーID', value: user.id, inline: true },
      { name: 'Botかどうか', value: user.bot ? '🤖 Bot' : '🧑 User', inline: true },
      { name: 'アカウント作成日', value: toDiscordTs(user.createdTimestamp), inline: false },
    ];

    if (member) {
      fields.push(
        { name: 'サーバー表示名', value: member.displayName, inline: true },
        { name: 'サーバー参加日', value: toDiscordTs(member.joinedTimestamp), inline: true },
        { name: 'ロール数', value: String(member.roles.cache.filter(r => r.id !== interaction.guild.id).size), inline: true },
      );
    }

    // バナーやアバターの高解像度URL（存在すれば）
    const avatarUrl = user.displayAvatarURL({ size: 1024, extension: 'png', forceStatic: false });
    // バナーは明示的にフェッチが必要な場合があるため、上のusers.fetch(force: true)でOK
    const bannerUrl = user.bannerURL?.({ size: 1024, extension: 'png' }) ?? null;

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${user.username}`, iconURL: avatarUrl })
      .setTitle('ユーザー情報')
      .setThumbnail(avatarUrl)
      .setColor(member?.displayHexColor && member.displayHexColor !== '#000000' ? member.displayHexColor : 0x2f3136)
      .addFields(fields)
      .setFooter({ text: `要求者: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    if (bannerUrl) {
      embed.setImage(bannerUrl);
    }

    // コードブロック用：生の値をまとめて整形
    const lines = [
      `username      : ${user.username}`,
      `globalName    : ${user.globalName ?? 'null'}`,
      `id            : ${user.id}`,
      `bot           : ${user.bot}`,
      `createdAt     : ${new Date(user.createdTimestamp).toISOString()}`,
      member ? `guildDisplay  : ${member.displayName}` : null,
      member ? `joinedAt      : ${new Date(member.joinedTimestamp).toISOString()}` : null,
      `avatar        : ${avatarUrl}`,
      `banner        : ${bannerUrl ?? 'null'}`,
    ].filter(Boolean);

    const infoBlock = codeBlock('ini', lines.join('\n')); // ```ini で色付け

    await interaction.editReply({ embeds: [embed], content: infoBlock });
  },
};
