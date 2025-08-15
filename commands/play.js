import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
} from '@discordjs/voice';
import fetch from 'node-fetch';

const GITHUB_API_URL = 'https://api.github.com/repos/toganedev/D/contents/';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/toganedev/D/main/';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('GitHubから曲を再生します')
        .addStringOption(option =>
            option
                .setName('title')
                .setDescription('曲名（省略可）')
                .setRequired(false)
        ),

    async execute(interaction) {
        const title = interaction.options.getString('title');

        // メンバーのVC取得（キャッシュ切れ防止）
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
                        .setDescription('ボイスチャンネルに参加してください！'),
                ],
                ephemeral: true,
            });
        }

        await interaction.deferReply();

        let fileUrl, fileName;

        if (title) {
            // タイトル指定再生
            fileName = `${encodeURIComponent(title)}.mp4`;
            let res = await fetch(`${GITHUB_RAW_BASE}${fileName}`, { method: 'HEAD' });

            if (!res.ok) {
                fileName = `${encodeURIComponent(title)}.m4a`;
                res = await fetch(`${GITHUB_RAW_BASE}${fileName}`, { method: 'HEAD' });
            }

            if (!res.ok) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle('❌ 曲が見つかりません')
                            .setDescription(`\`${title}\` は存在しません。`),
                    ],
                });
            }

            fileUrl = `${GITHUB_RAW_BASE}${fileName}`;
        } else {
            // ランダム選曲
            const listRes = await fetch(GITHUB_API_URL, {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`,
                    'User-Agent': 'togane-bot',
                },
            });
            const files = await listRes.json();

            if (!Array.isArray(files)) {
                console.error('GitHub API Error:', files);
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle('❌ GitHub APIエラー')
                            .setDescription('ファイル一覧を取得できませんでした。'),
                    ],
                });
            }

            const audioFiles = files.filter(
                f =>
                    f.type === 'file' &&
                    (f.name.endsWith('.mp4') || f.name.endsWith('.m4a'))
            );

            if (audioFiles.length === 0) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle('❌ 音源なし')
                            .setDescription('再生可能な音源ファイルがありません。'),
                    ],
                });
            }

            const randomFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
            fileName = randomFile.name;
            fileUrl = `${GITHUB_RAW_BASE}${fileName}`;
        }

        // VC接続
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        // GitHubから直接ストリーム取得
        const audioStream = await fetch(fileUrl).then(res => res.body);
        const resource = createAudioResource(audioStream);
        const player = createAudioPlayer();

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Playing, () => {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00ff00)
                        .setTitle('🎵 再生開始')
                        .setDescription(`\`${fileName}\` を再生中です。`),
                ],
            });
        });

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });

        player.on('error', error => {
            console.error(error);
            interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('❌ 再生エラー')
                        .setDescription('再生中にエラーが発生しました。'),
                ],
            });
            connection.destroy();
        });
    },
};
