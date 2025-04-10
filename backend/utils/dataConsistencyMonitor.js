const mongoose = require('mongoose');
const Student = require('../models/Student');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Result = require('../models/Result');
const fs = require('fs');
const path = require('path');

// Setup logging
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `data_consistency_${new Date().toISOString().split('T')[0]}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  logStream.write(logMessage);
  console.log(message);
}

/**
 * Utility to monitor and detect data inconsistencies
 */
const dataConsistencyMonitor = {
  /**
   * Check for duplicate results
   * @returns {Promise<Object>} - The check result
   */
  async checkDuplicateResults() {
    try {
      log('Checking for duplicate results...');
      
      // Check for duplicate O-LEVEL results
      const oLevelDuplicates = await OLevelResult.aggregate([
        {
          $group: {
            _id: {
              studentId: '$studentId',
              examId: '$examId',
              subjectId: '$subjectId'
            },
            count: { $sum: 1 },
            results: { $push: { id: '$_id', marks: '$marksObtained', grade: '$grade', points: '$points' } }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        },
        {
          $sort: {
            '_id.studentId': 1,
            '_id.examId': 1,
            '_id.subjectId': 1
          }
        }
      ]);
      
      // Check for duplicate A-LEVEL results
      const aLevelDuplicates = await ALevelResult.aggregate([
        {
          $group: {
            _id: {
              studentId: '$studentId',
              examId: '$examId',
              subjectId: '$subjectId'
            },
            count: { $sum: 1 },
            results: { $push: { id: '$_id', marks: '$marksObtained', grade: '$grade', points: '$points' } }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        },
        {
          $sort: {
            '_id.studentId': 1,
            '_id.examId': 1,
            '_id.subjectId': 1
          }
        }
      ]);
      
      // Log the results
      log(`Found ${oLevelDuplicates.length} sets of duplicate O-LEVEL results`);
      log(`Found ${aLevelDuplicates.length} sets of duplicate A-LEVEL results`);
      
      // Return the results
      return {
        oLevelDuplicates,
        aLevelDuplicates,
        totalDuplicates: oLevelDuplicates.length + aLevelDuplicates.length
      };
    } catch (error) {
      log(`Error checking for duplicate results: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Check for incorrect grades and points
   * @returns {Promise<Object>} - The check result
   */
  async checkIncorrectGradesAndPoints() {
    try {
      log('Checking for incorrect grades and points...');
      
      // Get all O-LEVEL results
      const oLevelResults = await OLevelResult.find();
      
      // Check each O-LEVEL result
      const incorrectOLevelResults = [];
      
      for (const result of oLevelResults) {
        const marks = result.marksObtained;
        let expectedGrade, expectedPoints;
        
        // Calculate expected grade and points for O-LEVEL
        if (marks >= 75) { expectedGrade = 'A'; expectedPoints = 1; }
        else if (marks >= 65) { expectedGrade = 'B'; expectedPoints = 2; }
        else if (marks >= 50) { expectedGrade = 'C'; expectedPoints = 3; }
        else if (marks >= 30) { expectedGrade = 'D'; expectedPoints = 4; }
        else { expectedGrade = 'F'; expectedPoints = 5; }
        
        // Check if grade or points are incorrect
        if (result.grade !== expectedGrade || result.points !== expectedPoints) {
          incorrectOLevelResults.push({
            id: result._id,
            studentId: result.studentId,
            examId: result.examId,
            subjectId: result.subjectId,
            marks: marks,
            currentGrade: result.grade,
            expectedGrade: expectedGrade,
            currentPoints: result.points,
            expectedPoints: expectedPoints
          });
        }
      }
      
      // Get all A-LEVEL results
      const aLevelResults = await ALevelResult.find();
      
      // Check each A-LEVEL result
      const incorrectALevelResults = [];
      
      for (const result of aLevelResults) {
        const marks = result.marksObtained;
        let expectedGrade, expectedPoints;
        
        // Calculate expected grade and points for A-LEVEL
        if (marks >= 80) { expectedGrade = 'A'; expectedPoints = 1; }
        else if (marks >= 70) { expectedGrade = 'B'; expectedPoints = 2; }
        else if (marks >= 60) { expectedGrade = 'C'; expectedPoints = 3; }
        else if (marks >= 50) { expectedGrade = 'D'; expectedPoints = 4; }
        else if (marks >= 40) { expectedGrade = 'E'; expectedPoints = 5; }
        else if (marks >= 35) { expectedGrade = 'S'; expectedPoints = 6; }
        else { expectedGrade = 'F'; expectedPoints = 7; }
        
        // Check if grade or points are incorrect
        if (result.grade !== expectedGrade || result.points !== expectedPoints) {
          incorrectALevelResults.push({
            id: result._id,
            studentId: result.studentId,
            examId: result.examId,
            subjectId: result.subjectId,
            marks: marks,
            currentGrade: result.grade,
            expectedGrade: expectedGrade,
            currentPoints: result.points,
            expectedPoints: expectedPoints
          });
        }
      }
      
      // Log the results
      log(`Found ${incorrectOLevelResults.length} O-LEVEL results with incorrect grades or points`);
      log(`Found ${incorrectALevelResults.length} A-LEVEL results with incorrect grades or points`);
      
      // Return the results
      return {
        incorrectOLevelResults,
        incorrectALevelResults,
        totalIncorrect: incorrectOLevelResults.length + incorrectALevelResults.length
      };
    } catch (error) {
      log(`Error checking for incorrect grades and points: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Check for missing required fields
   * @returns {Promise<Object>} - The check result
   */
  async checkMissingRequiredFields() {
    try {
      log('Checking for missing required fields...');
      
      // Define required fields
      const requiredFields = ['studentId', 'examId', 'subjectId', 'marksObtained', 'grade', 'points'];
      
      // Check O-LEVEL results
      const oLevelResults = await OLevelResult.find();
      const oLevelMissing = [];
      
      for (const result of oLevelResults) {
        const missingFields = [];
        
        for (const field of requiredFields) {
          if (result[field] === undefined || result[field] === null) {
            missingFields.push(field);
          }
        }
        
        if (missingFields.length > 0) {
          oLevelMissing.push({
            id: result._id,
            missingFields
          });
        }
      }
      
      // Check A-LEVEL results
      const aLevelResults = await ALevelResult.find();
      const aLevelMissing = [];
      
      for (const result of aLevelResults) {
        const missingFields = [];
        
        for (const field of requiredFields) {
          if (result[field] === undefined || result[field] === null) {
            missingFields.push(field);
          }
        }
        
        if (missingFields.length > 0) {
          aLevelMissing.push({
            id: result._id,
            missingFields
          });
        }
      }
      
      // Log the results
      log(`Found ${oLevelMissing.length} O-LEVEL results with missing required fields`);
      log(`Found ${aLevelMissing.length} A-LEVEL results with missing required fields`);
      
      // Return the results
      return {
        oLevelMissing,
        aLevelMissing,
        totalMissing: oLevelMissing.length + aLevelMissing.length
      };
    } catch (error) {
      log(`Error checking for missing required fields: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Check for orphaned results (results with missing student, exam, or subject)
   * @returns {Promise<Object>} - The check result
   */
  async checkOrphanedResults() {
    try {
      log('Checking for orphaned results...');
      
      // Get all student IDs
      const students = await Student.find({}, '_id');
      const studentIds = students.map(student => student._id.toString());
      
      // Check O-LEVEL results
      const oLevelResults = await OLevelResult.find();
      const oLevelOrphaned = [];
      
      for (const result of oLevelResults) {
        if (!studentIds.includes(result.studentId.toString())) {
          oLevelOrphaned.push({
            id: result._id,
            reason: 'Missing student',
            studentId: result.studentId
          });
        }
      }
      
      // Check A-LEVEL results
      const aLevelResults = await ALevelResult.find();
      const aLevelOrphaned = [];
      
      for (const result of aLevelResults) {
        if (!studentIds.includes(result.studentId.toString())) {
          aLevelOrphaned.push({
            id: result._id,
            reason: 'Missing student',
            studentId: result.studentId
          });
        }
      }
      
      // Log the results
      log(`Found ${oLevelOrphaned.length} orphaned O-LEVEL results`);
      log(`Found ${aLevelOrphaned.length} orphaned A-LEVEL results`);
      
      // Return the results
      return {
        oLevelOrphaned,
        aLevelOrphaned,
        totalOrphaned: oLevelOrphaned.length + aLevelOrphaned.length
      };
    } catch (error) {
      log(`Error checking for orphaned results: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Run all consistency checks
   * @returns {Promise<Object>} - The check results
   */
  async runAllChecks() {
    try {
      log('Running all data consistency checks...');
      
      // Run all checks
      const duplicateResults = await this.checkDuplicateResults();
      const incorrectGradesAndPoints = await this.checkIncorrectGradesAndPoints();
      const missingRequiredFields = await this.checkMissingRequiredFields();
      const orphanedResults = await this.checkOrphanedResults();
      
      // Calculate total issues
      const totalIssues = 
        duplicateResults.totalDuplicates + 
        incorrectGradesAndPoints.totalIncorrect + 
        missingRequiredFields.totalMissing + 
        orphanedResults.totalOrphaned;
      
      // Log the results
      log(`Found ${totalIssues} total data consistency issues`);
      
      // Return the results
      return {
        duplicateResults,
        incorrectGradesAndPoints,
        missingRequiredFields,
        orphanedResults,
        totalIssues
      };
    } catch (error) {
      log(`Error running all data consistency checks: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Fix all data consistency issues
   * @returns {Promise<Object>} - The fix results
   */
  async fixAllIssues() {
    try {
      log('Fixing all data consistency issues...');
      
      // Run all checks first
      const checks = await this.runAllChecks();
      
      // Fix duplicate results
      let fixedDuplicates = 0;
      
      // Fix O-LEVEL duplicates
      for (const duplicate of checks.duplicateResults.oLevelDuplicates) {
        // Keep the first result, remove the rest
        const resultIds = duplicate.results.map(r => r.id);
        resultIds.shift(); // Remove the first one (we'll keep it)
        
        // Delete the duplicates
        const deleteResult = await OLevelResult.deleteMany({ _id: { $in: resultIds } });
        fixedDuplicates += deleteResult.deletedCount;
      }
      
      // Fix A-LEVEL duplicates
      for (const duplicate of checks.duplicateResults.aLevelDuplicates) {
        // Keep the first result, remove the rest
        const resultIds = duplicate.results.map(r => r.id);
        resultIds.shift(); // Remove the first one (we'll keep it)
        
        // Delete the duplicates
        const deleteResult = await ALevelResult.deleteMany({ _id: { $in: resultIds } });
        fixedDuplicates += deleteResult.deletedCount;
      }
      
      // Fix incorrect grades and points
      let fixedGradesAndPoints = 0;
      
      // Fix O-LEVEL grades and points
      for (const incorrect of checks.incorrectGradesAndPoints.incorrectOLevelResults) {
        await OLevelResult.updateOne(
          { _id: incorrect.id },
          { $set: { grade: incorrect.expectedGrade, points: incorrect.expectedPoints } }
        );
        fixedGradesAndPoints++;
      }
      
      // Fix A-LEVEL grades and points
      for (const incorrect of checks.incorrectGradesAndPoints.incorrectALevelResults) {
        await ALevelResult.updateOne(
          { _id: incorrect.id },
          { $set: { grade: incorrect.expectedGrade, points: incorrect.expectedPoints } }
        );
        fixedGradesAndPoints++;
      }
      
      // Fix orphaned results
      let fixedOrphaned = 0;
      
      // Delete orphaned O-LEVEL results
      for (const orphaned of checks.orphanedResults.oLevelOrphaned) {
        await OLevelResult.deleteOne({ _id: orphaned.id });
        fixedOrphaned++;
      }
      
      // Delete orphaned A-LEVEL results
      for (const orphaned of checks.orphanedResults.aLevelOrphaned) {
        await ALevelResult.deleteOne({ _id: orphaned.id });
        fixedOrphaned++;
      }
      
      // Log the results
      log(`Fixed ${fixedDuplicates} duplicate results`);
      log(`Fixed ${fixedGradesAndPoints} results with incorrect grades or points`);
      log(`Fixed ${fixedOrphaned} orphaned results`);
      
      // Return the results
      return {
        fixedDuplicates,
        fixedGradesAndPoints,
        fixedOrphaned,
        totalFixed: fixedDuplicates + fixedGradesAndPoints + fixedOrphaned
      };
    } catch (error) {
      log(`Error fixing all data consistency issues: ${error.message}`);
      throw error;
    }
  }
};

module.exports = dataConsistencyMonitor;
