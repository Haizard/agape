import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * ALevelClassReportSelector Component
 *
 * A dedicated selector for A-Level class reports
 */
const ALevelClassReportSelector = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [formLevel, setFormLevel] = useState('all');
  const [forceRealData, setForceRealData] = useState(false);

  // Fetch classes and exams on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch A-Level classes
        console.log('Fetching A-Level classes...');
        const classesResponse = await axios.get('/api/classes?educationLevel=A_LEVEL');
        console.log('A-Level classes response:', classesResponse.data);
        setClasses(classesResponse.data);

        // Fetch exams with more specific filtering
        console.log('Fetching A-Level exams...');
        const examsResponse = await axios.get('/api/exams?educationLevel=A_LEVEL');
        console.log('A-Level exams response:', examsResponse.data);

        // Use all exams if no education level filter is available yet
        const filteredExams = examsResponse.data.length > 0 ?
          examsResponse.data :
          // Fallback to filtering client-side if the API doesn't support education level filtering yet
          (await axios.get('/api/exams')).data.filter(exam => {
            return !exam.educationLevel || exam.educationLevel === 'A_LEVEL';
          });

        console.log('Filtered exams for A-Level:', filteredExams);
        setExams(filteredExams);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle class selection
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
  };

  // Handle exam selection
  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
  };

  // Handle form level selection
  const handleFormLevelChange = (event) => {
    setFormLevel(event.target.value);
  };

  // Generate class report
  const handleGenerateReport = () => {
    if (!selectedClass || !selectedExam) {
      setError('Please select a class and an exam');
      return;
    }

    // Build the URL with query parameters
    let url;

    // Navigate to the appropriate report based on form level
    if (formLevel === 'all') {
      // Use the correct path structure
      url = `results/a-level/class/${selectedClass}/${selectedExam}`;
    } else {
      // Use the correct path structure
      url = `results/a-level/class/${selectedClass}/${selectedExam}/form/${formLevel}`;
    }

    // Add forceRefresh parameter if forceRealData is true
    if (forceRealData) {
      url += `?forceRefresh=true&useMock=false&_t=${Date.now()}`;
    }

    // Navigate to the report
    navigate(url);
  };

  return (
    <Paper sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              onChange={handleClassChange}
              label="Class"
              disabled={loading}
            >
              <MenuItem value="">Select a class</MenuItem>
              {classes.map((classItem) => (
                <MenuItem key={classItem._id} value={classItem._id}>
                  {classItem.name} {classItem.section || ''} {classItem.stream || ''}
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
              disabled={loading}
            >
              <MenuItem value="">Select an exam</MenuItem>
              {exams.map((exam) => (
                <MenuItem key={exam._id} value={exam._id}>
                  {exam.name} {exam.term ? `- Term ${exam.term}` : ''} {exam.year ? `(${exam.year})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Form Level</InputLabel>
            <Select
              value={formLevel}
              onChange={handleFormLevelChange}
              label="Form Level"
              disabled={loading}
            >
              <MenuItem value="all">All Forms</MenuItem>
              <MenuItem value="5">Form 5</MenuItem>
              <MenuItem value="6">Form 6</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={forceRealData}
                  onChange={(e) => setForceRealData(e.target.checked)}
                  color="primary"
                />
              }
              label="Force Real Data (Dev Only)"
            />
            <Tooltip title="When enabled, bypasses mock data and forces the system to use real database data">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateReport}
            disabled={!selectedClass || !selectedExam || loading}
            fullWidth
            sx={{ mt: 1 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate A-Level Class Report'}
          </Button>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Quick Access
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={() => navigate('results/a-level/marks-entry')}
          >
            Enter A-Level Marks
          </Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            onClick={() => navigate('results/a-level-comprehensive-selector')}
          >
            A-Level Comprehensive Reports
          </Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="outlined"
            color="info"
            fullWidth
            onClick={() => navigate('results/marks-entry-dashboard')}
          >
            Marks Entry Dashboard
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ALevelClassReportSelector;
