import React from 'react';
import { Box, Typography, Paper, Grid, Switch, FormControlLabel, Button, Divider } from '@mui/material';

/**
 * Settings Component
 * 
 * Application settings and preferences
 */
const Settings = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          General Settings
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable offline mode"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Auto-sync when online"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch />}
              label="Dark mode"
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Report Settings
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Include school logo in reports"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Include signature lines"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Include fee information"
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Management
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" color="primary" sx={{ mr: 2 }}>
            Export All Data
          </Button>
          
          <Button variant="outlined" color="secondary">
            Clear Offline Data
          </Button>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box>
          <Button variant="contained" color="primary">
            Save Settings
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
