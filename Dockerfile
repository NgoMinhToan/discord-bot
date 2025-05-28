FROM node:18

WORKDIR /app

# Chỉ copy package info trước
COPY package*.json ./

# Cài esbuild đúng trong môi trường container
RUN npm install

# Sau đó mới copy code vào
COPY . .

# Build TypeScript
RUN npm run build

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
