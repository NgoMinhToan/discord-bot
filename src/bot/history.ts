const MAX_HISTORY = parseInt(process.env.MAX_HISTORY || '30', 10);

export interface Message {
    from: string;
    content: string;
}

const channelHistories: { [channelId: string]: Message[] } = {};

export function addHistory(channelId: string, from: string, content: string) {
    if (!channelHistories[channelId]) channelHistories[channelId] = [];
    channelHistories[channelId].push({ from, content });
    if (channelHistories[channelId].length > MAX_HISTORY) {
        channelHistories[channelId].shift();
    }
}

export function getHistory(channelId: string): Message[] {
    return channelHistories[channelId] || [];
}