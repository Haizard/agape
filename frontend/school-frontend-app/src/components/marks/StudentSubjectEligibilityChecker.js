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
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

/**
 * Component for checking if a student is eligible to take a subject
 * This is useful for validating before entering marks
 */
const StudentSubjectEligibilityChecker = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [classLoading, setClassLoading] = useState(false);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [error, setError] = useState('');
  const [eligibilityResult, setEligibilityResult] = useState(null);

  // Fetch classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      setClassLoading(true);
      try {
        const response = await axios.get('/api/classes', {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });
        
        if (response.data.success) {
          setClasses(response.data.data);
        } else {
          setError('Failed to fetch classes');
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Error fetching classes');
      } finally {
        setClassLoading(false);
      }
    };

    fetchClasses();
  }, [currentUser]);

  // Fetch subjects when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      setSubjectLoading(true);
      try {
        const response = await axios.get(`/api/prisma/subjects/class/${selectedClass}`, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });
        
        if (response.data.success) {
          setSubjects(response.data.data.subjects || []);
        } else {
          setError('Failed to fetch subjects');
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setError('Error fetching subjects');
      } finally {
        setSubjectLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedClass, currentUser]);

  // Fetch students when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }

    const fetchStudents = async () => {
      setStudentLoading(true);
      try {
        const response = await axios.get(`/api/students/class/${selectedClass}`, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });
        
        if (response.data.success) {
          setStudents(response.data.data || []);
        } else {
          setError('Failed to fetch students');
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Error fetching students');
      } finally {
        setStudentLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, currentUser]);

  // Check eligibility
  const checkEligibility = async () => {
    if (!selectedStudent || !selectedSubject) {
      setError('Please select both a student and a subject');
      return;
    }

    setLoading(true);
    setError('');
    setEligibilityResult(null);

    try {
      const response = await axios.get('/api/prisma/marks/validate-eligibility', {
        params: {
          studentId: selectedStudent,
          subjectId: selectedSubject
        },
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      });
      
      setEligibilityResult(response.data);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setError('Error checking eligibility');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedStudent('');
    setSelectedSubject('');
    setEligibilityResult(null);
    setError('');
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Student Subject Eligibility Checker
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Use this tool to check if a student is eligible to take a subject before entering marks.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Class</InputLabel>
          <Select
            value={selectedClass}
            label="Class"
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={classLoading}
          >
            {classLoading ? (
              <MenuItem disabled>Loading classes...</MenuItem>
            ) : (
              classes.map((cls) => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Subject</InputLabel>
          <Select
            value={selectedSubject}
            label="Subject"
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={!selectedClass || subjectLoading}
          >
            {subjectLoading ? (
              <MenuItem disabled>Loading subjects...</MenuItem>
            ) : (
              subjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code}) - {subject.type === 'CORE' ? 'Core' : 'Optional'}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Student</InputLabel>
          <Select
            value={selectedStudent}
            label="Student"
            onChange={(e) => setSelectedStudent(e.target.value)}
            disabled={!selectedClass || studentLoading}
          >
            {studentLoading ? (
              <MenuItem disabled>Loading students...</MenuItem>
            ) : (
              students.map((student) => (
                <MenuItem key={student._id} value={student._id}>
                  {student.firstName} {student.lastName} ({student.admissionNumber})
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={checkEligibility}
            disabled={!selectedStudent || !selectedSubject || loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Checking...' : 'Check Eligibility'}
          </Button>
          <Button variant="outlined" onClick={resetForm}>
            Reset
          </Button>
        </Box>
      </Box>

      {eligibilityResult && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Eligibility Result
          </Typography>
          
          <Alert 
            severity={eligibilityResult.isEligible ? 'success' : 'warning'} 
            sx={{ mb: 2 }}
          >
            <AlertTitle>
              {eligibilityResult.isEligible ? 'Eligible' : 'Not Eligible'}
            </AlertTitle>
            {eligibilityResult.message}
            {eligibilityResult.warning && (
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                Warning: {eligibilityResult.warning}
              </Typography>
            )}
          </Alert>

          {eligibilityResult.student && eligibilityResult.subject && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Details:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Student" 
                    secondary={`${eligibilityResult.student.firstName} ${eligibilityResult.student.lastName} (${eligibilityResult.student.educationLevel})`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Subject" 
                    secondary={`${eligibilityResult.subject.name} (${eligibilityResult.subject.code}) - ${eligibilityResult.subject.type}`} 
                  />
                </ListItem>
                {eligibilityResult.isPrincipal && (
                  <ListItem>
                    <ListItemText 
                      primary="Subject Type" 
                      secondary="Principal Subject" 
                    />
                  </ListItem>
                )}
                {eligibilityResult.isSubsidiary && (
                  <ListItem>
                    <ListItemText 
                      primary="Subject Type" 
                      secondary="Subsidiary Subject" 
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default StudentSubjectEligibilityChecker;
