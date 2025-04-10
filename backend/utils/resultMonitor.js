const fs = require('node:fs');
const path = require('node:path');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Setup logging
const monitorLogFile = path.join(logDir, `monitor_${new Date().toISOString().split('T')[0]}.log`);
const logToMonitorFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(monitorLogFile, logMessage);
};

/**
 * Utility to monitor result consistency and detect potential issues
 */
const resultMonitor = {
  /**
   * Check for duplicate results
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @param {String} subjectId - The subject ID
   * @returns {Promise<Object>} - The check result
   */
  async checkForDuplicates(studentId, examId, subjectId) {
    try {
      // Get student to determine education level
      const student = await Student.findById(studentId);
      if (!student) {
        return { success: false, message: `Student not found with ID: ${studentId}` };
      }

      const educationLevel = student.educationLevel || 'O_LEVEL';
      const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;

      // Check for duplicates
      const results = await ResultModel.find({
        studentId,
        examId,
        subjectId
      });

      if (results.length > 1) {
        logToMonitorFile(`Found ${results.length} duplicate results for student ${studentId}, exam ${examId}, subject ${subjectId}`);

        // Check if marks are different
        const marks = results.map(r => r.marksObtained);
        const uniqueMarks = [...new Set(marks)];

        if (uniqueMarks.length > 1) {
          logToMonitorFile(`Inconsistent marks: ${uniqueMarks.join(', ')}`);
          return {
            success: false,
            message: `Found ${results.length} duplicate results with inconsistent marks: ${uniqueMarks.join(', ')}`,
            duplicates: results
          };
        } else {
          logToMonitorFile(`All marks are the same: ${uniqueMarks[0]}`);
          return {
            success: true,
            message: `Found ${results.length} duplicate results but all marks are the same: ${uniqueMarks[0]}`,
            duplicates: results
          };
        }
      }

      return { success: true, message: 'No duplicates found' };
    } catch (error) {
      logToMonitorFile(`Error checking for duplicates: ${error.message}`);
      return { success: false, message: `Error checking for duplicates: ${error.message}` };
    }
  },

  /**
   * Check for incorrect grade or points
   * @param {String} resultId - The result ID
   * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
   * @returns {Promise<Object>} - The check result
   */
  async checkGradeAndPoints(resultId, educationLevel) {
    try {
      // Get the appropriate model
      const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;

      // Get the result
      const result = await ResultModel.findById(resultId);
      if (!result) {
        return { success: false, message: `Result not found with ID: ${resultId}` };
      }

      // Calculate expected grade and points
      let expectedGrade, expectedPoints;
      const marks = result.marksObtained;

      if (educationLevel === 'A_LEVEL') {
        // A-LEVEL grading
        if (marks >= 80) { expectedGrade = 'A'; expectedPoints = 1; }
        else if (marks >= 70) { expectedGrade = 'B'; expectedPoints = 2; }
        else if (marks >= 60) { expectedGrade = 'C'; expectedPoints = 3; }
        else if (marks >= 50) { expectedGrade = 'D'; expectedPoints = 4; }
        else if (marks >= 40) { expectedGrade = 'E'; expectedPoints = 5; }
        else if (marks >= 35) { expectedGrade = 'S'; expectedPoints = 6; }
        else { expectedGrade = 'F'; expectedPoints = 7; }
      } else {
        // O-LEVEL grading
        if (marks >= 75) { expectedGrade = 'A'; expectedPoints = 1; }
        else if (marks >= 65) { expectedGrade = 'B'; expectedPoints = 2; }
        else if (marks >= 50) { expectedGrade = 'C'; expectedPoints = 3; }
        else if (marks >= 30) { expectedGrade = 'D'; expectedPoints = 4; }
        else { expectedGrade = 'F'; expectedPoints = 5; }
      }

      // Check if grade or points are incorrect
      const issues = [];

      if (result.grade !== expectedGrade) {
        issues.push(`grade (${result.grade} vs expected ${expectedGrade})`);
      }

      if (result.points !== expectedPoints) {
        issues.push(`points (${result.points} vs expected ${expectedPoints})`);
      }

      if (issues.length > 0) {
        logToMonitorFile(`Result ${resultId} has incorrect ${issues.join(' and ')}`);
        return {
          success: false,
          message: `Result has incorrect ${issues.join(' and ')}`,
          actual: { grade: result.grade, points: result.points },
          expected: { grade: expectedGrade, points: expectedPoints }
        };
      }

      return { success: true, message: 'Grade and points are correct' };
    } catch (error) {
      logToMonitorFile(`Error checking grade and points: ${error.message}`);
      return { success: false, message: `Error checking grade and points: ${error.message}` };
    }
  },

  /**
   * Fix duplicate results
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @param {String} subjectId - The subject ID
   * @returns {Promise<Object>} - The fix result
   */
  async fixDuplicates(studentId, examId, subjectId) {
    try {
      // Get student to determine education level
      const student = await Student.findById(studentId);
      if (!student) {
        return { success: false, message: `Student not found with ID: ${studentId}` };
      }

      const educationLevel = student.educationLevel || 'O_LEVEL';
      const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;

      // Check for duplicates
      const results = await ResultModel.find({
        studentId,
        examId,
        subjectId
      }).sort({ updatedAt: -1 }); // Sort by most recent first

      if (results.length <= 1) {
        return { success: true, message: 'No duplicates to fix' };
      }

      // Keep the most recent result, delete the others
      const mostRecent = results[0];
      const toDelete = results.slice(1);

      logToMonitorFile(`Keeping most recent result ${mostRecent._id} with marks ${mostRecent.marksObtained}`);

      for (const duplicate of toDelete) {
        await ResultModel.deleteOne({ _id: duplicate._id });
        logToMonitorFile(`Deleted duplicate result ${duplicate._id} with marks ${duplicate.marksObtained}`);
      }

      return {
        success: true,
        message: `Fixed ${toDelete.length} duplicate results`,
        kept: mostRecent,
        deleted: toDelete.map(d => d._id)
      };
    } catch (error) {
      logToMonitorFile(`Error fixing duplicates: ${error.message}`);
      return { success: false, message: `Error fixing duplicates: ${error.message}` };
    }
  },

  /**
   * Fix incorrect grade and points
   * @param {String} resultId - The result ID
   * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
   * @returns {Promise<Object>} - The fix result
   */
  async fixGradeAndPoints(resultId, educationLevel) {
    try {
      // Get the appropriate model
      const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;

      // Get the result
      const result = await ResultModel.findById(resultId);
      if (!result) {
        return { success: false, message: `Result not found with ID: ${resultId}` };
      }

      // Calculate correct grade and points
      let correctGrade, correctPoints;
      const marks = result.marksObtained;

      if (educationLevel === 'A_LEVEL') {
        // A-LEVEL grading
        if (marks >= 80) { correctGrade = 'A'; correctPoints = 1; }
        else if (marks >= 70) { correctGrade = 'B'; correctPoints = 2; }
        else if (marks >= 60) { correctGrade = 'C'; correctPoints = 3; }
        else if (marks >= 50) { correctGrade = 'D'; correctPoints = 4; }
        else if (marks >= 40) { correctGrade = 'E'; correctPoints = 5; }
        else if (marks >= 35) { correctGrade = 'S'; correctPoints = 6; }
        else { correctGrade = 'F'; correctPoints = 7; }
      } else {
        // O-LEVEL grading
        if (marks >= 75) { correctGrade = 'A'; correctPoints = 1; }
        else if (marks >= 65) { correctGrade = 'B'; correctPoints = 2; }
        else if (marks >= 50) { correctGrade = 'C'; correctPoints = 3; }
        else if (marks >= 30) { correctGrade = 'D'; correctPoints = 4; }
        else { correctGrade = 'F'; correctPoints = 5; }
      }

      // Check if grade or points need to be fixed
      const changes = [];

      if (result.grade !== correctGrade) {
        changes.push(`grade (${result.grade} -> ${correctGrade})`);
        result.grade = correctGrade;
      }

      if (result.points !== correctPoints) {
        changes.push(`points (${result.points} -> ${correctPoints})`);
        result.points = correctPoints;
      }

      if (changes.length > 0) {
        await result.save();
        logToMonitorFile(`Fixed result ${resultId}: ${changes.join(', ')}`);
        return {
          success: true,
          message: `Fixed ${changes.join(' and ')}`,
          changes
        };
      }

      return { success: true, message: 'No changes needed' };
    } catch (error) {
      logToMonitorFile(`Error fixing grade and points: ${error.message}`);
      return { success: false, message: `Error fixing grade and points: ${error.message}` };
    }
  }
};

module.exports = resultMonitor;
