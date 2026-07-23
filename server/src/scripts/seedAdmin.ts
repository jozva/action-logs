import { connectDatabase, disconnectDatabase } from '../database/connection.js';
import * as userRepository from '../repositories/userRepository.js';
import { ensureDefaultPolicies } from '../services/policyService.js';
import { hashPassword } from '../utils/password.js';
import { logger } from '../utils/logger.js';

async function seedAdmin(): Promise<void> {
  await connectDatabase();
  await ensureDefaultPolicies();

  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@company.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const passwordHash = await hashPassword(password);
  const existing = (await userRepository.findUserByEmail(email)) as
    | ({ _id: unknown; region?: string } | null)
    | null;

  if (existing) {
    await userRepository.updateUser(String(existing._id), {
      name: 'System Admin',
      role: 'admin',
      status: 'active',
      passwordHash,
      region: existing.region ?? 'ap-south-1',
    });
    logger.info(`Reset demo admin ${email} (password refreshed)`);
  } else {
    await userRepository.createUser({
      name: 'System Admin',
      email,
      passwordHash,
      role: 'admin',
      region: 'ap-south-1',
    });
    logger.info(`Seeded admin user ${email} / ${password}`);
  }

  await disconnectDatabase();
}

seedAdmin().catch(async (error: unknown) => {
  logger.error('Admin seed failed', {
    message: error instanceof Error ? error.message : 'Unknown error',
  });
  await disconnectDatabase();
  process.exit(1);
});
