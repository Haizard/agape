import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import SafeDisplay from '../common/SafeDisplay';
import { isAdmin } from '../../utils/roleUtils';
import TeacherSubjectAssignmentDialog from './TeacherSubjectAssignmentDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Typography,
  CircularProgress
} from '@mui/material';

const ClassManagement = () => {
  // Get user from Redux store
  const { user } = useSelector((state) => state.user);

  // Check if user is admin
  const userIsAdmin = isAdmin();

  const [state, setState] = useState({
    classes: [],
    teachers: [],
    academicYears: [],
    subjectCombinations: [], // Added for A_LEVEL classes
    loading: false,
    error: '',
    retryCount: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    teacherId: '',
    academicYear: '',  // Changed from academicYearId to match backend
    capacity: '',
    section: '',
    stream: '',  // Added missing required field
    educationLevel: 'O_LEVEL', // Default to O_LEVEL
    subjectCombination: '' // For A_LEVEL classes
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [openTeacherAssignmentDialog, setOpenTeacherAssignmentDialog] = useState(false);
  const [newlyCreatedClass, setNewlyCreatedClass] = useState(null);
  const [subjectsToAssign, setSubjectsToAssign] = useState([]);

  const fetchData = useCallback(async (page = 1, limit = 10) => {
    setState(prev => {
      if (prev.loading) return prev;
      if (prev.retryCount >= 3) {
        return {
          ...prev,
          error: 'Maximum retry attempts reached. Please refresh the page.'
        };
      }
      return { ...prev, loading: true, error: '' };
    });

    try {
      console.log('Fetching classes, teachers, academic years, and subject combinations...');
      const [classesRes, teachersRes, academicYearsRes, subjectCombinationsRes] = await Promise.all([
        api.get(`/api/classes?page=${page}&limit=${limit}`),
        api.get('/api/teachers'),
        api.get('/api/academic-years'),
        api.get('/api/subject-combinations')
      ]);

      console.log('Classes response:', classesRes.data);
      console.log('Teachers response:', teachersRes.data);
      console.log('Academic years response:', academicYearsRes.data);
      console.log('Subject combinations response:', subjectCombinationsRes.data);

      setState(prev => ({
        ...prev,
        classes: classesRes.data,
        teachers: teachersRes.data,
        academicYears: academicYearsRes.data,
        subjectCombinations: subjectCombinationsRes.data,
        loading: false,
        retryCount: 0
      }));
    } catch (err) {
      console.error('Fetch error:', err);
      let errorMessage = 'Failed to fetch data';

      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        retryCount: prev.retryCount + 1
      }));
    }
  }, []);

const handleCreateClass = async () => {
  try {
    console.log('Creating class with data:', formData);

    // Prepare the request data
    const classData = {
      name: formData.name,
      classTeacher: formData.teacherId,
      academicYear: formData.academicYear,
      capacity: formData.capacity,
      section: formData.section,
      stream: formData.stream,
      educationLevel: formData.educationLevel
    };

    // Add subject combination if it's an A_LEVEL class
    if (formData.educationLevel === 'A_LEVEL' && formData.subjectCombination) {
      classData.subjectCombination = formData.subjectCombination;

      // Get the subject combination details to extract subjects
      const combinationResponse = await api.get(`/api/subject-combinations/${formData.subjectCombination}`);
      const combination = combinationResponse.data;

      // Prepare subjects array with all subjects from the combination
      if (combination?.subjects) {
        classData.subjects = combination.subjects.map(subject => ({
          subject: typeof subject === 'object' ? subject._id : subject,
          teacher: null // Initially no teacher assigned
        }));
      }
    }

    console.log('Sending class data:', classData);
    const response = await api.post('/api/classes', classData);
    console.log('Created class response:', response.data);
    console.log('Created class subjects:', response.data.subjects);
    setState(prev => ({
      ...prev,
      classes: [...prev.classes, response.data]
    }));
    setOpenDialog(false);

    // If this is an A_LEVEL class with subjects, open the teacher assignment dialog
    if (formData.educationLevel === 'A_LEVEL' && combination?.subjects?.length > 0) {
      setNewlyCreatedClass(response.data);
      setSubjectsToAssign(combination.subjects);
      setOpenTeacherAssignmentDialog(true);
    }

    setFormData({
      name: '',
      teacherId: '',
      academicYear: '',
      capacity: '',
      section: '',
      stream: '',
      educationLevel: 'O_LEVEL',
      subjectCombination: ''
    });
  } catch (error) {
    setState(prev => ({
      ...prev,
      error: error.response?.data?.message || 'Failed to create class'
    }));
  }
};

const handleUpdateClass = async (classId) => {
  try {
    console.log(`Updating class ${classId} with data:`, formData);

    // Prepare the request data
    const classData = {
      name: formData.name,
      classTeacher: formData.teacherId,
      academicYear: formData.academicYear,
      capacity: formData.capacity,
      section: formData.section,
      stream: formData.stream,
      educationLevel: formData.educationLevel
    };

    // Add subject combination if it's an A_LEVEL class
    if (formData.educationLevel === 'A_LEVEL' && formData.subjectCombination) {
      classData.subjectCombination = formData.subjectCombination;

      // Check if the subject combination has changed
      const currentClass = state.classes.find(c => c._id === classId);
      const currentCombinationId = currentClass?.subjectCombination?._id || currentClass?.subjectCombination;

      if (currentCombinationId !== formData.subjectCombination) {
        // Get the subject combination details to extract subjects
        const combinationResponse = await api.get(`/api/subject-combinations/${formData.subjectCombination}`);
        const combination = combinationResponse.data;

        // Prepare subjects array with all subjects from the combination
        if (combination?.subjects) {
          classData.subjects = combination.subjects.map(subject => ({
            subject: typeof subject === 'object' ? subject._id : subject,
            teacher: null // Initially no teacher assigned
          }));
        }
      }
    }

    console.log('Sending updated class data:', classData);
    const response = await api.put(`/api/classes/${classId}`, classData);
    setState(prev => ({
      ...prev,
      classes: prev.classes.map(classItem =>
        classItem._id === classId ? response.data : classItem
      )
    }));
    setOpenDialog(false);
    setFormData({
      name: '',
      teacherId: '',
      academicYear: '',
      capacity: '',
      section: '',
      stream: ''
    });
  } catch (error) {
    setState(prev => ({
      ...prev,
      error: error.response?.data?.message || 'Failed to update class'
    }));
  }
};

