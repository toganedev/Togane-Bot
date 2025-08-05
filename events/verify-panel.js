import { EmbedBuilder } from 'discord.js';
import fs from 'fs';

const filePath = './rolepanel.json';
let panels = [];
try {
  panels = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
} catch (e) {
  console.error('rolepanel.json の読み込みに失敗しました', e);
  panels = [];
}

export default {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    try {
      if (user.bot || reaction.message.partial) return;
      const panel = panels.find(p => p.messageId === reaction.message.id);
      if (!panel) return;

      const emojiIndex = panel.emojis.indexOf(reaction.emoji.name);
      if (emojiIndex === -1) return;

      const roleId = panel.roles[emojiIndex];
      const role = reaction.message.guild.roles.cache.get(roleId);
      const member = await reaction.message.guild.members.fetch(user.id);

      if (!member.roles.cache.has(roleId)) {
        await member.roles.add(roleId);
        const embed = new EmbedBuilder()
          .setColor('Green')
          .setDescription(`✅ ロール <@&${roleId}> を付与しました。`)
          .setFooter({ text: user.tag, iconURL: user.displayAvatarURL() });
        const notify = await reaction.message.channel.send({ content: `<@${user.id}>`, embeds: [embed] });
        setTimeout(() => notify.delete().catch(() => {}), 5000);
      }

      await reaction.users.remove(user.id);
    } catch (err) {
      console.error('リアクション処理中にエラーが発生しました:', err);
    }
  }
};
