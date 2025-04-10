import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Paper, Typography, Grid } from '@mui/material';

const UserProfile = () => {
  const { user } = useSelector((state) => state.user);

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>User Profile</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography><strong>Name:</strong> {user?.name}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography><strong>Email:</strong> {user?.email}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography><strong>Role:</strong> {user?.role}</Typography>
          </Grid>
          {/* Add more user details as needed */}
        </Grid>
      </Paper>
    </Box>
  );
};

export default UserProfile;