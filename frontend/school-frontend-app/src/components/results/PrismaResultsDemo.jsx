import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  Divider
} from '@mui/material';
import { 
  School as SchoolIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

/**
 * PrismaResultsDemo component
 * Demonstrates the Prisma backend integration for results
 */
const PrismaResultsDemo = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [error, setError] = useState(null);

  // Sample data for demonstration
  const classes = [
    { id: 'class1', name: 'Form 1A' },
    { id: 'class2', name: 'Form 2B' },
    { id: 'class3', name: 'Form 3C' },
    { id: 'class4', name: 'Form 4D' }
  ];

  const exams = [
    { id: 'exam1', name: 'Mid-Term Exam 2023' },
    { id: 'exam2', name: 'Final Exam 2023' },
    { id: 'exam3', name: 'Mock Exam 2023' }
  ];

  const students = [
    { id: 'student1', name: 'John Doe', classId: 'class1' },
    { id: 'student2', name: 'Jane Smith', classId: 'class1' },
    { id: 'student3', name: 'Michael Johnson', classId: 'class2' },
    { id: 'student4', name: 'Emily Davis', classId: 'class2' },
    { id: 'student5', name: 'Robert Wilson', classId: 'class3' },
    { id: 'student6', name: 'Sarah Brown', classId: 'class3' },
    { id: 'student7', name: 'David Miller', classId: 'class4' },
    { id: 'student8', name: 'Lisa Taylor', classId: 'class4' }
  ];

  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
    setSelectedStudent(''); // Reset student when class changes
  };

  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
  };

  const handleStudentChange = (event) => {
    setSelectedStudent(event.target.value);
  };

  const handleViewClassResults = () => {
    if (!selectedClass || !selectedExam) {
      setError('Please select both a class and an exam');
      return;
    }
    
    setError(null);
    navigate(`/results/prisma/class/${selectedClass}/${selectedExam}`);
  };

  const handleViewStudentResults = () => {
    if (!selectedStudent || !selectedExam) {
      setError('Please select both a student and an exam');
      return;
    }
    
    setError(null);
    navigate(`/results/prisma/student/${selectedStudent}/${selectedExam}`);
  };

  // Filter students based on selected class
  const filteredStudents = selectedClass 
    ? students.filter(student => student.classId === selectedClass)
    : [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Prisma Results Integration Demo
      </Typography>
      
      <Typography variant="body1" paragraph>
        This page demonstrates the integration of the Prisma backend for results management.
        You can view both class results and individual student results using the Prisma API.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Class Results
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="class-select-label">Class</InputLabel>
                <Select
                  labelId="class-select-label"
                  id="class-select"
                  value={selectedClass}
                  label="Class"
                  onChange={handleClassChange}
                >
                  {classes.map(cls => (
                    <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="exam-select-label-class">Exam</InputLabel>
                <Select
                  labelId="exam-select-label-class"
                  id="exam-select-class"
                  value={selectedExam}
                  label="Exam"
                  onChange={handleExamChange}
                >
                  {exams.map(exam => (
                    <MenuItem key={exam.id} value={exam.id}>{exam.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                onClick={handleViewClassResults}
                disabled={!selectedClass || !selectedExam}
                startIcon={<AssessmentIcon />}
              >
                View Class Results
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Student Results
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="class-select-label-student">Class</InputLabel>
                <Select
                  labelId="class-select-label-student"
                  id="class-select-student"
                  value={selectedClass}
                  label="Class"
                  onChange={handleClassChange}
                >
                  {classes.map(cls => (
                    <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="student-select-label">Student</InputLabel>
                <Select
                  labelId="student-select-label"
                  id="student-select"
                  value={selectedStudent}
                  label="Student"
                  onChange={handleStudentChange}
                  disabled={!selectedClass}
                >
                  {filteredStudents.map(student => (
                    <MenuItem key={student.id} value={student.id}>{student.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="exam-select-label-student">Exam</InputLabel>
                <Select
                  labelId="exam-select-label-student"
                  id="exam-select-student"
                  value={selectedExam}
                  label="Exam"
                  onChange={handleExamChange}
                >
                  {exams.map(exam => (
                    <MenuItem key={exam.id} value={exam.id}>{exam.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                color="secondary" 
                fullWidth
                onClick={handleViewStudentResults}
                disabled={!selectedStudent || !selectedExam}
                startIcon={<PersonIcon />}
              >
                View Student Results
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Alert severity="info">
          <Typography variant="subtitle1">
            About Prisma Integration
          </Typography>
          <Typography variant="body2">
            This demo uses the Prisma backend to fetch results data. The Prisma backend provides improved performance, 
            better data validation, and enhanced features like core subject validation for O-Level division calculation.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default PrismaResultsDemo;
