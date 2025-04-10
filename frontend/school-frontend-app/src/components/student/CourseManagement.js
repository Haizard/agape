import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip } from '@mui/material';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);

  // Temporary mock data - replace with actual API call
  useEffect(() => {
    const mockCourses = [
      { id: 1, name: 'Mathematics', teacher: 'Mr. Smith', schedule: 'Mon, Wed 9:00 AM', status: 'active' },
      { id: 2, name: 'Physics', teacher: 'Mrs. Johnson', schedule: 'Tue, Thu 10:30 AM', status: 'active' },
      { id: 3, name: 'English', teacher: 'Ms. Davis', schedule: 'Mon, Fri 2:00 PM', status: 'active' },
    ];
    setCourses(mockCourses);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>My Courses</Typography>
      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} md={6} lg={4} key={course.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{course.name}</Typography>
                <Typography color="textSecondary">Teacher: {course.teacher}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>Schedule: {course.schedule}</Typography>
                <Chip 
                  label={course.status} 
                  color="primary" 
                  size="small" 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CourseManagement;