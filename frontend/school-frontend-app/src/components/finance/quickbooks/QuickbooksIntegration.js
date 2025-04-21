import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import api from '../../../services/api';

// Import sub-components
import QuickbooksConnectionStatus from './QuickbooksConnectionStatus';
import QuickbooksConfigForm from './QuickbooksConfigForm';
import QuickbooksAccountMappings from './QuickbooksAccountMappings';
import QuickbooksSyncSettings from './QuickbooksSyncSettings';
import QuickbooksReconciliation from './QuickbooksReconciliation';

/**
 * QuickbooksIntegration component
 * 
 * This is the main container component for QuickBooks integration.
 * It manages state and API calls, and renders the appropriate sub-components.
 */
const QuickbooksIntegration = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
      <Typography variant="h5" gutterBottom>
        QuickBooks Integration
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

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Configuration" />
        <Tab label="Account Mappings" />
        <Tab label="Sync Settings" />
        <Tab label="Reconciliation" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <QuickbooksConnectionStatus
              config={config}
              formatDate={formatDate}
              handleConnectQuickbooks={handleConnectQuickbooks}
              handleDisconnectQuickbooks={handleDisconnectQuickbooks}
              saving={saving}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <QuickbooksConfigForm
                config={config}
                handleInputChange={handleInputChange}
                handleSaveConfig={handleSaveConfig}
                saving={saving}
              />
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <QuickbooksAccountMappings
            config={config}
            accounts={accounts}
            handleAccountMappingChange={handleAccountMappingChange}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveConfig}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              {saving ? 'Saving...' : 'Save Mappings'}
            </Button>
          </Box>
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <QuickbooksSyncSettings
            config={config}
            handleSyncSettingChange={handleSyncSettingChange}
            handleSwitchChange={handleSwitchChange}
            handleSaveConfig={handleSaveConfig}
            saving={saving}
          />
        </Paper>
      )}

      {activeTab === 3 && (
        <QuickbooksReconciliation />
      )}

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
