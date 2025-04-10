import React from 'react';
import { Box, Typography, Paper, Button, TextField, Grid, Card, CardContent, Divider } from '@mui/material';
import { Phone as PhoneIcon, Email as EmailIcon, ContactMail as ContactMailIcon } from '@mui/icons-material';

const ParentContactManagement = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Parent Contact Management
      </Typography>
      <Typography variant="body1" paragraph>
        Manage parent contact information for communication and notifications.
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Search Parents
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search by Name"
              variant="outlined"
              placeholder="Enter parent name"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search by Student"
              variant="outlined"
              placeholder="Enter student name"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button 
              variant="contained" 
              color="primary"
              fullWidth
              sx={{ height: '56px' }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        Sample Parent Contacts
      </Typography>
      
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  Parent {item}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">
                    +255 7XX XXX XXX
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">
                    parent{item}@example.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ContactMailIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">
                    Student: Student Name {item}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ParentContactManagement;
