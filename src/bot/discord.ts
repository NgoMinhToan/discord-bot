import { Client, GatewayIntentBits } from 'discord.js';
import { addHistory } from './history';
import { broadcast } from './ws';

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log(`🤖 Bot đã đăng nhập: ${client.user?.tag}`);
    broadcast(`[INFO] Bot đã đăng nhập: ${client.user?.tag}`);
});

client.on('messageCreate', (msg) => {
    if (msg.author.bot) return;
    addHistory(msg.channelId, msg.author.username, msg.content);

    const content = `[MSG] ${msg.author.username}: ${msg.content}`;
    console.log(content);
    msg.reply(`Bạn vừa nói: "${msg.content}"`);
    broadcast(content);
});