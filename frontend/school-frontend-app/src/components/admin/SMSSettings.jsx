import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import { Save as SaveIcon, Send as SendIcon } from '@mui/icons-material';

const SMSSettings = () => {
  const [testNumber, setTestNumber] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTestSMS = () => {
    // Simulate sending a test SMS
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
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
              disabled={!testNumber || !testMessage}
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
              <Typography variant="h6" gutterBottom>
                SMS Usage Statistics
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">SMS Credits Available:</Typography>
                <Typography variant="body1" fontWeight="bold">5,000</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">SMS Sent This Month:</Typography>
                <Typography variant="body1" fontWeight="bold">1,245</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">SMS Sent Today:</Typography>
                <Typography variant="body1" fontWeight="bold">42</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Delivery Success Rate:</Typography>
                <Typography variant="body1" fontWeight="bold">98.5%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SMSSettings;
