// commands/play.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import fetch from 'node-fetch';

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

        // まずVCにいるか確認
        const channel = interaction.member.voice.channel;
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

        // ファイル名を決定
        let fileName;
        if (title) {
            fileName = `${encodeURIComponent(title)}.mp4`; // まずmp4想定
        } else {
            // ランダム再生（ファイル一覧は事前に作る必要あり）
            const files = ['song1.mp4', 'song2.m4a']; // 仮
            fileName = files[Math.floor(Math.random() * files.length)];
        }

        // mp4がなければm4aを試す
        let fileUrl = `${GITHUB_RAW_BASE}${fileName}`;
        let res = await fetch(fileUrl, { method: 'HEAD' });
        if (!res.ok && title) {
            fileName = `${encodeURIComponent(title)}.m4a`;
            fileUrl = `${GITHUB_RAW_BASE}${fileName}`;
            res = await fetch(fileUrl, { method: 'HEAD' });
        }

        if (!res.ok) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('❌ 再生できません')
                    .setDescription(`曲が見つかりません: \`${title ?? 'ランダム曲'}\``)]
            });
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
