#!/bin/sh
# Railway start command: apply migrations, seed demo data unless SEED=false, then serve.
set -e
echo "[start] prisma migrate deploy"
node ./tools/node_modules/prisma/build/index.js migrate deploy
if [ "$SEED" != "false" ]; then
  echo "[start] prisma db seed (set SEED=false to skip)"
  node ./tools/node_modules/tsx/dist/cli.mjs --conditions=react-server prisma/seed.ts || echo "[start] seed skipped/failed (non-fatal)"
fi
echo "[start] node server.js"
exec node server.js
