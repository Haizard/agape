import React from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert
} from '@mui/material';

/**
 * QuickbooksAccountMappings component
 * 
 * This component handles the mapping between school fee categories and QuickBooks accounts.
 */
const QuickbooksAccountMappings = ({
  config,
  accounts,
  handleAccountMappingChange
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Account Mappings
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {!config.isConfigured || !config.realmId ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Connect to QuickBooks first to configure account mappings.
        </Alert>
      ) : accounts.length === 0 ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No accounts found in QuickBooks. Please make sure your QuickBooks account has income and payment accounts set up.
        </Alert>
      ) : (
        <Grid container spacing={3}>
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
        </Grid>
      )}
    </Box>
  );
};

export default QuickbooksAccountMappings;
