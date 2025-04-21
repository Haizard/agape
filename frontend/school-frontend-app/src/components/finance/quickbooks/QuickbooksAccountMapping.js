import React from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Alert
} from '@mui/material';
import { Save } from '@mui/icons-material';

/**
 * QuickbooksAccountMapping component
 * 
 * This component handles the mapping between school fee categories and QuickBooks accounts.
 */
const QuickbooksAccountMapping = ({
  config,
  accounts,
  handleAccountMappingChange,
  handleSaveConfig,
  saving
}) => {
  return (
    <Paper sx={{ p: 3 }}>
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
          {/* Income Accounts */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Income Accounts
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Tuition Fees Account</InputLabel>
              <Select
                name="tuitionFees"
                value={config.accountMappings.tuitionFees}
                onChange={handleAccountMappingChange}
                label="Tuition Fees Account"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {accounts
                  .filter(account => account.AccountType === 'Income')
                  .map(account => (
                    <MenuItem key={account.Id} value={account.Id}>
                      {account.Name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Library Fees Account</InputLabel>
              <Select
                name="libraryFees"
                value={config.accountMappings.libraryFees}
                onChange={handleAccountMappingChange}
                label="Library Fees Account"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {accounts
                  .filter(account => account.AccountType === 'Income')
                  .map(account => (
                    <MenuItem key={account.Id} value={account.Id}>
                      {account.Name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Exam Fees Account</InputLabel>
              <Select
                name="examFees"
                value={config.accountMappings.examFees}
                onChange={handleAccountMappingChange}
                label="Exam Fees Account"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {accounts
                  .filter(account => account.AccountType === 'Income')
                  .map(account => (
                    <MenuItem key={account.Id} value={account.Id}>
                      {account.Name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Transport Fees Account</InputLabel>
              <Select
                name="transportFees"
                value={config.accountMappings.transportFees}
                onChange={handleAccountMappingChange}
                label="Transport Fees Account"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {accounts
                  .filter(account => account.AccountType === 'Income')
                  .map(account => (
                    <MenuItem key={account.Id} value={account.Id}>
                      {account.Name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Uniform Fees Account</InputLabel>
              <Select
                name="uniformFees"
                value={config.accountMappings.uniformFees}
                onChange={handleAccountMappingChange}
                label="Uniform Fees Account"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {accounts
                  .filter(account => account.AccountType === 'Income')
                  .map(account => (
                    <MenuItem key={account.Id} value={account.Id}>
                      {account.Name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Other Fees Account</InputLabel>
              <Select
                name="otherFees"
                value={config.accountMappings.otherFees}
                onChange={handleAccountMappingChange}
                label="Other Fees Account"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {accounts
                  .filter(account => account.AccountType === 'Income')
                  .map(account => (
                    <MenuItem key={account.Id} value={account.Id}>
                      {account.Name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Payment Accounts */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Payment Accounts
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Cash Account</InputLabel>
              <Select
                name="cashAccount"
                value={config.accountMappings.cashAccount}
                onChange={handleAccountMappingChange}
                label="Cash Account"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {accounts
                  .filter(account => ['Bank', 'Other Current Asset'].includes(account.AccountType))
                  .map(account => (
                    <MenuItem key={account.Id} value={account.Id}>
                      {account.Name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Bank Account</InputLabel>
              <Select
                name="bankAccount"
                value={config.accountMappings.bankAccount}
                onChange={handleAccountMappingChange}
                label="Bank Account"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {accounts
                  .filter(account => ['Bank', 'Other Current Asset'].includes(account.AccountType))
                  .map(account => (
                    <MenuItem key={account.Id} value={account.Id}>
                      {account.Name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Mobile Money Account</InputLabel>
              <Select
                name="mobileMoney"
                value={config.accountMappings.mobileMoney}
                onChange={handleAccountMappingChange}
                label="Mobile Money Account"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {accounts
                  .filter(account => ['Bank', 'Other Current Asset'].includes(account.AccountType))
                  .map(account => (
                    <MenuItem key={account.Id} value={account.Id}>
                      {account.Name}
                    </MenuItem>
                  ))}
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
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              >
                {saving ? 'Saving...' : 'Save Mappings'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default QuickbooksAccountMapping;
