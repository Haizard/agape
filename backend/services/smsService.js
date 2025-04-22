/**
 * SMS Service for sending text messages to parents
 * This service is configured to work with multiple SMS providers
 * and can be easily switched between them
 */
const axios = require('axios');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const smsConfig = require('../config/smsConfig');
const SmsLog = require('../models/SmsLog');
const { formatPhoneNumber, standardizeResultData, createSmsMessageObject } = require('../utils/smsDataFormatter');

// Load SMS providers
const africasTalkingProvider = require('./smsProviders/africasTalkingProvider');
const twilioProvider = require('./smsProviders/twilioProvider');
const bongoliveProvider = require('./smsProviders/bongoliveProvider');
const vonageProvider = require('./smsProviders/vonageProvider');
const messageBirdProvider = require('./smsProviders/messageBirdProvider');
const clickSendProvider = require('./smsProviders/clickSendProvider');
const textMagicProvider = require('./smsProviders/textMagicProvider');
const beemAfricaProvider = require('./smsProviders/beemAfricaProvider');

// Select the SMS provider based on the configuration
const getSmsProvider = async () => {
  // Get the current configuration
  const config = await smsConfig.getSmsConfig();
  const providerName = config.provider.toLowerCase();

  // Select the provider based on the configuration
  switch (providerName) {
    case 'twilio':
      return twilioProvider;
    case 'bongolive':
      return bongoliveProvider;
    case 'vonage':
      return vonageProvider;
    case 'messagebird':
      return messageBirdProvider;
    case 'clicksend':
      return clickSendProvider;
    case 'textmagic':
      return textMagicProvider;
    case 'beemafrica':
      return beemAfricaProvider;
    case 'africastalking':
    default:
      return africasTalkingProvider;
  }
};

// Note: formatPhoneNumber is now imported from smsDataFormatter.js
// This function is kept for backward compatibility
const formatTanzanianPhoneNumber = (phoneNumber) => {
  return formatPhoneNumber(phoneNumber).replace('+', '');
};

/**
 * Send SMS to a single recipient using the configured provider
 * @param {string} phoneNumber - Recipient's phone number
 * @param {string} message - SMS content
 * @param {Object} options - Additional options for the SMS
 * @returns {Promise} - Promise resolving to the SMS gateway response
 */
