FROM node:20-bullseye-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev \
  && npm cache clean --force

COPY . .

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
