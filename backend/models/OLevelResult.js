const mongoose = require('mongoose');
const oLevelGradeCalculator = require('../utils/oLevelGradeCalculator');
const logger = require('../utils/logger');
const MarksHistory = require('./MarksHistory');

const OLevelResultSchema = new mongoose.Schema({
  // Core fields
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  examTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamType', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  marksObtained: { type: Number, required: true },
  
  // Assessment marks
  assessments: [{
    name: { type: String, required: true },
    weightage: { type: Number, required: true, min: 0, max: 100 },
    marksObtained: { type: Number, required: true, min: 0, max: 100 },
    term: { type: String, required: true },
    examDate: Date,
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING'
    }
  }],
  totalWeightage: {
    type: Number,
    validate: {
      validator: function(v) {
        return this.assessments.reduce((sum, a) => sum + a.weightage, 0) === 100;
      },
      message: 'Total weightage must equal 100%'
    }
  },

  // Result processing fields
  grade: { type: String },
  points: { type: Number },
  comment: { type: String },

  // Alias fields for compatibility with report routes
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
  examType: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamType' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to set alias fields and calculate grade/points
OLevelResultSchema.pre('save', function(next) {
  // Set alias fields to match the original fields
  this.student = this.studentId;
  this.exam = this.examId;
  this.academicYear = this.academicYearId;
  this.examType = this.examTypeId;
  this.subject = this.subjectId;
  this.class = this.classId;

  // Calculate final marks based on weighted assessments if they exist
  if (this.assessments && this.assessments.length > 0) {
    const totalWeightedMarks = this.assessments.reduce((sum, assessment) => {
      return sum + (assessment.marksObtained * (assessment.weightage / 100));
    }, 0);
    this.marksObtained = Math.round(totalWeightedMarks * 100) / 100; // Round to 2 decimal places
    
    logger.debug(`[O-LEVEL] Calculated weighted marks: ${this.marksObtained} from ${this.assessments.length} assessments`);
  }

  // Calculate grade and points based on O-LEVEL grading system
  if (this.marksObtained !== undefined) {
    // Use the O-Level specific grade calculator
    const { grade, points } = oLevelGradeCalculator.calculateGradeAndPoints(this.marksObtained);
    this.grade = grade;
    this.points = points;

    // Log the grade calculation for debugging
    logger.debug(`[O-LEVEL] Calculated grade for marks ${this.marksObtained}: ${this.grade} (${this.points} points)`);
    logger.debug(`[O-LEVEL] Result for student ${this.studentId}, subject ${this.subjectId}, exam ${this.examId}`);
  }

  // Set updatedAt timestamp
  this.updatedAt = Date.now();

  next();
});

// Add a unique compound index to ensure each student has only one result per subject per exam per academic year
OLevelResultSchema.index(
  {
    studentId: 1,
    subjectId: 1,
    examId: 1,
    academicYearId: 1,
    examTypeId: 1,
    classId: 1
  },
  { unique: true }
);

// Add a pre-save hook to validate that marks are not duplicated across subjects
OLevelResultSchema.pre('save', async function(next) {
  try {
    // Skip validation for updates to existing documents
    if (!this.isNew) {
      return next();
    }

    // Check if this student already has a result for this exam, academic year, and exam type
    // but for a different subject
    const OLevelResult = this.constructor;
    const existingResult = await OLevelResult.findOne({
      studentId: this.studentId,
      examId: this.examId,
      academicYearId: this.academicYearId,
      examTypeId: this.examTypeId,
      classId: this.classId,
      subjectId: { $ne: this.subjectId } // Different subject
    });

    if (existingResult) {
      logger.debug(`[O-LEVEL] Found existing result for student ${this.studentId} in exam ${this.examId} for subject ${existingResult.subjectId}`);
      logger.debug(`[O-LEVEL] Ensuring marks are not duplicated from subject ${existingResult.subjectId} to ${this.subjectId}`);

      // If the marks are exactly the same, it might be a duplicate
      if (existingResult.marksObtained === this.marksObtained) {
        logger.warn(`[O-LEVEL] Potential duplicate marks detected: ${this.marksObtained} for student ${this.studentId} across subjects ${existingResult.subjectId} and ${this.subjectId}`);
        // We'll allow it but log a warning, as it could be legitimate that a student got the same marks in different subjects
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware to track history
OLevelResultSchema.post('save', async function(doc, next) {
  try {
    // Skip history tracking for new documents (CREATE is handled separately)
    if (this.isNew) {
      // Create a history entry for new document
      const historyEntry = new MarksHistory({
        resultId: doc._id,
        resultModel: 'OLevelResult',
        studentId: doc.studentId,
        subjectId: doc.subjectId,
        examId: doc.examId,
        academicYearId: doc.academicYearId,
        classId: doc.classId,
        userId: doc.__userId || doc.lastModifiedBy || mongoose.Types.ObjectId(), // Use the user ID if available
        changeType: 'CREATE',
        previousValues: {}, // No previous values for new documents
        newValues: {
          marksObtained: doc.marksObtained,
          grade: doc.grade,
          points: doc.points,
          comment: doc.comment
        },
        educationLevel: 'O_LEVEL',
        ipAddress: doc.__ipAddress,
        userAgent: doc.__userAgent
      });

      await historyEntry.save();
      logger.info(`Created history entry for new O-Level result: ${doc._id}`);
    } else if (doc.__previousValues) {
      // Create a history entry for updated document
      const historyEntry = new MarksHistory({
        resultId: doc._id,
        resultModel: 'OLevelResult',
        studentId: doc.studentId,
        subjectId: doc.subjectId,
        examId: doc.examId,
        academicYearId: doc.academicYearId,
        classId: doc.classId,
        userId: doc.__userId || doc.lastModifiedBy || mongoose.Types.ObjectId(), // Use the user ID if available
        changeType: 'UPDATE',
        previousValues: doc.__previousValues,
        newValues: {
          marksObtained: doc.marksObtained,
          grade: doc.grade,
          points: doc.points,
          comment: doc.comment
        },
        educationLevel: 'O_LEVEL',
        ipAddress: doc.__ipAddress,
        userAgent: doc.__userAgent
      });

      await historyEntry.save();
      logger.info(`Created history entry for updated O-Level result: ${doc._id}`);
    }
  } catch (error) {
    logger.error(`Error creating history entry for O-Level result: ${error.message}`);
    // Don't throw the error, just log it
  }
  next();
});

// Post-remove middleware to track history
OLevelResultSchema.post('remove', async function(doc, next) {
  try {
    // Create a history entry for deleted document
    const historyEntry = new MarksHistory({
      resultId: doc._id,
      resultModel: 'OLevelResult',
      studentId: doc.studentId,
      subjectId: doc.subjectId,
      examId: doc.examId,
      academicYearId: doc.academicYearId,
      classId: doc.classId,
      userId: doc.__userId || doc.lastModifiedBy || mongoose.Types.ObjectId(), // Use the user ID if available
      changeType: 'DELETE',
      previousValues: {
        marksObtained: doc.marksObtained,
        grade: doc.grade,
        points: doc.points,
        comment: doc.comment
      },
      newValues: {}, // No new values for deleted documents
      educationLevel: 'O_LEVEL',
      ipAddress: doc.__ipAddress,
      userAgent: doc.__userAgent
    });

    await historyEntry.save();
    logger.info(`Created history entry for deleted O-Level result: ${doc._id}`);
  } catch (error) {
    logger.error(`Error creating history entry for deleted O-Level result: ${error.message}`);
    // Don't throw the error, just log it
  }
  next();
});

module.exports = mongoose.model('OLevelResult', OLevelResultSchema);
