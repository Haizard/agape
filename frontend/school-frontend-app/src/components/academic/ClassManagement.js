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
  CircularProgress,
  Box,
  Chip,
  FormHelperText
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
    subjectCombination: '', // Legacy field for A_LEVEL classes
    subjectCombinations: [] // New field for multiple subject combinations
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [openTeacherAssignmentDialog, setOpenTeacherAssignmentDialog] = useState(false);
  const [newlyCreatedClass, setNewlyCreatedClass] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);
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
      // Fetch classes first as they are essential
      const classesRes = await api.get(`/classes?page=${page}&limit=${limit}`);
      if (!classesRes.data) {
        throw new Error('Failed to fetch classes data');
      }

      // Fetch additional data in parallel, but don't block on failure
      const [teachersRes, academicYearsRes, subjectCombinationsRes] = await Promise.allSettled([
        api.get('/api/teachers'),
        api.get('/api/academic-years'),
        api.get('/api/subject-combinations')
      ]);

      // Extract data from successful responses, use empty arrays for failed ones
      const teachers = teachersRes.status === 'fulfilled' ? teachersRes.value.data : [];
      const academicYears = academicYearsRes.status === 'fulfilled' ? academicYearsRes.value.data : [];
      const subjectCombinations = subjectCombinationsRes.status === 'fulfilled' ? subjectCombinationsRes.value.data : [];

      console.log('Classes response:', classesRes.data);
      console.log('Teachers response:', teachers);
      console.log('Academic years response:', academicYears);
      console.log('Subject combinations response:', subjectCombinations);

      // Log any failed requests
      if (teachersRes.status === 'rejected') console.error('Failed to fetch teachers:', teachersRes.reason);
      if (academicYearsRes.status === 'rejected') console.error('Failed to fetch academic years:', academicYearsRes.reason);
      if (subjectCombinationsRes.status === 'rejected') console.error('Failed to fetch subject combinations:', subjectCombinationsRes.reason);

      setState(prev => ({
        ...prev,
        classes: classesRes.data,
        teachers: teachers,
        academicYears: academicYears,
        subjectCombinations: subjectCombinations,
        loading: false,
        retryCount: 0,
        error: '' // Clear any previous errors since we have the essential data
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
      academicYear: formData.academicYear,
      capacity: formData.capacity,
      section: formData.section,
      stream: formData.stream,
      educationLevel: formData.educationLevel
    };

    // Only add classTeacher if a teacher is selected (not empty string)
    if (formData.teacherId && formData.teacherId.trim() !== '') {
      classData.classTeacher = formData.teacherId;
    }

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
      academicYear: formData.academicYear,
      capacity: formData.capacity,
      section: formData.section,
      stream: formData.stream,
      educationLevel: formData.educationLevel
    };

    // Only add classTeacher if a teacher is selected (not empty string)
    if (formData.teacherId && formData.teacherId.trim() !== '') {
      classData.classTeacher = formData.teacherId;
    }

    // Add subject combination for A-Level classes
    if (formData.educationLevel === 'A_LEVEL') {
      // Include the legacy field for backward compatibility
      if (formData.subjectCombination) {
        classData.subjectCombination = formData.subjectCombination;
      }

      // Include the new field for multiple combinations
      if (formData.subjectCombinations && formData.subjectCombinations.length > 0) {
        classData.subjectCombinations = formData.subjectCombinations;
      } else if (formData.subjectCombination) {
        // If only legacy field is available, use it for the array too
        classData.subjectCombinations = [formData.subjectCombination];
      }

      console.log('Updating A-Level class with combinations:', classData.subjectCombinations);
    }

    // Get the current class to check if subject combination has changed
    const currentClass = state.classes.find(c => c._id === classId);
    const currentCombinationId = currentClass?.subjectCombination?._id || currentClass?.subjectCombination;

    // If the subject combination has changed, update the subjects
    if (formData.educationLevel === 'A_LEVEL' &&
        formData.subjectCombination &&
        currentCombinationId !== formData.subjectCombination) {

      try {
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
      } catch (error) {
        console.error('Error fetching subject combination:', error);
        // Continue with the update even if we can't get the subjects
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
    // Reset the form and close the dialog
    setOpenDialog(false);
    setEditingClassId(null);
    setFormData({
      name: '',
      teacherId: '',
      academicYear: '',
      capacity: '',
      section: '',
      stream: '',
      educationLevel: 'O_LEVEL',
      subjectCombination: '',
      subjectCombinations: []
    });

    // Show success message
    setState(prev => ({
      ...prev,
      error: ''
    }));

    console.log('Class updated successfully');
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

  // Handle multiple subject combinations selection
  const handleSubjectCombinationsChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      subjectCombinations: value
    }));
  };

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
              <TableCell>Subject Combinations</TableCell>
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
                  {classItem.educationLevel === 'A_LEVEL' && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {classItem.subjectCombinations && classItem.subjectCombinations.length > 0 ? (
                        classItem.subjectCombinations.map((combination) => {
                          const combinationObj = typeof combination === 'object' ? combination : state.subjectCombinations.find(sc => sc._id === combination);
                          return (
                            <Chip
                              key={typeof combination === 'object' ? combination._id : combination}
                              label={combinationObj ? `${combinationObj.code}` : 'Unknown'}
                              size="small"
                              color="info"
                              sx={{ mr: 0.5 }}
                            />
                          );
                        })
                      ) : classItem.subjectCombination ? (
                        <Chip
                          label={typeof classItem.subjectCombination === 'object' ?
                            classItem.subjectCombination.code :
                            state.subjectCombinations.find(sc => sc._id === classItem.subjectCombination)?.code || 'Unknown'}
                          size="small"
                          color="primary"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">None</Typography>
                      )}
                    </Box>
                  )}
                  {classItem.educationLevel === 'O_LEVEL' && (
                    <Typography variant="body2" color="text.secondary">N/A</Typography>
                  )}
                </TableCell>
