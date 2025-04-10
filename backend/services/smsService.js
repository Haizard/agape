/**
 * SMS Service for sending text messages to parents
 * This service is configured to work with multiple SMS providers
 * and can be easily switched between them
 */
const axios = require('axios');

// Load SMS providers
const africasTalkingProvider = require('./smsProviders/africasTalkingProvider');
const twilioProvider = require('./smsProviders/twilioProvider');
const bongoliveProvider = require('./smsProviders/bongoliveProvider');
const vonageProvider = require('./smsProviders/vonageProvider');
const messageBirdProvider = require('./smsProviders/messageBirdProvider');
const clickSendProvider = require('./smsProviders/clickSendProvider');
const textMagicProvider = require('./smsProviders/textMagicProvider');
const beemAfricaProvider = require('./smsProviders/beemAfricaProvider');

// Get the SMS provider from environment variables
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'africasTalking';

// Flag to enable/disable actual SMS sending (useful for development)
const SMS_ENABLED = process.env.SMS_ENABLED === 'true' || false;

// Select the SMS provider based on the environment variable
const getSmsProvider = () => {
  switch (SMS_PROVIDER.toLowerCase()) {
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

/**
 * Format phone number to Tanzania format (+255XXXXXXXXX)
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} - Formatted phone number
 */
const formatTanzanianPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // If it starts with 0, replace with 255
  if (cleaned.startsWith('0')) {
    cleaned = '255' + cleaned.substring(1);
  }

  // If it doesn't have a country code, add 255
  if (!cleaned.startsWith('255') && !cleaned.startsWith('+255')) {
    cleaned = '255' + cleaned;
  }

  // Remove + if present
  cleaned = cleaned.replace('+', '');

  return cleaned;
};

/**
 * Send SMS to a single recipient using the configured provider
 * @param {string} phoneNumber - Recipient's phone number
 * @param {string} message - SMS content
 * @returns {Promise} - Promise resolving to the SMS gateway response
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Get the SMS provider
    const provider = getSmsProvider();

    // Log the provider being used
    console.log(`Using SMS provider: ${SMS_PROVIDER}`);

    // Send the SMS using the provider
    return await provider.sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Send SMS to multiple recipients
 * @param {Array} recipients - Array of objects with phoneNumber and message
 * @returns {Promise} - Promise resolving to an array of responses
 */
const sendBulkSMS = async (recipients) => {
  try {
    const results = [];

    // Process each recipient
    for (const recipient of recipients) {
      try {
        const result = await sendSMS(recipient.phoneNumber, recipient.message);
        results.push({
          phoneNumber: recipient.phoneNumber,
          result
        });

        // Add a small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        // Continue with other recipients even if one fails
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
    console.error('Error sending bulk SMS:', error);
    throw new Error(`Failed to send bulk SMS: ${error.message}`);
  }
};

/**
 * Send SMS to multiple recipients using Africa's Talking bulk API
 * This is more efficient for large numbers of recipients with the same message
 * @param {Array} phoneNumbers - Array of phone numbers
 * @param {string} message - Common message to send to all recipients
 * @returns {Promise} - Promise resolving to the API response
 */
const sendBulkSMSToMany = async (phoneNumbers, message) => {
  try {
    // If SMS is disabled, return a mock response
    if (!SMS_ENABLED) {
      console.log('SMS sending is disabled. Enable by setting SMS_ENABLED=true in environment variables.');
      return {
        success: true,
        messageId: `mock-bulk-${Date.now()}`,
        recipients: phoneNumbers.length,
        status: 'sent (mock)',
        cost: '0.0'
      };
    }

    // Format all phone numbers
    const formattedNumbers = phoneNumbers.map(formatTanzanianPhoneNumber);

    // Join phone numbers with commas for the API
    const numbersString = formattedNumbers.join(',');

    // Prepare the request to Africa's Talking API
    const response = await axios.post(AT_CONFIG.baseUrl,
      `username=${AT_CONFIG.username}&to=${numbersString}&message=${encodeURIComponent(message)}&from=${AT_CONFIG.sender}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': AT_CONFIG.apiKey,
          'Accept': 'application/json'
        }
      }
    );

    // Process the response
    const result = response.data;
    if (result.SMSMessageData) {
      return {
        success: true,
        messageId: result.SMSMessageData.MessageId,
        recipients: result.SMSMessageData.Recipients,
        status: 'sent',
        cost: result.SMSMessageData.TotalCost
      };
    } else {
      throw new Error('Invalid response from Africa\'s Talking API');
    }
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
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
  // Create a concise SMS with the student's performance
  const schoolName = process.env.SCHOOL_NAME || 'St. John Vianney School';
  const examName = resultData.examName || 'Exam';

  let message = `${schoolName}\n`;
  message += `${examName} Results for ${student.firstName} ${student.lastName}\n\n`;

  // Add average and division
  message += `Average: ${resultData.averageMarks}%\n`;
  message += `Division: ${resultData.division}\n`;
  message += `Points: ${resultData.points}\n`;
  if (resultData.rank !== 'N/A') {
    message += `Rank: ${resultData.rank} out of ${resultData.totalStudents}\n`;
  }
  message += '\n';

  // Add subject performance (limited to fit SMS length)
  message += 'Subject Marks:\n';

  // Handle different formats of subject data
  if (Array.isArray(resultData.subjects)) {
    // If subjects is an array (new format)
    const topSubjects = [...resultData.subjects]
      .sort((a, b) => (b.marks || b.marksObtained || 0) - (a.marks || a.marksObtained || 0))
      .slice(0, 5);

    for (const subject of topSubjects) {
      const subjectName = subject.subject?.name || subject.subjectName || 'Subject';
      const marks = subject.marks || subject.marksObtained || 0;
      const grade = subject.grade || '-';
      message += `${subjectName}: ${marks} (${grade})\n`;
    }

    if (resultData.subjects.length > 5) {
      message += '...\n';
    }
  } else if (typeof resultData.subjects === 'object') {
    // If subjects is an object (old format)
    const subjectEntries = Object.entries(resultData.subjects)
      .filter(([_, subject]) => subject.present)
      .slice(0, 5);

    for (const [_, subject] of subjectEntries) {
      message += `${subject.subjectName}: ${subject.marks} (${subject.grade})\n`;
    }

    if (Object.keys(resultData.subjects).length > 5) {
      message += '...\n';
    }
  }

  message += '\nFor complete results, please contact the school.';

  return message;
};

/**
 * Get SMS usage statistics
 * @returns {Promise} - Promise resolving to the usage statistics
 */
const getSMSUsage = async () => {
  try {
    // If SMS is disabled, return mock statistics
    if (!SMS_ENABLED) {
      return {
        balance: 'N/A (SMS disabled)',
        dailyUsage: 0,
        monthlyUsage: 0
      };
    }

    // In a real implementation, this would call the Africa's Talking API to get usage statistics
    // For now, we'll return mock data
    return {
      balance: 'Free tier: 10 SMS/day',
      dailyUsage: 0,
      monthlyUsage: 0
    };
  } catch (error) {
    console.error('Error getting SMS usage:', error);
    throw new Error(`Failed to get SMS usage: ${error.message}`);
  }
};

module.exports = {
  sendSMS,
  sendBulkSMS,
  sendBulkSMSToMany,
  generateResultSMS,
  getSMSUsage,
  formatTanzanianPhoneNumber
};
