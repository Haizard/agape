const Assessment = require('../models/Assessment');
const Result = require('../models/Result');
const { validateAssessmentData, validateTotalWeightage } = require('../utils/assessmentValidation');

/**
 * Assessment Controller
 * Handles all assessment-related operations
 */
const assessmentController = {
  /**
   * Get all assessments
   * Can filter by subjectId, term, academicYearId, and educationLevel
   */
  getAllAssessments: async (req, res) => {
    try {
      const { subjectId, term, academicYearId, educationLevel } = req.query;

      // Build query based on provided filters
      const query = {};

      if (subjectId) {
        query.subjectId = subjectId;
      }

      if (term) {
        query.term = term;
      }

      if (academicYearId) {
        query.academicYearId = academicYearId;
      }

      if (educationLevel) {
        query.educationLevel = educationLevel;
      }

      console.log('Assessment query:', query);

      const assessments = await Assessment.find(query)
        .populate('subjectId', 'name code')
        .sort({ displayOrder: 1, createdAt: -1 });

      // Ensure we return an array, even if empty
      const assessmentArray = Array.isArray(assessments) ? assessments : [];

      // Log what we're returning
      console.log('Returning assessments array with length:', assessmentArray.length);

      // Return the array directly to simplify frontend processing
      res.json(assessmentArray);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      // Return an empty array with error status to maintain consistency
      res.status(500).json([]);
    }
  },

  /**
   * Create a new assessment
   */
  createAssessment: async (req, res) => {
    try {
      const assessmentData = req.body;
      console.log('Assessment creation request body:', assessmentData);

      // Validate assessment data
      const validation = validateAssessmentData(assessmentData);
      if (!validation.isValid) {
        console.log('Assessment validation errors:', validation.errors);
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      // Note: createdBy is now handled in the validateAssessment middleware

      // Validate total weightage
      const existingAssessments = await Assessment.find();
      const weightageValidation = validateTotalWeightage(existingAssessments, assessmentData);
      if (!weightageValidation.isValid) {
        console.log('Weightage validation error:', weightageValidation.error);
        return res.status(400).json({
          success: false,
          message: weightageValidation.error
        });
      }

      const assessment = new Assessment(assessmentData);
      await assessment.save();

      res.status(201).json({
        success: true,
        data: assessment
      });
    } catch (error) {
      console.error('Error creating assessment:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to create assessment',
        error: error.message
      });
    }
  },

  /**
   * Update an assessment
   */
  updateAssessment: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate assessment data
      const validation = validateAssessmentData(updateData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      // Validate total weightage
      const existingAssessments = await Assessment.find({ _id: { $ne: id } });
      const weightageValidation = validateTotalWeightage(existingAssessments, updateData);
      if (!weightageValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: weightageValidation.error
        });
      }

      const assessment = await Assessment.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }

      res.json({
        success: true,
        data: assessment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update assessment'
      });
    }
  },

  /**
   * Delete an assessment
   */
  deleteAssessment: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if assessment has any results
      const hasResults = await Result.exists({ assessmentId: id });
      if (hasResults) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete assessment with existing results'
        });
      }

      const assessment = await Assessment.findByIdAndDelete(id);
      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }

      res.json({
        success: true,
        message: 'Assessment deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete assessment'
      });
    }
  },

  /**
   * Get assessment statistics
   */
  getAssessmentStats: async (req, res) => {
    try {
      const totalAssessments = await Assessment.countDocuments();
      const results = await Result.find().populate('assessmentId');

      // Calculate completion rate
      const completedResults = results.filter(result => result.marksObtained != null);
      const completionRate = (completedResults.length / (results.length || 1)) * 100;

      // Get recent assessments
      const recentAssessments = await Assessment.find()
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,
        stats: {
          totalAssessments,
          completionRate: Math.round(completionRate),
          recentAssessments
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assessment statistics'
      });
    }
  },

  /**
   * Generate assessment report
   */
  generateReport: async (req, res) => {
    try {
      const { classId, assessmentId } = req.params;

      const results = await Result.find({
        classId,
        assessmentId
      }).populate(['studentId', 'assessmentId']);

      if (!results.length) {
        return res.status(404).json({
          success: false,
          message: 'No results found for this assessment'
        });
      }

      // Calculate statistics
      const marks = results.map(r => (r.marksObtained / r.maxMarks) * 100);
      const totalStudents = marks.length;
      const averageScore = marks.reduce((a, b) => a + b, 0) / totalStudents;
      const highestScore = Math.max(...marks);
      const lowestScore = Math.min(...marks);
      const passRate = (marks.filter(m => m >= 45).length / totalStudents) * 100;

      // Calculate standard deviation
      const mean = averageScore;
      const squareDiffs = marks.map(m => (m - mean) ** 2);
      const standardDeviation = Math.sqrt(
        squareDiffs.reduce((a, b) => a + b, 0) / totalStudents
      );

      res.json({
        success: true,
        report: {
          totalStudents,
          averageScore,
          highestScore,
          lowestScore,
          passRate,
          standardDeviation,
          results: results.map(result => ({
            studentId: result.studentId._id,
            studentName: result.studentId.name,
            registrationNumber: result.studentId.registrationNumber,
            marksObtained: result.marksObtained,
            maxMarks: result.maxMarks,
            grade: result.grade
          }))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate assessment report'
      });
    }
  }
};

module.exports = assessmentController;