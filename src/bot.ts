import { Client, GatewayIntentBits } from 'discord.js';
import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// === Khởi tạo bot ===
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // phải bật trong Discord Developer Portal
    ],
});

client.once('ready', () => {
    console.log(`🤖 Bot đã đăng nhập: ${client.user?.tag}`);
    broadcast(`[INFO] Bot đã đăng nhập: ${client.user?.tag}`);
});

client.on('messageCreate', (msg) => {
    // Đừng nhại chính mình
    if (msg.author.bot) return;

    const content = `[MSG] ${msg.author.username}: ${msg.content}`;
    console.log(content);
    msg.reply(`Bạn vừa nói: "${msg.content}"`);
    broadcast(content);
});

client.login(process.env.DISCORD_TOKEN);

// === WebSocket + Express Server ===

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients: WebSocket[] = [];

wss.on('connection', (ws) => {
    console.log('📡 Web client connected');
    clients.push(ws);

    // Gửi danh sách kênh text về client khi vừa kết nối
    const guild = client.guilds.cache.first();
    if (guild) {
        const textChannels = guild.channels.cache
            .filter((c) => c.isTextBased() && c.type === 0)
            .map((c) => ({ id: c.id, name: c.name }));
        ws.send(JSON.stringify({ type: 'channels', channels: textChannels }));
    }

    ws.on('close', () => {
        const i = clients.indexOf(ws);
        if (i >= 0) clients.splice(i, 1);
    });

    ws.on('message', async (data) => {
        try {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'send' && typeof msg.content === 'string' && msg.channelId) {
                // Lấy tên kênh
                const guild = client.guilds.cache.first();
                let channelName = msg.channelId;
                if (guild) {
                    const channel = guild.channels.cache.get(msg.channelId);
                    if (channel) channelName = channel.name;
                }
                // Broadcast với định dạng mới
                broadcast(JSON.stringify({
                    type: 'web_message',
                    channel: channelName,
                    content: msg.content
                }));

                // Gửi vào kênh được chọn
                if (guild) {
                    const channel = guild.channels.cache.get(msg.channelId);
                    if (channel?.isTextBased()) {
                        await (channel as any).send(`[Web] ${msg.content}`);
                    }
                }
            }
        } catch (e) {
            console.error('WS message error:', e);
        }
    });
});

function broadcast(message: string) {
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

// Giao diện frontend
app.use(express.static(path.join(__dirname, 'public')));


(app.get as any)('/callback', async (req: Request, res: Response) => {

    const code = req.query.code as string;

    if (!code) {
        return res.status(400).send('Thiếu mã code từ Discord');
    }

    try {
        const params = new URLSearchParams();
        params.append('client_id', process.env.DISCORD_CLIENT_ID!);
        params.append('client_secret', process.env.DISCORD_CLIENT_SECRET!);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', process.env.DISCORD_REDIRECT_URI!);

        const response = await axios.post(
            'https://discord.com/api/oauth2/token',
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const accessToken = response.data.access_token;

        // Gọi tiếp để lấy user info nếu cần
        const userInfo = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        res.send(`
        <h1>Đăng nhập thành công!</h1>
        <pre>${JSON.stringify(userInfo.data, null, 2)}</pre>
      `);
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi trao đổi code với Discord');
    }
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 Giao diện tại http://localhost:${PORT}`);
    console.log(`🌐 Tham gia: https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot&permissions=2048`);
});


// https://discordapi.com/permissions.html#2048