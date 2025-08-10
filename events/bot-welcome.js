// events/bot-welcome.js
import { Events, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export default {
  name: Events.GuildCreate,
  once: false,
  async execute(guild) {
    try {
      let inviter = null;
      try {
        const auditLogs = await guild.fetchAuditLogs({
          limit: 1,
          type: 28 // BOT_ADD
        });
        const log = auditLogs.entries.first();
        inviter = log?.executor || null;
      } catch (err) {
        console.warn(`監査ログ取得失敗: ${err}`);
      }

      // BOT追加者へのDM
      const embed = new EmbedBuilder()
        .setColor('Random')
        .setTitle(`📥 ${guild.client.user.username} を導入いただきありがとうございます！`)
        .setDescription(
          `${guild.client.user.username} を **${guild.name}** に導入していただきありがとうございます！\n\n` +
          `📖 BOTの利用規約やコマンド説明はこちらをご覧ください：\n` +
          `[利用案内ページ](https://toganedev.github.io/Togane-Bot-Web/)\n\n` +
          `💬 サポートサーバーはこちら：\n` +
          `[参加する](https://discord.gg/aJ2zgdUzg7)`
        )
        .setFooter({ text: `サーバーID: ${guild.id}` })
        .setTimestamp();

      if (inviter) {
        await inviter.send({ embeds: [embed] }).catch(() => {
          console.warn(`ユーザー ${inviter.tag} にDMを送れませんでした`);
        });
      }

      // 招待リンク作成（期限なし）
      let inviteUrl = null;
      try {
        const channel = guild.systemChannel || guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.members.me).has('CreateInstantInvite'));
        if (channel) {
          const invite = await channel.createInvite({ maxAge: 0, maxUses: 0 });
          inviteUrl = `https://discord.gg/${invite.code}`;
        }
      } catch (err) {
        console.warn(`招待リンク作成失敗: ${err}`);
      }

      // 管理者（オーナー）情報
      let ownerUser = null;
      try {
        const owner = await guild.fetchOwner();
        ownerUser = owner.user;
      } catch (err) {
        console.warn(`オーナー取得失敗: ${err}`);
      }

      // 通知Embed
      const notifyEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle(`✅ BOTが追加されました`)
        .setDescription(
          `サーバー名：**${guild.name}**\n` +
          `サーバー人数：**${guild.memberCount}** 人\n` +
          `サーバー管理者：${ownerUser ? `${ownerUser.username}（${ownerUser.id}）` : '不明'}`
        )
        .setFooter({ text: `サーバーID: ${guild.id}` })
        .setTimestamp();

      const row = inviteUrl
        ? new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('サーバーに参加')
              .setStyle(ButtonStyle.Link)
              .setURL(inviteUrl)
          )
        : null;

      // 指定ユーザーにDM
      try {
        const user = await guild.client.users.fetch('1401421639106957464');
        if (user) {
          await user.send({ embeds: [notifyEmbed], components: row ? [row] : [] });
        }
      } catch (err) {
        console.warn(`通知用DM送信失敗: ${err}`);
      }

    } catch (error) {
      console.error(`bot-welcome.js エラー:`, error);
    }
  }
};
