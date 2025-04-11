import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Divider
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import axios from 'axios';

/**
 * ReportBookSelector Component
 * Allows users to select a student and exam to view a comprehensive report book
 */
const ReportBookSelector = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedForm, setSelectedForm] = useState('');

  // Fetch classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Only fetch A-Level classes (Form 5 and Form 6)
        const response = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/classes?educationLevel=A_LEVEL`);
        setClasses(response.data);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch exams when a class is selected
  useEffect(() => {
    if (!selectedClass) return;

    const fetchExams = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/exams?class=${selectedClass}`);
        setExams(response.data);
      } catch (err) {
        console.error('Error fetching exams:', err);
        setError('Failed to load exams. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [selectedClass]);

  // Fetch students when a class is selected
  useEffect(() => {
    if (!selectedClass) return;

    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/students?class=${selectedClass}`);
        
        // Filter students by form if selected
        let filteredStudents = response.data;
        if (selectedForm) {
          const formNumber = selectedForm === 'Form 5' ? 5 : 6;
          filteredStudents = response.data.filter(student => 
            student.form === formNumber || 
            student.form === formNumber.toString() ||
            student.form === selectedForm
          );
        }
        
        setStudents(filteredStudents);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, selectedForm]);

  // Handle form selection
  const handleFormChange = (event) => {
    setSelectedForm(event.target.value);
    setSelectedStudent(''); // Reset student selection
  };

  // Handle class selection
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
    setSelectedExam(''); // Reset exam selection
    setSelectedStudent(''); // Reset student selection
  };

  // Handle exam selection
  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
  };

  // Handle student selection
  const handleStudentChange = (event) => {
    setSelectedStudent(event.target.value);
  };

  // Generate report book
  const handleGenerateReportBook = () => {
    if (!selectedStudent || !selectedExam) {
      setError('Please select a student and an exam');
      return;
    }

    // Navigate to the report book page
    navigate(`/results/report-book/${selectedStudent}/${selectedExam}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Academic Report Book
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              height="140"
              image="/images/form5.jpg"
              alt="Form 5"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x140?text=Form+5';
              }}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Form 5 Report Book
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Comprehensive academic report book for Form 5 students showing academic results, character assessment, attendance, and teacher comments.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setSelectedForm('Form 5')}
                color={selectedForm === 'Form 5' ? 'primary' : 'inherit'}
              >
                Select Form 5
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              height="140"
              image="/images/form6.jpg"
              alt="Form 6"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x140?text=Form+6';
              }}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Form 6 Report Book
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Comprehensive academic report book for Form 6 students showing academic results, character assessment, attendance, and teacher comments.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setSelectedForm('Form 6')}
                color={selectedForm === 'Form 6' ? 'primary' : 'inherit'}
              >
                Select Form 6
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              height="140"
              image="/images/all-forms.jpg"
              alt="All Forms"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x140?text=All+Forms';
              }}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                All A-Level Forms
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                View report books for any A-Level student (Form 5 or Form 6) by selecting from all available students.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setSelectedForm('')}
                color={selectedForm === '' ? 'primary' : 'inherit'}
              >
                Select All Forms
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Report Book Parameters
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={handleClassChange}
                label="Class"
                disabled={loading}
              >
                <MenuItem value="">Select a class</MenuItem>
                {classes.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name} {cls.section || ''} {cls.stream || ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Exam</InputLabel>
              <Select
                value={selectedExam}
                onChange={handleExamChange}
                label="Exam"
                disabled={!selectedClass || loading}
              >
                <MenuItem value="">Select an exam</MenuItem>
                {exams.map((exam) => (
                  <MenuItem key={exam._id} value={exam._id}>
                    {exam.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Student</InputLabel>
              <Select
                value={selectedStudent}
                onChange={handleStudentChange}
                label="Student"
                disabled={!selectedClass || loading}
              >
                <MenuItem value="">Select a student</MenuItem>
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.firstName} {student.lastName} ({student.rollNumber || 'No Roll Number'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleGenerateReportBook}
              disabled={!selectedStudent || !selectedExam || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AssignmentIcon />}
              sx={{ height: '100%' }}
            >
              {loading ? 'Loading...' : 'Generate Report Book'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Demo Report Books Section */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Demo Report Books
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="body2" paragraph>
          If you don't have actual data, you can view sample report books for demonstration purposes:
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Form 5 Sample Report Book
                </Typography>
                <Typography variant="body2" paragraph>
                  View a sample comprehensive report book for a Form 5 student with academic results, character assessment, attendance, and teacher comments.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/results/report-book/demo-form5/demo-exam')}
                  fullWidth
                >
                  View Form 5 Demo
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Form 6 Sample Report Book
                </Typography>
                <Typography variant="body2" paragraph>
                  View a sample comprehensive report book for a Form 6 student with academic results, character assessment, attendance, and teacher comments.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/results/report-book/demo-form6/demo-exam')}
                  fullWidth
                >
                  View Form 6 Demo
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ReportBookSelector;
