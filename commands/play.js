// commands/play.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import fetch from 'node-fetch';

const GITHUB_API_URL = 'https://api.github.com/repos/toganedev/D/contents/';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/toganedev/D/main/';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('GitHubから曲を再生します')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('曲名（省略可）')
                .setRequired(false)
        ),
    async execute(interaction) {
        const title = interaction.options.getString('title');

        // VC取得
        let member = interaction.member;
        if (!member.voice || !member.voice.channel) {
            member = await interaction.guild.members.fetch(interaction.user.id);
        }
        const channel = member.voice.channel;
        if (!channel) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('⚠ エラー')
                    .setDescription('ボイスチャンネルに参加してください！')],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        let fileName, fileUrl;

        if (title) {
            // タイトル指定
            fileName = `${encodeURIComponent(title)}.mp4`;
            let res = await fetch(`${GITHUB_RAW_BASE}${fileName}`, { method: 'HEAD' });
            if (!res.ok) {
                fileName = `${encodeURIComponent(title)}.m4a`;
                res = await fetch(`${GITHUB_RAW_BASE}${fileName}`, { method: 'HEAD' });
            }
            if (!res.ok) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('❌ 曲が見つかりません')
                        .setDescription(`\`${title}\` は存在しません。`)]
                });
            }
            fileUrl = `${GITHUB_RAW_BASE}${fileName}`;
        } else {
            // ランダム再生
            const listRes = await fetch(GITHUB_API_URL);
            const files = await listRes.json();
            const audioFiles = files.filter(f => f.type === 'file' && (f.name.endsWith('.mp4') || f.name.endsWith('.m4a')));
            if (audioFiles.length === 0) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('❌ 曲が見つかりません')
                        .setDescription('ランダムで再生できる曲がありません。')]
                });
            }
            const randomFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
            fileName = randomFile.name;
            fileUrl = `${GITHUB_RAW_BASE}${fileName}`;
        }

        // 再生処理
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(fileUrl);
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });

        return interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('▶ 再生中')
                .setDescription(`[${fileName}](${fileUrl}) を再生中`)]
        });
    }
};
