/**
 * Prisma Test Script
 * 
 * This script tests the Prisma client connection to MongoDB.
 * Run it with: node test-prisma.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Prisma connection to MongoDB...');
    
    // Test the connection by querying for users
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Found ${userCount} users in the database.`);
    
    // Get some basic stats about the database
    const studentCount = await prisma.student.count();
    const teacherCount = await prisma.teacher.count();
    const classCount = await prisma.class.count();
    const subjectCount = await prisma.subject.count();
    
    console.log('\nDatabase Statistics:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Students: ${studentCount}`);
    console.log(`- Teachers: ${teacherCount}`);
    console.log(`- Classes: ${classCount}`);
    console.log(`- Subjects: ${subjectCount}`);
    
    console.log('\nPrisma setup is working correctly!');
  } catch (error) {
    console.error('Error testing Prisma connection:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
