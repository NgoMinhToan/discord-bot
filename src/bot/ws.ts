import WebSocket, { WebSocketServer } from 'ws';
import { client } from './discord';
import { addHistory, getHistory } from './history';
import { getChannelConfig, setChannelConfig } from './configChannel';

export const clients: WebSocket[] = [];

export function broadcast(message: string) {
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

export function setupWebSocket(server: any) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        clients.push(ws);

        const guild = client.guilds.cache.first();
        if (guild) {
            const textChannels = guild.channels.cache
                .filter((c) => c.isTextBased() && c.type === 0)
                .map((c) => {
                    const config = getChannelConfig(c.id);
                    return {
                        id: c.id,
                        name: c.name,
                        reply: config.reply,
                        handleMessage: config.handleMessage,
                        webhookUrl: config.webhookUrl || ''
                    };
                });
            ws.send(JSON.stringify({ type: 'channels', channels: textChannels }));

            if (textChannels.length > 0) {
                const firstChannelId = textChannels[0].id;
                ws.send(JSON.stringify({
                    type: 'history',
                    channelId: firstChannelId,
                    history: getHistory(firstChannelId)
                }));
            }
        }

        ws.on('close', () => {
            const i = clients.indexOf(ws);
            if (i >= 0) clients.splice(i, 1);
        });

        ws.on('message', async (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'load_history' && msg.channelId) {
                    ws.send(JSON.stringify({
                        type: 'history',
                        channelId: msg.channelId,
                        history: getHistory(msg.channelId)
                    }));
                    return;
                }
                if (msg.type === 'send' && typeof msg.content === 'string' && msg.channelId) {
                    addHistory(msg.channelId, 'web', msg.content);

                    // Gửi vào kênh Discord
                    if (guild) {
                        const channel = guild.channels.cache.get(msg.channelId);
                        if (channel?.isTextBased()) {
                            await (channel as any).send(`[Web] ${msg.content}`);
                        }
                    }

                    broadcast(JSON.stringify({
                        type: 'web_message',
                        channel: msg.channelId,
                        content: msg.content
                    }));
                }
                // Nhận cấu hình từ client
                if (msg.type === 'set_channel_config' && msg.channelId) {
                    setChannelConfig(msg.channelId, msg.config);
                    broadcast(JSON.stringify({
                        type: 'channel_config',
                        channelId: msg.channelId,
                        config: getChannelConfig(msg.channelId)
                    }));
                    return;
                }
            } catch (e) {
                console.error('WS message error:', e);
            }
        });
    });
}