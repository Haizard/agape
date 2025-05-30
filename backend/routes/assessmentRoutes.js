const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const assessmentController = require('../controllers/assessmentController');
const { authenticateToken } = require('../middleware/auth');
const { validateAssessment } = require('../middleware/validation');
const Assessment = require('../models/Assessment');
const { generatePDF } = require('../utils/pdfGenerator');
// Import the result service instead of the deprecated Result model
const resultService = require('../services/resultService');

// Get all assessments
router.get('/',
  authenticateToken,
  assessmentController.getAllAssessments
);

// Get assessment by ID
router.get('/:id',
  authenticateToken,
  assessmentController.getAssessmentById
);

// Create assessment
router.post('/',
  authenticateToken,
  validateAssessment,
  assessmentController.createAssessment
);

// Update assessment
router.put('/:id',
  authenticateToken,
  validateAssessment,
  assessmentController.updateAssessment
);

// Delete assessment
router.delete('/:id',
  authenticateToken,
  assessmentController.deleteAssessment
);

// Get assessment results
router.get('/:id/results',
  authenticateToken,
  assessmentController.getAssessmentResults
);

// Generate assessment report
router.get('/report/:classId/:assessmentId',
  authenticateToken,
  assessmentController.generateReport
);

// Bulk marks entry
router.post('/bulk-marks',
  authenticateToken,
  async (req, res) => {
    // Start a MongoDB session for transaction support
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { marks } = req.body;

      if (!Array.isArray(marks)) {
        return res.status(400).json({
          success: false,
          message: 'Marks must be an array'
        });
      }

      // Validate marks data
      for (const mark of marks) {
        if (!mark.studentId || !mark.assessmentId || mark.marksObtained === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Invalid marks data: missing studentId, assessmentId, or marksObtained'
          });
        }

        // Ensure subjectId is present to prevent cross-contamination
        if (!mark.subjectId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid marks data: missing subjectId. This is required to prevent marks from being applied to the wrong subject.'
          });
        }
      }

      // Log the marks data for debugging
      console.log(`Processing ${marks.length} marks entries with subject-specific association`);

      // Validate that all required models are available
      if (!Assessment) {
        throw new Error('Assessment model is not defined');
      }
      if (!resultService) {
        throw new Error('Result service is not defined');
      }

      // Process marks in a transaction
      const savedMarks = [];
      const errors = [];

      for (const mark of marks) {
        try {
          // Get assessment details first to get required fields
          const assessment = await Assessment.findById(mark.assessmentId).session(session);
          if (!assessment) {
            const error = `Assessment not found: ${mark.assessmentId}`;
            console.warn(error);
            errors.push({ studentId: mark.studentId, error });
            continue; // Skip this mark if assessment not found
          }

          // Get student details
          const student = await mongoose.model('Student').findById(mark.studentId).session(session);
          if (!student) {
            const error = `Student not found: ${mark.studentId}`;
            console.warn(error);
            errors.push({ studentId: mark.studentId, error });
            continue; // Skip this mark if student not found
          }

          // Get class details
          const classObj = await mongoose.model('Class').findById(student.class).session(session);
          if (!classObj) {
            const error = `Class not found for student: ${mark.studentId}`;
            console.warn(error);
            errors.push({ studentId: mark.studentId, error });
            continue; // Skip this mark if class not found
          }

          // Get or create a real exam ID
          let examId = assessment.examId;
          let academicYearId = assessment.academicYearId;
          let examTypeId = assessment.examTypeId;

          // If no exam ID is set, try to find an existing exam or create a default one
          if (!examId || examId === 'default-exam') {
            try {
              // Try to find an existing exam for this academic year
              const Exam = mongoose.model('Exam');
              const ExamType = mongoose.model('ExamType');
              const AcademicYear = mongoose.model('AcademicYear');

              // First, ensure we have a valid academicYearId
              if (!academicYearId) {
                // Try to find the active academic year
                const activeYear = await AcademicYear.findOne({ isActive: true }).session(session);
                if (activeYear) {
                  academicYearId = activeYear._id;
                  console.log(`Using active academic year: ${activeYear.name || activeYear.year}`);
                } else {
                  // If no active year, get the most recent one
                  const mostRecentYear = await AcademicYear.findOne().sort({ year: -1 }).session(session);
                  if (mostRecentYear) {
                    academicYearId = mostRecentYear._id;
                    console.log(`No active academic year found, using most recent: ${mostRecentYear.name || mostRecentYear.year}`);
                  } else {
                    throw new Error('No academic years found in the system');
                  }
                }
              }

              // Find an existing exam for this academic year
              let exam = await Exam.findOne({
                academicYear: academicYearId,
                status: { $in: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED'] }
              }).session(session);

              if (!exam) {
                // Find or create a default exam type
                let examType = await ExamType.findOne({ name: 'Midterm' }).session(session);
                if (!examType) {
                  examType = new ExamType({
                    name: 'Midterm',
                    description: 'Default midterm exam type',
                    maxMarks: 100,
                    isActive: true
                  });
                  await examType.save({ session });
                  console.log(`Created default exam type with ID: ${examType._id}`);
                }

                // Determine education level (default to O_LEVEL if not specified)
                const educationLevel = mark.educationLevel || student.educationLevel || 'O_LEVEL';

                // If no exam exists, create a default one
                console.log('Creating a default exam for marks entry');
                exam = new Exam({
                  name: 'Default Assessment Exam',
                  type: 'MID_TERM', // Valid enum value: 'OPEN_TEST', 'MID_TERM', 'FINAL'
                  examType: examType._id, // Required field
                  academicYear: academicYearId, // Required field
                  term: assessment.term || 'Term 1',
                  status: 'DRAFT', // Valid enum value: 'DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED'
                  educationLevel: educationLevel, // Valid enum value: 'O_LEVEL', 'A_LEVEL'
                  startDate: new Date(),
                  endDate: new Date(new Date().setDate(new Date().getDate() + 7))
                });
                await exam.save({ session });
                console.log(`Created default exam with ID: ${exam._id}`);
              }

              examId = exam._id;
              examTypeId = exam.examType;
            } catch (examError) {
              console.error('Error finding or creating exam:', examError);
              errors.push({
                studentId: mark.studentId,
                error: `Error finding or creating exam: ${examError.message}`
              });
              continue; // Skip this mark if we can't get a valid exam ID
            }
          }

          // Ensure we have all required fields before saving
          if (!mark.studentId || !mark.subjectId || !examId || !academicYearId || !examTypeId || !student.class) {
            const error = 'Missing required fields for result';
            console.warn(error, {
              studentId: mark.studentId,
              subjectId: mark.subjectId,
              examId,
              academicYearId,
              examTypeId,
              classId: student.class
            });
            errors.push({ studentId: mark.studentId, error });
            continue; // Skip this mark if any required field is missing
          }

          // Determine education level from student or mark
          const educationLevel = mark.educationLevel || student.educationLevel || 'O_LEVEL';

          // Prepare result data for the education-level specific model
          const resultData = {
            studentId: mark.studentId,
            examId: examId,
            academicYearId: academicYearId,
            examTypeId: examTypeId,
            subjectId: mark.subjectId || assessment.subjectId, // Prefer mark.subjectId over assessment.subjectId
            classId: student.class,
            marksObtained: mark.marksObtained,
            educationLevel: educationLevel,
            assessmentId: mark.assessmentId // Link to the assessment
          };

          // Save directly to the appropriate education-level specific model
          try {
            // Use the resultService to save the marks with the session
            const result = await resultService.enterMarksWithSession(resultData, session);
            console.log(`Saved ${educationLevel} result for student ${mark.studentId}, subject ${resultData.subjectId}, assessment ${mark.assessmentId}`);

            if (result) {
              savedMarks.push(result);
            }
          } catch (saveError) {
            console.error(`Error saving marks for student ${mark.studentId}, subject ${mark.subjectId}:`, saveError);
            errors.push({
              studentId: mark.studentId,
              error: `Error saving marks: ${saveError.message}`
            });
          }
        } catch (markError) {
          console.error(`Error processing mark for student ${mark.studentId}, subject ${mark.subjectId}:`, markError);
          errors.push({
            studentId: mark.studentId,
            error: `Error processing mark: ${markError.message}`
          });
        }
      }

      // If no marks were saved but we have errors, abort the transaction
      if (savedMarks.length === 0 && errors.length > 0) {
        await session.abortTransaction();
        console.error('No marks saved, transaction aborted. Errors:', errors);

        return res.status(400).json({
          success: false,
          message: 'Failed to save any marks',
          errors: errors
        });
      }

      // Commit the transaction
      await session.commitTransaction();
      console.log(`Transaction committed successfully. Saved ${savedMarks.length} marks.`);

      // Always include a success flag in the response
      res.json({
        success: true,
        message: `Successfully saved ${savedMarks.length} marks`,
        data: savedMarks,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      // Abort the transaction on error
      await session.abortTransaction();
      console.error('Error in bulk marks entry, transaction aborted:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to save marks',
        error: error.message
      });
    } finally {
      // End the session
      session.endSession();
    }
  }
);

// Export PDF report
router.post('/report/:classId/:assessmentId/pdf',
  authenticateToken,
  async (req, res) => {
    try {
      const { classId, assessmentId } = req.params;

      // Get report data
      const reportData = await assessmentController.generateReport(
        { params: { classId, assessmentId } },
        { json: () => {} } // Mock response object
      );

      if (!reportData.success) {
        throw new Error(reportData.message);
      }

      // Generate PDF
      const pdf = await generatePDF(reportData.report);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=assessment-report.pdf');

      // Send PDF
      res.send(pdf);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF report'
      });
    }
  }
);

module.exports = router;
