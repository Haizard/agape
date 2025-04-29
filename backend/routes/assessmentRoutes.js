const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const { authenticate } = require('../middleware/auth');
const { validateAssessment } = require('../middleware/validation');

/**
 * Assessment Routes
 * All routes are prefixed with /api/assessments
 */

// Get all assessments
router.get('/',
  authenticate,
  assessmentController.getAllAssessments
);

// Create new assessment
router.post('/',
  authenticate,
  validateAssessment,
  assessmentController.createAssessment
);

// Update assessment
router.put('/:id',
  authenticate,
  validateAssessment,
  assessmentController.updateAssessment
);

// Delete assessment
router.delete('/:id',
  authenticate,
  assessmentController.deleteAssessment
);

// Get assessment statistics
router.get('/stats',
  authenticate,
  assessmentController.getAssessmentStats
);

// Generate assessment report
router.get('/report/:classId/:assessmentId',
  authenticate,
  assessmentController.generateReport
);

// Bulk marks entry
router.post('/bulk-marks',
  authenticate,
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
      res.status(500).json({
        success: false,
        message: 'Failed to save marks'
      });
    }
  }
);

// Export PDF report
router.post('/report/:classId/:assessmentId/pdf',
  authenticate,
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