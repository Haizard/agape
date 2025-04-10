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

// Diagnose marks inconsistencies
async function diagnoseMarksInconsistencies() {
  try {
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Cannot proceed without MongoDB connection');
      return;
    }

    console.log('\n=== DIAGNOSING MARKS INCONSISTENCIES ===\n');

    // 1. Check for duplicate results across models
    console.log('Checking for duplicate results across models...');
    
    // Get a sample of students
    const students = await Student.find().limit(5);
    
    for (const student of students) {
      console.log(`\nChecking results for student: ${student.firstName} ${student.lastName} (${student._id})`);
      
      // Get exams
      const exams = await Exam.find().limit(3);
      
      for (const exam of exams) {
        console.log(`\n  Exam: ${exam.name} (${exam._id})`);
        
        // Check old Result model
        const oldResults = await Result.find({ 
          $or: [
            { studentId: student._id, examId: exam._id },
            { student: student._id, exam: exam._id }
          ]
        }).populate('subjectId').populate('subject');
        
        console.log(`  Old model results count: ${oldResults.length}`);
        
        // Check education level specific models
        const educationLevel = student.educationLevel || 'O_LEVEL';
        const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;
        
        const newResults = await ResultModel.find({ 
          studentId: student._id, 
          examId: exam._id 
        }).populate('subjectId');
        
        console.log(`  New ${educationLevel} model results count: ${newResults.length}`);
        
        // Compare results
        if (oldResults.length > 0 && newResults.length > 0) {
          console.log('  Comparing results between models:');
          
          // Create maps for easy comparison
          const oldResultsMap = new Map();
          oldResults.forEach(result => {
            const subjectId = (result.subjectId?._id || result.subject?._id || result.subjectId).toString();
            oldResultsMap.set(subjectId, result);
          });
          
          const newResultsMap = new Map();
          newResults.forEach(result => {
            const subjectId = (result.subjectId?._id || result.subjectId).toString();
            newResultsMap.set(subjectId, result);
          });
          
          // Find subjects in both maps
          for (const [subjectId, oldResult] of oldResultsMap.entries()) {
            const newResult = newResultsMap.get(subjectId);
            
            if (newResult) {
              const oldMarks = oldResult.marksObtained;
              const newMarks = newResult.marksObtained;
              
              if (oldMarks !== newMarks) {
                console.log(`    INCONSISTENCY: Subject ${subjectId} has different marks: Old=${oldMarks}, New=${newMarks}`);
              } else {
                console.log(`    Subject ${subjectId} has consistent marks: ${oldMarks}`);
              }
            } else {
              console.log(`    Subject ${subjectId} exists in old model but not in new model`);
            }
          }
          
          // Find subjects only in new model
          for (const [subjectId, newResult] of newResultsMap.entries()) {
            if (!oldResultsMap.has(subjectId)) {
              console.log(`    Subject ${subjectId} exists in new model but not in old model`);
            }
          }
        }
      }
    }
    
    // 2. Check for inconsistencies in alias fields
    console.log('\nChecking for inconsistencies in alias fields...');
    
    const sampleResults = await Result.find().limit(20);
    let aliasInconsistencies = 0;
    
    for (const result of sampleResults) {
      const inconsistencies = [];
      
      if (result.studentId && result.student && result.studentId.toString() !== result.student.toString()) {
        inconsistencies.push('studentId ≠ student');
      }
      
      if (result.examId && result.exam && result.examId.toString() !== result.exam.toString()) {
        inconsistencies.push('examId ≠ exam');
      }
      
      if (result.subjectId && result.subject && result.subjectId.toString() !== result.subject.toString()) {
        inconsistencies.push('subjectId ≠ subject');
      }
      
      if (result.classId && result.class && result.classId.toString() !== result.class.toString()) {
        inconsistencies.push('classId ≠ class');
      }
      
      if (inconsistencies.length > 0) {
        console.log(`  Result ${result._id} has alias inconsistencies: ${inconsistencies.join(', ')}`);
        aliasInconsistencies++;
      }
    }
    
    console.log(`  Found ${aliasInconsistencies} results with alias inconsistencies out of ${sampleResults.length} checked`);
    
    // 3. Check for multiple results for the same student/subject/exam
    console.log('\nChecking for duplicate results for the same student/subject/exam...');
    
    // Get all students
    const allStudents = await Student.find().limit(10);
    
    for (const student of allStudents) {
      // Get all exams for this student
      const studentExams = await Result.distinct('examId', { studentId: student._id });
      
      for (const examId of studentExams) {
        // Get all subjects for this student and exam
        const results = await Result.find({ 
          studentId: student._id, 
          examId: examId 
        }).populate('subjectId');
        
        // Group by subject
        const subjectGroups = {};
        
        for (const result of results) {
          const subjectId = result.subjectId?._id || result.subjectId;
          if (!subjectId) continue;
          
          const key = subjectId.toString();
          if (!subjectGroups[key]) {
            subjectGroups[key] = [];
          }
          
          subjectGroups[key].push(result);
        }
        
        // Check for duplicates
        for (const [subjectId, subjectResults] of Object.entries(subjectGroups)) {
          if (subjectResults.length > 1) {
            console.log(`  Student ${student._id} has ${subjectResults.length} results for subject ${subjectId} in exam ${examId}`);
            
            // Check if marks are different
            const marks = subjectResults.map(r => r.marksObtained);
            const uniqueMarks = [...new Set(marks)];
            
            if (uniqueMarks.length > 1) {
              console.log(`    INCONSISTENT MARKS: ${uniqueMarks.join(', ')}`);
            } else {
              console.log(`    All marks are the same: ${uniqueMarks[0]}`);
            }
          }
        }
      }
    }
    
    // 4. Check for results with missing required fields
    console.log('\nChecking for results with missing required fields...');
    
    const missingFieldsResults = await Result.find({
      $or: [
        { studentId: { $exists: false } },
        { examId: { $exists: false } },
        { subjectId: { $exists: false } },
        { marksObtained: { $exists: false } }
      ]
    }).limit(20);
    
    console.log(`  Found ${missingFieldsResults.length} results with missing required fields`);
    
    for (const result of missingFieldsResults) {
      const missingFields = [];
      
      if (!result.studentId) missingFields.push('studentId');
      if (!result.examId) missingFields.push('examId');
      if (!result.subjectId) missingFields.push('subjectId');
      if (result.marksObtained === undefined) missingFields.push('marksObtained');
      
      console.log(`  Result ${result._id} is missing fields: ${missingFields.join(', ')}`);
    }
    
    // 5. Check for results with invalid references
    console.log('\nChecking for results with invalid references...');
    
    const sampleForReferences = await Result.find().limit(50);
    let invalidReferences = 0;
    
    for (const result of sampleForReferences) {
      const invalidFields = [];
      
      if (result.studentId) {
        const student = await Student.findById(result.studentId);
        if (!student) invalidFields.push('studentId');
      }
      
      if (result.subjectId) {
        const subject = await Subject.findById(result.subjectId);
        if (!subject) invalidFields.push('subjectId');
      }
      
      if (result.examId) {
        const exam = await Exam.findById(result.examId);
        if (!exam) invalidFields.push('examId');
      }
      
      if (invalidFields.length > 0) {
        console.log(`  Result ${result._id} has invalid references: ${invalidFields.join(', ')}`);
        invalidReferences++;
      }
    }
    
    console.log(`  Found ${invalidReferences} results with invalid references out of ${sampleForReferences.length} checked`);
    
    console.log('\n=== DIAGNOSIS COMPLETE ===\n');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error during diagnosis:', error);
    
    // Ensure we disconnect even if there's an error
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
  }
}

// Run the diagnosis
diagnoseMarksInconsistencies();