const sendSMS = async (phoneNumber, message, options = {}) => {
  // Create a log entry
  let logEntry = null;

  try {
    // Get the SMS provider
    const provider = await getSmsProvider();

    // Get the current configuration
    const config = await smsConfig.getSmsConfig();

    // Log the provider being used
    logger.info(`Using SMS provider: ${config.provider}`);

    // Create a standardized message object
    const messageObj = createSmsMessageObject({
      phoneNumber,
      message,
      ...options
    });

    // Create a log entry
    logEntry = new SmsLog({
      recipient: messageObj.recipient,
      message: messageObj.message,
      messageType: messageObj.messageType,
      student: messageObj.student,
      parent: messageObj.parent,
      relatedData: messageObj.relatedData,
      sentBy: messageObj.sentBy,
      provider: {
        name: config.provider,
        status: 'PENDING'
      }
    });

    // Save the log entry
    if (mongoose.connection.readyState === 1) {
      await logEntry.save();
    }

    // Send the SMS using the provider
    const result = await provider.sendSMS(messageObj.recipient.phoneNumber, messageObj.message);

    // Update the log entry with the result
    if (logEntry && mongoose.connection.readyState === 1) {
      logEntry.provider.messageId = result.messageId;
      logEntry.provider.status = result.success ? 'SENT' : 'FAILED';
      logEntry.provider.statusDetails = result.status;
      logEntry.provider.cost = result.cost;

      if (!result.success) {
        logEntry.error = {
          message: result.error || 'Unknown error',
          timestamp: new Date()
        };
      }

      await logEntry.save();
    }

    return result;
  } catch (error) {
    logger.error('Error sending SMS:', error);

    // Update the log entry with the error
    if (logEntry && mongoose.connection.readyState === 1) {
      logEntry.provider.status = 'FAILED';
      logEntry.error = {
        message: error.message,
        timestamp: new Date()
      };

      await logEntry.save();
    }

    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Send SMS to multiple recipients
 * @param {Array} recipients - Array of objects with phoneNumber, message, and optional metadata
 * @returns {Promise} - Promise resolving to an array of responses
 */
const sendBulkSMS = async (recipients) => {
  try {
    const results = [];

    // Get the current configuration
    const config = await smsConfig.getSmsConfig();

    // Log the bulk operation
    logger.info(`Sending bulk SMS to ${recipients.length} recipients using ${config.provider}`);

    // Process each recipient
    for (const recipient of recipients) {
      try {
        // Extract options from the recipient object
        const { phoneNumber, message, ...options } = recipient;

        // Send the SMS with all available options
        const result = await sendSMS(phoneNumber, message, options);

        results.push({
          phoneNumber,
          result
        });

        // Add a small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        // Continue with other recipients even if one fails
        logger.warn(`Failed to send SMS to ${recipient.phoneNumber}: ${err.message}`);

        results.push({
          phoneNumber: recipient.phoneNumber,
          result: {
            success: false,
            error: err.message
          }
        });
      }
    }

    return results;
  } catch (error) {
    logger.error('Error sending bulk SMS:', error);
    throw new Error(`Failed to send bulk SMS: ${error.message}`);
  }
};

/**
 * Send SMS to multiple recipients using a bulk API
 * This is more efficient for large numbers of recipients with the same message
 * @param {Array} phoneNumbers - Array of phone numbers
 * @param {string} message - Common message to send to all recipients
 * @param {Object} options - Additional options for the SMS
 * @returns {Promise} - Promise resolving to the API response
 */
const sendBulkSMSToMany = async (phoneNumbers, message, options = {}) => {
  // Create a log entry for the bulk operation
  let bulkLogEntry = null;

  try {
    // Get the current configuration
    const config = await smsConfig.getSmsConfig();

    // Check if SMS is enabled
    if (!config.enabled && !config.mockMode) {
      logger.warn('SMS sending is disabled. Enable in SMS settings or set SMS_ENABLED=true in environment variables.');
      return {
        success: true,
        messageId: `mock-bulk-${Date.now()}`,
        recipients: phoneNumbers.length,
        status: 'MOCK',
        cost: '0.0'
      };
    }

    // Format all phone numbers
    const formattedNumbers = phoneNumbers.map(num => formatPhoneNumber(num));

    // Create a bulk log entry
    if (mongoose.connection.readyState === 1) {
      bulkLogEntry = new SmsLog({
        messageType: options.messageType || 'OTHER',
        message: `Bulk SMS to ${formattedNumbers.length} recipients: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
        sentBy: options.sentBy,
        provider: {
          name: config.provider,
          status: 'PENDING'
        },
        relatedData: options.relatedData
      });

      await bulkLogEntry.save();
    }

    // If using Africa's Talking and not in mock mode, use their bulk API
    if (config.provider.toLowerCase() === 'africastalking' && !config.mockMode) {
      // Get provider config
      const providerConfig = await smsConfig.getProviderConfig('africastalking');

      // Join phone numbers with commas for the API
      const numbersString = formattedNumbers.map(num => num.replace('+', '')).join(',');

      // Prepare the request to Africa's Talking API
      const response = await axios.post(providerConfig.baseUrl,
        `username=${providerConfig.username}&to=${numbersString}&message=${encodeURIComponent(message)}&from=${config.senderId}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': providerConfig.apiKey,
            'Accept': 'application/json'
          }
        }
      );

      // Process the response
      const result = response.data;
      if (result.SMSMessageData) {
        // Update the log entry
        if (bulkLogEntry && mongoose.connection.readyState === 1) {
          bulkLogEntry.provider.messageId = result.SMSMessageData.MessageId;
          bulkLogEntry.provider.status = 'SENT';
          bulkLogEntry.provider.statusDetails = 'Bulk SMS sent successfully';
          bulkLogEntry.provider.cost = result.SMSMessageData.TotalCost;
          await bulkLogEntry.save();
        }

        return {
          success: true,
          messageId: result.SMSMessageData.MessageId,
          recipients: result.SMSMessageData.Recipients,
          status: 'SENT',
          cost: result.SMSMessageData.TotalCost
        };
      }

      throw new Error('Invalid response from Africa\'s Talking API');
    } else {
      // For other providers or mock mode, send individual messages
      logger.info(`Using individual messages for bulk SMS to ${formattedNumbers.length} recipients`);

      const results = [];
      let successCount = 0;
      let failCount = 0;

      // Send messages individually
      for (const phoneNumber of formattedNumbers) {
        try {
          const result = await sendSMS(phoneNumber, message, options);
          results.push(result);

          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }

          // Add a small delay between messages
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          logger.warn(`Failed to send SMS to ${phoneNumber}: ${err.message}`);
          failCount++;
        }
      }

      // Update the log entry
      if (bulkLogEntry && mongoose.connection.readyState === 1) {
        bulkLogEntry.provider.status = failCount === 0 ? 'SENT' : (successCount > 0 ? 'PARTIAL' : 'FAILED');
        bulkLogEntry.provider.statusDetails = `Success: ${successCount}, Failed: ${failCount}`;
        bulkLogEntry.provider.messageId = `bulk-${Date.now()}`;
        await bulkLogEntry.save();
      }

      return {
        success: successCount > 0,
        messageId: `bulk-${Date.now()}`,
        recipients: {
          totalCount: formattedNumbers.length,
          successCount,
          failCount
        },
        status: failCount === 0 ? 'SENT' : (successCount > 0 ? 'PARTIAL' : 'FAILED'),
        cost: '0.0' // Cost tracking not available for individual sends
      };
    }
  } catch (error) {
    logger.error('Error sending bulk SMS:', error);

    // Update the log entry with the error
    if (bulkLogEntry && mongoose.connection.readyState === 1) {
      bulkLogEntry.provider.status = 'FAILED';
      bulkLogEntry.error = {
        message: error.message,
        timestamp: new Date()
      };
      await bulkLogEntry.save();
    }

    throw new Error(`Failed to send bulk SMS: ${error.message}`);
  }
};

