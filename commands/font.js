import { SlashCommandBuilder } from 'discord.js';

// Unicodeマッピング
const maps = {
  'bold-italic': {
    a: '𝒂', b: '𝒃', c: '𝒄', d: '𝒅', e: '𝒆',
    f: '𝒇', g: '𝒈', h: '𝒉', i: '𝒊', j: '𝒋',
    k: '𝒌', l: '𝒍', m: '𝒎', n: '𝒏', o: '𝒐',
    p: '𝒑', q: '𝒒', r: '𝒓', s: '𝒔', t: '𝒕',
    u: '𝒖', v: '𝒗', w: '𝒘', x: '𝒙', y: '𝒚', z: '𝒛'
  },
  'cursive': {
    a: '𝓪', b: '𝓫', c: '𝓬', d: '𝓭', e: '𝓮',
    f: '𝓯', g: '𝓰', h: '𝓱', i: '𝓲', j: '𝓳',
    k: '𝓴', l: '𝓵', m: '𝓶', n: '𝓷', o: '𝓸',
    p: '𝓹', q: '𝓺', r: '𝓻', s: '𝓼', t: '𝓽',
    u: '𝓾', v: '𝓿', w: '𝔀', x: '𝔁', y: '𝔂', z: '𝔃'
  },
  'old-english': {
    a: '𝔞', b: '𝔟', c: '𝔠', d: '𝔡', e: '𝔢',
    f: '𝔣', g: '𝔤', h: '𝔥', i: '𝔦', j: '𝔧',
    k: '𝔨', l: '𝔩', m: '𝔪', n: '𝔫', o: '𝔬',
    p: '𝔭', q: '𝔮', r: '𝔯', s: '𝔰', t: '𝔱',
    u: '𝔲', v: '𝔳', w: '𝔴', x: '𝔵', y: '𝔶', z: '𝔷'
  },
  'cool-text': {
    a: 'ⓐ', b: 'ⓑ', c: 'ⓒ', d: 'ⓓ', e: 'ⓔ',
    f: 'ⓕ', g: 'ⓖ', h: 'ⓗ', i: 'ⓘ', j: 'ⓙ',
    k: 'ⓚ', l: 'ⓛ', m: 'ⓜ', n: 'ⓝ', o: 'ⓞ',
    p: 'ⓟ', q: 'ⓠ', r: 'ⓡ', s: 'ⓢ', t: 'ⓣ',
    u: 'ⓤ', v: 'ⓥ', w: 'ⓦ', x: 'ⓧ', y: 'ⓨ', z: 'ⓩ'
  }
};

// 日本語（かな・漢字）を全角に変換
function toFullWidth(str) {
  return str.replace(/[!-~]/g, s =>
    String.fromCharCode(s.charCodeAt(0) + 0xFEE0)
  );
}

// 変換関数
function convert(text, style) {
  const map = maps[style];
  return text.split('').map(char => {
    const lower = char.toLowerCase();
    if (map[lower]) {
      return char === lower ? map[lower] : map[lower].toUpperCase();
    }
    // 日本語などは全角化
    if (/[ぁ-んァ-ヶ一-龠]/.test(char)) {
      return toFullWidth(char);
    }
    return char;
  }).join('');
}

export default {
  data: new SlashCommandBuilder()
    .setName('font')
    .setDescription('文字を指定フォントに変換して送信')
    .addStringOption(option =>
      option.setName('style')
        .setDescription('変換スタイル')
        .setRequired(true)
        .addChoices(
          { name: 'bold-italic', value: 'bold-italic' },
          { name: 'cursive', value: 'cursive' },
          { name: 'old-english', value: 'old-english' },
          { name: 'cool-text', value: 'cool-text' }
        )
    )
    .addStringOption(option =>
      option.setName('text')
        .setDescription('変換するテキスト')
        .setRequired(true)
    ),
  async execute(interaction) {
    const style = interaction.options.getString('style');
    const text = interaction.options.getString('text');
    const converted = convert(text, style);
    await interaction.reply(`\`\`\`${converted}\`\`\``);
  }
};
