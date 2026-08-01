FROM node:20-alpine

# Install OpenSSL untuk kebutuhan Prisma Client
RUN apk add --no-cache openssl

WORKDIR /app

# Copy file package untuk instalasi dependency monorepo
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install dependencies (termasuk devDependencies untuk build dan prisma)
RUN NODE_ENV=development npm install

# Copy source code backend
COPY apps/api ./apps/api

# Jalankan prisma generate dan build NestJS
RUN ./apps/api/node_modules/.bin/prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build -w apps/api

EXPOSE 3001

# Command untuk menjalankan server NestJS production
CMD ["node", "apps/api/dist/main.js"]