<TableCell>
  {userIsAdmin ? (
    <>
      <Button size="small" color="primary" onClick={() => {
        // Prepare subjectCombinations array
        let subjectCombinations = [];
        if (classItem.subjectCombinations && Array.isArray(classItem.subjectCombinations)) {
          subjectCombinations = classItem.subjectCombinations.map(combo =>
            typeof combo === 'object' ? combo._id : combo
          );
        } else if (classItem.subjectCombination) {
          // If only legacy field is available, use it
          subjectCombinations = [typeof classItem.subjectCombination === 'object' ?
            classItem.subjectCombination._id : classItem.subjectCombination];
        }

        console.log('Editing class with subjectCombinations:', subjectCombinations);

        // Set the editing class ID
        setEditingClassId(classItem._id);

        setFormData({
          name: classItem.name,
          teacherId: classItem.classTeacher ? classItem.classTeacher._id : '',
          academicYear: classItem.academicYear ? classItem.academicYear._id : '',
          capacity: classItem.capacity,
          section: classItem.section,
          stream: classItem.stream,
          educationLevel: classItem.educationLevel || 'O_LEVEL',
          subjectCombination: classItem.subjectCombination ?
            (typeof classItem.subjectCombination === 'object' ? classItem.subjectCombination._id : classItem.subjectCombination) : '',
          subjectCombinations: subjectCombinations
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

      <Dialog open={openDialog} onClose={() => {
        setOpenDialog(false);
        setEditingClassId(null);
        setFormData({
          name: '',
          teacherId: '',
          academicYear: '',
          capacity: '',
          section: '',
          stream: '',
          educationLevel: 'O_LEVEL',
          subjectCombination: '',
          subjectCombinations: []
        });
      }}>
        <DialogTitle>{editingClassId ? 'Edit Class' : 'Create New Class'}</DialogTitle>
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
            <>
              <FormControl fullWidth margin="dense">
                <InputLabel>Subject Combination (Legacy)</InputLabel>
                <Select
                  value={formData.subjectCombination}
                  onChange={(e) => setFormData({ ...formData, subjectCombination: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {state.subjectCombinations
                    .filter(combo => combo.educationLevel === 'A_LEVEL')
                    .map((combo) => (
                      <MenuItem key={combo._id} value={combo._id}>
                        <SafeDisplay value={`${combo.name} (${combo.code})`} />
                      </MenuItem>
                    ))}
                </Select>
                <FormHelperText>This is for backward compatibility. Use the multiple selector below for new classes.</FormHelperText>
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>Subject Combinations</InputLabel>
                <Select
                  multiple
                  value={formData.subjectCombinations}
                  onChange={handleSubjectCombinationsChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const combination = state.subjectCombinations.find(sc => sc._id === value);
                        return (
                          <Chip
                            key={value}
                            label={combination ? `${combination.code}` : value}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {state.subjectCombinations
                    .filter(combo => combo.educationLevel === 'A_LEVEL')
                    .map((combo) => (
                      <MenuItem key={combo._id} value={combo._id}>
                        <SafeDisplay value={`${combo.name} (${combo.code})`} />
                      </MenuItem>
                    ))}
                </Select>
                <FormHelperText>
                  Select multiple subject combinations for this A-Level class. Students will be assigned to specific combinations later.
                </FormHelperText>
              </FormControl>
            </>
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
          <Button onClick={() => {
            setOpenDialog(false);
            setEditingClassId(null);
            setFormData({
              name: '',
              teacherId: '',
              academicYear: '',
              capacity: '',
              section: '',
              stream: '',
              educationLevel: 'O_LEVEL',
              subjectCombination: '',
              subjectCombinations: []
            });
          }}>Cancel</Button>

          {/* Determine if we're editing an existing class or creating a new one */}
          {editingClassId ? (
            <Button
              onClick={() => handleUpdateClass(editingClassId)}
              color="primary"
            >
              Update
            </Button>
          ) : (
            <Button onClick={handleCreateClass} color="primary">Create</Button>
          )}
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
