import axios from 'axios';
import { Client, GatewayIntentBits } from 'discord.js';
import { addHistory } from './history';
import { broadcast } from './ws';
import { getChannelConfig } from './configChannel';

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

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;
    addHistory(msg.channelId, msg.author.username, msg.content);

    const config = getChannelConfig(msg.channelId);

    // Nếu bật handleMessage, gửi webhook và chờ callback
    if (config.handleMessage && config.webhookUrl) {
        try {
            // Gửi đến webhook ngoài
            await axios.post(config.webhookUrl, {
                channelId: msg.channelId,
                author: msg.author.username,
                content: msg.content,
                callbackUrl: `${process.env.PUBLIC_URL}/webhook-callback/${msg.channelId}/${msg.id}`
            });
        } catch (e) {
            console.error('Gửi webhook thất bại:', e);
        }
        return; // Không reply ngay
    }

    // Nếu bật reply, reply lại
    if (config.reply) {
        msg.reply(`Bạn vừa nói: "${msg.content}"`);
    }
    broadcast(`[MSG] ${msg.author.username}: ${msg.content}`);
});