import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

/**
 * Result Report Selector Component
 * Allows users to select between A-Level and O-Level result reports
 */
const ResultReportSelector = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [educationLevel, setEducationLevel] = useState('O_LEVEL');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch exams
        const examsResponse = await api.get('/api/exams');
        setExams(examsResponse.data);

        // Fetch classes
        const classesResponse = await api.get('/api/classes');
        setClasses(classesResponse.data);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) {
        setStudents([]);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Fetch students for the selected class
        const response = await api.get(`/api/students/class/${selectedClass}`);
        setStudents(response.data);

        // Get the education level from the selected class
        const classResponse = await api.get(`/api/classes/${selectedClass}`);
        if (classResponse.data && classResponse.data.educationLevel) {
          setEducationLevel(classResponse.data.educationLevel);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students. Please try again.');
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass]);

  // Handle tab change
  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  // Handle student selection
  const handleStudentChange = (event) => {
    setSelectedStudent(event.target.value);
  };

  // Handle class selection
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
    setSelectedStudent(''); // Reset student selection when class changes
  };

  // Handle exam selection
  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
  };

  // Handle education level selection
  const handleEducationLevelChange = (event) => {
    setEducationLevel(event.target.value);
  };

  // Generate student report
  const handleGenerateStudentReport = async () => {
    if (!selectedStudent || !selectedExam) {
      setError('Please select a student and an exam');
      return;
    }

    // Navigate to the appropriate report page based on education level
    if (educationLevel === 'A_LEVEL') {
      try {
        // Get student details to determine form level
        const response = await api.get(`/api/students/${selectedStudent}`);
        const student = response.data;

        // Check if form level is available
        if (student.form) {
          if (student.form === 5) {
            navigate(`/results/a-level/form5/student/${selectedStudent}/${selectedExam}`);
          } else if (student.form === 6) {
            navigate(`/results/a-level/form6/student/${selectedStudent}/${selectedExam}`);
          } else {
            // Default to regular A-level report if form is not 5 or 6
            navigate(`/results/a-level/student/${selectedStudent}/${selectedExam}`);
          }
        } else {
          // If form level is not available, check class name
          if (student.class && typeof student.class === 'object') {
            const className = student.class.name || '';
            if (className.includes('5') || className.toLowerCase().includes('form 5')) {
              navigate(`/results/a-level/form5/student/${selectedStudent}/${selectedExam}`);
            } else if (className.includes('6') || className.toLowerCase().includes('form 6')) {
              navigate(`/results/a-level/form6/student/${selectedStudent}/${selectedExam}`);
            } else {
              // Default to regular A-level report
              navigate(`/results/a-level/student/${selectedStudent}/${selectedExam}`);
            }
          } else {
            // Default to regular A-level report
            navigate(`/results/a-level/student/${selectedStudent}/${selectedExam}`);
          }
        }
      } catch (error) {
        console.error('Error fetching student details:', error);
        // Default to regular A-level report in case of error
        navigate(`/results/a-level/student/${selectedStudent}/${selectedExam}`);
      }
    } else {
      // For O-Level, use the dedicated O-level route
      navigate(`/results/o-level/student/${selectedStudent}/${selectedExam}`);
    }
  };

  // Generate class report
  const handleGenerateClassReport = () => {
    if (!selectedClass || !selectedExam) {
      setError('Please select a class and an exam');
      return;
    }

    // Navigate to the appropriate report page based on education level
    if (educationLevel === 'A_LEVEL') {
      navigate(`/results/a-level/class/${selectedClass}/${selectedExam}`);
    } else {
      // For O-Level, use the dedicated O-level route
      navigate(`/results/o-level/class/${selectedClass}/${selectedExam}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Result Reports
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Student Report" icon={<PersonIcon />} />
          <Tab label="Class Report" icon={<SchoolIcon />} />
        </Tabs>

        {/* Student Report Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Generate Student Result Report
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Education Level</InputLabel>
                  <Select
                    value={educationLevel}
                    onChange={handleEducationLevelChange}
                    label="Education Level"
                  >
                    <MenuItem value="O_LEVEL">O-Level</MenuItem>
                    <MenuItem value="A_LEVEL">A-Level</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={selectedClass}
                    onChange={handleClassChange}
                    label="Class"
                  >
                    <MenuItem value="">Select a class</MenuItem>
                    {classes.map((classItem) => (
                      <MenuItem
                        key={classItem._id}
                        value={classItem._id}
                        disabled={classItem.educationLevel !== educationLevel}
                      >
                        {classItem.name} {classItem.section || ''} {classItem.stream || ''}
                        {classItem.educationLevel !== educationLevel && ' (Wrong Level)'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
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
                        {student.firstName} {student.lastName} ({student.rollNumber})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Exam</InputLabel>
                  <Select
                    value={selectedExam}
                    onChange={handleExamChange}
                    label="Exam"
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

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateStudentReport}
                  disabled={!selectedStudent || !selectedExam || loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <AssignmentIcon />}
                  fullWidth
                >
                  {loading ? 'Loading...' : 'Generate Student Report'}
                </Button>
              </Grid>
            </Grid>

            {/* Report Type Cards */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Report Types
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        O-Level Report
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate an O-Level student result report with:
                      </Typography>
                      <ul>
                        <li>Subject marks and grades</li>
                        <li>Best 7 subjects calculation</li>
                        <li>Division based on O-Level criteria</li>
                        <li>Grade distribution</li>
                      </ul>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => setEducationLevel('O_LEVEL')}
                        color={educationLevel === 'O_LEVEL' ? 'primary' : 'inherit'}
                      >
                        Select O-Level
                      </Button>
                      <Button
                        size="small"
                        onClick={() => navigate('/results/o-level/enter-marks')}
                        color="primary"
                      >
                        Enter O-Level Marks
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="secondary" gutterBottom>
                        A-Level Report
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate an A-Level student result report with:
                      </Typography>
                      <ul>
                        <li>Principal and subsidiary subjects</li>
                        <li>Best 3 principal subjects calculation</li>
                        <li>Division based on A-Level criteria</li>
                        <li>Grade distribution</li>
                      </ul>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => setEducationLevel('A_LEVEL')}
                        color={educationLevel === 'A_LEVEL' ? 'secondary' : 'inherit'}
                      >
                        Select A-Level
                      </Button>
                      <Button
                        size="small"
                        onClick={() => navigate('/results/a-level/enter-marks')}
                        color="primary"
                      >
                        Enter A-Level Marks
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="secondary" gutterBottom>
                        A-Level Comprehensive Report
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate a comprehensive A-Level report with:
                      </Typography>
                      <ul>
                        <li>Both Principal and Subsidiary subjects</li>
                        <li>Form 5 and Form 6 specific formats</li>
                        <li>Empty templates for subjects without results</li>
                        <li>Detailed performance metrics</li>
                      </ul>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => navigate('/results/a-level-comprehensive-selector')}
                        color="secondary"
                      >
                        View Comprehensive Reports
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="secondary" gutterBottom>
                        Academic Report Book
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate a complete academic report book with:
                      </Typography>
                      <ul>
                        <li>Book-style format with multiple pages</li>
                        <li>Academic results for all subjects</li>
                        <li>Character assessment and attendance records</li>
                        <li>Teacher comments and parent signature section</li>
                      </ul>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => navigate('/results/report-book-selector')}
                        color="secondary"
                      >
                        View Report Books
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="secondary" gutterBottom>
                        Tabular Academic Report
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate a single-row tabular report with:
                      </Typography>
                      <ul>
                        <li>All subjects in a single row format</li>
                        <li>Principal and compulsory subjects together</li>
                        <li>Student info, points, and division in header</li>
                        <li>Marks, grades, and points for each subject</li>
                      </ul>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => navigate('/results/single-row-report/demo-form5/demo-exam')}
                        color="secondary"
                      >
                        View Student Report
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="secondary" gutterBottom>
                        Class Tabular Report
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate a comprehensive class report with:
                      </Typography>
                      <ul>
                        <li>All students from different combinations in one view</li>
                        <li>All subjects (principal and compulsory) in columns</li>
                        <li>Marks and grades for each student and subject</li>
                        <li>Division summary and performance statistics</li>
                      </ul>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => navigate('/results/class-report/demo-class/demo-exam')}
                        color="secondary"
                      >
                        View Class Report
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}

        {/* Class Report Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Generate Class Result Report
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Education Level</InputLabel>
                  <Select
                    value={educationLevel}
                    onChange={handleEducationLevelChange}
                    label="Education Level"
                  >
                    <MenuItem value="O_LEVEL">O-Level</MenuItem>
                    <MenuItem value="A_LEVEL">A-Level</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={selectedClass}
                    onChange={handleClassChange}
                    label="Class"
                  >
                    <MenuItem value="">Select a class</MenuItem>
                    {classes.map((classItem) => (
                      <MenuItem
                        key={classItem._id}
                        value={classItem._id}
                        disabled={classItem.educationLevel !== educationLevel}
                      >
                        {classItem.name} {classItem.section || ''} {classItem.stream || ''}
                        {classItem.educationLevel !== educationLevel && ' (Wrong Level)'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Exam</InputLabel>
                  <Select
                    value={selectedExam}
                    onChange={handleExamChange}
                    label="Exam"
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

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateClassReport}
                  disabled={!selectedClass || !selectedExam || loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <AssignmentIcon />}
                  fullWidth
                >
                  {loading ? 'Loading...' : 'Generate Class Report'}
                </Button>
              </Grid>
            </Grid>

            {/* Report Type Cards */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Report Types
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        O-Level Class Report
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate an O-Level class result report with:
                      </Typography>
                      <ul>
                        <li>Complete student list with marks and grades</li>
                        <li>Subject-wise performance analysis</li>
                        <li>Division distribution</li>
                        <li>Class statistics and rankings</li>
                      </ul>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => setEducationLevel('O_LEVEL')}
                        color={educationLevel === 'O_LEVEL' ? 'primary' : 'inherit'}
                      >
                        Select O-Level
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="secondary" gutterBottom>
                        A-Level Class Report
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate an A-Level class result report with:
                      </Typography>
                      <ul>
                        <li>Principal and subsidiary subject analysis</li>
                        <li>A-Level division calculation and distribution</li>
                        <li>Subject-wise performance breakdown</li>
                        <li>Class statistics and rankings</li>
                      </ul>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => setEducationLevel('A_LEVEL')}
                        color={educationLevel === 'A_LEVEL' ? 'secondary' : 'inherit'}
                      >
                        Select A-Level
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ResultReportSelector;
