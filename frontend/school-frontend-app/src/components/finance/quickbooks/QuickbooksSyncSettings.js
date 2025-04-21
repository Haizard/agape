import React from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import { Save } from '@mui/icons-material';

/**
 * QuickbooksSyncSettings component
 * 
 * This component handles the synchronization settings for QuickBooks integration.
 */
const QuickbooksSyncSettings = ({
  config,
  handleSyncSettingChange,
  handleSwitchChange,
  handleSaveConfig,
  saving
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Sync Settings
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
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
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuickbooksSyncSettings;
