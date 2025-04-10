const express = require('express');
const router = express.Router();
const ParentContact = require('../models/ParentContact');
const Student = require('../models/Student');
const Result = require('../models/Result');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const Setting = require('../models/Setting');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const smsService = require('../services/smsService');

// Send result SMS to a single student's parent
router.post('/send-result/:studentId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { examId, academicYearId, customMessage } = req.body;

    // Validate required parameters
    if (!examId) {
      return res.status(400).json({ message: 'Exam ID is required' });
    }

    // Get student information
    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get parent contact information
    const parentContacts = await ParentContact.find({
      studentId,
      isActive: true
    });

    if (parentContacts.length === 0) {
      return res.status(404).json({ message: 'No active parent contacts found for this student' });
    }

    // Get student's results
    const results = await Result.find({
      $or: [
        { studentId: studentId, examId: examId },
        { student: studentId, exam: examId }
      ]
    }).populate('subjectId').populate('subject');

    if (results.length === 0) {
      return res.status(404).json({ message: 'No results found for this student' });
    }

    // Process results to create a student result object
    const subjectResults = [];
    let totalMarks = 0;

    for (const result of results) {
      const subject = result.subject || result.subjectId;
      if (!subject) continue;

      const subjectName = subject.name;
      const subjectCode = subject.code || '';
      const marks = result.marksObtained || result.marks || 0;
      const grade = result.grade || 'F';

      subjectResults.push({
        subject: {
          _id: subject._id,
          name: subjectName,
          code: subjectCode
        },
        marks: marks,
        grade: grade,
        points: result.points || 0
      });

      totalMarks += marks;
    }

    // Calculate average
    const averageMarks = (totalMarks / results.length).toFixed(2);

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
    const bestSevenPoints = totalPoints;

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

    // Get class information for rank
    const classStudents = await Student.find({ class: student.class._id });
    const totalStudents = classStudents.length;

    // Get exam information
    const exam = await Exam.findById(examId);
    const examName = exam ? exam.name : 'Exam';

    // Create result data object
    const resultData = {
      studentId: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      subjects: subjectResults,
      totalMarks,
      averageMarks,
      division,
      points: totalPoints,
      bestSevenPoints,
      rank: 'N/A', // Would need more complex calculation for actual rank
      totalStudents,
      examName: examName,
      class: {
        name: student.class.name,
        section: student.class.section || '',
        stream: student.class.stream || ''
      }
    };

    // Generate SMS content
    let smsContent;
    if (customMessage) {
      smsContent = customMessage
        .replace('{studentName}', `${student.firstName} ${student.lastName}`)
        .replace('{average}', averageMarks)
        .replace('{division}', division)
        .replace('{points}', totalPoints);
    } else {
      smsContent = smsService.generateResultSMS(student, resultData);
    }

    // Send SMS to all parent contacts
    const smsResults = [];
    for (const contact of parentContacts) {
      try {
        const result = await smsService.sendSMS(contact.phoneNumber, smsContent);
        smsResults.push({
          parentName: contact.parentName,
          phoneNumber: contact.phoneNumber,
          status: 'sent',
          messageId: result.messageId
        });
      } catch (error) {
        smsResults.push({
          parentName: contact.parentName,
          phoneNumber: contact.phoneNumber,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      student: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber
      },
      smsContent,
      smsResults
    });
  } catch (error) {
    console.error('Error sending result SMS:', error);
    res.status(500).json({ message: error.message });
  }
});

