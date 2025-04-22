/**
 * Test script for the improved SMS service
 * This script tests the new SMS service features
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const ParentContact = require('../models/ParentContact');
const SmsLog = require('../models/SmsLog');
const smsService = require('../services/smsService');
const smsConfig = require('../config/smsConfig');
const logger = require('../utils/logger');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';

// Test phone number (replace with a valid phone number for testing)
const TEST_PHONE_NUMBER = '+255712345678';

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Test SMS configuration
async function testSmsConfig() {
  try {
    console.log('Testing SMS configuration...');
    const config = await smsConfig.getSmsConfig();
    console.log('SMS Configuration:', {
      enabled: config.enabled,
      provider: config.provider,
      senderId: config.senderId,
      schoolName: config.schoolName,
      mockMode: config.mockMode
    });
    
    // Get provider-specific configuration
    const providerConfig = await smsConfig.getProviderConfig(config.provider);
    console.log(`${config.provider} Provider Configuration:`, {
      enabled: providerConfig.enabled,
      mockMode: providerConfig.mockMode,
      // Don't log sensitive information like API keys
      hasApiKey: !!providerConfig.apiKey,
      hasUsername: !!providerConfig.username
    });
    
    return config;
  } catch (error) {
    console.error('Error testing SMS configuration:', error);
    throw error;
  }
}

// Test sending a simple SMS
async function testSendSms(config) {
  try {
    console.log(`Testing sending SMS to ${TEST_PHONE_NUMBER}...`);
    
    // Create a test message
    const message = `This is a test message from the improved SMS service. Time: ${new Date().toISOString()}`;
    
    // Send the SMS with additional options
    const result = await smsService.sendSMS(TEST_PHONE_NUMBER, message, {
      messageType: 'TEST',
      recipientName: 'Test Recipient',
      userId: mongoose.Types.ObjectId(),
      userName: 'Test User',
      userRole: 'admin'
    });
    
    console.log('SMS sent successfully:', result);
    
    // Check if the SMS was logged
    const logs = await SmsLog.find({
      'recipient.phoneNumber': TEST_PHONE_NUMBER,
      messageType: 'TEST'
    }).sort({ createdAt: -1 }).limit(1);
    
    if (logs.length > 0) {
      console.log('SMS log created successfully:', {
        id: logs[0]._id,
        status: logs[0].provider.status,
        messageId: logs[0].provider.messageId,
        sentAt: logs[0].sentAt
      });
    } else {
      console.warn('No SMS log found. This might be expected if the database connection was not established.');
    }
    
    return result;
  } catch (error) {
    console.error('Error sending test SMS:', error);
    throw error;
  }
}

// Test sending a result SMS
async function testResultSms() {
  try {
    console.log('Testing result SMS generation...');
    
    // Find a student
    const student = await Student.findOne().populate('class');
    
    if (!student) {
      console.error('No student found in the database');
      return;
    }
    
    console.log(`Found student: ${student.firstName} ${student.lastName}`);
    
    // Create mock result data
    const resultData = {
      studentId: student._id,
      examName: 'Mid-Term Exam 2023',
      averageMarks: 75.5,
      division: 'I',
      points: 12,
      rank: 3,
      totalStudents: 45,
      subjects: [
        {
          subject: { name: 'Mathematics', code: 'MATH' },
          marks: 85,
          grade: 'A',
          points: 1
        },
        {
          subject: { name: 'English', code: 'ENG' },
          marks: 78,
          grade: 'B+',
          points: 2
        },
        {
          subject: { name: 'Physics', code: 'PHY' },
          marks: 92,
          grade: 'A+',
          points: 1
        },
        {
          subject: { name: 'Chemistry', code: 'CHEM' },
          marks: 65,
          grade: 'C+',
          points: 3
        },
        {
          subject: { name: 'Biology', code: 'BIO' },
          marks: 72,
          grade: 'B',
          points: 2
        },
        {
          subject: { name: 'History', code: 'HIST' },
          marks: 68,
          grade: 'C+',
          points: 3
        }
      ]
    };
    
    // Generate SMS content
    const smsContent = smsService.generateResultSMS(student, resultData);
    console.log('Generated SMS content:');
    console.log(smsContent);
    
    // Get parent contacts
    const parentContacts = await ParentContact.find({ studentId: student._id });
    console.log(`Found ${parentContacts.length} parent contacts for student ${student.firstName} ${student.lastName}`);
    
    // If there are parent contacts, send the SMS
    if (parentContacts.length > 0) {
      for (const contact of parentContacts) {
        console.log(`Sending SMS to ${contact.parentName} (${contact.phoneNumber})...`);
        
        // Send the SMS with additional options
        const result = await smsService.sendSMS(contact.phoneNumber, smsContent, {
          messageType: 'RESULT',
          recipientName: contact.parentName,
          studentId: student._id,
          studentName: `${student.firstName} ${student.lastName}`,
          parentId: contact._id,
          parentName: contact.parentName,
          parentRelationship: contact.relationship
        });
        
        console.log('SMS sent successfully:', result);
      }
    } else {
      // Send to test number if no parent contacts
      console.log(`No parent contacts found, sending to test number ${TEST_PHONE_NUMBER}...`);
      const result = await smsService.sendSMS(TEST_PHONE_NUMBER, smsContent, {
        messageType: 'RESULT',
        recipientName: 'Test Parent',
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`
      });
      
      console.log('SMS sent successfully:', result);
    }
  } catch (error) {
    console.error('Error testing result SMS:', error);
    throw error;
  }
}

// Test SMS usage statistics
async function testSmsUsage() {
  try {
    console.log('Testing SMS usage statistics...');
    const usage = await smsService.getSMSUsage();
    console.log('SMS Usage Statistics:', usage);
    return usage;
  } catch (error) {
    console.error('Error getting SMS usage:', error);
    throw error;
  }
}

// Run all tests
async function runTests() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Test SMS configuration
    const config = await testSmsConfig();
    
    // Test sending a simple SMS
    await testSendSms(config);
    
    // Test sending a result SMS
    await testResultSms();
    
    // Test SMS usage statistics
    await testSmsUsage();
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the tests
runTests();
