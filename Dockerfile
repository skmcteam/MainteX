# ── Stage 1: install all deps ────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

RUN npm install -g pnpm@11.4.0

COPY package.json pnpm-lock.yaml pnpm.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile


# ── Stage 2: build ───────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

RUN npm install -g pnpm@11.4.0

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for the container OS
RUN node_modules/.bin/prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm build


# ── Stage 3: runner ──────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

# Prisma requires OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone server + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

# Full node_modules so pnpm-nested Prisma paths resolve correctly
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Prisma schema (needed by migrate deploy)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
