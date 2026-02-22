FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json package-lock.json ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "run", "start"]

ENV NODE_ENV=production
ENV OTEL_SERVICE_NAME=yetibot
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
