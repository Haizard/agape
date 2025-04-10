const mongoose = require('mongoose');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Result = require('../models/Result');
const Student = require('../models/Student');

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management');
    console.log('Connected to MongoDB');

    // Get a sample of results from each model
    const oLevelResults = await OLevelResult.find().limit(5).populate('studentId', 'firstName lastName').populate('subjectId', 'name');
    const aLevelResults = await ALevelResult.find().limit(5).populate('studentId', 'firstName lastName').populate('subjectId', 'name');
    const oldResults = await Result.find().limit(5).populate('studentId', 'firstName lastName').populate('subjectId', 'name');

    console.log('O-Level Results Sample:');
    for (const result of oLevelResults) {
      console.log(`Student: ${result.studentId?.firstName} ${result.studentId?.lastName}, Subject: ${result.subjectId?.name}, Marks: ${result.marksObtained}, Grade: ${result.grade}`);
    }

    console.log('\nA-Level Results Sample:');
    for (const result of aLevelResults) {
      console.log(`Student: ${result.studentId?.firstName} ${result.studentId?.lastName}, Subject: ${result.subjectId?.name}, Marks: ${result.marksObtained}, Grade: ${result.grade}`);
    }

    console.log('\nOld Results Sample:');
    for (const result of oldResults) {
      console.log(`Student: ${result.studentId?.firstName} ${result.studentId?.lastName}, Subject: ${result.subjectId?.name}, Marks: ${result.marksObtained}, Grade: ${result.grade}`);
    }

    // Check for duplicate results
    const duplicateCheck = await OLevelResult.aggregate([
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
      },
      {
        $limit: 10
      }
    ]);

    console.log('\nDuplicate Results Check:');
    console.log(`Found ${duplicateCheck.length} sets of duplicate results`);
    
    for (const duplicate of duplicateCheck) {
      console.log(`Student: ${duplicate._id.studentId}, Subject: ${duplicate._id.subjectId}, Exam: ${duplicate._id.examId}`);
      console.log(`Results: ${JSON.stringify(duplicate.results)}`);
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
