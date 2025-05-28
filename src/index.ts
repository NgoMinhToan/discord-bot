import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
    console.log(`🤖 Bot đã đăng nhập với tên ${client.user?.tag}`);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    message.reply(`Bạn vừa nói: ${message.content}`);
});

client.login(process.env.DISCORD_TOKEN);
