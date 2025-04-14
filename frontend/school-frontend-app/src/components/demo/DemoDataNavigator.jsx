import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Group as GroupIcon
} from '@mui/icons-material';

/**
 * Demo Data Navigator Component
 *
 * This component provides links to navigate to the demo data using the existing components.
 * It doesn't create new UI components for the demo data, but rather helps users access
 * the demo data through the existing system components.
 */
const DemoDataNavigator = () => {
  const navigate = useNavigate();
  const [demoInfo, setDemoInfo] = useState({
    classId: 'CLS001',
    examId: 'EXAM001',
    students: [
      { id: 'STU001', name: 'James Mwakasege', combination: 'PCM' },
      { id: 'STU002', name: 'Maria Kimaro', combination: 'PCB' },
      { id: 'STU003', name: 'Emmanuel Shirima', combination: 'HGE' },
      { id: 'STU004', name: 'Grace Mushi', combination: 'HKL' },
      { id: 'STU005', name: 'Daniel Mwasonga', combination: 'EGM' }
    ]
  });

  // Navigate to Form 5 class report
  const navigateToClassReport = () => {
    navigate(`/results/a-level/form5/class/${demoInfo.classId}/${demoInfo.examId}`);
  };

  // Navigate to special class report page
  const navigateToSpecialClassReport = () => {
    navigate('/results/class-report/demo-class/demo-exam');
  };

  // Navigate to Form 5 student report
  const navigateToStudentReport = (studentId) => {
    navigate(`/results/a-level/form5/student/${studentId}/${demoInfo.examId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Form 5 A-Level Demo Data Navigator
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Demo Data Information</AlertTitle>
        This page helps you navigate to the demo data using the existing system components.
        The demo data includes a Form 5 class with 10 students across different subject combinations.
        You can view the class report or individual student reports.
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Class Information
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Class:</strong> Form 5 Science
            </Typography>
            <Typography variant="body1">
              <strong>Academic Year:</strong> 2023-2024
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Exam:</strong> Mid-Term Examination
            </Typography>
            <Typography variant="body1">
              <strong>Exam Date:</strong> 2023-10-15 to 2023-10-25
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AssessmentIcon />}
            onClick={navigateToClassReport}
            sx={{ mt: 2 }}
          >
            View Form 5 Class Report
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AssessmentIcon />}
            onClick={navigateToSpecialClassReport}
            sx={{ mt: 2 }}
          >
            View Special Class Report
          </Button>
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom>
        <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Student Reports
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {demoInfo.students.map((student) => (
          <Grid item xs={12} sm={6} md={4} key={student.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {student.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>ID:</strong> {student.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Combination:</strong> {student.combination}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<PersonIcon />}
                  onClick={() => navigateToStudentReport(student.id)}
                >
                  View Student Report
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DemoDataNavigator;
