const mongoose = require('mongoose');
const Result = require('../models/Result');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Student = require('../models/Student');
const fs = require('fs');
const path = require('path');

/**
 * Script to monitor result consistency and detect potential issues
 * This can be run as a scheduled task (e.g., daily or weekly)
 */
async function monitorResultConsistency() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/school_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    console.log('Connected to MongoDB');

    // Create logs directory if it doesn't exist
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    
    // Create a log file with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logFile = path.join(logDir, `consistency_monitor_${timestamp}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    
    const log = (message) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}`;
      console.log(logMessage);
      logStream.write(logMessage + '\n');
    };

    log('Starting result consistency monitoring');
    
    // 1. Check for duplicate results in the new models
    log('\nChecking for duplicate results in new models...');
    
    // Check O-LEVEL results
    const oLevelDuplicates = await findDuplicateResults(OLevelResult, 'O_LEVEL');
    log(`Found ${oLevelDuplicates.length} duplicate sets in O-LEVEL results`);
    
    // Check A-LEVEL results
    const aLevelDuplicates = await findDuplicateResults(ALevelResult, 'A_LEVEL');
    log(`Found ${aLevelDuplicates.length} duplicate sets in A-LEVEL results`);
    
    // 2. Check for results with invalid references
    log('\nChecking for results with invalid references...');
    
    // Check O-LEVEL results
    const oLevelInvalidRefs = await findInvalidReferences(OLevelResult, 'O_LEVEL');
    log(`Found ${oLevelInvalidRefs.length} O-LEVEL results with invalid references`);
    
    // Check A-LEVEL results
    const aLevelInvalidRefs = await findInvalidReferences(ALevelResult, 'A_LEVEL');
    log(`Found ${aLevelInvalidRefs.length} A-LEVEL results with invalid references`);
    
    // 3. Check for results with incorrect grade or points
    log('\nChecking for results with incorrect grade or points...');
    
    // Check O-LEVEL results
    const oLevelIncorrectGrades = await findIncorrectGrades(OLevelResult, 'O_LEVEL');
    log(`Found ${oLevelIncorrectGrades.length} O-LEVEL results with incorrect grades or points`);
    
    // Check A-LEVEL results
    const aLevelIncorrectGrades = await findIncorrectGrades(ALevelResult, 'A_LEVEL');
    log(`Found ${aLevelIncorrectGrades.length} A-LEVEL results with incorrect grades or points`);
    
    // 4. Check for students with results in both models
    log('\nChecking for students with results in both old and new models...');
    
    const studentsWithMixedResults = await findStudentsWithMixedResults();
    log(`Found ${studentsWithMixedResults.length} students with results in both old and new models`);
    
    // 5. Check for results in old model that are not in new models
    log('\nChecking for results in old model that are not in new models...');
    
    const unmigrated = await findUnmigratedResults();
    log(`Found ${unmigrated.length} results in old model that are not in new models`);
    
    // 6. Generate summary
    log('\nMonitoring Summary:');
    log(`Duplicate results: ${oLevelDuplicates.length + aLevelDuplicates.length}`);
    log(`Results with invalid references: ${oLevelInvalidRefs.length + aLevelInvalidRefs.length}`);
    log(`Results with incorrect grades: ${oLevelIncorrectGrades.length + aLevelIncorrectGrades.length}`);
    log(`Students with mixed results: ${studentsWithMixedResults.length}`);
    log(`Unmigrated results: ${unmigrated.length}`);
    
    const totalIssues = oLevelDuplicates.length + aLevelDuplicates.length +
                        oLevelInvalidRefs.length + aLevelInvalidRefs.length +
                        oLevelIncorrectGrades.length + aLevelIncorrectGrades.length +
                        studentsWithMixedResults.length + unmigrated.length;
    
    log(`Total issues found: ${totalIssues}`);
    
    // 7. Recommend actions
    if (totalIssues > 0) {
      log('\nRecommended Actions:');
      
      if (oLevelDuplicates.length + aLevelDuplicates.length > 0) {
        log('- Run the fixMarksInconsistencies.js script to remove duplicate results');
      }
      
      if (oLevelInvalidRefs.length + aLevelInvalidRefs.length > 0) {
        log('- Run the fixMarksInconsistencies.js script to fix invalid references');
      }
      
      if (oLevelIncorrectGrades.length + aLevelIncorrectGrades.length > 0) {
        log('- Run the fixMarksInconsistencies.js script to recalculate grades and points');
      }
      
      if (studentsWithMixedResults.length > 0) {
        log('- Run the completeMigration.js script to migrate all results to the new models');
      }
      
      if (unmigrated.length > 0) {
        log('- Run the completeMigration.js script to migrate remaining results to the new models');
      }
    } else {
      log('\nNo issues found. The system is in a consistent state.');
    }
    
    log('\nMonitoring completed');
    
    // Close log stream
    logStream.end();
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Monitoring failed:', error);
    
    // Ensure we disconnect even if there's an error
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
    
    process.exit(1);
  }
}

/**
 * Find duplicate results in a model
 * @param {Model} Model - The Mongoose model to check
 * @param {String} modelName - The name of the model for logging
 * @returns {Promise<Array>} - Array of duplicate sets
 */
async function findDuplicateResults(Model, modelName) {
  // Find results with the same student, exam, and subject
  const duplicates = await Model.aggregate([
    {
      $group: {
        _id: {
          studentId: '$studentId',
          examId: '$examId',
          subjectId: '$subjectId'
        },
        count: { $sum: 1 },
        results: { $push: { id: '$_id', marks: '$marksObtained' } }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]);
  
  // Log details of duplicates
  for (const duplicate of duplicates) {
    console.log(`${modelName} duplicate: Student=${duplicate._id.studentId}, Exam=${duplicate._id.examId}, Subject=${duplicate._id.subjectId}, Count=${duplicate.count}`);
    console.log(`  Results: ${JSON.stringify(duplicate.results)}`);
  }
  
  return duplicates;
}

/**
 * Find results with invalid references
 * @param {Model} Model - The Mongoose model to check
 * @param {String} modelName - The name of the model for logging
 * @returns {Promise<Array>} - Array of results with invalid references
 */
async function findInvalidReferences(Model, modelName) {
  const invalidRefs = [];
  
  // Get a sample of results
  const results = await Model.find().limit(100);
  
  for (const result of results) {
    let isInvalid = false;
    const invalidFields = [];
    
    // Check student reference
    if (result.studentId) {
      const student = await Student.findById(result.studentId);
      if (!student) {
        isInvalid = true;
        invalidFields.push('studentId');
      }
    }
    
    // Add more reference checks as needed (examId, subjectId, etc.)
    
    if (isInvalid) {
      invalidRefs.push({
        id: result._id,
        invalidFields
      });
      
      console.log(`${modelName} invalid reference: Result=${result._id}, Invalid fields=${invalidFields.join(', ')}`);
    }
  }
  
  return invalidRefs;
}

/**
 * Find results with incorrect grade or points
 * @param {Model} Model - The Mongoose model to check
 * @param {String} modelName - The name of the model for logging
 * @returns {Promise<Array>} - Array of results with incorrect grade or points
 */
async function findIncorrectGrades(Model, modelName) {
  const incorrectGrades = [];
  
  // Get a sample of results
  const results = await Model.find().limit(100);
  
  for (const result of results) {
    let isIncorrect = false;
    const issues = [];
    
    // Calculate expected grade and points
    let expectedGrade, expectedPoints;
    const marks = result.marksObtained;
    
    if (modelName === 'A_LEVEL') {
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
    
    // Check if grade is incorrect
    if (result.grade !== expectedGrade) {
      isIncorrect = true;
      issues.push(`grade (${result.grade} vs expected ${expectedGrade})`);
    }
    
    // Check if points are incorrect
    if (result.points !== expectedPoints) {
      isIncorrect = true;
      issues.push(`points (${result.points} vs expected ${expectedPoints})`);
    }
    
    if (isIncorrect) {
      incorrectGrades.push({
        id: result._id,
        marks: result.marksObtained,
        actualGrade: result.grade,
        expectedGrade,
        actualPoints: result.points,
        expectedPoints,
        issues
      });
      
      console.log(`${modelName} incorrect grade/points: Result=${result._id}, Marks=${marks}, Issues=${issues.join(', ')}`);
    }
  }
  
  return incorrectGrades;
}

/**
 * Find students with results in both old and new models
 * @returns {Promise<Array>} - Array of students with mixed results
 */
async function findStudentsWithMixedResults() {
  const mixedResults = [];
  
  // Get all students
  const students = await Student.find().limit(100);
  
  for (const student of students) {
    // Check if student has results in old model
    const oldResults = await Result.find({ studentId: student._id }).countDocuments();
    
    // Check if student has results in new models
    const educationLevel = student.educationLevel || 'O_LEVEL';
    const Model = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;
    const newResults = await Model.find({ studentId: student._id }).countDocuments();
    
    if (oldResults > 0 && newResults > 0) {
      mixedResults.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        oldResultsCount: oldResults,
        newResultsCount: newResults
      });
      
      console.log(`Student with mixed results: ${student._id} (${student.firstName} ${student.lastName}), Old results: ${oldResults}, New results: ${newResults}`);
    }
  }
  
  return mixedResults;
}

/**
 * Find results in old model that are not in new models
 * @returns {Promise<Array>} - Array of unmigrated results
 */
async function findUnmigratedResults() {
  const unmigrated = [];
  
  // Get a sample of results from old model
  const oldResults = await Result.find().limit(100);
  
  for (const oldResult of oldResults) {
    // Get student to determine education level
    const student = await Student.findById(oldResult.studentId);
    if (!student) continue;
    
    const educationLevel = student.educationLevel || 'O_LEVEL';
    const Model = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;
    
    // Check if result exists in new model
    const newResult = await Model.findOne({
      studentId: oldResult.studentId,
      examId: oldResult.examId,
      subjectId: oldResult.subjectId
    });
    
    if (!newResult) {
      unmigrated.push({
        id: oldResult._id,
        studentId: oldResult.studentId,
        examId: oldResult.examId,
        subjectId: oldResult.subjectId,
        marks: oldResult.marksObtained
      });
      
      console.log(`Unmigrated result: ${oldResult._id}, Student=${oldResult.studentId}, Exam=${oldResult.examId}, Subject=${oldResult.subjectId}`);
    }
  }
  
  return unmigrated;
}

// Run the monitoring
monitorResultConsistency();
