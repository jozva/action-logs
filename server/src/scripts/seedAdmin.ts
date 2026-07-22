import { connectDatabase, disconnectDatabase } from '../database/connection.js';
import * as userRepository from '../repositories/userRepository.js';
import { ensureDefaultPolicies } from '../services/policyService.js';
import { hashPassword } from '../utils/password.js';
import { logger } from '../utils/logger.js';

async function seedAdmin(): Promise<void> {
  await connectDatabase();
  await ensureDefaultPolicies();

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@company.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const existing = await userRepository.findUserByEmail(email);

  if (existing) {
    logger.info(`Admin already exists: ${email}`);
  } else {
    const passwordHash = await hashPassword(password);
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
