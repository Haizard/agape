import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Typography, 
  Paper, 
  Alert, 
  AlertTitle,
  CircularProgress,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import StudentResultsView from './StudentResultsView';
import ClassResultsView from './ClassResultsView';

/**
 * Unified Results Viewer Component
 * Handles viewing results for both O-Level and A-Level students
 */
const UnifiedResultsViewer = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [studentResults, setStudentResults] = useState(null);
  const [classResults, setClassResults] = useState(null);

  // Fetch classes and exams on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch classes
        const classesResponse = await axios.get('/api/classes', {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });
        
        if (classesResponse.data.success) {
          setClasses(classesResponse.data.data);
        }

        // Fetch exams
        const examsResponse = await axios.get('/api/prisma/exams', {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });
        
        if (examsResponse.data.success) {
          setExams(examsResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Error fetching initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [currentUser]);

  // Fetch students when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setEducationLevel('');
      return;
    }

    const fetchClassDetails = async () => {
      setLoading(true);
      try {
        // Get class details to determine education level
        const classResponse = await axios.get(`/api/classes/${selectedClass}`, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });
        
        if (classResponse.data.success) {
          const classData = classResponse.data.data;
          setEducationLevel(classData.educationLevel);
        }

        // Fetch students in the class
        const studentsResponse = await axios.get(`/api/students/class/${selectedClass}`, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });
        
        if (studentsResponse.data.success) {
          setStudents(studentsResponse.data.data || []);
        } else {
          setError('Failed to fetch students');
        }
      } catch (error) {
        console.error('Error fetching class details:', error);
        setError('Error fetching class details');
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetails();
  }, [selectedClass, currentUser]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Clear results when switching tabs
    if (newValue === 0) {
      setClassResults(null);
    } else {
      setStudentResults(null);
    }
  };

  // View student results
  const viewStudentResults = async () => {
    if (!selectedStudent || !selectedExam) {
      setError('Please select both a student and an exam');
      return;
    }

    setLoadingResults(true);
    setError('');
    setStudentResults(null);

    try {
      const response = await axios.get(`/api/prisma/results/student/${selectedStudent}/exam/${selectedExam}`, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      });
      
      if (response.data.success) {
        setStudentResults(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch student results');
      }
    } catch (error) {
      console.error('Error fetching student results:', error);
      setError('Error fetching student results');
    } finally {
      setLoadingResults(false);
    }
  };

  // View class results
  const viewClassResults = async () => {
    if (!selectedClass || !selectedExam) {
      setError('Please select both a class and an exam');
      return;
    }

    setLoadingResults(true);
    setError('');
    setClassResults(null);

    try {
      const response = await axios.get(`/api/prisma/results/class/${selectedClass}/exam/${selectedExam}`, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      });
      
      if (response.data.success) {
        setClassResults(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch class results');
      }
    } catch (error) {
      console.error('Error fetching class results:', error);
      setError('Error fetching class results');
    } finally {
      setLoadingResults(false);
    }
  };

  // Generate student report
  const generateStudentReport = async () => {
    if (!selectedStudent || !selectedExam) {
      setError('Please select both a student and an exam');
      return;
    }

    setLoadingResults(true);
    setError('');

    try {
      const response = await axios.get(`/api/prisma/results/report/student/${selectedStudent}/exam/${selectedExam}`, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      });
      
      if (response.data.success) {
        // Open report in a new window or handle as needed
        const reportData = response.data.data;
        console.log('Report generated:', reportData);
        
        // For now, just show the student results
        setStudentResults(reportData);
      } else {
        setError(response.data.message || 'Failed to generate student report');
      }
    } catch (error) {
      console.error('Error generating student report:', error);
      setError('Error generating student report');
    } finally {
      setLoadingResults(false);
    }
  };

  // Generate class report
  const generateClassReport = async () => {
    if (!selectedClass || !selectedExam) {
      setError('Please select both a class and an exam');
      return;
    }

    setLoadingResults(true);
    setError('');

    try {
      const response = await axios.get(`/api/prisma/results/report/class/${selectedClass}/exam/${selectedExam}`, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      });
      
      if (response.data.success) {
        // Open report in a new window or handle as needed
        const reportData = response.data.data;
        console.log('Report generated:', reportData);
        
        // For now, just show the class results
        setClassResults(reportData);
      } else {
        setError(response.data.message || 'Failed to generate class report');
      }
    } catch (error) {
      console.error('Error generating class report:', error);
      setError('Error generating class report');
    } finally {
      setLoadingResults(false);
    }
  };

  // Reset form
  const resetForm = () => {
    if (activeTab === 0) {
      setSelectedStudent('');
      setStudentResults(null);
    } else {
      setClassResults(null);
    }
    setError('');
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Unified Results Viewer
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          View results for both O-Level and A-Level students.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Student Results" />
          <Tab label="Class Results" />
        </Tabs>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              label="Class"
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedStudent('');
                resetForm();
              }}
              disabled={loading}
            >
              {loading ? (
                <MenuItem disabled>Loading classes...</MenuItem>
              ) : (
                classes.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name} ({cls.educationLevel})
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {educationLevel && (
            <Alert severity="info" sx={{ mb: 1 }}>
              Selected class is {educationLevel === 'O_LEVEL' ? 'O-Level' : 'A-Level'}
            </Alert>
          )}

          <FormControl fullWidth>
            <InputLabel>Exam</InputLabel>
            <Select
              value={selectedExam}
              label="Exam"
              onChange={(e) => {
                setSelectedExam(e.target.value);
                resetForm();
              }}
              disabled={loading}
            >
              {exams.map((exam) => (
                <MenuItem key={exam.id} value={exam.id}>
                  {exam.name} ({exam.term})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {activeTab === 0 && (
            <FormControl fullWidth>
              <InputLabel>Student</InputLabel>
              <Select
                value={selectedStudent}
                label="Student"
                onChange={(e) => {
                  setSelectedStudent(e.target.value);
                  setStudentResults(null);
                }}
                disabled={!selectedClass || loading}
              >
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.firstName} {student.lastName} ({student.admissionNumber})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeTab === 0 ? (
              <>
                <Button 
                  variant="contained" 
                  onClick={viewStudentResults}
                  disabled={!selectedStudent || !selectedExam || loadingResults}
                  startIcon={loadingResults && <CircularProgress size={20} color="inherit" />}
                >
                  {loadingResults ? 'Loading...' : 'View Student Results'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={generateStudentReport}
                  disabled={!selectedStudent || !selectedExam || loadingResults}
                >
                  Generate Report
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="contained" 
                  onClick={viewClassResults}
                  disabled={!selectedClass || !selectedExam || loadingResults}
                  startIcon={loadingResults && <CircularProgress size={20} color="inherit" />}
                >
                  {loadingResults ? 'Loading...' : 'View Class Results'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={generateClassReport}
                  disabled={!selectedClass || !selectedExam || loadingResults}
                >
                  Generate Report
                </Button>
              </>
            )}
            <Button variant="text" onClick={resetForm}>
              Reset
            </Button>
          </Box>
        </Box>

        {(studentResults || classResults) && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            {activeTab === 0 && studentResults && (
              <StudentResultsView 
                results={studentResults} 
                educationLevel={educationLevel} 
              />
            )}
            {activeTab === 1 && classResults && (
              <ClassResultsView 
                results={classResults} 
                educationLevel={educationLevel} 
              />
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default UnifiedResultsViewer;
