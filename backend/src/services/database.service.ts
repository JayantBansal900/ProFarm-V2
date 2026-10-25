import { prisma } from '../lib/prisma';

export interface DatabaseHealthResult {
  connected: boolean;
  latencyMs: number;
}

export class DatabaseService {
  /**
   * Safe connectivity check without disclosing schemas or sensitive credentials
   */
  static async checkConnection(): Promise<DatabaseHealthResult> {
    const startTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1 as is_alive`;
      const latencyMs = Date.now() - startTime;
      return {
        connected: true,
        latencyMs,
      };
    } catch {
      return {
        connected: false,
        latencyMs: Date.now() - startTime,
      };
    }
  }
}
