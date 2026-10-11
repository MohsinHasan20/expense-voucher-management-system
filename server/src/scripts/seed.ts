import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { seedDataOnly } from '../services/seedService.js';
import { logger } from '../utils/logger.js';

export async function seedDatabase(customUri?: string) {
  logger.info('Starting database seeding...');
  try {
    await connectDatabase(customUri);
    await seedDataOnly();
    logger.info('Seeding finished successfully.');
  } catch (error) {
    logger.error('Seeding error:', error);
    throw error;
  } finally {
    await disconnectDatabase();
  }
}

// Run directly if invoked from CLI
if (process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
