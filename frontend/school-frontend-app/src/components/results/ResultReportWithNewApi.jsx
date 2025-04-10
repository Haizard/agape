import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import resultApi from '../../services/resultApi';
import api from '../../services/api';

const ResultReportWithNewApi = () => {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [educationLevel, setEducationLevel] = useState('O_LEVEL');

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [classesRes, examsRes] = await Promise.all([
          api.get('/api/classes'),
          api.get('/api/exams')
        ]);

        setClasses(classesRes.data);
        setExams(examsRes.data);

        // Default to O_LEVEL
        setEducationLevel('O_LEVEL');
      } catch (err) {
        setError('Failed to load initial data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) return;

      try {
        setLoading(true);
        const response = await api.get(`/api/students?class=${selectedClass}`);
        setStudents(response.data);

        // Get the education level from the selected class
        const classResponse = await api.get(`/api/classes/${selectedClass}`);
        if (classResponse.data && classResponse.data.educationLevel) {
          setEducationLevel(classResponse.data.educationLevel);
        }
      } catch (err) {
        setError('Failed to load students');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass]);

  // Generate student report
  const handleGenerateStudentReport = () => {
    if (!selectedStudent || !selectedExam) {
      setError('Please select a student and an exam');
      return;
    }

    // Use the appropriate API based on education level
    let reportUrl;
    if (educationLevel === 'A_LEVEL') {
      reportUrl = resultApi.getALevelStudentReportUrl(selectedStudent, selectedExam);
    } else {
      reportUrl = resultApi.getOLevelStudentReportUrl(selectedStudent, selectedExam);
    }

    // Open the report in a new tab
    window.open(reportUrl, '_blank');
  };

  // Generate class report
  const handleGenerateClassReport = () => {
    if (!selectedClass || !selectedExam) {
      setError('Please select a class and an exam');
      return;
    }

    // Use the appropriate API based on education level
    let reportUrl;
    if (educationLevel === 'A_LEVEL') {
      reportUrl = resultApi.getALevelClassReportUrl(selectedClass, selectedExam);
    } else {
      reportUrl = resultApi.getOLevelClassReportUrl(selectedClass, selectedExam);
    }

    // Open the report in a new tab
    window.open(reportUrl, '_blank');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Result Reports (Using New API)
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Student Result Report
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Class</InputLabel>
                    <Select
                      value={selectedClass}
                      onChange={(e) => {
                        setSelectedClass(e.target.value);
                        setSelectedStudent('');
                      }}
                      label="Class"
                    >
                      <MenuItem value="">Select Class</MenuItem>
                      {classes.map(cls => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name} {cls.section || ''} {cls.stream || ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth disabled={!selectedClass}>
                    <InputLabel>Student</InputLabel>
                    <Select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      label="Student"
                    >
                      <MenuItem value="">Select Student</MenuItem>
                      {students.map(student => (
                        <MenuItem key={student._id} value={student._id}>
                          {student.firstName} {student.lastName} ({student.rollNumber || 'No Roll'})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Exam</InputLabel>
                    <Select
                      value={selectedExam}
                      onChange={(e) => setSelectedExam(e.target.value)}
                      label="Exam"
                    >
                      <MenuItem value="">Select Exam</MenuItem>
                      {exams.map(exam => (
                        <MenuItem key={exam._id} value={exam._id}>
                          {exam.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={handleGenerateStudentReport}
                  disabled={!selectedStudent || !selectedExam || loading}
                >
                  Generate Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Class Result Report
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Class</InputLabel>
                    <Select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      label="Class"
                    >
                      <MenuItem value="">Select Class</MenuItem>
                      {classes.map(cls => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name} {cls.section || ''} {cls.stream || ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Exam</InputLabel>
                    <Select
                      value={selectedExam}
                      onChange={(e) => setSelectedExam(e.target.value)}
                      label="Exam"
                    >
                      <MenuItem value="">Select Exam</MenuItem>
                      {exams.map(exam => (
                        <MenuItem key={exam._id} value={exam._id}>
                          {exam.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PrintIcon />}
                  onClick={handleGenerateClassReport}
                  disabled={!selectedClass || !selectedExam || loading}
                >
                  Generate Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResultReportWithNewApi;
