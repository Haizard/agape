const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const Class = require('../models/Class');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');

/**
 * Middleware to validate result data before saving
 */
const resultValidation = {
  /**
   * Validate result data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  validateResult: async (req, res, next) => {
    try {
      const { studentId, examId, subjectId, marksObtained } = req.body;
      
      // Check for required fields
      if (!studentId || !examId || !subjectId || marksObtained === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: studentId, examId, subjectId, and marksObtained are required'
        });
      }
      
      // Validate marks obtained
      if (isNaN(marksObtained) || marksObtained < 0 || marksObtained > 100) {
        return res.status(400).json({
          success: false,
          message: 'Marks obtained must be a number between 0 and 100'
        });
      }
      
      // Check if student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student not found with ID: ${studentId}`
        });
      }
      
      // Check if exam exists
      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: `Exam not found with ID: ${examId}`
        });
      }
      
      // Check if subject exists
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: `Subject not found with ID: ${subjectId}`
        });
      }
      
      // Check if class exists if classId is provided
      if (req.body.classId) {
        const classObj = await Class.findById(req.body.classId);
        if (!classObj) {
          return res.status(404).json({
            success: false,
            message: `Class not found with ID: ${req.body.classId}`
          });
        }
      }
      
      // Determine education level
      const educationLevel = student.educationLevel || 'O_LEVEL';
      
      // Check if result already exists
      const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;
      const existingResult = await ResultModel.findOne({
        studentId,
        examId,
        subjectId
      });
      
      if (existingResult && !req.params.id) {
        return res.status(400).json({
          success: false,
          message: `Result already exists for student ${studentId}, subject ${subjectId}, and exam ${examId}`,
          existingResult
        });
      }
      
      // Add education level to request for later use
      req.educationLevel = educationLevel;
      
      // Calculate grade and points based on education level
      let grade, points;
      
      if (educationLevel === 'A_LEVEL') {
        // A-LEVEL grading
        if (marksObtained >= 80) { grade = 'A'; points = 1; }
        else if (marksObtained >= 70) { grade = 'B'; points = 2; }
        else if (marksObtained >= 60) { grade = 'C'; points = 3; }
        else if (marksObtained >= 50) { grade = 'D'; points = 4; }
        else if (marksObtained >= 40) { grade = 'E'; points = 5; }
        else if (marksObtained >= 35) { grade = 'S'; points = 6; }
        else { grade = 'F'; points = 7; }
      } else {
        // O-LEVEL grading
        if (marksObtained >= 75) { grade = 'A'; points = 1; }
        else if (marksObtained >= 65) { grade = 'B'; points = 2; }
        else if (marksObtained >= 50) { grade = 'C'; points = 3; }
        else if (marksObtained >= 30) { grade = 'D'; points = 4; }
        else { grade = 'F'; points = 5; }
      }
      
      // Add grade and points to request body
      req.body.grade = grade;
      req.body.points = points;
      
      // If classId is not provided, use student's class
      if (!req.body.classId) {
        req.body.classId = student.class;
      }
      
      // Proceed to next middleware
      next();
    } catch (error) {
      console.error(`Error validating result: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Error validating result',
        error: error.message
      });
    }
  },
  
  /**
   * Validate result update data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  validateResultUpdate: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { marksObtained } = req.body;
      
      // Check if result ID is provided
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Result ID is required'
        });
      }
      
      // Get student to determine education level
      let student;
      if (req.body.studentId) {
        student = await Student.findById(req.body.studentId);
        if (!student) {
          return res.status(404).json({
            success: false,
            message: `Student not found with ID: ${req.body.studentId}`
          });
        }
      }
      
      // If marks obtained is provided, validate it
      if (marksObtained !== undefined) {
        if (isNaN(marksObtained) || marksObtained < 0 || marksObtained > 100) {
          return res.status(400).json({
            success: false,
            message: 'Marks obtained must be a number between 0 and 100'
          });
        }
        
        // If student is not provided, get it from the result
        if (!student) {
          // Find the result first to get the student ID
          const oLevelResult = await OLevelResult.findById(id);
          const aLevelResult = await ALevelResult.findById(id);
          const result = oLevelResult || aLevelResult;
          
          if (!result) {
            return res.status(404).json({
              success: false,
              message: `Result not found with ID: ${id}`
            });
          }
          
          student = await Student.findById(result.studentId);
          if (!student) {
            return res.status(404).json({
              success: false,
              message: `Student not found with ID: ${result.studentId}`
            });
          }
        }
        
        // Determine education level
        const educationLevel = student.educationLevel || 'O_LEVEL';
        
        // Calculate grade and points based on education level
        let grade, points;
        
        if (educationLevel === 'A_LEVEL') {
          // A-LEVEL grading
          if (marksObtained >= 80) { grade = 'A'; points = 1; }
          else if (marksObtained >= 70) { grade = 'B'; points = 2; }
          else if (marksObtained >= 60) { grade = 'C'; points = 3; }
          else if (marksObtained >= 50) { grade = 'D'; points = 4; }
          else if (marksObtained >= 40) { grade = 'E'; points = 5; }
          else if (marksObtained >= 35) { grade = 'S'; points = 6; }
          else { grade = 'F'; points = 7; }
        } else {
          // O-LEVEL grading
          if (marksObtained >= 75) { grade = 'A'; points = 1; }
          else if (marksObtained >= 65) { grade = 'B'; points = 2; }
          else if (marksObtained >= 50) { grade = 'C'; points = 3; }
          else if (marksObtained >= 30) { grade = 'D'; points = 4; }
          else { grade = 'F'; points = 5; }
        }
        
        // Add grade and points to request body
        req.body.grade = grade;
        req.body.points = points;
        
        // Add education level to request for later use
        req.educationLevel = educationLevel;
      }
      
      // Proceed to next middleware
      next();
    } catch (error) {
      console.error(`Error validating result update: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Error validating result update',
        error: error.message
      });
    }
  }
};

module.exports = resultValidation;
