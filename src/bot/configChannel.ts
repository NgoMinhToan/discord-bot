interface ChannelConfig {
  reply: boolean;
  handleMessage: boolean;
  webhookUrl?: string;
}

const defaultConfig: ChannelConfig = {
  reply: process.env.REPLY_ENABLED === 'true',
  handleMessage: false,
};

const channelConfigs: { [channelId: string]: ChannelConfig } = {};

export function getChannelConfig(channelId: string): ChannelConfig {
  if (!channelConfigs[channelId]) {
    channelConfigs[channelId] = { ...defaultConfig };
  }
  return channelConfigs[channelId];
}

export function setChannelConfig(channelId: string, config: Partial<ChannelConfig>) {
  channelConfigs[channelId] = { ...getChannelConfig(channelId), ...config };
}

export function getAllConfigs() {
  return channelConfigs;
}