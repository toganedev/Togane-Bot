const TRACKS_JSON_URL = 'https://raw.githubusercontent.com/j20252097/h/main/tracks.json';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('tracks.jsonから曲を再生します')
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('曲名（部分一致可・省略可）')
        .setRequired(false)
    ),

  async execute(interaction) {
    const title = interaction.options.getString('title');

    // --- VC確認 ---
    let member = interaction.member;
    if (!member.voice || !member.voice.channel) {
      member = await interaction.guild.members.fetch(interaction.user.id);
    }
    const channel = member.voice.channel;
    if (!channel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('⚠ エラー')
            .setDescription('```ボイスチャンネルに参加してください！```'),
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    // --- tracks.json 読み込み ---
    const res = await fetch(TRACKS_JSON_URL);
    if (!res.ok) {
      return interaction.editReply('❌ tracks.jsonの取得に失敗しました');
    }
    const tracks = await res.json();

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return interaction.editReply('❌ 再生可能な曲がありません');
    }

    // --- 曲検索 ---
    let currentTrack;
    if (title) {
      currentTrack = tracks.find(t =>
        t.title.toLowerCase().includes(title.toLowerCase())
      );
      if (!currentTrack) {
        return interaction.editReply(`❌ ${title} が見つかりません`);
      }
    } else {
      currentTrack = tracks[Math.floor(Math.random() * tracks.length)];
    }

    // --- 次の曲（ランダム） ---
    const candidates = tracks.filter(t => t.url !== currentTrack.url);
    const nextTrack = candidates[Math.floor(Math.random() * candidates.length)];

    global.currentTrack = currentTrack;
    global.nextTrack = nextTrack;

    // --- ダウンロード ---
    const tempPath = path.join('/tmp', path.basename(currentTrack.url));
    const audioRes = await fetch(currentTrack.url);
    if (!audioRes.ok) {
      return interaction.editReply('❌ 音源のダウンロードに失敗しました');
    }
    await streamPipeline(audioRes.body, fs.createWriteStream(tempPath));

    // --- 再生処理 ---
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    const resource = createAudioResource(tempPath);
    const player = createAudioPlayer();
    connection.subscribe(player);

    global.voiceConnection = connection;
    global.audioPlayer = player;

    player.play(resource);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('🎵 再生開始')
          .setDescription(`\`\`\`\n現在: ${currentTrack.title} - ${currentTrack.artist}\n次: ${nextTrack.title} - ${nextTrack.artist}\n\`\`\``),
      ],
    });

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
      fs.unlink(tempPath, () => {});
    });

    player.on('error', error => {
      console.error(error);
      connection.destroy();
      fs.unlink(tempPath, () => {});
    });
  },
};
