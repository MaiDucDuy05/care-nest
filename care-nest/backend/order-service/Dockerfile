FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.11.2 --activate

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc ./
COPY packages ./packages
COPY backend/order-service ./backend/order-service
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app /app
RUN pnpm --filter @carenest/order-service build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache libc6-compat dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
COPY --from=build --chown=nodejs:nodejs /app /app
USER nodejs
EXPOSE 3004
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/order-service/dist/main.js"]
