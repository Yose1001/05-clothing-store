# Frontend — build React แล้วเสิร์ฟด้วย nginx (multi-stage build)
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: เสิร์ฟไฟล์ static ที่ build แล้วด้วย nginx (image เล็กและเร็ว)
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
