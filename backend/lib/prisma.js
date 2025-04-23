/**
 * Prisma Client Instance
 * 
 * This file provides a singleton instance of the Prisma client to be used throughout the application.
 * In development, it uses a global variable to prevent multiple instances during hot reloading.
 */

const { PrismaClient } = require('@prisma/client');

// Declare a variable to store the Prisma client instance
let prisma;

// Check if we're in production mode
if (process.env.NODE_ENV === 'production') {
  // In production, create a new instance
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to prevent multiple instances during hot reloading
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.prisma;
}

module.exports = prisma;
