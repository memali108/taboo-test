/**
 * Demo data for the admin dashboard.
 *
 * PHASE 1: a no-op. The Attempt flow lands in Phase 2 and the admin pages in
 * Phase 4, so there is nothing yet worth faking. The script, its
 * `--conditions=react-server` invocation and the `SEED=false` guard are wired
 * up now so the container start sequence is the real one from day one.
 *
 * When it does seed (~300 submitted attempts, SPEC §9), every row must carry
 * `isSeed: true`, and production must set SEED=false.
 */
async function main() {
  if (process.env.SEED === "false") {
    console.log("[seed] SEED=false, skipping");
    return;
  }
  console.log("[seed] nothing to seed yet (Phase 1)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
