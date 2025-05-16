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
   * Now includes universal assessments regardless of subject filter
   */
  getAllAssessments: async (req, res) => {
    try {
      const { subjectId, term, academicYearId, educationLevel } = req.query;

      // DEBUGGING: Check if any assessments exist at all
      const totalAssessments = await Assessment.countDocuments({});
      console.log(`DEBUGGING: Total assessments in database: ${totalAssessments}`);

      // DEBUGGING: Check if any universal assessments exist
      const universalCount = await Assessment.countDocuments({ isUniversal: true });
      console.log(`DEBUGGING: Universal assessments in database: ${universalCount}`);

      // DEBUGGING: Check if any assessments match the term
      const termCount = term ? await Assessment.countDocuments({ term }) : 0;
      console.log(`DEBUGGING: Assessments with term ${term}: ${termCount}`);

      // DEBUGGING: Check if any assessments match the academic year
      const yearCount = academicYearId ? await Assessment.countDocuments({ academicYearId }) : 0;
      console.log(`DEBUGGING: Assessments with academicYearId ${academicYearId}: ${yearCount}`);

      // Build query based on provided filters
      const query = {};

      // Term filter
      if (term) {
        // Handle both string and number types for term
        query.term = term;
      }

      // Academic year filter
      if (academicYearId) {
        // Include assessments with this academic year OR no academic year at all
        // This ensures that assessments without an academic year still appear
        query.$or = [
          { academicYearId: academicYearId },
          { academicYearId: { $exists: false } },
          { academicYearId: null }
        ];
      }

      // Education level filter
      if (educationLevel) {
        query.educationLevel = educationLevel;
      }

      console.log('Assessment base query:', query);

      // DEBUGGING: Check how many assessments match the base query
      const baseQueryCount = await Assessment.countDocuments(query);
      console.log(`DEBUGGING: Assessments matching base query: ${baseQueryCount}`);

      // If subjectId is provided, we need to include both:
      // 1. Assessments specifically for this subject
      // 2. Universal assessments that apply to all subjects
      let assessments;
      if (subjectId) {
        // DEBUGGING: Check how many assessments are specific to this subject
        const subjectSpecificCount = await Assessment.countDocuments({ subjectId });
        console.log(`DEBUGGING: Subject-specific assessments for ${subjectId}: ${subjectSpecificCount}`);

        // Create the combined query
        const combinedQuery = {
          $and: [
            query,
            {
              $or: [
                { subjectId: subjectId },
                { isUniversal: true }
              ]
            }
          ]
        };

        console.log('DEBUGGING: Combined query:', JSON.stringify(combinedQuery));

        // DEBUGGING: Check how many assessments match the combined query
        const combinedQueryCount = await Assessment.countDocuments(combinedQuery);
        console.log(`DEBUGGING: Assessments matching combined query: ${combinedQueryCount}`);

        // Execute the query
        assessments = await Assessment.find(combinedQuery)
          .populate('subjectId', 'name code')
          .sort({ displayOrder: 1, createdAt: -1 });

        console.log(`Found ${assessments.length} assessments for subject ${subjectId} (including universal assessments)`);

        // DEBUGGING: Log details of each assessment found
        if (assessments.length > 0) {
          assessments.forEach((a, i) => {
            console.log(`DEBUGGING: Assessment ${i+1}:`, {
              id: a._id,
              name: a.name,
              isUniversal: a.isUniversal,
              isVisible: a.isVisible,
              status: a.status,
              term: a.term,
              academicYearId: a.academicYearId
            });
          });
        } else {
          console.log('DEBUGGING: No assessments found that match the criteria');
        }
      } else {
        // If no subjectId, just use the regular query
        assessments = await Assessment.find(query)
          .populate('subjectId', 'name code')
          .sort({ displayOrder: 1, createdAt: -1 });

        console.log(`Found ${assessments.length} assessments (no subject filter)`);
      }

      // Ensure we return an array, even if empty
      const assessmentArray = Array.isArray(assessments) ? assessments : [];

      // Log what we're returning
      console.log('Returning assessments array with length:', assessmentArray.length);

      // Return the array directly to simplify frontend processing
      res.json(assessmentArray);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      console.error('Error details:', error.stack);
      // Return an empty array with error status to maintain consistency
      res.status(500).json([]);
    }
  },

  /**
   * Create a new assessment
   * Now supports universal assessments
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

      // Handle universal assessment flag
      if (assessmentData.isUniversal) {
        console.log('Creating universal assessment that applies to all subjects');
        // For universal assessments, we don't need a subjectId
        assessmentData.subjectId = null;
      } else if (!assessmentData.subjectId) {
        // If not universal and no subjectId, check if we should make it universal
        console.log('No subject ID provided, defaulting to universal assessment');
        assessmentData.isUniversal = true;
      }

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
   * Now supports universal assessments
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

      // Handle universal assessment flag
      if (updateData.isUniversal) {
        console.log('Updating to universal assessment that applies to all subjects');
        // For universal assessments, we don't need a subjectId
        updateData.subjectId = null;
      } else if (!updateData.subjectId) {
        // If not universal and no subjectId, check if we should make it universal
        console.log('No subject ID provided in update, defaulting to universal assessment');
        updateData.isUniversal = true;
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
      console.error('Error updating assessment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update assessment',
        error: error.message
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
   * Get universal assessments
   * This endpoint specifically returns universal assessments for a given term
   */
  getUniversalAssessments: async (req, res) => {
    try {
      const { term } = req.query;

      console.log(`Getting universal assessments for term ${term}`);

      const query = {
        isUniversal: true,
        isVisible: true,
        status: 'active'
      };

      if (term) {
        query.term = term;
      }

      const assessments = await Assessment.find(query)
        .sort({ displayOrder: 1, createdAt: -1 });

      console.log(`Found ${assessments.length} universal assessments for term ${term}`);

      res.json(assessments);
    } catch (error) {
      console.error('Error fetching universal assessments:', error);
      res.status(500).json([]);
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