/**
 * Script to fix cross-contaminated marks in the database
 * This script will:
 * 1. Find all results that have the same studentId and assessmentId but different subjectIds
 * 2. Determine which subject is correct based on the student's enrollment
 * 3. Update the results to have the correct subjectId
 * 4. Delete any duplicate results
 */
const mongoose = require('mongoose');
const Result = require('../models/Result');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Assessment = require('../models/Assessment');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agape', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function fixCrossContaminatedMarks() {
  try {
    console.log('Starting cross-contaminated marks fix...');
    
    // Find all assessments
    const assessments = await Assessment.find({});
    console.log(`Found ${assessments.length} assessments`);
    
    // Find all students
    const students = await Student.find({}).populate('subjects');
    console.log(`Found ${students.length} students`);
    
    // Find all results
    const results = await Result.find({});
    console.log(`Found ${results.length} results`);
    
    // Group results by studentId and assessmentId
    const resultGroups = {};
    for (const result of results) {
      const key = `${result.studentId}-${result.assessmentId}`;
      if (!resultGroups[key]) {
        resultGroups[key] = [];
      }
      resultGroups[key].push(result);
    }
    
    // Find groups with multiple results (potential cross-contamination)
    const crossContaminatedGroups = Object.entries(resultGroups)
      .filter(([_, group]) => group.length > 1)
      .map(([key, group]) => ({ key, group }));
    
    console.log(`Found ${crossContaminatedGroups.length} potential cross-contaminated groups`);
    
    // Process each cross-contaminated group
    for (const { key, group } of crossContaminatedGroups) {
      const [studentId, assessmentId] = key.split('-');
      console.log(`Processing group for student ${studentId}, assessment ${assessmentId}`);
      
      // Find the student
      const student = students.find(s => s._id.toString() === studentId);
      if (!student) {
        console.log(`Student ${studentId} not found, skipping`);
        continue;
      }
      
      // Find the assessment
      const assessment = assessments.find(a => a._id.toString() === assessmentId);
      if (!assessment) {
        console.log(`Assessment ${assessmentId} not found, skipping`);
        continue;
      }
      
      // Get the student's subjects
      const studentSubjectIds = student.subjects.map(s => s.toString());
      console.log(`Student ${student.name} is enrolled in ${studentSubjectIds.length} subjects`);
      
      // Find which results have a subjectId that matches the student's enrollment
      const validResults = group.filter(r => 
        studentSubjectIds.includes(r.subjectId.toString())
      );
      
      console.log(`Found ${validResults.length} valid results out of ${group.length} total`);
      
      // If there are valid results, keep those and delete the rest
      if (validResults.length > 0) {
        // Delete invalid results
        for (const result of group) {
          if (!validResults.some(vr => vr._id.toString() === result._id.toString())) {
            console.log(`Deleting invalid result ${result._id} for subject ${result.subjectId}`);
            await Result.deleteOne({ _id: result._id });
          }
        }
      } 
      // If there are no valid results, keep the one with the assessment's subjectId if it exists
      else if (assessment.subjectId) {
        const assessmentSubjectResult = group.find(r => 
          r.subjectId.toString() === assessment.subjectId.toString()
        );
        
        if (assessmentSubjectResult) {
          console.log(`Keeping result ${assessmentSubjectResult._id} that matches assessment's subjectId ${assessment.subjectId}`);
          
          // Delete all other results
          for (const result of group) {
            if (result._id.toString() !== assessmentSubjectResult._id.toString()) {
              console.log(`Deleting invalid result ${result._id} for subject ${result.subjectId}`);
              await Result.deleteOne({ _id: result._id });
            }
          }
        } 
        // If no result matches the assessment's subjectId, keep the first one and update its subjectId
        else if (assessment.isUniversal) {
          const firstResult = group[0];
          console.log(`Keeping first result ${firstResult._id} and updating its subjectId to match student's first subject`);
          
          if (studentSubjectIds.length > 0) {
            firstResult.subjectId = studentSubjectIds[0];
            await firstResult.save();
          }
          
          // Delete all other results
          for (const result of group.slice(1)) {
            console.log(`Deleting duplicate result ${result._id} for subject ${result.subjectId}`);
            await Result.deleteOne({ _id: result._id });
          }
        }
        // If the assessment is not universal and no result matches, delete all results
        else {
          console.log(`No valid results found and assessment is not universal, deleting all ${group.length} results`);
          for (const result of group) {
            await Result.deleteOne({ _id: result._id });
          }
        }
      }
      // If there are no valid results and the assessment has no subjectId, keep the first one
      else {
        console.log(`No valid results found and assessment has no subjectId, keeping first result`);
        
        // Delete all but the first result
        for (const result of group.slice(1)) {
          console.log(`Deleting duplicate result ${result._id} for subject ${result.subjectId}`);
          await Result.deleteOne({ _id: result._id });
        }
      }
    }
    
    console.log('Cross-contaminated marks fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during cross-contaminated marks fix:', error);
    process.exit(1);
  }
}

// Run the fix
fixCrossContaminatedMarks();
