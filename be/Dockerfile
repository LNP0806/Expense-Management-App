# 1. Base cài đặt dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# 2. Target "dev": Dùng cho phát triển (hỗ trợ nodemon)
FROM node:20-alpine AS dev
WORKDIR /app
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node . .
USER node
EXPOSE 3001
CMD ["npm", "run", "dev"]

# 3. Target "prod": Dùng cho production (chạy node trực tiếp, không nodemon)
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node . .
USER node
EXPOSE 3001
CMD ["node", "src/server.js"]