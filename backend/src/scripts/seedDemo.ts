/**
 * Runs before the server starts on a free host. Does nothing unless SEED_DEMO=true, and
 * never touches a database that already has accounts.
 */
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { DEMO_EMAIL, seedDemoIfEmpty } from '../services/demoSeed.service';

async function main() {
  if (!env.SEED_DEMO) {
    console.log('[ProFarm] SEED_DEMO is off: no demo data added.');
    return;
  }
  const { seeded } = await seedDemoIfEmpty(prisma, env.DEMO_PASSWORD);
  console.log(seeded ? `[ProFarm] Demo data added. Sign in as ${DEMO_EMAIL}.` : '[ProFarm] Accounts already exist: demo data skipped.');
}

main()
  .catch((error) => { console.error('[ProFarm] Demo seeding failed:', error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