const handleDeleteClass = async (classId) => {
  try {
    console.log(`Deleting class ${classId}`);
    await api.delete(`/api/classes/${classId}`);
    setState(prev => ({
      ...prev,
      classes: prev.classes.filter(classItem => classItem._id !== classId)
    }));
  } catch (error) {
    setState(prev => ({
      ...prev,
      error: error.response?.data?.message || 'Failed to delete class'
    }));
  }
};

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div style={{ padding: '20px' }}>
      {state.loading && <Alert severity="info">Loading...</Alert>}
      {state.error && <Alert severity="error">{state.error}</Alert>}

      {!userIsAdmin && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You need admin privileges to manage classes. Your current role is {user?.role || 'unknown'}.
        </Alert>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Class Management</h2>
        {userIsAdmin && (
          <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>
            Create New Class
          </Button>
        )}
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Class Name</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Academic Year</TableCell>
              <TableCell>Education Level</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.classes.map((classItem) => (
              <TableRow key={classItem._id}>
                <TableCell><SafeDisplay value={classItem.name} /></TableCell>
                <TableCell>
                  {classItem.classTeacher ?
                    <SafeDisplay value={`${classItem.classTeacher.firstName} ${classItem.classTeacher.lastName}`} />
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {classItem.academicYear ? <SafeDisplay value={classItem.academicYear.year} /> : 'N/A'}
                </TableCell>
                <TableCell>
                  <SafeDisplay value={classItem.educationLevel === 'A_LEVEL' ? 'A Level' : 'O Level'} />
                </TableCell>
                <TableCell><SafeDisplay value={classItem.capacity} /></TableCell>
                <TableCell><SafeDisplay value={classItem.section} /></TableCell>
<TableCell>
  {userIsAdmin ? (
    <>
      <Button size="small" color="primary" onClick={() => {
        setFormData({
          name: classItem.name,
          teacherId: classItem.classTeacher ? classItem.classTeacher._id : '',
          academicYear: classItem.academicYear ? classItem.academicYear._id : '',
          capacity: classItem.capacity,
          section: classItem.section,
          stream: classItem.stream,
          educationLevel: classItem.educationLevel || 'O_LEVEL',
          subjectCombination: classItem.subjectCombination ? classItem.subjectCombination._id : ''
        });
        setOpenDialog(true);
      }}>Edit</Button>
      <Button size="small" color="error" onClick={() => handleDeleteClass(classItem._id)}>Delete</Button>
    </>
  ) : (
    <Typography variant="body2" color="text.secondary">No actions available</Typography>
  )}
</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Class</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Class Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Teacher</InputLabel>
            <Select
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
            >
              {state.teachers.map((teacher) => (
                <MenuItem key={teacher._id} value={teacher._id}>
                  <SafeDisplay value={`${teacher.firstName} ${teacher.lastName}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Academic Year</InputLabel>
            <Select
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
            >
              {state.academicYears.map((year) => (
                <MenuItem key={year._id} value={year._id}>
                  <SafeDisplay value={year.year} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Education Level</InputLabel>
            <Select
              value={formData.educationLevel}
              onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
              required
            >
              <MenuItem value="O_LEVEL">O Level</MenuItem>
              <MenuItem value="A_LEVEL">A Level</MenuItem>
            </Select>
          </FormControl>

          {formData.educationLevel === 'A_LEVEL' && (
            <FormControl fullWidth margin="dense">
              <InputLabel>Subject Combination</InputLabel>
              <Select
                value={formData.subjectCombination}
                onChange={(e) => setFormData({ ...formData, subjectCombination: e.target.value })}
                required
              >
                {state.subjectCombinations
                  .filter(combo => combo.educationLevel === 'A_LEVEL')
                  .map((combo) => (
                    <MenuItem key={combo._id} value={combo._id}>
                      <SafeDisplay value={`${combo.name} (${combo.code})`} />
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth margin="dense">
            <InputLabel>Stream</InputLabel>
            <Select
              value={formData.stream}
              onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
              required
            >
              <MenuItem value="SCIENCE">Science</MenuItem>
              <MenuItem value="COMMERCE">Commerce</MenuItem>
              <MenuItem value="ARTS">Arts</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="dense"
            label="Capacity"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Section"
            value={formData.section}
            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateClass} color="primary">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Teacher Subject Assignment Dialog */}
      <TeacherSubjectAssignmentDialog
        open={openTeacherAssignmentDialog}
        onClose={(success) => {
          setOpenTeacherAssignmentDialog(false);
          if (success) {
            // Refresh the data to show updated assignments
            fetchData();
          }
        }}
        classId={newlyCreatedClass?._id}
        className={newlyCreatedClass?.name}
        subjects={subjectsToAssign}
      />
    </div>
  );
};

export default ClassManagement;
