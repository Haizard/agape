import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Check,
  Error,
  Settings,
  AccountBalance,
  CloudSync,
  Link as LinkIcon,
  LinkOff
} from '@mui/icons-material';

/**
 * QuickbooksConnectionStatus component
 * 
 * This component displays the current connection status with QuickBooks
 * and provides buttons to connect or disconnect.
 */
const QuickbooksConnectionStatus = ({
  config,
  formatDate,
  handleConnectQuickbooks,
  handleDisconnectQuickbooks,
  saving
}) => {
  return (
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
      </CardContent
    </Card>
  );
};

export default QuickbooksConnectionStatus;
