import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  CloudSync,
  Check,
  Error,
  AccountBalance,
  Settings,
  Link as LinkIcon,
  LinkOff
} from '@mui/icons-material';
import api from '../../services/api';

const QuickbooksIntegration = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [config, setConfig] = useState({
    isConfigured: false,
    environment: 'sandbox',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    realmId: '',
    lastSyncDate: null,
    accountMappings: {
      tuitionFees: '',
      libraryFees: '',
      examFees: '',
      transportFees: '',
      uniformFees: '',
      otherFees: '',
      cashAccount: '',
      bankAccount: '',
      mobileMoney: ''
    },
    syncSettings: {
      autoSyncEnabled: false,
      syncFrequency: 'daily',
      lastSyncStatus: 'not_started'
    }
  });
  const [accounts, setAccounts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const [authWindow, setAuthWindow] = useState(null);

  useEffect(() => {
    fetchQuickbooksConfig();

    // Add event listener for QuickBooks auth callback
    const handleAuthMessage = (event) => {
      if (event.data && event.data.type === 'quickbooks-auth-success') {
        console.log('QuickBooks auth success:', event.data);
        setSuccess('QuickBooks connected successfully!');
        fetchQuickbooksConfig();
        if (authWindow) {
          authWindow.close();
          setAuthWindow(null);
        }
        setOpenAuthDialog(false);
      } else if (event.data && event.data.type === 'quickbooks-auth-error') {
        console.error('QuickBooks auth error:', event.data);
        setError(`QuickBooks connection failed: ${event.data.error}`);
        if (authWindow) {
          authWindow.close();
          setAuthWindow(null);
        }
        setOpenAuthDialog(false);
      }
    };

    window.addEventListener('message', handleAuthMessage);

    return () => {
      window.removeEventListener('message', handleAuthMessage);
      if (authWindow) {
        authWindow.close();
      }
    };
  }, [authWindow]);

  const fetchQuickbooksConfig = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/api/finance/quickbooks/config');
      setConfig(response.data);

      // If QuickBooks is configured and authorized, fetch accounts and payment methods
      if (response.data.isConfigured && response.data.realmId) {
        try {
          const [accountsResponse, paymentMethodsResponse] = await Promise.all([
            api.get('/api/finance/quickbooks/accounts'),
            api.get('/api/finance/quickbooks/payment-methods')
          ]);

          setAccounts(accountsResponse.data || []);
          setPaymentMethods(paymentMethodsResponse.data || []);
        } catch (error) {
          console.error('Error fetching QuickBooks data:', error);
          // Don't set error here to avoid blocking the UI
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching QuickBooks configuration:', error);
      setError('Failed to load QuickBooks configuration');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prevConfig => ({
      ...prevConfig,
      [name]: value
    }));
  };

  const handleAccountMappingChange = (e) => {
    const { name, value } = e.target;
    setConfig(prevConfig => ({
      ...prevConfig,
      accountMappings: {
        ...prevConfig.accountMappings,
        [name]: value
      }
    }));
  };

  const handleSyncSettingChange = (e) => {
    const { name, value } = e.target;
    setConfig(prevConfig => ({
      ...prevConfig,
      syncSettings: {
        ...prevConfig.syncSettings,
        [name]: value
      }
    }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setConfig(prevConfig => ({
      ...prevConfig,
      syncSettings: {
        ...prevConfig.syncSettings,
        [name]: checked
      }
    }));
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validate required fields
      if (!config.clientId || !config.redirectUri) {
        setError('Client ID and Redirect URI are required');
        setSaving(false);
        return;
      }

      // If client secret is empty and config is already configured, don't send it
      // to avoid overwriting the existing secret
      const dataToSend = { ...config };
      if (!dataToSend.clientSecret && config.isConfigured) {
        delete dataToSend.clientSecret;
      }

      const response = await api.put('/api/finance/quickbooks/config', dataToSend);
      setConfig(response.data.config);
      setSuccess('QuickBooks configuration saved successfully');
      setSaving(false);
    } catch (error) {
      console.error('Error saving QuickBooks configuration:', error);
      setError('Failed to save QuickBooks configuration');
      setSaving(false);
    }
  };

  const handleConnectQuickbooks = async () => {
    try {
      setError('');
      setSuccess('');

      // Get authorization URL
      const response = await api.get('/api/finance/quickbooks/auth-url');
      const { authUrl } = response.data;

      // Open authorization URL in a new window
      const newWindow = window.open(authUrl, 'QuickBooks Authorization', 'width=600,height=700');
      setAuthWindow(newWindow);
      setOpenAuthDialog(true);
    } catch (error) {
      console.error('Error connecting to QuickBooks:', error);
      setError('Failed to connect to QuickBooks');
    }
  };

  const handleDisconnectQuickbooks = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Update configuration to remove QuickBooks connection
      const updatedConfig = {
        ...config,
        isConfigured: false,
        realmId: '',
        accessToken: '',
        refreshToken: '',
        tokenExpiry: null
      };

      const response = await api.put('/api/finance/quickbooks/config', updatedConfig);
      setConfig(response.data.config);
      setSuccess('QuickBooks disconnected successfully');
      setSaving(false);
    } catch (error) {
      console.error('Error disconnecting QuickBooks:', error);
      setError('Failed to disconnect QuickBooks');
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>
      <Typography variant="h4" gutterBottom>
        QuickBooks Integration
      </Typography>

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
        {/* Connection Status Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Connection Status
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {config.isConfigured && config.realmId ? (
                  <Check color="success" sx={{ mr: 1 }} />
                ) : (
                  <Error color="error" sx={{ mr: 1 }} />
                )}
                <Typography>
                  {config.isConfigured && config.realmId
                    ? 'Connected to QuickBooks'
                    : 'Not connected to QuickBooks'}
                </Typography>
              </Box>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Environment"
                    secondary={config.environment === 'sandbox' ? 'Sandbox (Testing)' : 'Production'}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <AccountBalance fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Company ID"
                    secondary={config.realmId || 'Not connected'}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CloudSync fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Sync"
                    secondary={formatDate(config.lastSyncDate)}
                  />
                </ListItem>
              </List>

              <Box sx={{ mt: 2 }}>
                {config.isConfigured && config.realmId ? (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LinkOff />}
                    onClick={handleDisconnectQuickbooks}
                    disabled={saving}
                    fullWidth
                  >
                    Disconnect QuickBooks
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LinkIcon />}
                    onClick={handleConnectQuickbooks}
                    disabled={!config.isConfigured || saving}
                    fullWidth
                  >
                    Connect to QuickBooks
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuration Settings */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              QuickBooks Configuration
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Environment</InputLabel>
                  <Select
                    name="environment"
                    value={config.environment}
                    onChange={handleInputChange}
                    label="Environment"
                  >
                    <MenuItem value="sandbox">Sandbox (Testing)</MenuItem>
                    <MenuItem value="production">Production</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Client ID"
                  name="clientId"
                  value={config.clientId}
                  onChange={handleInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Client Secret"
                  name="clientSecret"
                  type="password"
                  value={config.clientSecret}
                  onChange={handleInputChange}
                  required={!config.isConfigured}
                  helperText={config.isConfigured ? "Leave blank to keep current secret" : ""}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Redirect URI"
                  name="redirectUri"
                  value={config.redirectUri}
                  onChange={handleInputChange}
                  required
                  helperText="e.g., http://localhost:3000/api/finance/quickbooks/callback"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Account Mappings
                </Typography>
              </Grid>

              {/* Account Mappings */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tuition Fees Account</InputLabel>
                  <Select
                    name="tuitionFees"
                    value={config.accountMappings.tuitionFees}
                    onChange={handleAccountMappingChange}
                    label="Tuition Fees Account"
                    disabled={!config.isConfigured || !config.realmId}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {accounts.map(account => (
                      <MenuItem key={account.Id} value={account.Id}>
                        {account.Name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Library Fees Account</InputLabel>
                  <Select
                    name="libraryFees"
                    value={config.accountMappings.libraryFees}
                    onChange={handleAccountMappingChange}
                    label="Library Fees Account"
                    disabled={!config.isConfigured || !config.realmId}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {accounts.map(account => (
                      <MenuItem key={account.Id} value={account.Id}>
                        {account.Name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Exam Fees Account</InputLabel>
                  <Select
                    name="examFees"
                    value={config.accountMappings.examFees}
                    onChange={handleAccountMappingChange}
                    label="Exam Fees Account"
                    disabled={!config.isConfigured || !config.realmId}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {accounts.map(account => (
                      <MenuItem key={account.Id} value={account.Id}>
                        {account.Name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Other Fees Account</InputLabel>
                  <Select
                    name="otherFees"
                    value={config.accountMappings.otherFees}
                    onChange={handleAccountMappingChange}
                    label="Other Fees Account"
                    disabled={!config.isConfigured || !config.realmId}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {accounts.map(account => (
                      <MenuItem key={account.Id} value={account.Id}>
                        {account.Name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Sync Settings
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.syncSettings.autoSyncEnabled}
                      onChange={handleSwitchChange}
                      name="autoSyncEnabled"
                      color="primary"
                    />
                  }
                  label="Enable Automatic Sync"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!config.syncSettings.autoSyncEnabled}>
                  <InputLabel>Sync Frequency</InputLabel>
                  <Select
                    name="syncFrequency"
                    value={config.syncSettings.syncFrequency}
                    onChange={handleSyncSettingChange}
                    label="Sync Frequency"
                  >
                    <MenuItem value="hourly">Hourly</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveConfig}
                    disabled={saving}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save Configuration'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* QuickBooks Authorization Dialog */}
      <Dialog
        open={openAuthDialog}
        onClose={() => {
          setOpenAuthDialog(false);
          if (authWindow) {
            authWindow.close();
            setAuthWindow(null);
          }
        }}
      >
        <DialogTitle>Connecting to QuickBooks</DialogTitle>
        <DialogContent>
          <DialogContentText>
            A new window has opened for you to authorize the connection to QuickBooks.
            Please complete the authorization process in that window.
          </DialogContentText>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenAuthDialog(false);
              if (authWindow) {
                authWindow.close();
                setAuthWindow(null);
              }
            }}
            color="primary"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickbooksIntegration;
