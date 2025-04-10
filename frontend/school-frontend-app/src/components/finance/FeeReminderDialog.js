import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup
} from '@mui/material';
import { Sms, Email, NotificationsActive } from '@mui/icons-material';
import api from '../../services/api';

const FeeReminderDialog = ({ open, onClose, studentFee, formatCurrency }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reminderType, setReminderType] = useState('sms');
  const [message, setMessage] = useState('');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('default');

  // Templates
  const templates = {
    default: `Dear Parent/Guardian,\n\nThis is a reminder that your child's school fees are due. Please make payment at your earliest convenience.\n\nThank you.`,
    overdue: `Dear Parent/Guardian,\n\nThis is an urgent reminder that your child's school fees are overdue. Please make payment immediately to avoid any inconvenience.\n\nThank you.`,
    partial: `Dear Parent/Guardian,\n\nThis is a reminder that your child has a pending balance for school fees. Please complete the payment at your earliest convenience.\n\nThank you.`,
    custom: ''
  };

  // Initialize message when dialog opens or template changes
  React.useEffect(() => {
    if (open && studentFee) {
      let templateText = templates[selectedTemplate];

      if (selectedTemplate === 'custom') {
        setMessage('');
        return;
      }

      if (includeDetails) {
        const detailsText = `\n\nStudent: ${studentFee.student?.firstName} ${studentFee.student?.lastName}\nAdmission #: ${studentFee.student?.admissionNumber}\nClass: ${studentFee.class?.name || ''}\nTotal Amount: ${formatCurrency(studentFee.totalAmount)}\nAmount Paid: ${formatCurrency(studentFee.amountPaid)}\nBalance: ${formatCurrency(studentFee.balance)}\nDue Date: ${new Date(studentFee.dueDate).toLocaleDateString()}`;
        templateText += detailsText;
      }

      setMessage(templateText);
    }
  }, [open, selectedTemplate, includeDetails, studentFee, formatCurrency]);

  // Handle template change
  const handleTemplateChange = (event) => {
    setSelectedTemplate(event.target.value);
  };

  // Handle reminder type change
  const handleReminderTypeChange = (event) => {
    setReminderType(event.target.value);
  };

  // Handle message change
  const handleMessageChange = (event) => {
    setMessage(event.target.value);
  };

  // Handle include details change
  const handleIncludeDetailsChange = (event) => {
    setIncludeDetails(event.target.checked);
  };

  // Handle send to all change
  const handleSendToAllChange = (event) => {
    setSendToAll(event.target.checked);
  };

  // Send reminder
  const handleSendReminder = async () => {
    if (!message.trim()) {
      setError('Please enter a message.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/api/finance/student-fees/${studentFee._id}/reminder`, {
        message,
        reminderType,
        sendToAll
      });

      setSuccess(response.data.message || 'Reminder sent successfully.');
      setLoading(false);

      // Close dialog after a delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Error sending reminder:', error);
      setError(error.response?.data?.message || 'Failed to send reminder. Please try again later.');
      setLoading(false);
    }
  };

  if (!studentFee) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Send Fee Reminder</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Student Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Student Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Name</Typography>
                <Typography variant="body1">{`${studentFee.student?.firstName} ${studentFee.student?.lastName}`}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Admission Number</Typography>
                <Typography variant="body1">{studentFee.student?.admissionNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Class</Typography>
                <Typography variant="body1">
                  {studentFee.class?.name}
                  {studentFee.class?.section && ` - ${studentFee.class.section}`}
                  {studentFee.class?.stream && ` (${studentFee.class.stream})`}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Parent Contact</Typography>
                <Typography variant="body1">
                  {studentFee.student?.parent?.phone || 'No phone number available'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Balance</Typography>
                <Typography variant="body1" color="error.main">
                  {formatCurrency(studentFee.balance)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Due Date</Typography>
                <Typography variant="body1">
                  {new Date(studentFee.dueDate).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Reminder Settings */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Reminder Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <Typography variant="subtitle2" gutterBottom>
                    Reminder Type
                  </Typography>
                  <RadioGroup
                    row
                    name="reminderType"
                    value={reminderType}
                    onChange={handleReminderTypeChange}
                  >
                    <FormControlLabel
                      value="sms"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Sms sx={{ mr: 0.5 }} fontSize="small" />
                          SMS
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="email"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Email sx={{ mr: 0.5 }} fontSize="small" />
                          Email
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="both"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <NotificationsActive sx={{ mr: 0.5 }} fontSize="small" />
                          Both
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Message Template</InputLabel>
                  <Select
                    value={selectedTemplate}
                    onChange={handleTemplateChange}
                    label="Message Template"
                  >
                    <MenuItem value="default">Default Reminder</MenuItem>
                    <MenuItem value="overdue">Overdue Reminder</MenuItem>
                    <MenuItem value="partial">Partial Payment Reminder</MenuItem>
                    <MenuItem value="custom">Custom Message</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeDetails}
                      onChange={handleIncludeDetailsChange}
                      disabled={selectedTemplate === 'custom'}
                    />
                  }
                  label="Include fee details in message"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sendToAll}
                      onChange={handleSendToAllChange}
                    />
                  }
                  label="Send to all students with similar status (bulk send)"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={6}
                  value={message}
                  onChange={handleMessageChange}
                  required
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSendReminder}
          variant="contained"
          color="primary"
          disabled={loading || !message.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Send Reminder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

FeeReminderDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  studentFee: PropTypes.object,
  formatCurrency: PropTypes.func.isRequired
};

export default FeeReminderDialog;
