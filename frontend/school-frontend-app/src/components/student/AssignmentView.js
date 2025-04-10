import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, Button } from '@mui/material';

const AssignmentView = () => {
  const [assignments, setAssignments] = useState([]);

  // Temporary mock data - replace with actual API call
  useEffect(() => {
    const mockAssignments = [
      { 
        id: 1, 
        title: 'Math Assignment 1', 
        subject: 'Mathematics',
        dueDate: '2024-03-20',
        status: 'pending'
      },
      { 
        id: 2, 
        title: 'Physics Lab Report', 
        subject: 'Physics',
        dueDate: '2024-03-25',
        status: 'submitted'
      },
    ];
    setAssignments(mockAssignments);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'success';
      case 'pending': return 'warning';
      case 'late': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>My Assignments</Typography>
      <Grid container spacing={3}>
        {assignments.map((assignment) => (
          <Grid item xs={12} md={6} key={assignment.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{assignment.title}</Typography>
                <Typography color="textSecondary">{assignment.subject}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Due Date: {assignment.dueDate}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={assignment.status} 
                    color={getStatusColor(assignment.status)} 
                    size="small" 
                  />
                  <Button variant="contained" size="small">
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AssignmentView;