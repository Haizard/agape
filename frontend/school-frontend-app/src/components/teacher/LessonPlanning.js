import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions
} from '@mui/material';

const LessonPlanning = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [objectives, setObjectives] = useState('');
  const [materials, setMaterials] = useState('');
  const [activities, setActivities] = useState('');
  const [assessment, setAssessment] = useState('');

  // Dummy data - replace with actual API calls
  const classes = ['Class A', 'Class B', 'Class C'];
  const subjects = ['Mathematics', 'Science', 'English'];
  const lessonPlans = [
    {
      id: 1,
      title: 'Introduction to Algebra',
      class: 'Class A',
      subject: 'Mathematics',
      date: '2024-03-15',
      objectives: 'Understanding basic algebraic concepts'
    },
    // Add more lesson plans
  ];

  const handleSubmit = () => {
    // Implement submit logic
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Lesson Planning
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Create New Lesson Plan
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                label="Class"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                label="Subject"
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Lesson Title"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Learning Objectives"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Materials Needed"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Learning Activities"
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Assessment Methods"
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Save Lesson Plan
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Existing Lesson Plans
      </Typography>
      <Grid container spacing={2}>
        {lessonPlans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{plan.title}</Typography>
                <Typography color="textSecondary">
                  {plan.class} - {plan.subject}
                </Typography>
                <Typography variant="body2">
                  Date: {plan.date}
                </Typography>
                <Typography variant="body2">
                  Objectives: {plan.objectives}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small">View Details</Button>
                <Button size="small">Edit</Button>
                <Button size="small" color="error">Delete</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LessonPlanning;