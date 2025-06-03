import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { client } from './bot/discord';
import { setupWebSocket } from './bot/ws';
import { setupRoutes } from './bot/routes';

dotenv.config();

const app = express();
const server = http.createServer(app);

setupWebSocket(server);
setupRoutes(app);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 Giao diện tại http://localhost:${PORT}`);
    console.log(`🌐 Tham gia: https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot&permissions=2048`);
});

client.login(process.env.DISCORD_TOKEN);