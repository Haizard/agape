const Student = require('../models/Student');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const fs = require('fs');
const path = require('path');

// Setup logging
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `mark_validation_${new Date().toISOString().split('T')[0]}.log`);
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
};

/**
 * Middleware to check if marks already exist for a student
 * If marks exist, it will add a flag to the request object
 * This middleware doesn't block the request, it just adds information
 */
const checkExistingMarks = async (req, res, next) => {
  try {
    // For batch mark entry
    if (req.path.includes('/batch') && req.body.marksData) {
      logToFile('Checking existing marks for batch entry');
      
      // Create a map to store existing results
      const existingResults = {};
      
      // Process each mark in the batch
      for (const mark of req.body.marksData) {
        const { studentId, examId, subjectId, academicYearId } = mark;
        
        // Skip if any required field is missing
        if (!studentId || !examId || !subjectId || !academicYearId) {
          continue;
        }
        
        // Get student to determine education level
        const student = await Student.findById(studentId);
        if (!student) {
          continue;
        }
        
        // Determine which model to use based on education level
        const ResultModel = student.educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;
        
        // Check if result already exists
        const existingResult = await ResultModel.findOne({
          studentId,
          examId,
          subjectId,
          academicYearId
        });
        
        if (existingResult) {
          existingResults[studentId] = {
            resultId: existingResult._id,
            marksObtained: existingResult.marksObtained,
            grade: existingResult.grade,
            points: existingResult.points
          };
          
          // Update the mark data to include the result ID for update
          mark.resultId = existingResult._id;
          mark.isUpdate = true;
          
          logToFile(`Found existing result for student ${studentId}, subject ${subjectId}, exam ${examId}`);
        }
      }
      
      // Add existing results to the request object
      req.existingResults = existingResults;
      
      // Continue with the request
      return next();
    }
    
    // For single mark entry
    const { studentId, examId, subjectId, academicYearId } = req.body;
    
    // Skip validation if any required field is missing
    if (!studentId || !examId || !subjectId || !academicYearId) {
      return next();
    }
    
    logToFile(`Checking existing marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);
    
    // Get student to determine education level
    const student = await Student.findById(studentId);
    if (!student) {
      return next();
    }
    
    // Determine which model to use based on education level
    const ResultModel = student.educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;
    
    // Check if result already exists
    const existingResult = await ResultModel.findOne({
      studentId,
      examId,
      subjectId,
      academicYearId
    });
    
    if (existingResult) {
      // Add existing result to the request object
      req.existingResult = {
        resultId: existingResult._id,
        marksObtained: existingResult.marksObtained,
        grade: existingResult.grade,
        points: existingResult.points
      };
      
      // Update the request body to include the result ID for update
      req.body.resultId = existingResult._id;
      req.body.isUpdate = true;
      
      logToFile(`Found existing result for student ${studentId}, subject ${subjectId}, exam ${examId}`);
    }
    
    // Continue with the request
    next();
  } catch (error) {
    logToFile(`Error checking existing marks: ${error.message}`);
    console.error('Error checking existing marks:', error);
    next(error);
  }
};

/**
 * Middleware to prevent entering marks twice for the same student
 * This middleware will block the request if marks already exist and isUpdate is not true
 */
const preventDuplicateMarks = async (req, res, next) => {
  try {
    // For batch mark entry
    if (req.path.includes('/batch') && req.body.marksData) {
      logToFile('Preventing duplicate marks for batch entry');
      
      // Filter out marks that already exist but don't have isUpdate flag
      const filteredMarksData = req.body.marksData.filter(mark => {
        // If the mark has a resultId or isUpdate flag, allow it (it's an update)
        if (mark.resultId || mark.isUpdate) {
          return true;
        }
        
        // Check if this mark exists in the existingResults map
        const exists = req.existingResults && req.existingResults[mark.studentId];
        
        // If it exists but doesn't have isUpdate flag, filter it out
        if (exists) {
          logToFile(`Filtering out duplicate mark for student ${mark.studentId}`);
          return false;
        }
        
        // Otherwise, allow it (it's a new mark)
        return true;
      });
      
      // If all marks were filtered out, return an error
      if (filteredMarksData.length === 0 && req.body.marksData.length > 0) {
        logToFile('All marks were filtered out because they already exist');
        return res.status(400).json({
          success: false,
          message: 'All marks already exist. Use the update endpoint to modify existing marks.'
        });
      }
      
      // Update the request body with filtered marks data
      req.body.marksData = filteredMarksData;
      
      // Continue with the request
      return next();
    }
    
    // For single mark entry
    if (req.existingResult && !req.body.isUpdate) {
      logToFile(`Preventing duplicate mark for student ${req.body.studentId}`);
      return res.status(400).json({
        success: false,
        message: 'Marks already exist for this student, subject, exam, and academic year. Use the update endpoint to modify existing marks.',
        existingResult: req.existingResult
      });
    }
    
    // Continue with the request
    next();
  } catch (error) {
    logToFile(`Error preventing duplicate marks: ${error.message}`);
    console.error('Error preventing duplicate marks:', error);
    next(error);
  }
};

module.exports = {
  checkExistingMarks,
  preventDuplicateMarks
};
