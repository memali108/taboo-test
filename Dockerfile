# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
# Only the CLI tooling needed at container start (migrate + seed); runtime deps come from the standalone bundle.
RUN npm ci --omit=dev --ignore-scripts \
 && rm -rf node_modules/next node_modules/@next node_modules/@img node_modules/typescript \
           node_modules/react node_modules/react-dom node_modules/sharp

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* is inlined at BUILD time, so the origin has to reach this stage.
# Railway passes service variables as build args, but Docker only exposes one
# that is declared with ARG — without this line the build silently bakes in the
# localhost fallback and every absolute URL in the GHL payload is wrong.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npx prisma generate && npm run build

FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
# Standalone server + static assets
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
# Prisma CLI, tsx and the seed script inputs for `migrate deploy` / `db seed` at start
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./tools/node_modules
COPY --from=build --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
# server-only is bundled by Next, so the seed script needs its own copy beside the app
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules/server-only ./node_modules/server-only
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/src/lib/scoring.ts ./src/lib/scoring.ts
COPY --from=build --chown=nextjs:nodejs /app/src/lib/public-id.ts ./src/lib/public-id.ts
COPY --from=build --chown=nextjs:nodejs /app/src/config ./src/config
COPY --chown=nextjs:nodejs scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["./scripts/start.sh"]
