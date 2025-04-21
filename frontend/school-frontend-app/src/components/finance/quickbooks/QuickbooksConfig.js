import React from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import { Save } from '@mui/icons-material';

/**
 * QuickbooksConfig component
 * 
 * This component handles the configuration settings for QuickBooks integration.
 */
const QuickbooksConfig = ({ 
  config, 
  handleInputChange, 
  handleSaveConfig, 
  saving 
}) => {
  return (
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveConfig}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default QuickbooksConfig;
