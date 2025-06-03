import { Request, Response } from 'express';
import axios from 'axios';

export function setupRoutes(app: any) {
    app.get('/callback', async (req: Request, res: Response) => {
        const code = req.query.code as string;
        if (!code) return res.status(400).send('Thiếu mã code từ Discord');
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
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            const accessToken = response.data.access_token;
            const userInfo = await axios.get('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` },
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
}