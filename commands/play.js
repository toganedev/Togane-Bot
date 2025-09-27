import {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} from 'discord.js';
import fs from 'fs';
import musicQueue from '../utils/musicQueue.js';

const tracks = JSON.parse(fs.readFileSync('./tracks.json', 'utf-8'));

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('曲を再生します')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('曲名またはアーティスト名')
        .setRequired(true),
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query').toLowerCase();
    const results = tracks.filter(t =>
      t.title.toLowerCase().includes(query) ||
      t.artist.toLowerCase().includes(query),
    );

    if (results.length === 0) {
      return interaction.reply({ content: '❌ 曲が見つかりませんでした。', ephemeral: true });
    }

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: 'VCに参加してください！', ephemeral: true });
    }

    // 1曲だけ → そのまま再生
    if (results.length === 1) {
      musicQueue.join(voiceChannel);
      musicQueue.add(results[0], interaction);

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle('✅ 曲を追加しました')
          .setDescription(`\`\`\`\n${results[0].title}\nby ${results[0].artist}\n\`\`\``)
          .setColor(0x1DB954)],
      });
    }

    // 複数候補 → 選択メニュー
    const options = results.map((t, i) => ({
      label: `${t.title} - ${t.artist}`,
      description: `候補 ${i + 1}`,
      value: i.toString(),
    }));

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select-track')
        .setPlaceholder('曲を選んでください')
        .addOptions(options),
    );

    const embed = new EmbedBuilder()
      .setTitle('複数の候補が見つかりました')
      .setDescription('以下から曲を選択してください:')
      .setColor(0x5865F2);

    const reply = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    const collector = reply.createMessageComponentCollector({ time: 15000 });

    collector.on('collect', i => {
      if (i.customId === 'select-track') {
        const selected = results[parseInt(i.values[0])];
        musicQueue.join(voiceChannel);
        musicQueue.add(selected, interaction);

        i.update({
          content: `🎶 ${selected.title} を再生リストに追加しました！`,
          components: [],
          embeds: [],
        });
        collector.stop();
      }
    });
  },
};
