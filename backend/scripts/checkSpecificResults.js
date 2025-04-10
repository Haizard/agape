require('dotenv').config();
const mongoose = require('mongoose');
const OLevelResult = require('../models/OLevelResult');
const Student = require('../models/Student');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Check if there are results for a specific student and exam
    const studentId = '67f3779e951e87867642156a';
    const examId = '67f596c1a03db3d12366dc7c';
    
    console.log(`Checking for results for student ${studentId} and exam ${examId}`);
    
    // Get student details
    const student = await Student.findById(studentId);
    if (student) {
      console.log(`Student found: ${student.firstName} ${student.lastName}, Education Level: ${student.educationLevel || 'Not set'}`);
    } else {
      console.log(`Student not found with ID: ${studentId}`);
    }
    
    // Get exam details
    const exam = await Exam.findById(examId);
    if (exam) {
      console.log(`Exam found: ${exam.name}`);
    } else {
      console.log(`Exam not found with ID: ${examId}`);
    }
    
    // Get results for this student and exam
    const studentResults = await OLevelResult.find({ 
      studentId, 
      examId 
    }).populate('subjectId', 'name');
    
    console.log(`Found ${studentResults.length} results for student ${studentId} and exam ${examId}`);
    
    if (studentResults.length > 0) {
      console.log('Results:');
      studentResults.forEach(result => {
        console.log(`Subject: ${result.subjectId?.name || 'Unknown'}, Marks: ${result.marksObtained}, Grade: ${result.grade}, Points: ${result.points}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
});
