const mongoose = require('mongoose');
const Result = require('../models/Result');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Student = require('../models/Student');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/school_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false;
  }
}

// Fix marks inconsistencies
async function fixMarksInconsistencies() {
  try {
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Cannot proceed without MongoDB connection');
      return;
    }

    console.log('\n=== FIXING MARKS INCONSISTENCIES ===\n');
    
    // 1. Fix alias fields in the Result model
    console.log('Fixing alias fields in the Result model...');
    
    const resultsToFix = await Result.find({
      $or: [
        { student: { $exists: false } },
        { exam: { $exists: false } },
        { subject: { $exists: false } },
        { class: { $exists: false } }
      ]
    });
    
    console.log(`Found ${resultsToFix.length} results with missing alias fields`);
    
    let fixedAliasCount = 0;
    for (const result of resultsToFix) {
      // Set alias fields to match the original fields
      if (result.studentId && !result.student) result.student = result.studentId;
      if (result.examId && !result.exam) result.exam = result.examId;
      if (result.subjectId && !result.subject) result.subject = result.subjectId;
      if (result.classId && !result.class) result.class = result.classId;
      
      try {
        await result.save();
        fixedAliasCount++;
      } catch (error) {
        console.error(`Error fixing alias fields for result ${result._id}:`, error);
      }
    }
    
    console.log(`Fixed alias fields for ${fixedAliasCount} results`);
    
    // 2. Ensure consistent data between old and new models
    console.log('\nEnsuring consistent data between old and new models...');
    
    // Get all students
    const students = await Student.find();
    console.log(`Processing ${students.length} students...`);
    
    let totalFixed = 0;
    let totalProcessed = 0;
    
    for (const student of students) {
      const educationLevel = student.educationLevel || 'O_LEVEL';
      const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;
      
      // Get all exams for this student from the old model
      const exams = await Result.distinct('examId', { studentId: student._id });
      
      for (const examId of exams) {
        // Get all results for this student and exam from the old model
        const oldResults = await Result.find({ 
          studentId: student._id, 
          examId: examId 
        }).populate('subjectId');
        
        for (const oldResult of oldResults) {
          totalProcessed++;
          
          // Skip if no subject
          if (!oldResult.subjectId) continue;
          
          // Check if this result exists in the new model
          const newResult = await ResultModel.findOne({
            studentId: student._id,
            examId: examId,
            subjectId: oldResult.subjectId._id || oldResult.subjectId
          });
          
          if (newResult) {
            // Check if marks are different
            if (newResult.marksObtained !== oldResult.marksObtained) {
              console.log(`Inconsistent marks for student ${student._id}, exam ${examId}, subject ${oldResult.subjectId._id || oldResult.subjectId}`);
              console.log(`  Old model: ${oldResult.marksObtained}, New model: ${newResult.marksObtained}`);
              
              // Update the new model with the marks from the old model
              newResult.marksObtained = oldResult.marksObtained;
              
              try {
                await newResult.save();
                console.log(`  Fixed: Updated new model with marks ${oldResult.marksObtained}`);
                totalFixed++;
              } catch (error) {
                console.error(`  Error fixing marks:`, error);
              }
            }
          } else {
            // Result doesn't exist in the new model, create it
            console.log(`Missing result in new model for student ${student._id}, exam ${examId}, subject ${oldResult.subjectId._id || oldResult.subjectId}`);
            
            try {
              const newResultData = {
                studentId: student._id,
                examId: examId,
                academicYearId: oldResult.academicYearId || oldResult.academicYear,
                examTypeId: oldResult.examTypeId || oldResult.examType,
                subjectId: oldResult.subjectId._id || oldResult.subjectId,
                classId: oldResult.classId || oldResult.class || student.class,
                marksObtained: oldResult.marksObtained,
                grade: oldResult.grade,
                points: oldResult.points,
                comment: oldResult.comment
              };
              
              const createdResult = new ResultModel(newResultData);
              await createdResult.save();
              console.log(`  Fixed: Created new result in ${educationLevel} model with marks ${oldResult.marksObtained}`);
              totalFixed++;
            } catch (error) {
              console.error(`  Error creating new result:`, error);
            }
          }
        }
      }
    }
    
    console.log(`\nProcessed ${totalProcessed} results, fixed ${totalFixed} inconsistencies`);
    
    // 3. Fix duplicate results in the old model
    console.log('\nFixing duplicate results in the old model...');
    
    // Get all students again
    const studentsForDuplicates = await Student.find();
    let duplicatesFixed = 0;
    
    for (const student of studentsForDuplicates) {
      // Get all exams for this student
      const studentExams = await Result.distinct('examId', { studentId: student._id });
      
      for (const examId of studentExams) {
        // For each subject, find if there are duplicate results
        const subjects = await Result.distinct('subjectId', { 
          studentId: student._id, 
          examId: examId 
        });
        
        for (const subjectId of subjects) {
          // Get all results for this student, exam, and subject
          const duplicateResults = await Result.find({ 
            studentId: student._id, 
            examId: examId,
            subjectId: subjectId
          }).sort({ updatedAt: -1 }); // Sort by most recent first
          
          if (duplicateResults.length > 1) {
            console.log(`Found ${duplicateResults.length} duplicate results for student ${student._id}, exam ${examId}, subject ${subjectId}`);
            
            // Keep the most recent result, delete the others
            const mostRecent = duplicateResults[0];
            const toDelete = duplicateResults.slice(1);
            
            console.log(`  Keeping most recent result ${mostRecent._id} with marks ${mostRecent.marksObtained}`);
            
            for (const duplicate of toDelete) {
              try {
                await Result.deleteOne({ _id: duplicate._id });
                console.log(`  Deleted duplicate result ${duplicate._id} with marks ${duplicate.marksObtained}`);
                duplicatesFixed++;
              } catch (error) {
                console.error(`  Error deleting duplicate result:`, error);
              }
            }
          }
        }
      }
    }
    
    console.log(`Fixed ${duplicatesFixed} duplicate results`);
    
    // 4. Ensure all results have proper grade and points
    console.log('\nEnsuring all results have proper grade and points...');
    
    // Process old model
    const resultsWithoutGrade = await Result.find({
      $or: [
        { grade: { $exists: false } },
        { grade: null },
        { points: { $exists: false } },
        { points: null }
      ]
    });
    
    console.log(`Found ${resultsWithoutGrade.length} results without proper grade or points in old model`);
    
    let gradeFixCount = 0;
    for (const result of resultsWithoutGrade) {
      // Calculate grade based on marks
      const marks = result.marksObtained;
      let grade, points;
      
      // Get student to determine education level
      const student = await Student.findById(result.studentId);
      const educationLevel = student ? (student.educationLevel || 'O_LEVEL') : 'O_LEVEL';
      
      if (educationLevel === 'O_LEVEL') {
        // O-LEVEL grading
        if (marks >= 75) { grade = 'A'; points = 1; }
        else if (marks >= 65) { grade = 'B'; points = 2; }
        else if (marks >= 50) { grade = 'C'; points = 3; }
        else if (marks >= 30) { grade = 'D'; points = 4; }
        else { grade = 'F'; points = 5; }
      } else {
        // A-LEVEL grading
        if (marks >= 80) { grade = 'A'; points = 1; }
        else if (marks >= 70) { grade = 'B'; points = 2; }
        else if (marks >= 60) { grade = 'C'; points = 3; }
        else if (marks >= 50) { grade = 'D'; points = 4; }
        else if (marks >= 40) { grade = 'E'; points = 5; }
        else if (marks >= 35) { grade = 'S'; points = 6; }
        else { grade = 'F'; points = 7; }
      }
      
      // Update the result
      result.grade = grade;
      result.points = points;
      
      try {
        await result.save();
        gradeFixCount++;
      } catch (error) {
        console.error(`Error fixing grade for result ${result._id}:`, error);
      }
    }
    
    console.log(`Fixed grades and points for ${gradeFixCount} results in old model`);
    
    // Process new O-LEVEL model
    const oLevelResultsWithoutGrade = await OLevelResult.find({
      $or: [
        { grade: { $exists: false } },
        { grade: null },
        { points: { $exists: false } },
        { points: null }
      ]
    });
    
    console.log(`Found ${oLevelResultsWithoutGrade.length} results without proper grade or points in O-LEVEL model`);
    
    let oLevelGradeFixCount = 0;
    for (const result of oLevelResultsWithoutGrade) {
      // Calculate grade based on marks
      const marks = result.marksObtained;
      let grade, points;
      
      // O-LEVEL grading
      if (marks >= 75) { grade = 'A'; points = 1; }
      else if (marks >= 65) { grade = 'B'; points = 2; }
      else if (marks >= 50) { grade = 'C'; points = 3; }
      else if (marks >= 30) { grade = 'D'; points = 4; }
      else { grade = 'F'; points = 5; }
      
      // Update the result
      result.grade = grade;
      result.points = points;
      
      try {
        await result.save();
        oLevelGradeFixCount++;
      } catch (error) {
        console.error(`Error fixing grade for O-LEVEL result ${result._id}:`, error);
      }
    }
    
    console.log(`Fixed grades and points for ${oLevelGradeFixCount} results in O-LEVEL model`);
    
    // Process new A-LEVEL model
    const aLevelResultsWithoutGrade = await ALevelResult.find({
      $or: [
        { grade: { $exists: false } },
        { grade: null },
        { points: { $exists: false } },
        { points: null }
      ]
    });
    
    console.log(`Found ${aLevelResultsWithoutGrade.length} results without proper grade or points in A-LEVEL model`);
    
    let aLevelGradeFixCount = 0;
    for (const result of aLevelResultsWithoutGrade) {
      // Calculate grade based on marks
      const marks = result.marksObtained;
      let grade, points;
      
      // A-LEVEL grading
      if (marks >= 80) { grade = 'A'; points = 1; }
      else if (marks >= 70) { grade = 'B'; points = 2; }
      else if (marks >= 60) { grade = 'C'; points = 3; }
      else if (marks >= 50) { grade = 'D'; points = 4; }
      else if (marks >= 40) { grade = 'E'; points = 5; }
      else if (marks >= 35) { grade = 'S'; points = 6; }
      else { grade = 'F'; points = 7; }
      
      // Update the result
      result.grade = grade;
      result.points = points;
      
      try {
        await result.save();
        aLevelGradeFixCount++;
      } catch (error) {
        console.error(`Error fixing grade for A-LEVEL result ${result._id}:`, error);
      }
    }
    
    console.log(`Fixed grades and points for ${aLevelGradeFixCount} results in A-LEVEL model`);
    
    console.log('\n=== FIX COMPLETE ===\n');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error during fix process:', error);
    
    // Ensure we disconnect even if there's an error
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
  }
}

// Run the fix
fixMarksInconsistencies();
