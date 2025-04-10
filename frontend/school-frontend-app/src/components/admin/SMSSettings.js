import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Sms as SmsIcon,
  Settings as SettingsIcon,
  CreditCard as CreditCardIcon,
  History as HistoryIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';

const SMSSettings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsProvider, setSmsProvider] = useState('africasTalking');
  const [smsSettings, setSmsSettings] = useState({
    // Africa's Talking settings
    apiKey: '',
    username: '',
    senderId: '',
    schoolName: '',

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
  const [smsUsage, setSmsUsage] = useState({
    balance: 'Loading...',
    dailyUsage: 0,
    monthlyUsage: 0
  });
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('This is a test message from the school management system.');

  useEffect(() => {
    fetchSMSSettings();
    fetchSMSUsage();
  }, []);

  const fetchSMSSettings = async () => {
    try {
      const response = await axios.get('/api/settings/sms');
      setSmsSettings(response.data);
      setSmsEnabled(response.data.enabled || false);
    } catch (err) {
      console.error('Error fetching SMS settings:', err);
      // If the endpoint doesn't exist yet, we'll just use the default values
    }
  };

  const fetchSMSUsage = async () => {
    try {
      const response = await axios.get('/api/sms/usage');
      setSmsUsage(response.data);
    } catch (err) {
      console.error('Error fetching SMS usage:', err);
      setSmsUsage({
        balance: 'Error fetching balance',
        dailyUsage: 0,
        monthlyUsage: 0
      });
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/settings/sms', {
        ...smsSettings,
        provider: smsProvider,
        enabled: smsEnabled
      });
      setSuccess('SMS settings saved successfully');
      fetchSMSUsage(); // Refresh usage data
    } catch (err) {
      setError('Failed to save SMS settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestSMS = async () => {
    if (!testPhoneNumber) {
      setError('Please enter a phone number for testing');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Sending test SMS to:', testPhoneNumber);
      // Include the API key and secret key if using Beem Africa
      const requestData = {
        phoneNumber: testPhoneNumber,
        message: testMessage || 'This is a test message from the school management system.'
      };

      // If using Beem Africa, include the API key and secret key
      if (smsProvider === 'beemafrica') {
        // Make sure we have the API key and secret key
        if (smsSettings.beemApiKey) {
          requestData.apiKey = smsSettings.beemApiKey;
          console.log('Including API key in request:', smsSettings.beemApiKey);
        } else {
          console.log('No API key available, test will use mock mode');
        }

        // Try to decode the secret key if it's base64 encoded
        if (smsSettings.beemSecretKey) {
          try {
            // Check if it looks like base64
            if (/^[A-Za-z0-9+/=]+$/.test(smsSettings.beemSecretKey)) {
              // Try to decode it
              const decodedKey = atob(smsSettings.beemSecretKey);
              console.log('Decoded secret key:', decodedKey);
              requestData.secretKey = decodedKey;
            } else {
              // Use as is
              requestData.secretKey = smsSettings.beemSecretKey;
              console.log('Using original secret key');
            }
          } catch (e) {
            // If decoding fails, use the original
            console.log('Using original secret key');
            requestData.secretKey = smsSettings.beemSecretKey;
          }
        } else {
          console.log('No secret key available, test will use mock mode');
        }

        // Log the credentials for debugging
        console.log('Using Beem Africa credentials:');
        console.log('API Key:', requestData.apiKey || 'Not set (will use mock mode)');
        console.log('Secret Key:', requestData.secretKey ? 'Set (value hidden)' : 'Not set (will use mock mode)');
      }

      const response = await axios.post('/api/sms/test', requestData);
      console.log('SMS test response:', response.data);
      // Show a success message with the provider information
      const provider = response.data.provider || 'Mock Mode';
      setSuccess(`Test SMS sent successfully via ${provider}`);
      console.log('Full response:', response.data);
    } catch (err) {
      console.error('Error sending test SMS:', err);
      setError(`Failed to send test SMS: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSmsSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>SMS Settings</Typography>

      <Grid container spacing={3}>
        {/* SMS Usage Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SmsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                SMS Usage
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CreditCardIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Balance"
                    secondary={smsUsage.balance}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <HistoryIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Daily Usage"
                    secondary={`${smsUsage.dailyUsage} SMS sent today`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <HistoryIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Monthly Usage"
                    secondary={`${smsUsage.monthlyUsage} SMS sent this month`}
                  />
                </ListItem>
              </List>

              <Button
                variant="outlined"
                size="small"
                onClick={fetchSMSUsage}
                sx={{ mt: 2 }}
              >
                Refresh Usage
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* SMS Provider Settings */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              SMS Provider Configuration
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <FormControlLabel
              control={
                <Switch
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label={smsEnabled ? "SMS Sending Enabled" : "SMS Sending Disabled"}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="sms-provider-label">SMS Provider</InputLabel>
              <Select
                labelId="sms-provider-label"
                value={smsProvider}
                onChange={(e) => setSmsProvider(e.target.value)}
                label="SMS Provider"
              >
                <MenuItem value="africasTalking">Africa's Talking</MenuItem>
                <MenuItem value="twilio">Twilio</MenuItem>
                <MenuItem value="bongolive">Bongolive</MenuItem>
                <MenuItem value="vonage">Vonage</MenuItem>
                <MenuItem value="messagebird">MessageBird</MenuItem>
                <MenuItem value="clicksend">ClickSend</MenuItem>
                <MenuItem value="textmagic">TextMagic</MenuItem>
                <MenuItem value="beemafrica">Beem Africa</MenuItem>
              </Select>
            </FormControl>

            {smsProvider === 'africasTalking' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                To use Africa's Talking SMS service, you need to create an account at
                <a href="https://africastalking.com/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }}>
                  africastalking.com
                </a>
              </Alert>
            )}

            {smsProvider === 'twilio' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                To use Twilio SMS service, you need to create an account at
                <a href="https://www.twilio.com/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }}>
                  twilio.com
                </a>
              </Alert>
            )}

            {smsProvider === 'bongolive' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                To use Bongolive SMS service, you need to create an account at
                <a href="https://www.bongolive.co.tz/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }}>
                  bongolive.co.tz
                </a>
              </Alert>
            )}

            {smsProvider === 'vonage' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                To use Vonage SMS service, you need to create an account at
                <a href="https://www.vonage.com/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }}>
                  vonage.com
                </a>
              </Alert>
            )}

            {smsProvider === 'messagebird' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                To use MessageBird SMS service, you need to create an account at
                <a href="https://www.messagebird.com/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }}>
                  messagebird.com
                </a>
              </Alert>
            )}

            {smsProvider === 'clicksend' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                To use ClickSend SMS service, you need to create an account at
                <a href="https://www.clicksend.com/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }}>
                  clicksend.com
                </a>
              </Alert>
            )}

            {smsProvider === 'textmagic' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                To use TextMagic SMS service, you need to create an account at
                <a href="https://www.textmagic.com/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }}>
                  textmagic.com
                </a>
              </Alert>
            )}

            {smsProvider === 'beemafrica' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                To use Beem Africa SMS service, you need to create an account at
                <a href="https://engage.beem.africa/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }}>
                  engage.beem.africa
                </a>
              </Alert>
            )}

            {/* Common Settings */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="School Name"
                  name="schoolName"
                  value={smsSettings.schoolName}
                  onChange={handleInputChange}
                  margin="normal"
                  helperText="School name to include in SMS messages"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sender ID"
                  name="senderId"
                  value={smsSettings.senderId}
                  onChange={handleInputChange}
                  margin="normal"
                  helperText="The sender ID that will appear on SMS messages"
                />
              </Grid>
            </Grid>

            {/* Africa's Talking Settings */}
            {smsProvider === 'africasTalking' && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API Key"
                    name="apiKey"
                    value={smsSettings.apiKey}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your Africa's Talking API Key"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={smsSettings.username}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your Africa's Talking Username (use 'sandbox' for testing)"
                  />
                </Grid>
              </Grid>
            )}

            {/* Twilio Settings */}
            {smsProvider === 'twilio' && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Account SID"
                    name="accountSid"
                    value={smsSettings.accountSid}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your Twilio Account SID"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Auth Token"
                    name="authToken"
                    value={smsSettings.authToken}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your Twilio Auth Token"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={smsSettings.phoneNumber}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your Twilio Phone Number"
                  />
                </Grid>
              </Grid>
            )}

            {/* Bongolive Settings */}
            {smsProvider === 'bongolive' && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="bongoliveUsername"
                    value={smsSettings.bongoliveUsername}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your Bongolive Username"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="bongolivePassword"
                    value={smsSettings.bongolivePassword}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your Bongolive Password"
                    type="password"
                  />
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    label="API URL"
                    name="bongoliveApiUrl"
                    value={smsSettings.bongoliveApiUrl}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Bongolive API URL"
                  />
                </Grid>
              </Grid>
            )}

            {/* Vonage Settings */}
            {smsProvider === 'vonage' && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API Key"
                    name="vonageApiKey"
                    value={smsSettings.vonageApiKey}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your Vonage API Key"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API Secret"
                    name="vonageApiSecret"
                    value={smsSettings.vonageApiSecret}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your Vonage API Secret"
                    type="password"
                  />
                </Grid>
              </Grid>
            )}

            {/* MessageBird Settings */}
            {smsProvider === 'messagebird' && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    label="API Key"
                    name="messageBirdApiKey"
                    value={smsSettings.messageBirdApiKey}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your MessageBird API Key"
                  />
                </Grid>
              </Grid>
            )}

            {/* ClickSend Settings */}
            {smsProvider === 'clicksend' && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="clickSendUsername"
                    value={smsSettings.clickSendUsername}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your ClickSend Username"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API Key"
                    name="clickSendApiKey"
                    value={smsSettings.clickSendApiKey}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your ClickSend API Key"
                    type="password"
                  />
                </Grid>
              </Grid>
            )}

            {/* TextMagic Settings */}
            {smsProvider === 'textmagic' && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="textMagicUsername"
                    value={smsSettings.textMagicUsername}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your TextMagic Username"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API Key"
                    name="textMagicApiKey"
                    value={smsSettings.textMagicApiKey}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your TextMagic API Key"
                    type="password"
                  />
                </Grid>
              </Grid>
            )}

            {/* Beem Africa Settings */}
            {smsProvider === 'beemafrica' && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API Key"
                    name="beemApiKey"
                    value={smsSettings.beemApiKey}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your Beem Africa API Key"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Secret Key"
                    name="beemSecretKey"
                    value={smsSettings.beemSecretKey}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="Your Beem Africa Secret Key"
                    type="password"
                  />
                </Grid>
              </Grid>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Settings'}
              </Button>
            </Box>
          </Paper>

          {/* Test SMS Section */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              <SmsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Send Test SMS
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Test Phone Number"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  margin="normal"
                  helperText="Enter a phone number to send a test SMS (e.g., +255XXXXXXXXX)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Test Message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleSendTestSMS}
                disabled={loading || !smsEnabled}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Test SMS'}
              </Button>
            </Box>

            {!smsEnabled && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                SMS sending is disabled. Enable it in the settings above to send test messages.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SMSSettings;
