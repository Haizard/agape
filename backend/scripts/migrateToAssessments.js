const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Assessment = require('../models/Assessment');
const Result = require('../models/Result');
require('dotenv').config();

/**
 * Migration Script
 * Converts existing exam records to the new assessment structure
 */
async function migrateToAssessments() {
  try {
    console.log('Starting migration to new assessment structure...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to database');

    // Get all existing exams
    const exams = await Exam.find().populate('createdBy');
    console.log(`Found ${exams.length} exams to migrate`);

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Migrate each exam
      for (const exam of exams) {
        console.log(`Migrating exam: ${exam.name}`);

        // Create new assessment
        const assessment = new Assessment({
          name: exam.name,
          weightage: 100, // Default to 100% as it's a single assessment
          maxMarks: exam.maxMarks || 100,
          term: exam.term || '1',
          examDate: exam.examDate || exam.createdAt,
          status: 'active',
          description: `Migrated from exam: ${exam.name}`,
          createdBy: exam.createdBy?._id || exam.createdBy,
          createdAt: exam.createdAt,
          updatedAt: exam.updatedAt
        });

        await assessment.save({ session });

        // Migrate exam results
        const results = await Result.find({ examId: exam._id });
        console.log(`Migrating ${results.length} results for exam: ${exam.name}`);

        for (const result of results) {
          const newResult = new Result({
            studentId: result.studentId,
            assessmentId: assessment._id,
            marksObtained: result.marksObtained,
            maxMarks: assessment.maxMarks,
            grade: assessment.calculateGrade(result.marksObtained),
            term: assessment.term,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt
          });

          await newResult.save({ session });
        }

        // Archive old exam
        exam.status = 'archived';
        exam.notes = `Migrated to assessment: ${assessment._id}`;
        await exam.save({ session });

        console.log(`Successfully migrated exam: ${exam.name}`);
      }

      // Commit transaction
      await session.commitTransaction();
      console.log('Migration completed successfully');

    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  migrateToAssessments()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateToAssessments;