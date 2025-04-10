const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const smsService = require('../services/smsService');

// Get SMS settings
router.get('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    // In a production app, these would be stored in a database
    // For now, we'll return the environment variables (without the actual API key for security)
    const settings = {
      username: process.env.AT_USERNAME || 'sandbox',
      senderId: process.env.SMS_SENDER_ID || 'SCHOOL',
      schoolName: process.env.SCHOOL_NAME || 'St. John Vianney School',
      enabled: process.env.SMS_ENABLED === 'true',
      // Don't return the actual API key, just whether it's set
      apiKey: process.env.AT_API_KEY ? '********' : ''
    };
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update SMS settings
router.post('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { apiKey, username, senderId, schoolName, enabled } = req.body;
    
    // In a production app, these would be stored in a database
    // For now, we'll just log them (in a real app, you'd update environment variables or a config file)
    console.log('SMS Settings updated:');
    console.log('- API Key:', apiKey ? '(updated)' : '(not updated)');
    console.log('- Username:', username);
    console.log('- Sender ID:', senderId);
    console.log('- School Name:', schoolName);
    console.log('- Enabled:', enabled);
    
    // Simulate successful update
    res.json({ 
      message: 'SMS settings updated successfully',
      settings: {
        username,
        senderId,
        schoolName,
        enabled,
        apiKey: apiKey ? '********' : ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get SMS usage statistics
router.get('/usage', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const usage = await smsService.getSMSUsage();
    res.json(usage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a test SMS
router.post('/test', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    // Send the test SMS
    const result = await smsService.sendSMS(phoneNumber, message);
    
    res.json({
      message: 'Test SMS sent successfully',
      result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
