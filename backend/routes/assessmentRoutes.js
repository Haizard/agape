const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const assessmentController = require('../controllers/assessmentController');
const { authenticateToken } = require('../middleware/auth');
const { validateAssessment } = require('../middleware/validation');
const Result = require('../models/Result');
const { generatePDF } = require('../utils/pdfGenerator'); // Assuming this is the correct path

/**
 * Assessment Routes
 * All routes are prefixed with /api/assessments
 */

// Get all assessments
router.get('/',
  authenticateToken,
  assessmentController.getAllAssessments
);

// Create new assessment
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

// Get assessment statistics
router.get('/stats',
  authenticateToken,
  assessmentController.getAssessmentStats
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
            message: 'Invalid marks data'
          });
        }
      }

      // Save marks in transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const savedMarks = await Promise.all(
          marks.map(async (mark) => {
            // Save to assessment result
            const result = await Result.findOneAndUpdate(
              {
                studentId: mark.studentId,
                assessmentId: mark.assessmentId
              },
              {
                marksObtained: mark.marksObtained
              },
              {
                new: true,
                upsert: true,
                session
              }
            );

            // If educationLevel is provided, also save to the appropriate result model
            if (mark.educationLevel) {
              try {
                // Get assessment details
                const assessment = await Assessment.findById(mark.assessmentId);
                if (!assessment) {
                  console.warn(`Assessment not found: ${mark.assessmentId}`);
                  return result;
                }

                // Get student details
                const student = await mongoose.model('Student').findById(mark.studentId);
                if (!student) {
                  console.warn(`Student not found: ${mark.studentId}`);
                  return result;
                }

                // Get class details
                const classObj = await mongoose.model('Class').findById(student.class);
                if (!classObj) {
                  console.warn(`Class not found for student: ${mark.studentId}`);
                  return result;
                }

                // Determine which endpoint to use based on education level
                let endpoint = '';
                let resultData = {};

                if (mark.educationLevel === 'A_LEVEL') {
                  endpoint = '/api/a-level-results/batch';
                  resultData = {
                    studentId: mark.studentId,
                    examId: assessment.examId || 'default-exam', // Use default if not set
                    academicYearId: assessment.academicYearId,
                    examTypeId: assessment.examTypeId,
                    subjectId: assessment.subjectId,
                    classId: student.class,
                    marksObtained: mark.marksObtained,
                    educationLevel: 'A_LEVEL'
                  };
                } else {
                  endpoint = '/api/o-level/marks/batch';
                  resultData = {
                    studentId: mark.studentId,
                    examId: assessment.examId || 'default-exam', // Use default if not set
                    academicYearId: assessment.academicYearId,
                    examTypeId: assessment.examTypeId,
                    subjectId: assessment.subjectId,
                    classId: student.class,
                    marksObtained: mark.marksObtained,
                    educationLevel: 'O_LEVEL'
                  };
                }

                // Forward to the appropriate endpoint
                if (endpoint && Object.keys(resultData).length > 0) {
                  try {
                    // Use internal API call to avoid HTTP overhead
                    const resultService = require('../services/resultService');
                    await resultService.enterMarks(resultData);
                    console.log(`Saved ${mark.educationLevel} result for student ${mark.studentId}`);
                  } catch (forwardError) {
                    console.error(`Error forwarding to ${endpoint}:`, forwardError);
                  }
                }
              } catch (educationLevelError) {
                console.error('Error processing education level:', educationLevelError);
              }
            }

            return result;
          })
        );

        await session.commitTransaction();
        session.endSession();

        res.json({
          success: true,
          data: savedMarks
        });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error in bulk marks entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save marks',
        error: error.message
      });
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