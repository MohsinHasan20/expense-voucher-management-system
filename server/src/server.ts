import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    // Attempt database connection
    try {
      await connectDatabase();
    } catch (dbError) {
      logger.warn(
        'Could not connect to MongoDB initially. Ensure MongoDB is running or MONGODB_URI is correctly configured in .env.'
      );
    }

    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`Server is running at http://localhost:${config.port}`);
      logger.info(`Health check available at http://localhost:${config.port}/api/health`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Server closed. Process terminating.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error('Fatal bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();
