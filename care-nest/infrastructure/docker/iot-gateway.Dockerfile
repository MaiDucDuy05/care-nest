# Multi-stage Dockerfile for the iot-gateway (TCP server)
# Smaller surface — only depends on @carenest/iot-codec + Kafka client.

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.11.2 --activate

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc ./
COPY packages ./packages
COPY backend ./backend
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app /app
RUN pnpm --filter @carenest/iot-gateway build

FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache libc6-compat dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
COPY --from=build --chown=nodejs:nodejs /app/packages/iot-codec/dist ./packages/iot-codec/dist
COPY --from=build --chown=nodejs:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=build --chown=nodejs:nodejs /app/packages/shared-config/dist ./packages/shared-config/dist
COPY --from=build --chown=nodejs:nodejs /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=build --chown=nodejs:nodejs /app/backend/iot-gateway/dist ./backend/iot-gateway/dist
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
USER nodejs
EXPOSE 18800
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/iot-gateway/dist/main.js"]
