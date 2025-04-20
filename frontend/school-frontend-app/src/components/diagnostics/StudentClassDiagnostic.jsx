import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
  Alert
} from '@mui/material';
import { useClassesQuery } from '../../hooks/useClassesQuery';
import api from '../../services/api';

const StudentClassDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [assignmentResult, setAssignmentResult] = useState(null);
  
  // Get classes
  const { data: classes, isLoading: classesLoading } = useClassesQuery();
  
  // Check student-class assignments
  const handleCheckAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setDiagnosticResult(null);
      
      const response = await api.get('/api/enhanced-teachers/check-student-assignments');
      setDiagnosticResult(response.data);
      setSuccess('Student-class assignments checked successfully');
    } catch (error) {
      console.error('Error checking student-class assignments:', error);
      setError(`Failed to check student-class assignments: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Get students in a class
  const handleGetClassStudents = async () => {
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setDiagnosticResult(null);
      
      const response = await api.get(`/api/enhanced-teachers/class-students/${selectedClass}`);
      setDiagnosticResult(response.data);
      setSuccess(`Found ${response.data.studentCount} students in class`);
    } catch (error) {
      console.error('Error getting class students:', error);
      setError(`Failed to get class students: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Assign students to a class
  const handleAssignStudents = async () => {
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setAssignmentResult(null);
      
      const response = await api.post('/api/enhanced-teachers/assign-students-to-class', {
        classId: selectedClass
      });
      
      setAssignmentResult(response.data);
      setSuccess(response.data.message);
      
      // Refresh the diagnostic result
      await handleGetClassStudents();
    } catch (error) {
      console.error('Error assigning students to class:', error);
      setError(`Failed to assign students to class: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Student-Class Assignment Diagnostic
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Check All Student-Class Assignments
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleCheckAssignments}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Check Assignments'}
        </Button>
      </Paper>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Class-Specific Operations
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Select Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                label="Select Class"
                disabled={loading || classesLoading}
              >
                {classes?.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name} ({cls.educationLevel})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGetClassStudents}
              disabled={loading || !selectedClass}
              fullWidth
            >
              Get Students
            </Button>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleAssignStudents}
              disabled={loading || !selectedClass}
              fullWidth
            >
              Assign Students
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {assignmentResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Assignment Result
            </Typography>
            
            <Typography variant="body1">
              {assignmentResult.message}
            </Typography>
            
            {assignmentResult.students && assignmentResult.students.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle1">
                  Assigned Students:
                </Typography>
                
                <ul>
                  {assignmentResult.students.map((student) => (
                    <li key={student.id}>
                      {student.name}
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
      
      {diagnosticResult && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Diagnostic Result
            </Typography>
            
            {diagnosticResult.classSummary ? (
              <>
                <Typography variant="body1" gutterBottom>
                  Total Classes: {diagnosticResult.totalClasses}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  Total Students: {diagnosticResult.totalStudents}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Class Summary:
                </Typography>
                
                {diagnosticResult.classSummary.map((cls) => (
                  <Box key={cls.classId} mb={2} p={1} bgcolor="background.paper" borderRadius={1}>
                    <Typography variant="subtitle2">
                      {cls.className} ({cls.educationLevel}) - {cls.studentCount} students
                    </Typography>
                    
                    {cls.students && cls.students.length > 0 ? (
                      <Box ml={2}>
                        <Typography variant="body2" color="textSecondary">
                          Sample students:
                        </Typography>
                        
                        <ul>
                          {cls.students.map((student) => (
                            <li key={student._id}>
                              {student.name}
                            </li>
                          ))}
                        </ul>
                        
                        {cls.studentCount > cls.students.length && (
                          <Typography variant="body2" color="textSecondary">
                            ...and {cls.studentCount - cls.students.length} more
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="error" ml={2}>
                        No students in this class
                      </Typography>
                    )}
                  </Box>
                ))}
              </>
            ) : (
              <>
                <Typography variant="body1" gutterBottom>
                  Class: {diagnosticResult.className} ({diagnosticResult.educationLevel})
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  Student Count: {diagnosticResult.studentCount}
                </Typography>
                
                {diagnosticResult.students && diagnosticResult.students.length > 0 ? (
                  <Box mt={2}>
                    <Typography variant="subtitle1">
                      Students:
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {diagnosticResult.students.map((student) => (
                        <Grid item xs={12} sm={6} md={4} key={student._id}>
                          <Box p={1} bgcolor="background.paper" borderRadius={1}>
                            <Typography variant="body2">
                              {student.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Roll: {student.rollNumber || 'N/A'}, Gender: {student.gender || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ) : (
                  <Typography variant="body1" color="error">
                    No students found in this class
                  </Typography>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default StudentClassDiagnostic;
