import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
} from '@discordjs/voice';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

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

        // VC取得（キャッシュ切れ防止）
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

        // 一時ファイルに保存（途切れ防止）
        const tempPath = path.join('/tmp', fileName);
        const res = await fetch(fileUrl);
        if (!res.ok) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('❌ ダウンロード失敗')
                        .setDescription('音源を取得できませんでした。'),
                ],
            });
        }
        await streamPipeline(res.body, fs.createWriteStream(tempPath));

        // VC接続
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const resource = createAudioResource(tempPath);
        const player = createAudioPlayer();
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
            fs.unlink(tempPath, () => {}); // 再生後削除
        });

        player.on('error', error => {
            console.error(error);
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('❌ 再生エラー')
                        .setDescription('再生中にエラーが発生しました。'),
                ],
            });
            connection.destroy();
            fs.unlink(tempPath, () => {});
        });

        player.play(resource);
    },
};
