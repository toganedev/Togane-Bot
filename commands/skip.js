import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createAudioResource, AudioPlayerStatus } from '@discordjs/voice';

const streamPipeline = promisify(pipeline);
const GITHUB_API_URL = 'https://api.github.com/repos/toganedev/D/contents/';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/toganedev/D/main/';

export default {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('次のランダム曲にスキップします'),

    async execute(interaction) {
        const connection = global.voiceConnection;
        const player = global.audioPlayer;

        if (!connection || !player) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('❌ スキップできません')
                        .setDescription('```現在、再生中の曲はありません。```')
                ],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        // GitHubからランダム曲取得
        const listRes = await fetch(GITHUB_API_URL, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                'User-Agent': 'togane-bot',
            },
        });
        const files = await listRes.json();

        const audioFiles = files.filter(
            f => f.type === 'file' && (f.name.endsWith('.mp4') || f.name.endsWith('.m4a'))
        );

        if (audioFiles.length === 0) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('❌ 音源なし')
                        .setDescription('```再生可能な音源ファイルがありません。```')
                ]
            });
        }

        const randomFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
        const fileName = randomFile.name;
        const fileUrl = `${GITHUB_RAW_BASE}${fileName}`;

        // 一時保存
        const tempPath = path.join('/tmp', fileName);
        const res = await fetch(fileUrl);
        if (!res.ok) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('❌ ダウンロード失敗')
                        .setDescription('```音源を取得できませんでした。```')
                ]
            });
        }
        await streamPipeline(res.body, fs.createWriteStream(tempPath));

        // 再生
        const resource = createAudioResource(tempPath);
        player.play(resource);

        player.once(AudioPlayerStatus.Playing, () => {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00ff00)
                        .setTitle('⏭ スキップ')
                        .setDescription(`\`\`\`${fileName} を再生中です。\`\`\``)
                ]
            });
        });

        player.once(AudioPlayerStatus.Idle, () => {
            fs.unlink(tempPath, () => {});
        });
    }
};
