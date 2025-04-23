/**
 * Prisma Client Instance
 *
 * This file provides a singleton instance of the Prisma client to be used throughout the application.
 * In development, it uses a global variable to prevent multiple instances during hot reloading.
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL environment variable is not set. Prisma requires this to connect to the database.');
  logger.info('Attempting to use MONGODB_URI as fallback for Prisma connection...');

  // Try to use MONGODB_URI as fallback if available
  if (process.env.MONGODB_URI) {
    process.env.DATABASE_URL = process.env.MONGODB_URI;
    logger.info('Using MONGODB_URI as fallback for Prisma DATABASE_URL');
  } else {
    logger.error('Neither DATABASE_URL nor MONGODB_URI is set. Prisma will likely fail to connect.');
  }
}

// Declare a variable to store the Prisma client instance
let prisma;

// Create Prisma client with error handling
try {
  // Check if we're in production mode
  if (process.env.NODE_ENV === 'production') {
    // In production, create a new instance
    prisma = new PrismaClient();
    logger.info('Prisma client initialized in production mode');
  } else {
    // In development, use a global variable to prevent multiple instances during hot reloading
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      });
      logger.info('Prisma client initialized in development mode with logging enabled');
    }
    prisma = global.prisma;
  }

  // Test connection on startup
  prisma.$connect()
    .then(() => {
      logger.info('Prisma successfully connected to the database');
    })
    .catch((error) => {
      logger.error(`Prisma failed to connect to the database: ${error.message}`, error);
    });

} catch (error) {
  logger.error(`Error initializing Prisma client: ${error.message}`, error);
  // Create a mock Prisma client that logs errors instead of crashing
  prisma = new Proxy({}, {
    get: function(target, prop) {
      if (prop === '$connect' || prop === '$disconnect') {
        return () => Promise.reject(new Error('Prisma client failed to initialize'));
      }
      return function() {
        const error = new Error('Prisma client is not available');
        logger.error(`Attempted to use Prisma client method ${prop} but client failed to initialize`, error);
        return Promise.reject(error);
      };
    }
  });
}

module.exports = prisma;
