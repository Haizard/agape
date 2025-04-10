import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Divider, Switch, FormControlLabel } from '@mui/material';
import { Settings as SettingsIcon, Notifications, Security, AccountBalance, Receipt } from '@mui/icons-material';

const Settings = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>
      <Typography variant="h4" gutterBottom>
        Finance Settings
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          General Settings
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Default Currency"
              secondary="Set the default currency for financial transactions"
            />
            <Typography variant="body2">TZS</Typography>
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
            <Typography variant="body2">RCT-{new Date().getFullYear()}-####</Typography>
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
            <Typography variant="body2">Jan 1 - Dec 31</Typography>
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
              control={<Switch defaultChecked />}
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
            <FormControlLabel
              control={<Switch defaultChecked />}
              label=""
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Security Settings
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Security />
            </ListItemIcon>
            <ListItemText
              primary="Payment Approval"
              secondary="Require approval for payments above a certain amount"
            />
            <FormControlLabel
              control={<Switch />}
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
              control={<Switch />}
              label=""
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default Settings;
