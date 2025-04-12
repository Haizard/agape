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
  Assignment as AssignmentIcon,
  FilterList as FilterIcon
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
        console.log('Exams fetched:', examsResponse.data);

        // Fetch classes
        const classesResponse = await api.get('/api/classes');
        setClasses(classesResponse.data);
        console.log('Classes fetched:', classesResponse.data);

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
        console.log('Students fetched:', response.data);

        // Get the education level from the selected class
        const classResponse = await api.get(`/api/classes/${selectedClass}`);
        console.log('Class details fetched:', classResponse.data);
        if (classResponse.data?.educationLevel) {
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

    // Use the new unified report route for all education levels
    navigate(`/results/student-report/${selectedStudent}/${selectedExam}`);
  };

  // Generate class report
  const handleGenerateClassReport = () => {
    if (!selectedClass || !selectedExam) {
      setError('Please select a class and an exam');
      return;
    }

    // Use the unified class report route for all education levels
    navigate(`/results/class-report/${selectedClass}/${selectedExam}`);
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
                  <Card sx={{ opacity: 0.7 }}>
                    <Box sx={{ position: 'absolute', top: 10, right: 10, bgcolor: '#ffebee', color: '#d32f2f', px: 1, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                      DEPRECATED
                    </Box>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
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
                      <Typography variant="caption" color="error">
                        This report type is being phased out. Please use the Unified Class Tabular Report instead.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => navigate('/results/a-level-comprehensive-selector')}
                        color="secondary"
                        disabled
                      >
                        View Comprehensive Reports
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ opacity: 0.7 }}>
                    <Box sx={{ position: 'absolute', top: 10, right: 10, bgcolor: '#ffebee', color: '#d32f2f', px: 1, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                      DEPRECATED
                    </Box>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
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
                      <Typography variant="caption" color="error">
                        This report type is being phased out. Please use the Unified Class Tabular Report instead.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => navigate('/results/report-book-selector')}
                        color="secondary"
                        disabled
                      >
                        View Report Books
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ opacity: 0.7 }}>
                    <Box sx={{ position: 'absolute', top: 10, right: 10, bgcolor: '#ffebee', color: '#d32f2f', px: 1, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                      DEPRECATED
                    </Box>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
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
                      <Typography variant="caption" color="error">
                        This report type is being phased out. Please use the Unified Class Tabular Report instead.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => navigate('/results/single-row-report/demo-form5/demo-exam')}
                        color="secondary"
                        disabled
                      >
                        View Student Report
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: '#f0f7ff', border: '1px solid #2196f3' }}>
                    <CardContent>
                      <Typography variant="h5" color="primary" gutterBottom fontWeight="bold">
                        Unified Academic Reports System (v2.0)
                      </Typography>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        Our comprehensive unified report system for all A-Level students:
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle1" color="primary" gutterBottom>
                            Class Reports
                          </Typography>
                          <ul>
                            <li>View entire class in one report</li>
                            <li>Filter by form level and combination</li>
                            <li>Compare student performance</li>
                            <li>View division statistics</li>
                          </ul>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => navigate('/results/class-report/demo-class/demo-exam')}
                            color="primary"
                            sx={{ mt: 1 }}
                            fullWidth
                          >
                            View Class Report
                          </Button>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle1" color="primary" gutterBottom>
                            Individual Student Reports
                          </Typography>
                          <ul>
                            <li>Detailed individual student reports</li>
                            <li>Principal and subsidiary subjects</li>
                            <li>Performance metrics and comments</li>
                            <li>Print-friendly format</li>
                          </ul>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => navigate('/results/student-report/demo-form5/demo-exam')}
                            color="primary"
                            sx={{ mt: 1 }}
                            fullWidth
                          >
                            View Student Report
                          </Button>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle1" color="primary" gutterBottom>
                            Bulk Download
                          </Typography>
                          <ul>
                            <li>Download multiple reports at once</li>
                            <li>Filter by year and exam type</li>
                            <li>Select specific students</li>
                            <li>Batch processing for efficiency</li>
                          </ul>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => navigate('/results/bulk-download')}
                            color="primary"
                            sx={{ mt: 1 }}
                            fullWidth
                          >
                            Bulk Download
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                    <CardActions>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => setTabValue(1)}
                        color="primary"
                        startIcon={<FilterIcon />}
                        fullWidth
                      >
                        Generate Reports
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
