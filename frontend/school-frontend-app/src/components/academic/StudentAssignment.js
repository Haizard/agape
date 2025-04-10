import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Paper,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import api from '../../services/api';
import SafeDisplay from '../common/SafeDisplay';

const StudentAssignment = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    classId: ''
  });
  const [editingAssignment, setEditingAssignment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching students and classes...');
      const [studentsRes, classesRes] = await Promise.all([
        api.get('/api/students'),
        api.get('/api/classes')
      ]);
      console.log('Students response:', studentsRes.data);
      console.log('Classes response:', classesRes.data);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching data:', err);
      let errorMessage = 'Failed to fetch data';
      if (err.response) {
        errorMessage = err.response.data?.message || err.response.statusText || errorMessage;
      } else if (err.request) {
        errorMessage = 'No response received from server. Please check your network connection.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Updating student assignment:', formData);
      await api.put('/api/student-assignments', formData);
      setOpenDialog(false);
      fetchData();
      setFormData({
        studentId: '',
        classId: ''
      });
      setEditingAssignment(null);
    } catch (error) {
      setError('Failed to update student assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAssignment) {
        await handleUpdate(e);
      } else {
        console.log('Creating student assignment:', formData);
        await api.post('/api/student-assignments', formData);
        setOpenDialog(false);
        fetchData();
        setFormData({
          studentId: '',
          classId: ''
        });
      }
    } catch (error) {
      setError(editingAssignment ? 'Failed to update student assignment' : 'Failed to assign student');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId, classId) => {
    if (window.confirm('Are you sure you want to remove this student from the class?')) {
      setLoading(true);
      try {
        console.log(`Removing student ${studentId} from class ${classId}`);
        await api.delete('/api/student-assignments', {
          data: { studentId, classId }
        });
        fetchData();
      } catch (err) {
        console.error('Error removing student:', err);
        let errorMessage = 'Failed to remove student';
        if (err.response) {
          errorMessage = err.response.data?.message || err.response.statusText || errorMessage;
        } else if (err.request) {
          errorMessage = 'No response received from server. Please check your network connection.';
        } else {
          errorMessage = err.message || errorMessage;
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
      studentId: assignment.studentId,
      classId: assignment.classId
    });
    setOpenDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Student Class Assignment
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={() => setOpenDialog(true)}
        sx={{ mb: 3 }}
      >
        Assign Student to Class
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student Name</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No classes found
                </TableCell>
              </TableRow>
            ) : (
              classes.map((classItem) =>
                (classItem.students || []).map((student) => (
                  <TableRow key={`${classItem._id}-${student?._id || 'unknown'}`}>
                    <TableCell>
                      <SafeDisplay
                        value={student ? `${student.firstName || ''} ${student.lastName || ''}` : 'Unknown Student'}
                        fallback="Unknown Student"
                      />
                    </TableCell>
                    <TableCell>
                      <SafeDisplay value={classItem.name} fallback="Unknown Class" />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveStudent(student?._id, classItem._id)}
                        disabled={!student || !student._id}
                      >
                        Remove
                      </Button>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => handleEdit({ studentId: student?._id, classId: classItem._id })}
                        disabled={!student || !student._id}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{editingAssignment ? 'Edit Student Assignment' : 'Assign Student to Class'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Student</InputLabel>
              <Select
                value={formData.studentId}
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              >
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    <SafeDisplay
                      value={student ? `${student.firstName || ''} ${student.lastName || ''}` : ''}
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
              >
                {classes.map((classItem) => (
                  <MenuItem key={classItem._id} value={classItem._id}>
                    <SafeDisplay value={classItem.name} fallback="Unknown Class" />
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
          }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {editingAssignment ? 'Update' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAssignment;
