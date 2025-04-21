import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications,
  Security,
  AccountBalance,
  Receipt,
  Save,
  MonetizationOn,
  CalendarToday
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    general: {
      defaultCurrency: 'TZS',
      receiptNumberFormat: `RCT-${new Date().getFullYear()}-####`,
      financialYearStart: new Date(new Date().getFullYear(), 0, 1), // Jan 1
      financialYearEnd: new Date(new Date().getFullYear(), 11, 31), // Dec 31
    },
    notifications: {
      paymentNotifications: true,
      feeReminderNotifications: true,
      reminderDays: 7
    },
    security: {
      paymentApproval: false,
      paymentApprovalThreshold: 1000000, // 1,000,000 TZS
      twoFactorAuth: false,
      auditLogging: true
    }
  });
  const [openFinancialYearDialog, setOpenFinancialYearDialog] = useState(false);
  const [openApprovalSettingsDialog, setOpenApprovalSettingsDialog] = useState(false);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/finance/settings');
        if (response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error('Error fetching finance settings:', error);
        // Continue with default settings
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Save settings
  const saveSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/api/finance/settings', settings);
      setSuccess('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle switch change
  const handleSwitchChange = (section, field) => (event) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: event.target.checked
      }
    });
  };

  // Handle text field change
  const handleTextChange = (section, field) => (event) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: event.target.value
      }
    });
  };

  // Handle date change
  const handleDateChange = (section, field) => (date) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: date
      }
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `${settings.general.defaultCurrency} ${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>
      <Typography variant="h5" gutterBottom>
        Finance Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            General Settings
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CalendarToday />}
            onClick={() => setOpenFinancialYearDialog(true)}
          >
            Set Financial Year
          </Button>
        </Box>
        <List>
          <ListItem>
            <ListItemIcon>
              <MonetizationOn />
            </ListItemIcon>
            <ListItemText
              primary="Default Currency"
              secondary="Set the default currency for financial transactions"
            />
            <TextField
              select
              value={settings.general.defaultCurrency}
              onChange={handleTextChange('general', 'defaultCurrency')}
              sx={{ width: 120 }}
              size="small"
            >
              <MenuItem value="TZS">TZS</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="GBP">GBP</MenuItem>
            </TextField>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Receipt />
            </ListItemIcon>
            <ListItemText
              primary="Receipt Numbering"
              secondary="Configure the format for receipt numbers"
            />
            <TextField
              value={settings.general.receiptNumberFormat}
              onChange={handleTextChange('general', 'receiptNumberFormat')}
              size="small"
              sx={{ width: 200 }}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <AccountBalance />
            </ListItemIcon>
            <ListItemText
              primary="Financial Year"
              secondary="Set the start and end dates for the financial year"
            />
            <Typography variant="body2">
              {formatDate(settings.general.financialYearStart)} - {formatDate(settings.general.financialYearEnd)}
            </Typography>
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Notification Settings
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Notifications />
            </ListItemIcon>
            <ListItemText
              primary="Payment Notifications"
              secondary="Send notifications when payments are received"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.paymentNotifications}
                  onChange={handleSwitchChange('notifications', 'paymentNotifications')}
                />
              }
              label=""
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Notifications />
            </ListItemIcon>
            <ListItemText
              primary="Fee Reminder Notifications"
              secondary="Send notifications for upcoming fee deadlines"
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.feeReminderNotifications}
                    onChange={handleSwitchChange('notifications', 'feeReminderNotifications')}
                  />
                }
                label=""
              />
              {settings.notifications.feeReminderNotifications && (
                <TextField
                  label="Days before"
                  type="number"
                  size="small"
                  value={settings.notifications.reminderDays}
                  onChange={handleTextChange('notifications', 'reminderDays')}
                  sx={{ width: 100, ml: 2 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">days</InputAdornment>,
                  }}
                />
              )}
            </Box>
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Security Settings
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Security />}
            onClick={() => setOpenApprovalSettingsDialog(true)}
            disabled={!settings.security.paymentApproval}
          >
            Configure Approval
          </Button>
        </Box>
        <List>
          <ListItem>
            <ListItemIcon>
              <Security />
            </ListItemIcon>
            <ListItemText
              primary="Payment Approval"
              secondary={`Require approval for payments above ${formatCurrency(settings.security.paymentApprovalThreshold)}`}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.security.paymentApproval}
                  onChange={handleSwitchChange('security', 'paymentApproval')}
                />
              }
              label=""
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Security />
            </ListItemIcon>
            <ListItemText
              primary="Two-Factor Authentication"
              secondary="Require two-factor authentication for financial transactions"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.security.twoFactorAuth}
                  onChange={handleSwitchChange('security', 'twoFactorAuth')}
                />
              }
              label=""
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Security />
            </ListItemIcon>
            <ListItemText
              primary="Audit Logging"
              secondary="Keep detailed logs of all financial activities"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.security.auditLogging}
                  onChange={handleSwitchChange('security', 'auditLogging')}
                />
              }
              label=""
            />
          </ListItem>
        </List>
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          onClick={saveSettings}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {/* Financial Year Dialog */}
      <Dialog open={openFinancialYearDialog} onClose={() => setOpenFinancialYearDialog(false)}>
        <DialogTitle>Set Financial Year</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <DatePicker
                  label="Start Date"
                  value={settings.general.financialYearStart}
                  onChange={handleDateChange('general', 'financialYearStart')}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12}>
                <DatePicker
                  label="End Date"
                  value={settings.general.financialYearEnd}
                  onChange={handleDateChange('general', 'financialYearEnd')}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFinancialYearDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              // Validate dates
              if (settings.general.financialYearStart >= settings.general.financialYearEnd) {
                setError('End date must be after start date');
                return;
              }
              setOpenFinancialYearDialog(false);
            }}
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Approval Settings Dialog */}
      <Dialog open={openApprovalSettingsDialog} onClose={() => setOpenApprovalSettingsDialog(false)}>
        <DialogTitle>Payment Approval Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure when payments require approval before they are processed.
          </Typography>
          <TextField
            label="Approval Threshold"
            type="number"
            fullWidth
            value={settings.security.paymentApprovalThreshold}
            onChange={handleTextChange('security', 'paymentApprovalThreshold')}
            InputProps={{
              startAdornment: <InputAdornment position="start">{settings.general.defaultCurrency}</InputAdornment>,
            }}
            helperText="Payments above this amount will require approval"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApprovalSettingsDialog(false)}>Cancel</Button>
          <Button
            onClick={() => setOpenApprovalSettingsDialog(false)}
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