/**
 * Generate a result SMS for a student
 * @param {Object} student - Student information
 * @param {Object} resultData - Student's result data
 * @returns {string} - Formatted SMS message
 */
const generateResultSMS = (student, resultData) => {
  try {
    // Standardize the result data to ensure consistent format
    const standardData = standardizeResultData(student, resultData);

    // Get school name from configuration
    const config = schoolConfig || {};
    const schoolName = config.shortName || process.env.SCHOOL_NAME || 'School';

    // Create a concise SMS with the student's performance
    let message = `${schoolName}\n`;
    message += `${standardData.exam.name} Results for ${standardData.student.name}\n\n`;

    // Add average and division
    message += `Average: ${standardData.summary.averageMarks.toFixed(1)}%\n`;
    message += `Division: ${standardData.summary.division}\n`;
    message += `Points: ${standardData.summary.points}\n`;

    if (standardData.summary.rank !== 'N/A') {
      message += `Rank: ${standardData.summary.rank} out of ${standardData.summary.totalStudents}\n`;
    }

    message += '\n';

    // Add subject performance (limited to fit SMS length)
    message += 'Subject Marks:\n';

    // Sort subjects by marks (highest first) and take top 5
    const topSubjects = [...standardData.subjects]
      .sort((a, b) => b.marks - a.marks)
      .slice(0, 5);

    for (const subject of topSubjects) {
      message += `${subject.name}: ${subject.marks} (${subject.grade})\n`;
    }

    if (standardData.subjects.length > 5) {
      message += '...\n';
    }

    message += '\nFor complete results, please contact the school.';

    return message;
  } catch (error) {
    logger.error('Error generating result SMS:', error);

    // Fallback to a simple message if there's an error
    return `Exam results for ${student.firstName} ${student.lastName}\n` +
           `Average: ${resultData.averageMarks || 'N/A'}\n` +
           `Division: ${resultData.division || 'N/A'}\n` +
           `For complete results, please contact the school.`;
  }
};

/**
 * Get SMS usage statistics
 * @returns {Promise<Object>} - Promise resolving to the usage statistics
 */
const getSMSUsage = async () => {
  try {
    // Get the current configuration
    const config = await smsConfig.getSmsConfig();

    // If SMS is disabled, return mock statistics
    if (!config.enabled) {
      return {
        balance: 'N/A (SMS disabled)',
        dailyUsage: 0,
        monthlyUsage: 0,
        successRate: '0%',
        provider: config.provider
      };
    }

    // Get SMS logs from the database if connected
    let dailyUsage = 0;
    let monthlyUsage = 0;
    let successCount = 0;
    let failCount = 0;

    if (mongoose.connection.readyState === 1) {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get the first day of the current month
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Count daily usage
      dailyUsage = await SmsLog.countDocuments({
        sentAt: { $gte: today },
        'provider.status': { $in: ['SENT', 'DELIVERED'] }
      });

      // Count monthly usage
      monthlyUsage = await SmsLog.countDocuments({
        sentAt: { $gte: firstDayOfMonth },
        'provider.status': { $in: ['SENT', 'DELIVERED'] }
      });

      // Calculate success rate (last 100 messages)
      const recentLogs = await SmsLog.find({}).sort({ sentAt: -1 }).limit(100);

      if (recentLogs.length > 0) {
        successCount = recentLogs.filter(log =>
          ['SENT', 'DELIVERED'].includes(log.provider.status)
        ).length;

        failCount = recentLogs.filter(log =>
          log.provider.status === 'FAILED'
        ).length;
      }
    }

    // Calculate success rate
    const totalMessages = successCount + failCount;
    const successRate = totalMessages > 0 ?
      `${Math.round((successCount / totalMessages) * 100)}%` :
      'N/A';

    // For now, we'll return mock balance data with real usage statistics
    return {
      balance: 'Free tier: 10 SMS/day',
      dailyUsage,
      monthlyUsage,
      successRate,
      provider: config.provider
    };
  } catch (error) {
    logger.error('Error getting SMS usage:', error);

    // Return minimal data if there's an error
    return {
      balance: 'Error retrieving balance',
      dailyUsage: 0,
      monthlyUsage: 0,
      successRate: 'N/A',
      provider: 'unknown',
      error: error.message
    };
  }
};

module.exports = {
  sendSMS,
  sendBulkSMS,
  sendBulkSMSToMany,
  generateResultSMS,
  getSMSUsage,
  formatTanzanianPhoneNumber,
  // Export the standardized data formatter functions for use in other modules
  standardizeResultData
};