// Send result SMS to all students in a class
router.post('/send-class-results/:classId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { examId, academicYearId, customMessage } = req.body;

    // Validate required parameters
    if (!examId) {
      return res.status(400).json({ message: 'Exam ID is required' });
    }

    // Get class information
    const classInfo = await Class.findById(classId);
    if (!classInfo) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Get all students in the class
    const students = await Student.find({ class: classId });
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found in this class' });
    }

    // Process each student
    const results = [];
    for (const student of students) {
      // Get parent contacts
      const parentContacts = await ParentContact.find({
        studentId: student._id,
        isActive: true
      });

      if (parentContacts.length === 0) {
        results.push({
          student: {
            id: student._id,
            name: `${student.firstName} ${student.lastName}`,
            rollNumber: student.rollNumber
          },
          status: 'skipped',
          reason: 'No active parent contacts'
        });
        continue;
      }

      // Get student's results
      const studentResults = await Result.find({
        studentId: student._id,
        examId,
        academicYearId
      }).populate('subjectId', 'name code');

      if (studentResults.length === 0) {
        results.push({
          student: {
            id: student._id,
            name: `${student.firstName} ${student.lastName}`,
            rollNumber: student.rollNumber
          },
          status: 'skipped',
          reason: 'No results found'
        });
        continue;
      }

      // Process results to create a student result object (similar to single student endpoint)
      const subjects = {};
      let totalMarks = 0;

      for (const result of studentResults) {
        const subjectName = result.subjectId.name;
        const subjectCode = result.subjectId.code;

        subjects[result.subjectId._id] = {
          subjectId: result.subjectId._id,
          subjectName,
          subjectCode,
          marks: result.marksObtained,
          grade: result.grade,
          present: true
        };

        totalMarks += result.marksObtained;
      }

      // Calculate average
      const averageMarks = (totalMarks / studentResults.length).toFixed(2);

      // Calculate points and division (same as single student endpoint)
      const pointsMap = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'F': 5 };
      const subjectsWithPoints = Object.values(subjects)
        .map(subject => ({
          subjectId: subject.subjectId,
          points: pointsMap[subject.grade] || 5
        }))
        .sort((a, b) => a.points - b.points);

      const bestSevenSubjects = subjectsWithPoints.slice(0, 7);
      const totalPoints = bestSevenSubjects.reduce((sum, subject) => sum + subject.points, 0);

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
        subjects,
        totalMarks,
        averageMarks,
        division,
        points: totalPoints,
        rank: 'N/A', // Would need more complex calculation for actual rank
        totalStudents: students.length,
        examName: req.body.examName || 'Exam'
      };

      // Generate SMS content
      let smsContent;
      if (customMessage) {
        smsContent = customMessage
          .replace('{studentName}', `${student.firstName} ${student.lastName}`)
          .replace('{average}', averageMarks)
          .replace('{division}', division)
          .replace('{points}', totalPoints);
      } else {
        smsContent = smsService.generateResultSMS(student, resultData);
      }

      // Send SMS to all parent contacts
      const smsResults = [];
      for (const contact of parentContacts) {
        try {
          const result = await smsService.sendSMS(contact.phoneNumber, smsContent);
          smsResults.push({
            parentName: contact.parentName,
            phoneNumber: contact.phoneNumber,
            status: 'sent',
            messageId: result.messageId
          });
        } catch (error) {
          smsResults.push({
            parentName: contact.parentName,
            phoneNumber: contact.phoneNumber,
            status: 'failed',
            error: error.message
          });
        }
      }

      results.push({
        student: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber
        },
        smsContent,
        smsResults
      });
    }

    res.json({
      class: {
        id: classInfo._id,
        name: classInfo.name,
        section: classInfo.section
      },
      totalStudents: students.length,
      processedStudents: results.length,
      results
    });
  } catch (error) {
    console.error('Error sending class results SMS:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route POST /api/sms/test
 * @desc Send a test SMS message
 * @access Private (Admin only)
 */
router.post('/test', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    // Validate required parameters
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get SMS settings
    const smsSettings = await Setting.findOne({ key: 'sms' });

    // If settings don't exist or SMS is disabled, we'll create temporary settings for testing
    let provider = 'beemafrica';
    let enabled = true;

    if (smsSettings && smsSettings.value) {
      // Use existing settings if available
      provider = smsSettings.value.provider || 'beemafrica';
      enabled = smsSettings.value.enabled;

      // If SMS is explicitly disabled in settings, return an error
      if (enabled === false) {
        return res.status(400).json({ message: 'SMS is disabled in settings. Please enable it first.' });
      }
    }

    // Set environment variables for the SMS service
    process.env.SMS_PROVIDER = provider;
    process.env.SMS_ENABLED = 'true';

    // Always enable mock mode for testing
    process.env.SMS_MOCK_MODE = 'true';
    console.log('Mock mode enabled for SMS testing');

    // If using Beem Africa, set the API key and secret key directly
    if (provider === 'beemafrica') {
      // Use the values from the frontend if available
      if (req.body.apiKey) {
        process.env.BEEM_API_KEY = req.body.apiKey;
        console.log('Using API key from request:', req.body.apiKey);
      } else if (smsSettings?.value?.beemApiKey) {
        process.env.BEEM_API_KEY = smsSettings.value.beemApiKey;
        console.log('Using API key from settings:', smsSettings.value.beemApiKey);
      } else {
        console.log('No API key found, using mock mode');
      }

      if (req.body.secretKey) {
        process.env.BEEM_SECRET_KEY = req.body.secretKey;
        console.log('Using secret key from request');
      } else if (smsSettings?.value?.beemSecretKey) {
        process.env.BEEM_SECRET_KEY = smsSettings.value.beemSecretKey;
        console.log('Using secret key from settings');
      } else {
        console.log('No secret key found, using mock mode');
      }
    }

    // Send the SMS
    const result = await smsService.sendSMS(phoneNumber, message);

    // Return the result
    res.status(200).json({
      success: true,
      message: 'Test SMS sent successfully',
      result,
      provider,
      // Include the API key and secret key for debugging (only first few characters)
      apiKey: process.env.BEEM_API_KEY ? `${process.env.BEEM_API_KEY.substring(0, 5)}...` : 'Not set',
      secretKey: process.env.BEEM_SECRET_KEY ? `${process.env.BEEM_SECRET_KEY.substring(0, 5)}...` : 'Not set'
    });
  } catch (error) {
    console.error('Error sending test SMS:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route POST /api/sms/callback
 * @desc Receive callbacks from Beem Africa about SMS delivery status
 * @access Public
 */
router.post('/callback', async (req, res) => {
  try {
    console.log('Received SMS callback from Beem Africa:', req.body);

    // Extract the relevant information from the callback
    const { messageId, status, recipient, statusCode } = req.body;

    // TODO: Update the SMS status in your database
    // This would typically involve finding the SMS record by messageId
    // and updating its status

    // Respond with a success message
    res.status(200).json({ success: true, message: 'Callback received successfully' });
  } catch (error) {
    console.error('Error processing SMS callback:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
