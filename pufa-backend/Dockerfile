FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy only source files needed for build (avoid copying secrets like .env)
COPY tsconfig*.json ./
COPY tsconfig.build.json ./
COPY nest-cli.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy only production artifacts
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
