import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api, { constructApiUrl } from '../../utils/api';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Paper,
  Alert,
  AlertTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  History as HistoryIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { API_URL } from '../../config/index';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Marks History Dashboard Component
 * Provides navigation to different marks history views
 */
const MarksHistoryDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  // State variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [resultId, setResultId] = useState('');
  const [resultModel, setResultModel] = useState('OLevelResult');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch students
        const studentsEndpoint = constructApiUrl('/students');
        console.log(`Fetching students from: ${studentsEndpoint}`);
        const studentsResponse = await api.get(studentsEndpoint);

        // Fetch subjects
        const subjectsEndpoint = constructApiUrl('/subjects');
        console.log(`Fetching subjects from: ${subjectsEndpoint}`);
        const subjectsResponse = await api.get(subjectsEndpoint);

        // Fetch exams
        const examsEndpoint = constructApiUrl('/exams');
        console.log(`Fetching exams from: ${examsEndpoint}`);
        const examsResponse = await api.get(examsEndpoint);

        setStudents(studentsResponse.data || []);
        setSubjects(subjectsResponse.data || []);
        setExams(examsResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle student change
  const handleStudentChange = (event) => {
    setSelectedStudent(event.target.value);
  };

  // Handle subject change
  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
  };

  // Handle exam change
  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
  };

  // Handle result ID change
  const handleResultIdChange = (event) => {
    setResultId(event.target.value);
  };

  // Handle result model change
  const handleResultModelChange = (event) => {
    setResultModel(event.target.value);
  };

  // View student history
  const viewStudentHistory = () => {
    if (selectedStudent) {
      console.log(`Navigating to student history: ${selectedStudent}`);
      navigate(`/marks-history/student/${selectedStudent}`);
    }
  };

  // View subject history
  const viewSubjectHistory = () => {
    if (selectedSubject) {
      console.log(`Navigating to subject history: ${selectedSubject}`);
      navigate(`/marks-history/subject/${selectedSubject}`);
    }
  };

  // View exam history
  const viewExamHistory = () => {
    if (selectedExam) {
      console.log(`Navigating to exam history: ${selectedExam}`);
      navigate(`/marks-history/exam/${selectedExam}`);
    }
  };

  // View result history
  const viewResultHistory = () => {
    if (resultId && resultModel) {
      console.log(`Navigating to result history: ${resultId} (${resultModel})`);
      navigate(`/marks-history/result/${resultId}?model=${resultModel}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Marks History Dashboard
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Track Changes to Student Marks</AlertTitle>
        View the history of marks changes for students, subjects, exams, or specific results. Select an option below to get started.
      </Alert>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Student History Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Student History</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={selectedStudent}
                  onChange={handleStudentChange}
                  label="Select Student"
                >
                  {Array.isArray(students) && students.map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.firstName} {student.lastName} ({student.rollNumber})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<HistoryIcon />}
                onClick={viewStudentHistory}
                disabled={!selectedStudent}
                fullWidth
              >
                View Student History
              </Button>
            </Paper>
          </Grid>

          {/* Subject History Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BookIcon sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">Subject History</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Subject</InputLabel>
                <Select
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  label="Select Subject"
                >
                  {Array.isArray(subjects) && subjects.map((subject) => (
                    <MenuItem key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<HistoryIcon />}
                onClick={viewSubjectHistory}
                disabled={!selectedSubject}
                fullWidth
              >
                View Subject History
              </Button>
            </Paper>
          </Grid>

          {/* Exam History Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Exam History</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Exam</InputLabel>
                <Select
                  value={selectedExam}
                  onChange={handleExamChange}
                  label="Select Exam"
                >
                  {Array.isArray(exams) && exams.map((exam) => (
                    <MenuItem key={exam._id} value={exam._id}>
                      {exam.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="success"
                startIcon={<HistoryIcon />}
                onClick={viewExamHistory}
                disabled={!selectedExam}
                fullWidth
              >
                View Exam History
              </Button>
            </Paper>
          </Grid>

          {/* Result History Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SearchIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Result History</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Result ID"
                    value={resultId}
                    onChange={handleResultIdChange}
                    fullWidth
                    placeholder="Enter result ID"
                    helperText="Enter the ID of the specific result you want to view"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Result Type</InputLabel>
                    <Select
                      value={resultModel}
                      onChange={handleResultModelChange}
                      label="Result Type"
                    >
                      <MenuItem value="OLevelResult">O-Level Result</MenuItem>
                      <MenuItem value="ALevelResult">A-Level Result</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<HistoryIcon />}
                  onClick={viewResultHistory}
                  disabled={!resultId}
                  fullWidth
                >
                  View Result History
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Back to Marks Entry */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/results/marks-entry-dashboard')}
              >
                Back to Marks Entry Dashboard
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default MarksHistoryDashboard;
