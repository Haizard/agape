import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

const DirectMarksEntry = () => {
  // State for form data
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  // State for selected values
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // State for marks data
  const [marksData, setMarksData] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch classes
        const classesResponse = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/classes`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setClasses(classesResponse.data);

        // Fetch exams
        const examsResponse = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/exams`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setExams(examsResponse.data);

        // Fetch academic years
        const academicYearsResponse = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/academic-years`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setAcademicYears(academicYearsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error fetching data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch students and subjects when class is selected
  useEffect(() => {
    if (!selectedClass) return;

    const fetchClassData = async () => {
      try {
        setLoading(true);

        // Fetch class details to get subjects
        const classResponse = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/classes/${selectedClass}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        // Extract subjects from class data
        if (classResponse.data.subjects && Array.isArray(classResponse.data.subjects)) {
          const classSubjects = classResponse.data.subjects
            .filter(subjectData => subjectData.subject)
            .map(subjectData => subjectData.subject);

          setSubjects(classSubjects);
        }

        // Fetch students in the selected class
        const studentsResponse = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/students?class=${selectedClass}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        setStudents(studentsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching class data:', error);
        setError('Error fetching class data. Please try again.');
        setLoading(false);
      }
    };

    fetchClassData();
  }, [selectedClass]);

  // Initialize marks data when students and subject are selected
  useEffect(() => {
    if (!selectedSubject || students.length === 0) return;

    // Create initial marks data for all students
    const initialMarksData = students.map(student => ({
      studentId: student._id,
      studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      subjectId: selectedSubject,
      examId: selectedExam,
      academicYearId: selectedAcademicYear,
      marksObtained: '',
      educationLevel: student.educationLevel || 'O_LEVEL',
      classId: selectedClass
    }));

    setMarksData(initialMarksData);
  }, [students, selectedSubject, selectedExam, selectedAcademicYear, selectedClass]);

  // Handle form field changes
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
    // Reset dependent fields
    setSelectedSubject('');
    setMarksData([]);
  };

  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
    // Reset marks data
    setMarksData([]);
  };

  const handleAcademicYearChange = (event) => {
    setSelectedAcademicYear(event.target.value);
    // Reset marks data
    setMarksData([]);
  };

  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
    // Reset marks data
    setMarksData([]);
  };

  // Handle marks input change
  const handleMarksChange = (studentId, value) => {
    // Validate input (only numbers between 0-100)
    if (value !== '' && (isNaN(value) || value < 0 || value > 100)) {
      return;
    }

    // Update marks data
    setMarksData(prevData =>
      prevData.map(item =>
        item.studentId === studentId
          ? { ...item, marksObtained: value }
          : item
      )
    );
  };

  // Calculate grade based on marks
  const calculateGrade = (marks) => {
    if (marks === '') return '-';

    const numMarks = Number(marks);

    // O-Level grading system
    if (numMarks >= 75) return 'A';
    if (numMarks >= 65) return 'B';
    if (numMarks >= 45) return 'C';
    if (numMarks >= 30) return 'D';
    return 'F';
  };

  // Calculate points based on grade
  const calculatePoints = (grade) => {
    switch (grade) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      case 'D': return 4;
      case 'F': return 5;
      default: return 0;
    }
  };

  // Submit marks
  const handleSubmit = async () => {
    try {
      if (!selectedClass || !selectedExam || !selectedAcademicYear || !selectedSubject) {
        setError('Please select class, exam, academic year, and subject.');
        return;
      }

      // Filter out empty marks
      const validMarksData = marksData
        .filter(item => item.marksObtained !== '')
        .map(item => ({
          ...item,
          marksObtained: Number(item.marksObtained),
          grade: calculateGrade(item.marksObtained),
          points: calculatePoints(calculateGrade(item.marksObtained))
        }));

      if (validMarksData.length === 0) {
        setError('Please enter marks for at least one student.');
        return;
      }

      setLoading(true);

      // Use the appropriate API endpoint based on education level
      const educationLevel = students[0]?.educationLevel || 'O_LEVEL';
      const endpoint = educationLevel === 'A_LEVEL'
        ? '/api/a-level-results/batch'
        : '/api/o-level/marks/batch';

      console.log(`Submitting marks to ${educationLevel} API endpoint: ${endpoint}`, validMarksData);
      await axios.post(
        `${process.env.REACT_APP_API_URL || ''}${endpoint}`,
        validMarksData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccessMessage(`Successfully saved marks for ${validMarksData.length} students.`);
      setSuccess(true);
      setLoading(false);

      // Clear marks data
      setMarksData(prevData =>
        prevData.map(item => ({ ...item, marksObtained: '' }))
      );
    } catch (error) {
      console.error('Error submitting marks:', error);
      setError('Error submitting marks. Please try again.');
      setLoading(false);
    }
  };

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s._id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Direct Marks Entry
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              onChange={handleClassChange}
              label="Class"
              disabled={loading}
            >
              {classes.map((cls) => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.name}
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
              disabled={loading || !selectedClass}
            >
              {exams.map((exam) => (
                <MenuItem key={exam._id} value={exam._id}>
                  {exam.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Academic Year</InputLabel>
            <Select
              value={selectedAcademicYear}
              onChange={handleAcademicYearChange}
              label="Academic Year"
              disabled={loading || !selectedClass}
            >
              {academicYears.map((year) => (
                <MenuItem key={year._id} value={year._id}>
                  {year.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Subject</InputLabel>
            <Select
              value={selectedSubject}
              onChange={handleSubjectChange}
              label="Subject"
              disabled={loading || !selectedClass || subjects.length === 0}
            >
              {subjects.map((subject) => (
                <MenuItem key={subject._id} value={subject._id}>
                  {subject.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {selectedClass && selectedExam && selectedAcademicYear && selectedSubject && (
        <>
          <Typography variant="h6" gutterBottom>
            Enter Marks for {getSubjectName(selectedSubject)}
          </Typography>

          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Marks (0-100)</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Points</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {marksData.map((item) => (
                  <TableRow key={item.studentId}>
                    <TableCell>{item.studentName}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.marksObtained}
                        onChange={(e) => handleMarksChange(item.studentId, e.target.value)}
                        inputProps={{ min: 0, max: 100 }}
                        size="small"
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      {calculateGrade(item.marksObtained)}
                    </TableCell>
                    <TableCell>
                      {calculatePoints(calculateGrade(item.marksObtained))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Saving...' : 'Save Marks'}
            </Button>
          </Box>
        </>
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default DirectMarksEntry;
