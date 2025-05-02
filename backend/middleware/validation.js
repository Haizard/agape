const { validateAssessmentData, validateTotalWeightage } = require('../utils/assessmentValidation');
const Assessment = require('../models/Assessment');

/**
 * Validation Middleware
 * Contains validation functions for different data types
 */
const validationMiddleware = {
  /**
   * Validate assessment data
   */
  validateAssessment: async (req, res, next) => {
    try {
      const assessmentData = req.body;
      
      // Add createdBy from authenticated user if not provided
      if (!assessmentData.createdBy && req.user && req.user.userId) {
        assessmentData.createdBy = req.user.userId;
        console.log('Added createdBy from authenticated user:', assessmentData.createdBy);
      }

      // Basic data validation
      const validation = validateAssessmentData(assessmentData);
      if (!validation.isValid) {
        console.log('Assessment validation errors:', validation.errors);
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      // Validate total weightage
      const existingAssessments = await Assessment.find(
        req.params.id ? { _id: { $ne: req.params.id } } : {}
      );
      
      const weightageValidation = validateTotalWeightage(
        existingAssessments,
        assessmentData,
        req.params.id
      );

      if (!weightageValidation.isValid) {
        console.log('Weightage validation error:', weightageValidation.error);
        return res.status(400).json({
          success: false,
          message: weightageValidation.error
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Validation error'
      });
    }
  },

  /**
   * Validate bulk marks data
   */
  validateBulkMarks: async (req, res, next) => {
    try {
      const { marks } = req.body;

      if (!Array.isArray(marks)) {
        return res.status(400).json({
          success: false,
          message: 'Marks must be an array'
        });
      }

      // Validate each mark entry
      for (const mark of marks) {
        if (!mark.studentId || !mark.assessmentId || mark.marksObtained === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Invalid marks data structure'
          });
        }

        // Get assessment max marks
        const assessment = await Assessment.findById(mark.assessmentId);
        if (!assessment) {
          return res.status(400).json({
            success: false,
            message: `Assessment not found: ${mark.assessmentId}`
          });
        }

        // Validate marks value
        if (
          isNaN(mark.marksObtained) ||
          mark.marksObtained < 0 ||
          mark.marksObtained > assessment.maxMarks
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid marks for student ${mark.studentId}: must be between 0 and ${assessment.maxMarks}`
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Validation error'
      });
    }
  },

  /**
   * Validate report parameters
   */
  validateReportParams: async (req, res, next) => {
    try {
      const { classId, assessmentId } = req.params;

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid class or assessment ID'
        });
      }

      // Check if assessment exists
      const assessment = await Assessment.findById(assessmentId);
      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }

      // Check if class exists
      const classExists = await Class.findById(classId);
      if (!classExists) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Validation error'
      });
    }
  }
};

module.exports = validationMiddleware;