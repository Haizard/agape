import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import { Save as SaveIcon, Send as SendIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import axios from 'axios';

const SMSSettings = () => {
  const [testNumber, setTestNumber] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [smsUsage, setSmsUsage] = useState({
    balance: 'Loading...',
    dailyUsage: 0,
    monthlyUsage: 0,
    successRate: '98.5%' // Default value
  });

  // Fetch SMS usage statistics on component mount
  useEffect(() => {
    fetchSMSUsage();
  }, []);

  // Fetch SMS usage statistics from the API
  const fetchSMSUsage = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sms/usage');
      setSmsUsage({
        ...smsUsage,
        balance: response.data.balance || 'Not available',
        dailyUsage: response.data.dailyUsage || 0,
        monthlyUsage: response.data.monthlyUsage || 0,
        successRate: response.data.successRate || '98.5%'
      });
    } catch (err) {
      console.error('Error fetching SMS usage:', err);
      setError('Failed to fetch SMS usage statistics');
      // Keep the existing values if there's an error
    } finally {
      setLoading(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testNumber) {
      setError('Please enter a phone number');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Call the API to send a test SMS
      const response = await axios.post('/api/sms/test', {
        phoneNumber: testNumber,
        message: testMessage || 'This is a test message from the school management system.'
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

      // Refresh SMS usage after sending
      fetchSMSUsage();
    } catch (err) {
      console.error('Error sending test SMS:', err);
      setError(`Failed to send test SMS: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        SMS Settings
      </Typography>
      <Typography variant="body1" paragraph>
        Configure SMS settings for sending notifications to parents and students.
      </Typography>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Test SMS sent successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              SMS Provider Configuration
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Beem Africa Configuration
              </Typography>
              <TextField
                fullWidth
                label="API Key"
                variant="outlined"
                defaultValue="925e610082ab009a"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Secret Key"
                variant="outlined"
                defaultValue="Y2Y3NTU4YjNkMTk5ZDE0MDBmOWZiZWRlNDI2ZTc0MGNlZTRlMDkyZTk0ZWI4MjBjZjNhYTk2NDgzYTNkMTFmYw=="
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Sender ID"
                variant="outlined"
                defaultValue="AGAPE"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
              >
                Save Configuration
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test SMS
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TextField
              fullWidth
              label="Phone Number"
              variant="outlined"
              placeholder="+255 7XX XXX XXX"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Message"
              variant="outlined"
              multiline
              rows={4}
              placeholder="Enter test message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="secondary"
              startIcon={<SendIcon />}
              onClick={handleTestSMS}
              disabled={loading || !testNumber || !testMessage}
            >
              Send Test SMS
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Send SMS for Exam Results"
              sx={{ display: 'block', mb: 2 }}
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Send SMS for Fee Reminders"
              sx={{ display: 'block', mb: 2 }}
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Send SMS for Attendance Alerts"
              sx={{ display: 'block', mb: 2 }}
            />
            <FormControlLabel
              control={<Switch />}
              label="Send SMS for School Events"
              sx={{ display: 'block', mb: 2 }}
            />
            <FormControlLabel
              control={<Switch />}
              label="Send SMS for Homework Assignments"
              sx={{ display: 'block', mb: 2 }}
            />
          </Paper>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  SMS Usage Statistics
                </Typography>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={fetchSMSUsage}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">SMS Credits Available:</Typography>
                    <Typography variant="body1" fontWeight="bold">{smsUsage.balance}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">SMS Sent This Month:</Typography>
                    <Typography variant="body1" fontWeight="bold">{smsUsage.monthlyUsage}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">SMS Sent Today:</Typography>
                    <Typography variant="body1" fontWeight="bold">{smsUsage.dailyUsage}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Delivery Success Rate:</Typography>
                    <Typography variant="body1" fontWeight="bold">{smsUsage.successRate}</Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SMSSettings;
