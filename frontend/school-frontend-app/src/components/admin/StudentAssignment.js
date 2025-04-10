import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress
} from '@mui/material';
import api from '../../services/api';
import SafeDisplay from '../common/SafeDisplay';

const StudentAssignment = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingAssignment, setExistingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    classId: ''
  });
  const [editingAssignment, setEditingAssignment] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to access this page');
      return;
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching data for student assignments...');
      const [studentsRes, classesRes, assignmentsRes] = await Promise.all([
        api.get('/api/students'),
        api.get('/api/classes'),
        api.get('/api/student-assignments')
      ]);
      console.log('Students data:', studentsRes.data);
      console.log('Classes data:', classesRes.data);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
      setAssignments(assignmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.put('/api/student-assignments', formData);
      setSuccess('Student assignment updated successfully');
      setOpenDialog(false);
      setExistingAssignment(null);
      fetchData();
      setFormData({
        studentId: '',
        classId: ''
      });
      setEditingAssignment(null);
    } catch (error) {
      console.error('Error in handleUpdate:', error);
      let errorMessage = 'Failed to update student assignment';

      // Extract more detailed error message if available
      if (error.response?.data) {
        errorMessage = error.response.data.message || errorMessage;
        console.log('Server error details:', error.response.data);
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.classId) {
      setError('Please select both student and class');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (editingAssignment) {
        await handleUpdate();
      } else {
        await api.post('/api/student-assignments', formData);
        setSuccess('Student assigned to class successfully');
        setOpenDialog(false);
        setExistingAssignment(null);
        fetchData();
        setFormData({
          studentId: '',
          classId: ''
        });
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      let errorMessage = editingAssignment ? 'Failed to update student assignment' : 'Failed to assign student';

      // Check for authentication errors
      if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        // Redirect to login or show login modal
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      }

      // Extract more detailed error message if available
      if (error.response?.data) {
        errorMessage = error.response.data.message || errorMessage;
        console.log('Server error details:', error.response.data);

        // Check if there's an existing assignment
        if (error.response.data.existingAssignment) {
          setExistingAssignment(error.response.data.existingAssignment);
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId, classId) => {
    if (window.confirm('Are you sure you want to remove this student from the class?')) {
      setLoading(true);
      try {
        await api.delete('/api/student-assignments', {
          data: { studentId, classId }
        });
        setSuccess('Student removed from class successfully');
        setExistingAssignment(null);
        fetchData();
      } catch (error) {
        console.error('Error in handleRemoveStudent:', error);
        let errorMessage = 'Failed to remove student';

        // Extract more detailed error message if available
        if (error.response?.data) {
          errorMessage = error.response.data.message || errorMessage;
          console.log('Server error details:', error.response.data);
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      studentId: typeof assignment.studentId === 'object' ? assignment.studentId._id : assignment.studentId,
      classId: typeof assignment.classId === 'object' ? assignment.classId._id : assignment.classId
    });
    setOpenDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Student Assignment</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            {existingAssignment && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => handleRemoveStudent(
                  existingAssignment.studentId,
                  existingAssignment.classId
                )}
              >
                Remove Existing Assignment
              </Button>
            )}
            <Button
              size="small"
              onClick={() => {
                setError('');
                setExistingAssignment(null);
              }}
            >
              Dismiss
            </Button>
          </Box>
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
          <Button
            size="small"
            onClick={() => setSuccess('')}
            sx={{ ml: 2 }}
          >
            Dismiss
          </Button>
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={() => {
          setEditingAssignment(null);
          setFormData({
            studentId: '',
            classId: ''
          });
          setOpenDialog(true);
        }}
        sx={{ mb: 3 }}
      >
        Assign Student to Class
      </Button>

      {loading && !openDialog ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Roll Number</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <TableRow key={assignment._id}>
                    <TableCell>
                      {typeof assignment.studentId === 'object' ?
                        <SafeDisplay value={`${assignment.studentId.firstName} ${assignment.studentId.lastName}`} /> :
                        'Unknown Student'}
                    </TableCell>
                    <TableCell>
                      <SafeDisplay value={typeof assignment.studentId === 'object' ? assignment.studentId.rollNumber : 'N/A'} />
                    </TableCell>
                    <TableCell>
                      {typeof assignment.classId === 'object' ?
                        <SafeDisplay value={`${assignment.classId.name} ${assignment.classId.section}`} /> :
                        'Unknown Class'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(assignment)}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveStudent(
                          typeof assignment.studentId === 'object' ? assignment.studentId._id : assignment.studentId,
                          typeof assignment.classId === 'object' ? assignment.classId._id : assignment.classId
                        )}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No student assignments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAssignment ? 'Edit Student Assignment' : 'Assign Student to Class'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Student</InputLabel>
              <Select
                value={formData.studentId}
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                label="Student"
              >
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    <SafeDisplay
                      value={student ? `${student.firstName || ''} ${student.lastName || ''} (${student.rollNumber || 'N/A'})` : ''}
                      fallback="Unknown Student"
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Class</InputLabel>
              <Select
                value={formData.classId}
                onChange={(e) => setFormData({...formData, classId: e.target.value})}
                label="Class"
              >
                {classes.map((classItem) => (
                  <MenuItem key={classItem._id} value={classItem._id}>
                    <SafeDisplay
                      value={classItem ? `${classItem.name || ''} ${classItem.section || ''}` : ''}
                      fallback="Unknown Class"
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setEditingAssignment(null);
            setFormData({
              studentId: '',
              classId: ''
            });
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (editingAssignment ? 'Update' : 'Assign')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAssignment;