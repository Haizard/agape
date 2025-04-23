/**
 * Mongoose to Prisma Migration Utility
 * 
 * This script helps migrate data from Mongoose models to Prisma.
 * It provides functions to migrate specific collections or all collections.
 * 
 * Run it with: node scripts/migrate-to-prisma.js [collection]
 * 
 * Examples:
 *   node scripts/migrate-to-prisma.js users
 *   node scripts/migrate-to-prisma.js all
 */

const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Mongoose and Prisma
const prisma = new PrismaClient();
const mongoUri = process.env.DATABASE_URL || 'mongodb://localhost:27017/agape_db';

// Import Mongoose models
require('../models/User');
require('../models/Teacher');
require('../models/Student');
require('../models/AcademicYear');
require('../models/Class');
require('../models/Subject');
require('../models/Exam');
require('../models/ExamType');
require('../models/Result');

// Get Mongoose models
const User = mongoose.model('User');
const Teacher = mongoose.model('Teacher');
const Student = mongoose.model('Student');
const AcademicYear = mongoose.model('AcademicYear');
const Class = mongoose.model('Class');
const Subject = mongoose.model('Subject');
const Exam = mongoose.model('Exam');
const ExamType = mongoose.model('ExamType');
const Result = mongoose.model('Result');

// Migration functions for each collection
const migrationFunctions = {
  // Migrate users
  async users() {
    console.log('Migrating users...');
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        // Check if user already exists in Prisma
        const existingUser = await prisma.user.findUnique({
          where: { id: user._id.toString() }
        });
        
        if (existingUser) {
          console.log(`User ${user.username} already exists in Prisma, skipping`);
          continue;
        }
        
        // Create user in Prisma
        await prisma.user.create({
          data: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            password: user.password,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        });
        
        successCount++;
        console.log(`Migrated user: ${user.username}`);
      } catch (error) {
        errorCount++;
        console.error(`Error migrating user ${user.username}:`, error);
      }
    }
    
    console.log(`Users migration completed: ${successCount} succeeded, ${errorCount} failed`);
  },
  
  // Migrate teachers
  async teachers() {
    console.log('Migrating teachers...');
    const teachers = await Teacher.find({});
    console.log(`Found ${teachers.length} teachers to migrate`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const teacher of teachers) {
      try {
        // Check if teacher already exists in Prisma
        const existingTeacher = await prisma.teacher.findUnique({
          where: { id: teacher._id.toString() }
        });
        
        if (existingTeacher) {
          console.log(`Teacher ${teacher.firstName} ${teacher.lastName} already exists in Prisma, skipping`);
          continue;
        }
        
        // Create teacher in Prisma
        await prisma.teacher.create({
          data: {
            id: teacher._id.toString(),
            userId: teacher.userId ? teacher.userId.toString() : null,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: teacher.email,
            contactNumber: teacher.contactNumber,
            qualification: teacher.qualification,
            experience: teacher.experience,
            employeeId: teacher.employeeId,
            status: teacher.status || 'active',
            createdAt: teacher.createdAt,
            updatedAt: teacher.updatedAt
          }
        });
        
        successCount++;
        console.log(`Migrated teacher: ${teacher.firstName} ${teacher.lastName}`);
      } catch (error) {
        errorCount++;
        console.error(`Error migrating teacher ${teacher.firstName} ${teacher.lastName}:`, error);
      }
    }
    
    console.log(`Teachers migration completed: ${successCount} succeeded, ${errorCount} failed`);
  },
  
  // Migrate academic years
  async academicYears() {
    console.log('Migrating academic years...');
    const academicYears = await AcademicYear.find({});
    console.log(`Found ${academicYears.length} academic years to migrate`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const academicYear of academicYears) {
      try {
        // Check if academic year already exists in Prisma
        const existingAcademicYear = await prisma.academicYear.findUnique({
          where: { id: academicYear._id.toString() }
        });
        
        if (existingAcademicYear) {
          console.log(`Academic year ${academicYear.name} already exists in Prisma, skipping`);
          continue;
        }
        
        // Create academic year in Prisma
        await prisma.academicYear.create({
          data: {
            id: academicYear._id.toString(),
            name: academicYear.name,
            startDate: academicYear.startDate,
            endDate: academicYear.endDate,
            isCurrent: academicYear.isCurrent || false,
            createdAt: academicYear.createdAt,
            updatedAt: academicYear.updatedAt
          }
        });
        
        successCount++;
        console.log(`Migrated academic year: ${academicYear.name}`);
      } catch (error) {
        errorCount++;
        console.error(`Error migrating academic year ${academicYear.name}:`, error);
      }
    }
    
    console.log(`Academic years migration completed: ${successCount} succeeded, ${errorCount} failed`);
  },
  
  // Migrate classes
  async classes() {
    console.log('Migrating classes...');
    const classes = await Class.find({});
    console.log(`Found ${classes.length} classes to migrate`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const classObj of classes) {
      try {
        // Check if class already exists in Prisma
        const existingClass = await prisma.class.findUnique({
          where: { id: classObj._id.toString() }
        });
        
        if (existingClass) {
          console.log(`Class ${classObj.name} already exists in Prisma, skipping`);
          continue;
        }
        
        // Create class in Prisma
        await prisma.class.create({
          data: {
            id: classObj._id.toString(),
            name: classObj.name,
            stream: classObj.stream,
            section: classObj.section,
            academicYearId: classObj.academicYear.toString(),
            educationLevel: classObj.educationLevel || 'O_LEVEL',
            capacity: classObj.capacity,
            classTeacherId: classObj.classTeacher ? classObj.classTeacher.toString() : null,
            createdAt: classObj.createdAt,
            updatedAt: classObj.updatedAt
          }
        });
        
        successCount++;
        console.log(`Migrated class: ${classObj.name}`);
      } catch (error) {
        errorCount++;
        console.error(`Error migrating class ${classObj.name}:`, error);
      }
    }
    
    console.log(`Classes migration completed: ${successCount} succeeded, ${errorCount} failed`);
  },
  
  // Migrate subjects
  async subjects() {
    console.log('Migrating subjects...');
    const subjects = await Subject.find({});
    console.log(`Found ${subjects.length} subjects to migrate`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const subject of subjects) {
      try {
        // Check if subject already exists in Prisma
        const existingSubject = await prisma.subject.findUnique({
          where: { id: subject._id.toString() }
        });
        
        if (existingSubject) {
          console.log(`Subject ${subject.name} already exists in Prisma, skipping`);
          continue;
        }
        
        // Create subject in Prisma
        await prisma.subject.create({
          data: {
            id: subject._id.toString(),
            name: subject.name,
            code: subject.code,
            type: subject.type || 'CORE',
            educationLevel: subject.educationLevel || 'O_LEVEL',
            isCompulsory: subject.isCompulsory || false,
            isPrincipal: subject.isPrincipal || false,
            description: subject.description,
            passMark: subject.passMark || 40,
            createdAt: subject.createdAt,
            updatedAt: subject.updatedAt
          }
        });
        
        successCount++;
        console.log(`Migrated subject: ${subject.name}`);
      } catch (error) {
        errorCount++;
        console.error(`Error migrating subject ${subject.name}:`, error);
      }
    }
    
    console.log(`Subjects migration completed: ${successCount} succeeded, ${errorCount} failed`);
  },
  
  // Migrate students
  async students() {
    console.log('Migrating students...');
    const students = await Student.find({});
    console.log(`Found ${students.length} students to migrate`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const student of students) {
      try {
        // Check if student already exists in Prisma
        const existingStudent = await prisma.student.findUnique({
          where: { id: student._id.toString() }
        });
        
        if (existingStudent) {
          console.log(`Student ${student.firstName} ${student.lastName} already exists in Prisma, skipping`);
          continue;
        }
        
        // Create student in Prisma
        await prisma.student.create({
          data: {
            id: student._id.toString(),
            userId: student.userId.toString(),
            firstName: student.firstName,
            lastName: student.lastName,
            middleName: student.middleName,
            email: student.email,
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            classId: student.class.toString(),
            educationLevel: student.educationLevel || 'O_LEVEL',
            form: student.form || 1,
            previousEducationLevel: student.previousEducationLevel,
            subjectCombinationId: student.subjectCombination ? student.subjectCombination.toString() : null,
            admissionNumber: student.admissionNumber,
            rollNumber: student.rollNumber,
            status: student.status || 'active',
            createdAt: student.createdAt,
            updatedAt: student.updatedAt
          }
        });
        
        successCount++;
        console.log(`Migrated student: ${student.firstName} ${student.lastName}`);
      } catch (error) {
        errorCount++;
        console.error(`Error migrating student ${student.firstName} ${student.lastName}:`, error);
      }
    }
    
    console.log(`Students migration completed: ${successCount} succeeded, ${errorCount} failed`);
  },
  
  // Migrate class-subject relationships
  async classSubjects() {
    console.log('Migrating class-subject relationships...');
    const classes = await Class.find({}).populate('subjects.subject subjects.teacher');
    console.log(`Found ${classes.length} classes to process for class-subject relationships`);
    
    let totalRelationships = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (const classObj of classes) {
      if (!classObj.subjects || classObj.subjects.length === 0) {
        console.log(`Class ${classObj.name} has no subjects, skipping`);
        continue;
      }
      
      totalRelationships += classObj.subjects.length;
      
      for (const subjectRelation of classObj.subjects) {
        try {
          if (!subjectRelation.subject) {
            console.log(`Invalid subject relation in class ${classObj.name}, skipping`);
            continue;
          }
          
          const subjectId = subjectRelation.subject._id || subjectRelation.subject;
          const teacherId = subjectRelation.teacher ? (subjectRelation.teacher._id || subjectRelation.teacher) : null;
          
          // Check if relationship already exists
          const existingRelation = await prisma.classSubject.findFirst({
            where: {
              classId: classObj._id.toString(),
              subjectId: subjectId.toString()
            }
          });
          
          if (existingRelation) {
            console.log(`Class-subject relationship already exists for class ${classObj.name} and subject ${subjectId}, skipping`);
            continue;
          }
          
          // Create relationship in Prisma
          await prisma.classSubject.create({
            data: {
              classId: classObj._id.toString(),
              subjectId: subjectId.toString(),
              teacherId: teacherId ? teacherId.toString() : null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          successCount++;
          console.log(`Migrated class-subject relationship: Class ${classObj.name}, Subject ${subjectId}`);
        } catch (error) {
          errorCount++;
          console.error(`Error migrating class-subject relationship for class ${classObj.name}:`, error);
        }
      }
    }
    
    console.log(`Class-subject relationships migration completed: ${successCount} succeeded, ${errorCount} failed out of ${totalRelationships} total`);
  },
  
  // Migrate all collections
  async all() {
    console.log('Migrating all collections...');
    
    // Migrate in order to respect foreign key constraints
    await this.users();
    await this.academicYears();
    await this.teachers();
    await this.subjects();
    await this.classes();
    await this.students();
    await this.classSubjects();
    
    console.log('All collections migration completed!');
  }
};

// Main function
async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Get collection to migrate from command line arguments
    const collection = process.argv[2] || 'all';
    
    if (!migrationFunctions[collection]) {
      console.error(`Unknown collection: ${collection}`);
      console.log('Available collections:', Object.keys(migrationFunctions).join(', '));
      process.exit(1);
    }
    
    // Run migration
    await migrationFunctions[collection]();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Disconnect from MongoDB and Prisma
    await mongoose.disconnect();
    await prisma.$disconnect();
  }
}

// Run the migration
main();
