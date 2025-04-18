/**
 * Simple script to check if there are any exam records in the database
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  console.log('MongoDB URI:', process.env.MONGODB_URI);
  
  try {
    // Check for exams
    const Exam = mongoose.model('Exam', new mongoose.Schema({
      name: String,
      type: String,
      status: String,
      academicYear: mongoose.Schema.Types.ObjectId,
      educationLevel: String
    }));
    
    const exams = await Exam.find().limit(10);
    console.log(`Found ${exams.length} exams in the database`);
    
    if (exams.length > 0) {
      console.log('\nExam Records:');
      exams.forEach((exam, index) => {
        console.log(`${index + 1}. ID: ${exam._id}, Name: ${exam.name}, Type: ${exam.type}, Status: ${exam.status}`);
      });
    } else {
      console.log('\nNo exam records found in the database.');
    }
    
    // Check for A-Level classes
    const Class = mongoose.model('Class', new mongoose.Schema({
      name: String,
      stream: String,
      educationLevel: String
    }));
    
    const aLevelClasses = await Class.find({ educationLevel: 'A_LEVEL' }).limit(10);
    console.log(`\nFound ${aLevelClasses.length} A-Level classes in the database`);
    
    if (aLevelClasses.length > 0) {
      console.log('\nA-Level Class Records:');
      aLevelClasses.forEach((cls, index) => {
        console.log(`${index + 1}. ID: ${cls._id}, Name: ${cls.name}, Stream: ${cls.stream || 'N/A'}`);
      });
    }
    
    // Check for A-Level results
    const ALevelResult = mongoose.model('ALevelResult', new mongoose.Schema({
      studentId: mongoose.Schema.Types.ObjectId,
      examId: mongoose.Schema.Types.ObjectId,
      classId: mongoose.Schema.Types.ObjectId,
      marksObtained: Number
    }));
    
    const aLevelResults = await ALevelResult.find().limit(10);
    console.log(`\nFound ${aLevelResults.length} A-Level result records in the database`);
    
    if (aLevelResults.length > 0) {
      console.log('\nA-Level Result Records:');
      aLevelResults.forEach((result, index) => {
        console.log(`${index + 1}. Student: ${result.studentId}, Exam: ${result.examId}, Class: ${result.classId}, Marks: ${result.marksObtained}`);
      });
      
      // Find a valid combination
      const validResult = aLevelResults[0];
      console.log('\nTry using these IDs for the A-Level Class Report:');
      console.log(`- Class ID: ${validResult.classId}`);
      console.log(`- Exam ID: ${validResult.examId}`);
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
