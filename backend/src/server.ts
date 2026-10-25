import { app } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const server = app.listen(env.PORT, () => {
  console.log(`[ProFarm API] Server running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`);
});

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  console.log(`[ProFarm API] Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    console.log('[ProFarm API] HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('[ProFarm API] Database connection closed.');
      process.exit(0);
    } catch (error) {
      console.error('[ProFarm API] Error during database disconnect:', error);
      process.exit(1);
    }
  });

  // Force shutdown if cleanup hangs
  setTimeout(() => {
    console.error('[ProFarm API] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
