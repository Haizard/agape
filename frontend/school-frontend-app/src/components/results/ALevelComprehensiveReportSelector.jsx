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
  Divider
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Filter5 as Filter5Icon,
  Filter6 as Filter6Icon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import axios from 'axios';

/**
 * A-Level Comprehensive Report Selector Component
 * Allows users to select a student and exam to view a comprehensive A-Level report
 */
const ALevelComprehensiveReportSelector = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedForm, setSelectedForm] = useState('');

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (!token) {
      setError('You need to be logged in to access this page. Please log in and try again.');
    }
  }, []);

  // Fetch classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError(null);

        // Only fetch A-Level classes (Form 5 and Form 6)
        const response = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/classes?educationLevel=A_LEVEL`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });
        setClasses(response.data);
      } catch (err) {
        console.error('Error fetching classes:', err);
        const errorMessage = err.response?.status === 403
          ? 'You do not have permission to access classes. Please check your login status.'
          : 'Failed to load classes. Please try again.';
        setError(errorMessage);
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

        const response = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/exams?class=${selectedClass}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });
        setExams(response.data);
      } catch (err) {
        console.error('Error fetching exams:', err);
        const errorMessage = err.response?.status === 403
          ? 'You do not have permission to access exams. Please check your login status.'
          : 'Failed to load exams. Please try again.';
        setError(errorMessage);
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

        const response = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/students?class=${selectedClass}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });

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
        const errorMessage = err.response?.status === 403
          ? 'You do not have permission to access students. Please check your login status.'
          : 'Failed to load students. Please try again.';
        setError(errorMessage);
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

  // Generate report
  const handleGenerateReport = () => {
    if (!selectedStudent || !selectedExam) {
      setError('Please select a student and an exam');
      return;
    }

    console.log(`Navigating to report for student ${selectedStudent} and exam ${selectedExam}`);
    // Navigate to the report page
    navigate(`/results/a-level-comprehensive/${selectedStudent}/${selectedExam}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        A-Level Comprehensive Report
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          !isLoggedIn && (
            <Button color="inherit" size="small" onClick={() => navigate('/login')}>
              Login
            </Button>
          )
        }>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ opacity: isLoggedIn ? 1 : 0.7 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5', borderTop: '4px solid #1976d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Filter5Icon sx={{ mr: 1, color: '#1976d2' }} />
                <Typography variant="h6" gutterBottom>
                  Form 5 Report
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Comprehensive academic report for Form 5 students showing both Principal and Subsidiary subjects with all performance metrics.
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
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5', borderTop: '4px solid #2e7d32' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Filter6Icon sx={{ mr: 1, color: '#2e7d32' }} />
                <Typography variant="h6" gutterBottom>
                  Form 6 Report
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Comprehensive academic report for Form 6 students showing both Principal and Subsidiary subjects with all performance metrics.
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
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5', borderTop: '4px solid #9c27b0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FilterListIcon sx={{ mr: 1, color: '#9c27b0' }} />
                <Typography variant="h6" gutterBottom>
                  All A-Level Forms
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                View reports for any A-Level student (Form 5 or Form 6) by selecting from all available students.
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

      <Paper sx={{ p: 3, mt: 3, opacity: isLoggedIn ? 1 : 0.7 }}>
        <Typography variant="h6" gutterBottom>
          Select Report Parameters
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
                disabled={loading || !isLoggedIn}
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
                disabled={!selectedClass || loading || !isLoggedIn}
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
                disabled={!selectedClass || loading || !isLoggedIn}
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
              onClick={handleGenerateReport}
              disabled={!selectedStudent || !selectedExam || loading || !isLoggedIn}
              startIcon={loading ? <CircularProgress size={20} /> : <AssignmentIcon />}
              sx={{ height: '100%' }}
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Demo Data Section */}
      <Paper sx={{ p: 3, mt: 3, opacity: isLoggedIn ? 1 : 0.7 }}>
        <Typography variant="h6" gutterBottom>
          Demo Reports
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Typography variant="body2" paragraph>
          If you don't have actual data, you can view sample reports for demonstration purposes:
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Form 5 Sample Report
                </Typography>
                <Typography variant="body2" paragraph>
                  View a sample comprehensive report for a Form 5 student with both Principal and Subsidiary subjects.
                </Typography>
                <Button
                  variant="contained"
                  disabled={!isLoggedIn}
                  onClick={() => {
                    console.log('Navigating to Form 5 demo report');
                    navigate('/results/a-level-comprehensive/demo-form5/demo-exam');
                  }}
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
                  Form 6 Sample Report
                </Typography>
                <Typography variant="body2" paragraph>
                  View a sample comprehensive report for a Form 6 student with both Principal and Subsidiary subjects.
                </Typography>
                <Button
                  variant="contained"
                  disabled={!isLoggedIn}
                  onClick={() => {
                    console.log('Navigating to Form 6 demo report');
                    navigate('/results/a-level-comprehensive/demo-form6/demo-exam');
                  }}
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

export default ALevelComprehensiveReportSelector;
