# 1. Base cài đặt dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# 2. Target "dev": Dùng cho phát triển (Vite dev server + Hot Module Replacement)
FROM node:20-alpine AS dev
WORKDIR /app
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node . .
USER node
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# 3. Target "builder": Build mã nguồn React ra thư mục dist
FROM dev AS builder
USER root
RUN npm run build

# 4. Target "prod": Dùng cho production (Nginx siêu nhẹ phục vụ file tĩnh)
FROM nginx:alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]