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

const StudentAssignmentFixed = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    classId: ''
  });
  const [selectedClassSubjects, setSelectedClassSubjects] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching students, classes, subjects, and teachers...');
      const [studentsRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
        api.get('/api/students'),
        api.get('/api/classes'),
        api.get('/api/subjects'),
        api.get('/api/teachers')
      ]);

      // Ensure we have valid data
      const validStudents = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      const validClasses = Array.isArray(classesRes.data) ? classesRes.data : [];
      const validSubjects = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];
      const validTeachers = Array.isArray(teachersRes.data) ? teachersRes.data : [];

      console.log('Fetched students:', validStudents.length);
      console.log('Fetched classes:', validClasses.length);
      console.log('Fetched subjects:', validSubjects.length);
      console.log('Fetched teachers:', validTeachers.length);

      setStudents(validStudents);
      setClasses(validClasses);
      setSubjects(validSubjects);
      setTeachers(validTeachers);
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

  const handleRemoveStudent = async (studentId, classId) => {
    if (!studentId || !classId) {
      setError('Invalid student or class ID');
      return;
    }

    if (window.confirm('Are you sure you want to remove this student from the class?')) {
      setLoading(true);
      try {
        await api.delete('/api/student-assignments', {
          data: { studentId, classId }
        });
        fetchData();
      } catch (err) {
        console.error('Error removing student:', err);
        setError('Failed to remove student from class');
      } finally {
        setLoading(false);
      }
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

  const fetchClassSubjects = async (classId) => {
    if (!classId) {
      setSelectedClassSubjects([]);
      return;
    }

    try {
      const response = await api.get(`/api/classes/${classId}`);
      const classData = response.data;

      // Extract subjects from the class data
      const subjects = classData.subjects || [];
      setSelectedClassSubjects(subjects);
      console.log('Fetched subjects for class:', subjects);
    } catch (err) {
      console.error('Error fetching class subjects:', err);
      setError('Failed to fetch subjects for the selected class');
      setSelectedClassSubjects([]);
    }
  };

  const handleEdit = (assignment) => {
    if (!assignment || !assignment.studentId || !assignment.classId) {
      setError('Invalid assignment data');
      return;
    }

    setEditingAssignment(assignment);
    setFormData({
      studentId: assignment.studentId,
      classId: assignment.classId
    });

    // Fetch subjects for the selected class
    fetchClassSubjects(assignment.classId);

    setOpenDialog(true);
  };

  // Safe render function for student names
  const renderStudentName = (student) => {
    if (!student) return 'Unknown Student';
    const firstName = student.firstName || '';
    const lastName = student.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Student';
  };

  // Safe render function for class names
  const renderClassName = (classItem) => {
    if (!classItem) return 'Unknown Class';
    return classItem.name || 'Unknown Class';
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

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

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
            {classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No classes found
                </TableCell>
              </TableRow>
            ) : (
              classes.flatMap((classItem) => {
                // Ensure students array exists and is valid
                const classStudents = Array.isArray(classItem.students) ? classItem.students : [];

                if (classStudents.length === 0) {
                  return [
                    <TableRow key={classItem._id}>
                      <TableCell colSpan={3} align="center">
                        No students in {renderClassName(classItem)}
                      </TableCell>
                    </TableRow>
                  ];
                }

                return classStudents
                  .filter(student => student?._id) // Filter out invalid students
                  .map(student => (
                    <TableRow key={`${classItem._id}-${student._id}`}>
                      <TableCell>{renderStudentName(student)}</TableCell>
                      <TableCell>{renderClassName(classItem)}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRemoveStudent(student._id, classItem._id)}
                        >
                          Remove
                        </Button>
                        <Button
                          size="small"
                          color="primary"
                          onClick={() => handleEdit({ studentId: student._id, classId: classItem._id })}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ));
              }) // Using flatMap instead of map().flat()
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
                {students.map((student) => {
                  // Skip invalid students
                  if (!student || !student._id) return null;

                  return (
                    <MenuItem key={student._id} value={student._id}>
                      {renderStudentName(student)}
                    </MenuItem>
                  );
                }).filter(Boolean)} {/* Filter out null entries */}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Class</InputLabel>
              <Select
                value={formData.classId}
                onChange={(e) => {
                  const classId = e.target.value;
                  setFormData({...formData, classId});
                  fetchClassSubjects(classId);
                }}
              >
                {classes.map((classItem) => {
                  // Skip invalid classes
                  if (!classItem || !classItem._id) return null;

                  return (
                    <MenuItem key={classItem._id} value={classItem._id}>
                      {renderClassName(classItem)}
                    </MenuItem>
                  );
                }).filter(Boolean)} {/* Filter out null entries */}
              </Select>
            </FormControl>

            {/* Display subjects that will be assigned to the student */}
            {formData.classId && selectedClassSubjects.length > 0 && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Subjects in this class:
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                  {selectedClassSubjects.map((subjectItem, index) => {
                    // Get the subject details
                    const subjectId = subjectItem.subject?._id || subjectItem.subject;
                    const subject = subjects.find(s => s._id === subjectId);
                    const teacherId = subjectItem.teacher;
                    const teacher = teachers.find(t => t._id === teacherId);

                    return (
                      <Box key={subjectId || `subject-${index}`} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">
                          {subject ? subject.name : 'Unknown Subject'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Teacher: {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Not Assigned'}
                        </Typography>
                      </Box>
                    );
                  })}

                  {selectedClassSubjects.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No subjects assigned to this class yet.
                    </Typography>
                  )}
                </Paper>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  When assigned to this class, the student will have access to all these subjects.
                </Typography>
              </Box>
            )}
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
            {loading ? <CircularProgress size={20} /> : (editingAssignment ? 'Update' : 'Assign')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAssignmentFixed;
