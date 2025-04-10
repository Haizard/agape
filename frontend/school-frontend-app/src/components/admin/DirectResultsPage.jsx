import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DirectPdfLink from '../common/DirectPdfLink';

/**
 * A completely new admin results page that focuses on direct PDF downloads
 * This component avoids rendering complex objects directly
 */
const DirectResultsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get('/api/classes');
        // Ensure we're working with an array
        const classesData = Array.isArray(response.data) ? response.data : [];
        setClasses(classesData);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Failed to fetch classes');
      }
    };

    fetchClasses();
  }, []);

  // Fetch exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await axios.get('/api/exams');
        // Ensure we're working with an array
        const examsData = Array.isArray(response.data) ? response.data : [];
        setExams(examsData);
      } catch (error) {
        console.error('Error fetching exams:', error);
        setError('Failed to fetch exams');
      }
    };

    fetchExams();
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/students?class=${selectedClass}`);
        // Ensure we're working with an array
        const studentsData = Array.isArray(response.data) ? response.data : [];
        setStudents(studentsData);
        setError(null);
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Failed to fetch students');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass]);

  // Handle class selection
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
    setSelectedStudent(''); // Reset student selection when class changes
  };

  // Handle exam selection
  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
  };

  // Handle student selection
  const handleStudentChange = (event) => {
    setSelectedStudent(event.target.value);
  };

  // Download functionality is now handled by the DirectPdfDownload component

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Result Reports
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/admin/result-reports')}
        >
          A-Level & O-Level Reports
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof error === 'object' ? JSON.stringify(error) : error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Class Result Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Class Result Report
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={handleClassChange}
                >
                  {classes.map((classItem) => (
                    <MenuItem key={classItem._id} value={classItem._id}>
                      {classItem.name ? String(classItem.name) : String(classItem._id)}
                      {classItem.section ? ` - ${String(classItem.section)}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Exam</InputLabel>
                <Select
                  value={selectedExam}
                  onChange={handleExamChange}
                >
                  {exams.map((exam) => (
                    <MenuItem key={exam._id} value={exam._id}>
                      {exam.name ? String(exam.name) : String(exam._id)}
                      {exam.term ? ` - Term ${String(exam.term)}` : ''}
                      {exam.year ? ` (${String(exam.year)})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
            <CardActions>
              <DirectPdfLink
                type="class"
                classId={selectedClass}
                examId={selectedExam}
                label="Download Class Result PDF"
                fullWidth
                disabled={!selectedClass || !selectedExam}
              />
            </CardActions>
          </Card>
        </Grid>

        {/* Student Result Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Student Result Report
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={handleClassChange}
                >
                  {classes.map((classItem) => (
                    <MenuItem key={classItem._id} value={classItem._id}>
                      {classItem.name ? String(classItem.name) : String(classItem._id)}
                      {classItem.section ? ` - ${String(classItem.section)}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Student</InputLabel>
                <Select
                  value={selectedStudent}
                  onChange={handleStudentChange}
                  disabled={!selectedClass || loading}
                >
                  {students.map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.firstName && student.lastName
                        ? `${String(student.firstName)} ${String(student.lastName)}`
                        : (student.name ? String(student.name) : String(student._id))}
                      {student.rollNumber ? ` (${String(student.rollNumber)})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Exam</InputLabel>
                <Select
                  value={selectedExam}
                  onChange={handleExamChange}
                >
                  {exams.map((exam) => (
                    <MenuItem key={exam._id} value={exam._id}>
                      {exam.name ? String(exam.name) : String(exam._id)}
                      {exam.term ? ` - Term ${String(exam.term)}` : ''}
                      {exam.year ? ` (${String(exam.year)})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress />
                </Box>
              )}
            </CardContent>
            <CardActions>
              <DirectPdfLink
                type="student"
                studentId={selectedStudent}
                examId={selectedExam}
                label="Download Student Result PDF"
                fullWidth
                disabled={!selectedStudent || !selectedExam}
              />
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          About Direct PDF Downloads
        </Typography>
        <Typography variant="body1" paragraph>
          This page provides direct PDF downloads of result reports, bypassing any rendering issues in the UI.
          The PDFs are generated on the server and contain all the information you need.
        </Typography>
        <Typography variant="body1">
          To download a report:
          <ol>
            <li>Select a class</li>
            <li>Select an exam</li>
            <li>For student reports, also select a student</li>
            <li>Click the download button</li>
          </ol>
        </Typography>
      </Box>
    </Box>
  );
};

export default DirectResultsPage;
