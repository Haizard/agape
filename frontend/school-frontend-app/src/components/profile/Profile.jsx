import React from 'react';
import { Box, Typography, Paper, Avatar, Grid, TextField, Button, Divider } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

/**
 * Profile Component
 * 
 * User profile management
 */
const Profile = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ width: 80, height: 80, mr: 2 }}>
            <PersonIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Box>
            <Typography variant="h5">John Doe</Typography>
            <Typography variant="body1" color="textSecondary">Teacher</Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Full Name"
              defaultValue="John Doe"
              fullWidth
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Email"
              defaultValue="john.doe@example.com"
              fullWidth
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Phone"
              defaultValue="+255 123 456 789"
              fullWidth
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Role"
              defaultValue="Teacher"
              fullWidth
              margin="normal"
              disabled
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" color="primary">
            Save Changes
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Change Password
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Current Password"
              type="password"
              fullWidth
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="New Password"
              type="password"
              fullWidth
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              margin="normal"
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" color="primary">
            Update Password
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Profile;
