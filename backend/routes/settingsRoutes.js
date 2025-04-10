const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const Setting = require('../models/Setting');

/**
 * @route GET /api/settings/sms
 * @desc Get SMS settings
 * @access Private (Admin only)
 */
router.get('/sms', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    // Get SMS settings from database
    const smsSettings = await Setting.findOne({ key: 'sms' });

    if (!smsSettings) {
      return res.status(200).json({
        enabled: false,
        provider: 'africasTalking',
        // Africa's Talking settings
        apiKey: '',
        username: '',
        senderId: 'SCHOOL',
        schoolName: 'St. John Vianney School',
        // Twilio settings
        accountSid: '',
        authToken: '',
        phoneNumber: '',
        // Bongolive settings
        bongoliveUsername: '',
        bongolivePassword: '',
        bongoliveApiUrl: '',
        // Vonage settings
        vonageApiKey: '',
        vonageApiSecret: '',
        // MessageBird settings
        messageBirdApiKey: '',
        // ClickSend settings
        clickSendUsername: '',
        clickSendApiKey: '',
        // TextMagic settings
        textMagicUsername: '',
        textMagicApiKey: '',
        // Beem Africa settings
        beemApiKey: '',
        beemSecretKey: ''
      });
    }

    return res.status(200).json(smsSettings.value);
  } catch (error) {
    console.error('Error getting SMS settings:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/settings/sms
 * @desc Update SMS settings
 * @access Private (Admin only)
 */
router.post('/sms', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const {
      enabled,
      provider,
      // Africa's Talking settings
      apiKey,
      username,
      senderId,
      schoolName,
      // Twilio settings
      accountSid,
      authToken,
      phoneNumber,
      // Bongolive settings
      bongoliveUsername,
      bongolivePassword,
      bongoliveApiUrl,
      // Vonage settings
      vonageApiKey,
      vonageApiSecret,
      // MessageBird settings
      messageBirdApiKey,
      // ClickSend settings
      clickSendUsername,
      clickSendApiKey,
      // TextMagic settings
      textMagicUsername,
      textMagicApiKey,
      // Beem Africa settings
      beemApiKey,
      beemSecretKey
    } = req.body;

    // Update SMS settings in database
    const smsSettings = await Setting.findOneAndUpdate(
      { key: 'sms' },
      {
        key: 'sms',
        value: {
          enabled: enabled || false,
          provider: provider || 'africasTalking',
          // Africa's Talking settings
          apiKey: apiKey || '',
          username: username || '',
          senderId: senderId || 'SCHOOL',
          schoolName: schoolName || 'St. John Vianney School',
          // Twilio settings
          accountSid: accountSid || '',
          authToken: authToken || '',
          phoneNumber: phoneNumber || '',
          // Bongolive settings
          bongoliveUsername: bongoliveUsername || '',
          bongolivePassword: bongolivePassword || '',
          bongoliveApiUrl: bongoliveApiUrl || '',
          // Vonage settings
          vonageApiKey: vonageApiKey || '',
          vonageApiSecret: vonageApiSecret || '',
          // MessageBird settings
          messageBirdApiKey: messageBirdApiKey || '',
          // ClickSend settings
          clickSendUsername: clickSendUsername || '',
          clickSendApiKey: clickSendApiKey || '',
          // TextMagic settings
          textMagicUsername: textMagicUsername || '',
          textMagicApiKey: textMagicApiKey || '',
          // Beem Africa settings
          beemApiKey: beemApiKey || '',
          beemSecretKey: beemSecretKey || ''
        }
      },
      { new: true, upsert: true }
    );

    return res.status(200).json(smsSettings.value);
  } catch (error) {
    console.error('Error updating SMS settings:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
