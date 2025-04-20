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
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { getReportUrlByEducationLevel, getClassReportUrlByEducationLevel } from '../../utils/educationLevelUtils';

/**
 * Result Report Selector Component
 * Allows users to select between A-Level and O-Level result reports
 */
const ResultReportSelector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get query parameters from URL
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  const educationLevelParam = queryParams.get('educationLevel');

  const [tabValue, setTabValue] = useState(tabParam ? parseInt(tabParam) : 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState(['Term 1', 'Term 2', 'Term 3']);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [educationLevel, setEducationLevel] = useState(educationLevelParam || 'O_LEVEL');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch academic years
        const yearsResponse = await api.get('/api/academic-years');
        setAcademicYears(yearsResponse.data);
        console.log('Academic Years fetched:', yearsResponse.data);
        // Set the current academic year if available
        const currentYear = yearsResponse.data.find(year => year.isCurrent);
        if (currentYear) {
          setSelectedAcademicYear(currentYear._id);
        }

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

    // Update URL with the new tab value
    const newParams = new URLSearchParams(location.search);
    newParams.set('tab', newValue.toString());
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
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
    const newEducationLevel = event.target.value;
    setEducationLevel(newEducationLevel);

    // Update URL with the new education level
    const newParams = new URLSearchParams(location.search);
    newParams.set('educationLevel', newEducationLevel);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  };

  // Generate student report
  const handleGenerateStudentReport = async () => {
    if (!selectedStudent || !selectedExam || !selectedAcademicYear || !selectedTerm) {
      setError('Please select a student, an exam, an academic year, and a term');
      return;
    }

    // Use the education level utility to get the appropriate URL
    const reportUrl = getReportUrlByEducationLevel(
      educationLevel,
      selectedStudent,
      selectedExam
    );

    navigate(`${reportUrl}?academicYear=${selectedAcademicYear}&term=${selectedTerm}`);
  };

  // Generate class report
  const handleGenerateClassReport = () => {
    if (!selectedClass || !selectedExam || !selectedAcademicYear || !selectedTerm) {
      setError('Please select a class, an exam, an academic year, and a term');
      return;
    }

    // Use the education level utility to get the appropriate URL
    const reportUrl = getClassReportUrlByEducationLevel(
      educationLevel,
      selectedClass,
      selectedExam
    );

    navigate(`${reportUrl}?academicYear=${selectedAcademicYear}&term=${selectedTerm}`);
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
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Academic Year</InputLabel>
                  <Select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    label="Academic Year"
                  >
                    <MenuItem value="">Select an academic year</MenuItem>
                    {academicYears.map((year) => (
                      <MenuItem key={year._id} value={year._id}>
                        {year.name} {year.isCurrent && '(Current)'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Term</InputLabel>
                  <Select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    label="Term"
                    disabled={!selectedAcademicYear}
                  >
                    <MenuItem value="">Select a term</MenuItem>
                    {terms.map((term) => (
                      <MenuItem key={term} value={term}>
                        {term}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
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

              <Grid item xs={12} md={3}>
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

              <Grid item xs={12} md={3}>
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

              <Grid item xs={12} md={3}>
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

                {/* Form-Specific A-Level Reports */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: '#f8f0ff', border: '1px solid #9c27b0' }}>
                    <CardContent>
                      <Typography variant="h6" color="secondary" gutterBottom>
                        Form 5 A-Level Report
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate a Form 5 specific A-Level report with:
                      </Typography>
                      <ul>
                        <li>Form 5 students only</li>
                        <li>Subject combination specific results</li>
                        <li>Principal and subsidiary subjects</li>
                        <li>Best 3 principal subjects calculation</li>
                      </ul>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => {
                          if (selectedClass && selectedExam) {
                            navigate(`/results/a-level/class/${selectedClass}/${selectedExam}/form/5`);
                          } else {
                            setError('Please select a class and an exam first');
                          }
                        }}
                        fullWidth
                        sx={{ mt: 1 }}
                      >
                        Generate Form 5 Class Report
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: '#fff0f0', border: '1px solid #f44336' }}>
                    <CardContent>
                      <Typography variant="h6" color="error" gutterBottom>
                        Form 6 A-Level Report
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate a Form 6 specific A-Level report with:
                      </Typography>
                      <ul>
                        <li>Form 6 students only</li>
                        <li>Subject combination specific results</li>
                        <li>Comparison with Form 5 results</li>
                        <li>Final recommendations</li>
                      </ul>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          if (selectedClass && selectedExam) {
                            navigate(`/results/a-level/class/${selectedClass}/${selectedExam}/form/6`);
                          } else {
                            setError('Please select a class and an exam first');
                          }
                        }}
                        fullWidth
                        sx={{ mt: 1 }}
                      >
                        Generate Form 6 Class Report
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                {/* Deprecated report types have been removed */}
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
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Academic Year</InputLabel>
                  <Select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    label="Academic Year"
                  >
                    <MenuItem value="">Select an academic year</MenuItem>
                    {academicYears.map((year) => (
                      <MenuItem key={year._id} value={year._id}>
                        {year.name} {year.isCurrent && '(Current)'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Term</InputLabel>
                  <Select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    label="Term"
                    disabled={!selectedAcademicYear}
                  >
                    <MenuItem value="">Select a term</MenuItem>
                    {terms.map((term) => (
                      <MenuItem key={term} value={term}>
                        {term}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
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

              <Grid item xs={12} md={3}>
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

              <Grid item xs={12} md={3}>
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

              <Grid item xs={12} md={6}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateClassReport}
                  disabled={!selectedClass || !selectedExam || loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <AssignmentIcon />}
                  fullWidth
                >
                  {loading ? 'Loading...' : 'Generate Standard Class Report'}
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    if (selectedClass && selectedExam) {
                      navigate(`/results/o-level/class/${selectedClass}/${selectedExam}`);
                    }
                  }}
                  disabled={!selectedClass || !selectedExam || loading || educationLevel !== 'O_LEVEL'}
                  startIcon={<AssignmentIcon />}
                  fullWidth
                >
                  Generate O-Level Class Report
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => {
                    if (selectedClass && selectedExam) {
                      navigate(`/results/a-level/class/${selectedClass}/${selectedExam}`);
                    }
                  }}
                  disabled={!selectedClass || !selectedExam || loading || educationLevel !== 'A_LEVEL'}
                  startIcon={<AssignmentIcon />}
                  fullWidth
                >
                  Generate A-Level Class Report
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => navigate('/admin/a-level-sample-report')}
                  startIcon={<AssignmentIcon />}
                  fullWidth
                >
                  View A-Level Sample Report (No API Calls)
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() => navigate('/public/a-level-report/67fa6d5df511ccf0cff1f86c/67f608376e2df41bcd957beb')}
                  startIcon={<AssignmentIcon />}
                  fullWidth
                >
                  View Public A-Level Report (No Authentication)
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

                {/* Enhanced O-Level Class Report Card */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: '#e8f5e9', border: '1px solid #4caf50', p: 2, mb: 3, height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" color="success.main" gutterBottom>
                        O-Level Class Report (New!)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Our new enhanced O-Level class report format includes:
                      </Typography>
                      <ul>
                        <li>Clean, modern tabular layout with "OPEN TEST RESULT" header</li>
                        <li>Comprehensive subject summary with GPA calculation</li>
                        <li>Support for missing marks and proper handling of null values</li>
                        <li>Approval section for academic teacher and head of school signatures</li>
                        <li>Export to both PDF and Excel formats</li>
                        <li>Pagination for large classes (25-30 students per page)</li>
                      </ul>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => {
                          if (selectedClass && selectedExam) {
                            navigate(`/results/o-level/class/${selectedClass}/${selectedExam}`);
                          } else {
                            setError('Please select a class and exam first');
                          }
                        }}
                        fullWidth
                        sx={{ mt: 2 }}
                        disabled={educationLevel !== 'O_LEVEL'}
                      >
                        Try O-Level Class Report
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Enhanced A-Level Class Report Card */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: '#f3e5f5', border: '1px solid #9c27b0', p: 2, mb: 3, height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" color="secondary.main" gutterBottom>
                        Enhanced A-Level Class Report (New!)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Our new enhanced A-Level class report format includes:
                      </Typography>
                      <ul>
                        <li>Comprehensive school header with ELCT Northern Diocese</li>
                        <li>Individual student results with dynamic subject combinations</li>
                        <li>Division summary and overall performance metrics</li>
                        <li>Subject-wise performance analysis with grade distribution</li>
                        <li>Export to both PDF and Excel formats</li>
                        <li>Approval section for academic teacher and head signatures</li>
                      </ul>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => {
                          if (selectedClass && selectedExam) {
                            navigate(`/results/a-level/class/${selectedClass}/${selectedExam}`);
                          } else {
                            setError('Please select a class and exam first');
                          }
                        }}
                        fullWidth
                        sx={{ mt: 2 }}
                        disabled={educationLevel !== 'A_LEVEL'}
                      >
                        Try A-Level Class Report
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Form-Specific A-Level Class Reports */}
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: '#f5f5f5', border: '1px solid #9e9e9e', p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Form-Specific A-Level Reports
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ bgcolor: '#f8f0ff', border: '1px solid #9c27b0' }}>
                          <CardContent>
                            <Typography variant="h6" color="secondary" gutterBottom>
                              Form 5 A-Level Class Report
                            </Typography>
                            <Typography variant="body2">
                              Generate a Form 5 specific class report with:
                            </Typography>
                            <ul>
                              <li>Form 5 students only</li>
                              <li>Multiple subject combinations</li>
                              <li>Principal and subsidiary subjects</li>
                              <li>Division distribution</li>
                            </ul>
                            <Button
                              variant="contained"
                              color="secondary"
                              size="small"
                              onClick={() => {
                                if (selectedClass && selectedExam) {
                                  navigate(`/results/a-level/form5/class/${selectedClass}/${selectedExam}`);
                                } else {
                                  setError('Please select a class and an exam first');
                                }
                              }}
                              fullWidth
                              sx={{ mt: 1 }}
                            >
                              Generate Form 5 Report
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ bgcolor: '#fff0f0', border: '1px solid #f44336' }}>
                          <CardContent>
                            <Typography variant="h6" color="error" gutterBottom>
                              Form 6 A-Level Class Report
                            </Typography>
                            <Typography variant="body2">
                              Generate a Form 6 specific class report with:
                            </Typography>
                            <ul>
                              <li>Form 6 students only</li>
                              <li>Multiple subject combinations</li>
                              <li>Comparison with Form 5 results</li>
                              <li>Final recommendations</li>
                            </ul>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => {
                                if (selectedClass && selectedExam) {
                                  navigate(`/results/a-level/form6/class/${selectedClass}/${selectedExam}`);
                                } else {
                                  setError('Please select a class and an exam first');
                                }
                              }}
                              fullWidth
                              sx={{ mt: 1 }}
                            >
                              Generate Form 6 Report
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
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
