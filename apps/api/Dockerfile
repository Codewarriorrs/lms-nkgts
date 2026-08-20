# 1. Builder Stage
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

ENV NODE_ENV=development
ENV NODE_OPTIONS="--max-old-space-size=1024"

RUN npm install --workspace=apps/api

COPY apps/api ./apps/api

ENV PATH="/app/node_modules/.bin:/app/apps/api/node_modules/.bin:${PATH}"

RUN npm run build --workspace=apps/api

# 2. Production Runner Stage
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl curl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm install --workspace=apps/api --omit=dev

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/generated ./apps/api/generated
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]



