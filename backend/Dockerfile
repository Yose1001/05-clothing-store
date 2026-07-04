# Backend — Express API
FROM node:20-alpine

WORKDIR /app

# ติดตั้ง dependencies ก่อน copy โค้ด เพื่อให้ Docker cache layer นี้ได้
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 5000

CMD ["node", "src/server.js"]
