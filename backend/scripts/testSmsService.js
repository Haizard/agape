/**
 * Test script for SMS service
 * This script tests the SMS service by sending a test message to a specified phone number
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Result = require('../models/Result');
const Exam = require('../models/Exam');
const ParentContact = require('../models/ParentContact');
const smsService = require('../services/smsService');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';

// Test phone number (replace with a valid phone number for testing)
const TEST_PHONE_NUMBER = '+255712345678';

/**
 * Test sending a simple SMS
 */
async function testSimpleSMS() {
  console.log('Testing simple SMS...');
  try {
    const result = await smsService.sendSMS(TEST_PHONE_NUMBER, 'This is a test message from St. John Vianney School');
    console.log('SMS sent successfully:', result);
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}

/**
 * Test sending a result SMS
 */
async function testResultSMS() {
  console.log('Testing result SMS...');
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get a student
    const student = await Student.findOne().populate('class');
    if (!student) {
      console.error('No student found');
      return;
    }
    console.log(`Found student: ${student.firstName} ${student.lastName}`);

    // Get an exam
    const exam = await Exam.findOne();
    if (!exam) {
      console.error('No exam found');
      return;
    }
    console.log(`Found exam: ${exam.name}`);

    // Get results for the student
    const results = await Result.find({
      $or: [
        { studentId: student._id, examId: exam._id },
        { student: student._id, exam: exam._id }
      ]
    }).populate('subjectId').populate('subject');

    if (results.length === 0) {
      console.error('No results found for this student');
      return;
    }
    console.log(`Found ${results.length} results for student ${student.firstName} ${student.lastName}`);

    // Process results
    const subjectResults = [];
    let totalMarks = 0;

    for (const result of results) {
      const subject = result.subject || result.subjectId;
      if (!subject) continue;
      
      const subjectName = subject.name;
      const marks = result.marksObtained || result.marks || 0;
      const grade = result.grade || 'F';

      subjectResults.push({
        subject: {
          name: subjectName
        },
        marks: marks,
        grade: grade,
        points: result.points || 0
      });

      totalMarks += marks;
    }

    // Calculate average
    const averageMarks = results.length > 0 ? totalMarks / results.length : 0;

    // Calculate points and division
    const pointsMap = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'F': 5 };
    
    // Calculate points for each subject if not already calculated
    subjectResults.forEach(subject => {
      if (!subject.points) {
        subject.points = pointsMap[subject.grade] || 5;
      }
    });
    
    // Sort subjects by points (ascending) for best subjects calculation
    const sortedSubjects = [...subjectResults].sort((a, b) => a.points - b.points);

    // Take the best 7 subjects or all if less than 7
    const bestSevenSubjects = sortedSubjects.slice(0, 7);
    const totalPoints = bestSevenSubjects.reduce((sum, subject) => sum + subject.points, 0);

    // Determine division
    let division;
    if (totalPoints >= 7 && totalPoints <= 14) {
      division = 'I';
    } else if (totalPoints >= 15 && totalPoints <= 21) {
      division = 'II';
    } else if (totalPoints >= 22 && totalPoints <= 25) {
      division = 'III';
    } else if (totalPoints >= 26 && totalPoints <= 32) {
      division = 'IV';
    } else {
      division = '0';
    }

    // Create result data object
    const resultData = {
      studentId: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      subjects: subjectResults,
      totalMarks,
      averageMarks: averageMarks.toFixed(2),
      division,
      points: totalPoints,
      rank: '1',
      totalStudents: 30,
      examName: exam.name,
      class: {
        name: student.class.name,
        section: student.class.section || '',
        stream: student.class.stream || ''
      }
    };

    // Generate SMS content
    const smsContent = smsService.generateResultSMS(student, resultData);
    console.log('Generated SMS content:');
    console.log(smsContent);

    // Send the SMS
    console.log(`Sending SMS to ${TEST_PHONE_NUMBER}...`);
    const result = await smsService.sendSMS(TEST_PHONE_NUMBER, smsContent);
    console.log('SMS sent successfully:', result);

    // Get parent contacts
    const parentContacts = await ParentContact.find({ studentId: student._id });
    console.log(`Found ${parentContacts.length} parent contacts for student ${student.firstName} ${student.lastName}`);

    // Send SMS to parent contacts
    if (parentContacts.length > 0) {
      for (const contact of parentContacts) {
        console.log(`Sending SMS to ${contact.parentName} (${contact.phoneNumber})...`);
        const result = await smsService.sendSMS(contact.phoneNumber, smsContent);
        console.log('SMS sent successfully:', result);
      }
    }
  } catch (error) {
    console.error('Error testing result SMS:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the tests
async function runTests() {
  // Test simple SMS
  await testSimpleSMS();
  
  // Test result SMS
  await testResultSMS();
}

runTests().catch(console.error);
