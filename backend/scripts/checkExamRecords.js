/**
 * Script to check if there are any exam records in the database
 * This script connects to MongoDB and checks for exam records
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Class = require('../models/Class');
const Student = require('../models/Student');
const ALevelResult = require('../models/ALevelResult');
const Subject = require('../models/Subject');
const SubjectCombination = require('../models/SubjectCombination');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  console.log('MongoDB URI:', process.env.MONGODB_URI);

  try {
    // Check for exams
    const exams = await Exam.find().limit(10);
    console.log(`Found ${exams.length} exams in the database`);

    if (exams.length > 0) {
      console.log('\nExam Records:');
      exams.forEach((exam, index) => {
        console.log(`${index + 1}. ID: ${exam._id}, Name: ${exam.name}, Type: ${exam.type}, Status: ${exam.status}`);
      });

      // Check for A-Level classes
      const aLevelClasses = await Class.find({ educationLevel: 'A_LEVEL' }).limit(10);
      console.log(`\nFound ${aLevelClasses.length} A-Level classes in the database`);

      if (aLevelClasses.length > 0) {
        console.log('\nA-Level Class Records:');
        aLevelClasses.forEach((cls, index) => {
          console.log(`${index + 1}. ID: ${cls._id}, Name: ${cls.name}, Stream: ${cls.stream || 'N/A'}`);
        });

        // Check for A-Level students
        const aLevelStudents = await Student.find({ educationLevel: 'A_LEVEL' }).limit(10);
        console.log(`\nFound ${aLevelStudents.length} A-Level students in the database`);

        if (aLevelStudents.length > 0) {
          console.log('\nA-Level Student Records:');
          aLevelStudents.forEach((student, index) => {
            console.log(`${index + 1}. ID: ${student._id}, Name: ${student.firstName} ${student.lastName}, Form: ${student.form || 'N/A'}, Class: ${student.class}`);
          });

          // Check for A-Level results
          const aLevelResults = await ALevelResult.find().limit(10);
          console.log(`\nFound ${aLevelResults.length} A-Level result records in the database`);

          if (aLevelResults.length > 0) {
            console.log('\nA-Level Result Records:');
            aLevelResults.forEach((result, index) => {
              console.log(`${index + 1}. Student: ${result.studentId}, Exam: ${result.examId}, Class: ${result.classId}, Marks: ${result.marksObtained}`);
            });
          }

          // Check for A-Level subjects
          const aLevelSubjects = await Subject.find({ educationLevel: 'A_LEVEL' }).limit(10);
          console.log(`\nFound ${aLevelSubjects.length} A-Level subject records in the database`);

          if (aLevelSubjects.length > 0) {
            console.log('\nA-Level Subject Records:');
            aLevelSubjects.forEach((subject, index) => {
              console.log(`${index + 1}. ID: ${subject._id}, Name: ${subject.name}, Code: ${subject.code}, IsPrincipal: ${subject.isPrincipal}`);
            });
          }

          // Check for A-Level subject combinations
          const aLevelCombinations = await SubjectCombination.find({ educationLevel: 'A_LEVEL' }).limit(10);
          console.log(`\nFound ${aLevelCombinations.length} A-Level subject combination records in the database`);

          if (aLevelCombinations.length > 0) {
            console.log('\nA-Level Subject Combination Records:');
            aLevelCombinations.forEach((combo, index) => {
              console.log(`${index + 1}. ID: ${combo._id}, Name: ${combo.name}, Code: ${combo.code}, Subjects: ${combo.subjects.length}`);
            });
          }
        }
      }

      // Check for specific exam and class combination
      if (exams.length > 0 && aLevelClasses.length > 0) {
        const examId = exams[0]._id;
        const classId = aLevelClasses[0]._id;

        console.log(`\nChecking for results with examId=${examId} and classId=${classId}`);

        const resultsCount = await ALevelResult.countDocuments({
          examId: examId,
          classId: classId
        });

        console.log(`Found ${resultsCount} results for this exam and class combination`);

        if (resultsCount === 0) {
          console.log('\nNo results found for this combination. This explains why the A-Level Class Report shows mock data.');
          console.log('You need to create test data for this specific exam and class combination.');

          // Check if there are any results at all
          const totalResults = await ALevelResult.countDocuments();
          console.log(`\nTotal A-Level results in the database: ${totalResults}`);

          if (totalResults > 0) {
            // Find a valid combination
            const validResult = await ALevelResult.findOne();
            if (validResult) {
              console.log('\nFound a valid result record:');
              console.log(`- Student ID: ${validResult.studentId}`);
              console.log(`- Exam ID: ${validResult.examId}`);
              console.log(`- Class ID: ${validResult.classId}`);
              console.log('\nTry using these IDs for the A-Level Class Report:');
              console.log(`- Class ID: ${validResult.classId}`);
              console.log(`- Exam ID: ${validResult.examId}`);
            }
          }
        } else {
          console.log('\nResults found for this combination. The A-Level Class Report should be able to show real data.');
          console.log('Make sure USE_DEMO_DATA=false in your .env file.');

          // Get a sample of the results
          const sampleResults = await ALevelResult.find({
            examId: examId,
            classId: classId
          }).limit(5);

          console.log('\nSample results for this combination:');
          sampleResults.forEach((result, index) => {
            console.log(`${index + 1}. Student: ${result.studentId}, Subject: ${result.subjectId}, Marks: ${result.marksObtained}`);
          });

          // Check if there are students in this class
          const studentsInClass = await Student.countDocuments({ class: classId, educationLevel: 'A_LEVEL' });
          console.log(`\nFound ${studentsInClass} A-Level students in class ${classId}`);

          if (studentsInClass === 0) {
            console.log('\nNo students found in this class. This could be why the A-Level Class Report shows mock data.');
            console.log('You need to assign students to this class.');
          }
        }
      }
    } else {
      console.log('\nNo exam records found in the database.');
      console.log('You need to create exam records before the A-Level Class Report can show real data.');
    }
  } catch (error) {
    console.error('Error checking database records:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});
