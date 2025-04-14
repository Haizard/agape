/**
 * Report Validation Middleware
 * 
 * This middleware validates requests for report generation.
 */

const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const { EDUCATION_LEVELS } = require('../constants/apiEndpoints');
const logger = require('../utils/logger');

/**
 * Validate report request parameters
 */
const validateReportRequest = async (req, res, next) => {
  try {
    const { studentId, classId, examId } = req.params;
    
    // Validate exam ID
    if (!examId) {
      return res.status(400).json({ 
        message: 'Exam ID is required',
        code: 'MISSING_EXAM_ID'
      });
    }
    
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ 
        message: 'Exam not found',
        code: 'EXAM_NOT_FOUND'
      });
    }
    
    // Validate student ID if present
    if (studentId) {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ 
          message: 'Student not found',
          code: 'STUDENT_NOT_FOUND'
        });
      }
      
      // Set education level if not provided
      if (!req.query.educationLevel) {
        req.query.educationLevel = student.educationLevel || EDUCATION_LEVELS.O_LEVEL;
        logger.info(`Setting education level to ${req.query.educationLevel} based on student data`);
      }
    }
    
    // Validate class ID if present
    if (classId) {
      const classObj = await Class.findById(classId);
      if (!classObj) {
        return res.status(404).json({ 
          message: 'Class not found',
          code: 'CLASS_NOT_FOUND'
        });
      }
      
      // Set education level if not provided
      if (!req.query.educationLevel) {
        req.query.educationLevel = classObj.educationLevel || EDUCATION_LEVELS.O_LEVEL;
        logger.info(`Setting education level to ${req.query.educationLevel} based on class data`);
      }
    }
    
    // Validate education level if provided
    if (req.query.educationLevel && 
        !Object.values(EDUCATION_LEVELS).includes(req.query.educationLevel)) {
      return res.status(400).json({ 
        message: 'Invalid education level',
        code: 'INVALID_EDUCATION_LEVEL',
        validValues: Object.values(EDUCATION_LEVELS)
      });
    }
    
    next();
  } catch (error) {
    logger.error(`Report validation error: ${error.message}`);
    res.status(500).json({ 
      message: 'Error validating report request',
      details: error.message,
      code: 'REPORT_VALIDATION_ERROR'
    });
  }
};

module.exports = {
  validateReportRequest
};
