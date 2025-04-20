import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar
} from '@mui/material';
import axios from 'axios';

const EnterSampleMarks = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [marksData, setMarksData] = useState([]);
  const [generatingMarks, setGeneratingMarks] = useState(false);

  // Fetch classes, exams, and academic years on component mount
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

        // Fetch students in the selected class
        const studentsResponse = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/students?class=${selectedClass}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setStudents(studentsResponse.data);

        // Fetch subjects for the selected class
        const classResponse = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/classes/${selectedClass}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (classResponse.data.subjects && Array.isArray(classResponse.data.subjects)) {
          // Extract subjects from class data
          const classSubjects = classResponse.data.subjects.map(subjectData => {
            if (typeof subjectData === 'object' && subjectData.subject) {
              return subjectData.subject;
            } else if (typeof subjectData === 'string') {
              return { _id: subjectData, name: `Subject ${subjectData.substring(0, 5)}...` };
            }
            return null;
          }).filter(Boolean);

          setSubjects(classSubjects);
        } else {
          // Fetch all subjects as fallback
          const subjectsResponse = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/subjects`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          setSubjects(subjectsResponse.data);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching class data:', error);
        setError('Error fetching class data. Please try again.');
        setLoading(false);
      }
    };

    fetchClassData();
  }, [selectedClass]);

  // Generate random marks for all students and subjects
  const generateRandomMarks = () => {
    if (!selectedClass || !selectedExam || !selectedAcademicYear || students.length === 0 || subjects.length === 0) {
      setError('Please select class, exam, and academic year first.');
      return;
    }

    setGeneratingMarks(true);

    // Generate random marks for each student and subject
    const generatedMarks = [];

    students.forEach(student => {
      subjects.forEach(subject => {
        // Generate random marks between 40 and 95
        const randomMarks = Math.floor(Math.random() * 56) + 40;

        generatedMarks.push({
          studentId: student._id,
          studentName: `${student.firstName} ${student.lastName}`,
          subjectId: subject._id,
          subjectName: subject.name,
          examId: selectedExam,
          academicYearId: selectedAcademicYear,
          marksObtained: randomMarks,
          // Determine grade based on marks
          grade: randomMarks >= 80 ? 'A' :
                 randomMarks >= 70 ? 'B' :
                 randomMarks >= 60 ? 'C' :
                 randomMarks >= 50 ? 'D' : 'F',
          // Determine points based on grade
          points: randomMarks >= 80 ? 1 :
                  randomMarks >= 70 ? 2 :
                  randomMarks >= 60 ? 3 :
                  randomMarks >= 50 ? 4 : 5,
          educationLevel: student.educationLevel || 'O_LEVEL'
        });
      });
    });

    setMarksData(generatedMarks);
    setGeneratingMarks(false);
  };

  // Submit marks to the API
  const submitMarks = async () => {
    if (marksData.length === 0) {
      setError('Please generate marks first.');
      return;
    }

    try {
      setLoading(true);

      // Submit marks in batches of 10 to avoid overwhelming the server
      const batchSize = 10;
      const batches = [];

      for (let i = 0; i < marksData.length; i += batchSize) {
        batches.push(marksData.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        // Use the new standardized API endpoint
        const educationLevel = batch[0]?.educationLevel || 'O_LEVEL';
        const endpoint = educationLevel === 'A_LEVEL'
          ? '/api/a-level-results/batch'
          : '/api/o-level/marks/batch';

        console.log(`Using ${educationLevel} endpoint: ${endpoint}`);
        await axios.post(
          `${process.env.REACT_APP_API_URL || ''}${endpoint}`,
          batch,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      setSuccess(true);
      setLoading(false);

      // Clear marks data after successful submission
      setMarksData([]);

    } catch (error) {
      console.error('Error submitting marks:', error);
      setError('Error submitting marks. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Enter Sample Marks for Testing
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
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

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Exam</InputLabel>
            <Select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              label="Exam"
              disabled={loading}
            >
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
            <InputLabel>Academic Year</InputLabel>
            <Select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              label="Academic Year"
              disabled={loading}
            >
              {academicYears.map((year) => (
                <MenuItem key={year._id} value={year._id}>
                  {year.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={generateRandomMarks}
          disabled={loading || generatingMarks || !selectedClass || !selectedExam || !selectedAcademicYear}
        >
          {generatingMarks ? <CircularProgress size={24} /> : 'Generate Random Marks'}
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={submitMarks}
          disabled={loading || marksData.length === 0}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit Marks'}
        </Button>
      </Box>

      {marksData.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generated Marks ({marksData.length} entries)
          </Typography>

          <Box sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #ddd', p: 2 }}>
            {marksData.slice(0, 10).map((mark, index) => (
              <Box key={index} sx={{ mb: 1, p: 1, borderBottom: '1px solid #eee' }}>
                <Typography variant="body2">
                  <strong>Student:</strong> {mark.studentName} |
                  <strong> Subject:</strong> {mark.subjectName} |
                  <strong> Marks:</strong> {mark.marksObtained} |
                  <strong> Grade:</strong> {mark.grade}
                </Typography>
              </Box>
            ))}

            {marksData.length > 10 && (
              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                ... and {marksData.length - 10} more entries
              </Typography>
            )}
          </Box>
        </Box>
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
          Marks submitted successfully!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default EnterSampleMarks;
