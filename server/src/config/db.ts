import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env.js';
import { logger } from '../utils/logger.js';
import { seedDataOnly } from '../services/seedService.js';
import { User } from '../models/User.js';

let embeddedMemoryServer: MongoMemoryServer | null = null;

export async function connectDatabase(uri = config.mongodbUri): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  try {
    // Attempt connecting to the configured URI with a fast 3-second timeout
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    logger.info(`MongoDB connected successfully to: ${conn.connection.host}/${conn.connection.name}`);

    // If connected to a fresh/empty database, auto-seed demo accounts
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info('Database is empty. Automatically initializing demo accounts...');
      await seedDataOnly();
    }

    return conn;
  } catch (error: any) {
    // If external/local MongoDB is not available and we are in development mode, spin up embedded in-memory MongoDB
    if (config.nodeEnv !== 'production') {
      logger.warn(
        `Could not connect to external MongoDB at ${uri} (${error.message}). Starting embedded MongoMemoryServer for development...`
      );

      if (!embeddedMemoryServer) {
        embeddedMemoryServer = await MongoMemoryServer.create();
      }

      const memoryUri = embeddedMemoryServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      logger.info(`Embedded MongoDB running at: ${memoryUri}`);

      // Seed initial data
      await seedDataOnly();
      logger.info('----------------------------------------------------');
      logger.info('PSPL Demo Accounts Ready for Login:');
      logger.info('  1. Employee: employee@pspl.com  / Password123!');
      logger.info('  2. Director: director@pspl.com  / Password123!');
      logger.info('  3. Accounts: accounts@pspl.com  / Password123!');
      logger.info('----------------------------------------------------');

      return conn;
    }

    logger.error('Fatal MongoDB connection error in production:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (embeddedMemoryServer) {
      await embeddedMemoryServer.stop();
      embeddedMemoryServer = null;
    }
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error during MongoDB disconnect:', error);
  }
}
