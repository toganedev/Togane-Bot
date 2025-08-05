// events/role-panel.js
import { EmbedBuilder } from 'discord.js';
import fs from 'fs';

const filePath = './rolepanel.json';
let panels = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];

export default {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
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
  }
};
