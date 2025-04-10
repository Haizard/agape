import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  FormControlLabel,
  Switch,
  Autocomplete,
  IconButton,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
// DatePicker removed in favor of native date input
import api from '../../services/api';

// Separate component for class subjects selection
const ClassSubjectsSelector = ({ cls, fetchClassSubjects, selectedSubjects, onSubjectsChange }) => {
  const [classSubjects, setClassSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch subjects for this class when the component mounts
  useEffect(() => {
    const getSubjects = async () => {
      setLoading(true);
      try {
        const subjects = await fetchClassSubjects(cls._id);
        setClassSubjects(subjects);
      } catch (err) {
        console.error(`Error fetching subjects for class ${cls.name}:`, err);
        setError('Failed to load subjects for this class');
      } finally {
        setLoading(false);
      }
    };
    getSubjects();
  }, [cls._id, cls.name, fetchClassSubjects]);

  return (
    <Grid item xs={12}>
      <Typography variant="subtitle1" gutterBottom>
        Subjects for {cls.name}
      </Typography>
      {loading ? (
        <Alert severity="info" sx={{ mt: 1 }}>
          Loading subjects for this class...
        </Alert>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      ) : classSubjects.length > 0 ? (
        <Autocomplete
          multiple
          options={classSubjects}
          getOptionLabel={(option) => `${option.name} (${option.code})`}
          value={selectedSubjects}
          onChange={(event, newValue) => onSubjectsChange(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Subjects"
              placeholder="Subjects"
              required
            />
          )}
        />
      ) : (
        <Alert severity="warning" sx={{ mt: 1 }}>
          No subjects found for this class. Please assign subjects to this class first.
        </Alert>
      )}
    </Grid>
  );
};

// PropTypes validation for ClassSubjectsSelector
ClassSubjectsSelector.propTypes = {
  cls: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  fetchClassSubjects: PropTypes.func.isRequired,
  selectedSubjects: PropTypes.array.isRequired,
  onSubjectsChange: PropTypes.func.isRequired
};

const ExamCreation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [examTypes, setExamTypes] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState({});
  const [selectedExam, setSelectedExam] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'MID_TERM',
    examType: '',
    academicYear: '',
    term: 'Term 1',
    startDate: null,
    endDate: null,
    status: 'DRAFT'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examTypesRes, academicYearsRes, classesRes, subjectsRes, examsRes] = await Promise.all([
        api.get('/api/exam-types'),
        api.get('/api/academic-years'),
        api.get('/api/classes'),
        api.get('/api/subjects'),
        api.get('/api/exams')
      ]);

      setExamTypes(examTypesRes.data);
      setAcademicYears(academicYearsRes.data);
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
      setExams(examsRes.data);

      // Set default academic year if available
      const activeYear = academicYearsRes.data.find(year => year.isActive);
      if (activeYear) {
        setFormData(prev => ({ ...prev, academicYear: activeYear._id }));
      }

      // Set default exam type if available
      if (examTypesRes.data.length > 0) {
        setFormData(prev => ({ ...prev, examType: examTypesRes.data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setIsEditing(false);
    resetForm();
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditing(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'MID_TERM',
      examType: examTypes.length > 0 ? examTypes[0]._id : '',
      academicYear: academicYears.find(year => year.isActive)?._id || '',
      term: 'Term 1',
      startDate: null,
      endDate: null,
      status: 'DRAFT'
    });
    setSelectedClasses([]);
    setSelectedSubjects({});
    setSelectedExam(null);
  };

  const handleEditExam = (exam) => {
    setIsEditing(true);
    setSelectedExam(exam);

    // Populate form data with exam details
    setFormData({
      name: exam.name || '',
      type: exam.type || 'MID_TERM',
      examType: exam.examType || '',
      academicYear: exam.academicYear || '',
      term: exam.term || 'Term 1',
      startDate: exam.startDate ? new Date(exam.startDate) : null,
      endDate: exam.endDate ? new Date(exam.endDate) : null,
      status: exam.status || 'DRAFT'
    });

    // Populate selected classes and subjects
    if (exam.classes && Array.isArray(exam.classes)) {
      const examClasses = [];
      const examSubjects = {};

      for (const classItem of exam.classes) {
        // Find the full class object
        const fullClass = classes.find(c => c._id === classItem.class);
        if (fullClass) {
          examClasses.push(fullClass);

          // Set up subjects for this class
          if (classItem.subjects && Array.isArray(classItem.subjects)) {
            examSubjects[fullClass._id] = classItem.subjects.map(subjectItem => {
              // Find the full subject object
              return subjects.find(s => s._id === subjectItem.subject) || { _id: subjectItem.subject };
            }).filter(Boolean);
          }
        }
      }

      setSelectedClasses(examClasses);
      setSelectedSubjects(examSubjects);
    }

    setOpenDialog(true);
  };

  const handleViewExam = (exam) => {
    setSelectedExam(exam);
    setOpenViewDialog(true);
  };

  const handleDeleteExam = (exam) => {
    setSelectedExam(exam);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteExam = async () => {
    if (!selectedExam) return;

    setLoading(true);
    try {
      await api.delete(`/api/exams/${selectedExam._id}`);
      setSuccess('Exam deleted successfully');
      fetchData(); // Refresh the data
      setOpenDeleteDialog(false);
      setSelectedExam(null);
    } catch (err) {
      console.error('Error deleting exam:', err);
      setError(err.response?.data?.message || 'Failed to delete exam');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects assigned to a specific class
  const fetchClassSubjects = async (classId) => {
    try {
      console.log(`Fetching subjects for class ${classId}`);
      const response = await api.get(`/api/fixed-subjects/class/${classId}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching subjects for class ${classId}:`, err);
      return [];
    }
  };

  const handleClassChange = async (event, newValue) => {
    setSelectedClasses(newValue);

    // Initialize subject selection for new classes
    const updatedSubjects = { ...selectedSubjects };

    // For each newly selected class, fetch its assigned subjects
    for (const cls of newValue) {
      // Only fetch subjects if this class wasn't previously selected
      if (!updatedSubjects[cls._id]) {
        // Fetch subjects assigned to this class
        const classSubjects = await fetchClassSubjects(cls._id);
        console.log(`Found ${classSubjects.length} subjects for class ${cls.name}:`, classSubjects);

        // Initialize with empty array even if no subjects found
        updatedSubjects[cls._id] = [];
      }
    }

    // Remove classes that are no longer selected
    Object.keys(updatedSubjects).forEach(classId => {
      if (!newValue.some(cls => cls._id === classId)) {
        delete updatedSubjects[classId];
      }
    });

    setSelectedSubjects(updatedSubjects);
  };

  const handleSubjectChange = (classId, event, newValue) => {
    setSelectedSubjects(prev => ({
      ...prev,
      [classId]: newValue
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.type || !formData.academicYear || !formData.term || !formData.examType) {
      setError('Please fill in all required fields including exam type');
      return;
    }

    if (selectedClasses.length === 0) {
      setError('Please select at least one class');
      return;
    }

    // Check if subjects are selected for each class
    const hasEmptySubjects = selectedClasses.some(cls =>
      !selectedSubjects[cls._id] || selectedSubjects[cls._id].length === 0
    );

    if (hasEmptySubjects) {
      setError('Please select at least one subject for each class');
      return;
    }

    setLoading(true);
    try {
      // Get the selected exam type details
      const selectedExamType = examTypes.find(et => et._id === formData.examType);
      if (!selectedExamType) {
        setError('Selected exam type not found. Please select a valid exam type.');
        setLoading(false);
        return;
      }

      console.log('Selected exam type:', selectedExamType);

      // Format the exam data
      const examData = {
        name: formData.name,
        type: formData.type,
        examType: formData.examType, // This is the ObjectId reference to ExamType
        academicYear: formData.academicYear,
        term: formData.term,
        startDate: formData.startDate instanceof Date && !isNaN(formData.startDate) ? formData.startDate.toISOString() : null,
        endDate: formData.endDate instanceof Date && !isNaN(formData.endDate) ? formData.endDate.toISOString() : null,
        status: formData.status,
        classes: selectedClasses.map(cls => ({
          class: cls._id,
          subjects: (selectedSubjects[cls._id] || []).map(subject => ({
            subject: subject._id,
            maxMarks: selectedExamType?.maxMarks || 100
          }))
        }))
      };

      console.log(`${isEditing ? 'Updating' : 'Creating'} exam data:`, JSON.stringify(examData, null, 2));

      try {
        let response;

        if (isEditing && selectedExam) {
          // Update existing exam
          response = await api.put(`/api/exams/${selectedExam._id}`, examData);
          console.log('Exam updated successfully:', response.data);
          setSuccess('Exam updated successfully');
        } else {
          // Create new exam
          response = await api.post('/api/exams', examData);
          console.log('Exam created successfully:', response.data);
          setSuccess('Exam created successfully');
        }

        fetchData(); // Refresh the data
        handleCloseDialog();
      } catch (err) {
        console.error(`Error ${isEditing ? 'updating' : 'creating'} exam:`, err);
        let errorMessage = `Failed to ${isEditing ? 'update' : 'create'} exam`;

        if (err.response) {
          console.error('Error response:', err.response.data);
          errorMessage = err.response.data.message || errorMessage;

          // Check for MongoDB duplicate key error
          if (err.response.data.message && err.response.data.message.includes('duplicate key error')) {
            errorMessage = 'An exam with these details already exists. Please use a different name or type.';
          }
        }

        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error in form validation:', err);
      setError('An unexpected error occurred. Please check your form data.');
    } finally {
      setLoading(false);
    }
  };

  const getExamTypeName = (examTypeId) => {
    const examType = examTypes.find(et => et._id === examTypeId);
    return examType ? examType.name : 'Unknown';
  };

  const getAcademicYearName = (academicYearId) => {
    const academicYear = academicYears.find(ay => ay._id === academicYearId);
    return academicYear ? academicYear.name : 'Unknown';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Exam Management</Typography>
        <Button
          variant="contained"
          onClick={handleOpenDialog}
          disabled={loading}
        >
          Create New Exam
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading && !openDialog ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Exam Type</TableCell>
                <TableCell>Academic Year</TableCell>
                <TableCell>Term</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Classes</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No exams found
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam._id}>
                    <TableCell>{exam.name}</TableCell>
                    <TableCell>{exam.type}</TableCell>
                    <TableCell>{getExamTypeName(exam.examType)}</TableCell>
                    <TableCell>{getAcademicYearName(exam.academicYear)}</TableCell>
                    <TableCell>{exam.term}</TableCell>
                    <TableCell>
                      <Chip
                        label={exam.status}
                        color={
                          exam.status === 'COMPLETED' ? 'success' :
                          exam.status === 'IN_PROGRESS' ? 'warning' :
                          exam.status === 'PUBLISHED' ? 'info' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {exam.classes?.length || 0} classes
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          color="primary"
                          onClick={() => handleViewExam(exam)}
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Exam">
                        <IconButton
                          color="secondary"
                          onClick={() => handleEditExam(exam)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Exam">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteExam(exam)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Exam</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Exam Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Exam Type</InputLabel>
                <Select
                  value={formData.examType}
                  label="Exam Type"
                  onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                >
                  {examTypes.map((examType) => (
                    <MenuItem key={examType._id} value={examType._id}>
                      {examType.name} (Max: {examType.maxMarks})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <MenuItem value="OPEN_TEST">Open Test</MenuItem>
                  <MenuItem value="MID_TERM">Mid Term</MenuItem>
                  <MenuItem value="FINAL">Final</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={formData.academicYear}
                  label="Academic Year"
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                >
                  {academicYears.map((year) => (
                    <MenuItem key={year._id} value={year._id}>
                      {year.name} {year.isActive && '(Active)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Term"
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="PUBLISHED">Published</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value ? new Date(e.target.value) : null })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value ? new Date(e.target.value) : null })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={classes}
                getOptionLabel={(option) => option.name}
                value={selectedClasses}
                onChange={handleClassChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Classes"
                    placeholder="Classes"
                    required
                  />
                )}
              />
            </Grid>
            {selectedClasses.map((cls) => (
                <ClassSubjectsSelector
                  key={cls._id}
                  cls={cls}
                  fetchClassSubjects={fetchClassSubjects}
                  selectedSubjects={selectedSubjects[cls._id] || []}
                  onSubjectsChange={(newValue) => handleSubjectChange(cls._id, null, newValue)}
                />
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Exam'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Exam Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Exam Details</DialogTitle>
        <DialogContent>
          {selectedExam && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Name:</strong> {selectedExam.name}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Type:</strong> {selectedExam.type}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Exam Type:</strong> {getExamTypeName(selectedExam.examType)}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Term:</strong> {selectedExam.term}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Academic Year:</strong> {getAcademicYearName(selectedExam.academicYear)}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Status:</strong> {selectedExam.status}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Start Date:</strong> {selectedExam.startDate && !isNaN(new Date(selectedExam.startDate).getTime()) ? new Date(selectedExam.startDate).toLocaleDateString() : 'Not set'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>End Date:</strong> {selectedExam.endDate && !isNaN(new Date(selectedExam.endDate).getTime()) ? new Date(selectedExam.endDate).toLocaleDateString() : 'Not set'}
                  </Typography>
                </Grid>

                {/* Classes and Subjects */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Classes and Subjects
                  </Typography>

                  {selectedExam.classes && selectedExam.classes.length > 0 ? (
                    selectedExam.classes.map((classItem, index) => {
                      // Find the class name
                      const classObj = classes.find(c => c._id === classItem.class);
                      const className = classObj ? classObj.name : 'Unknown Class';

                      return (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            <strong>Class:</strong> {className}
                          </Typography>

                          {classItem.subjects && classItem.subjects.length > 0 ? (
                            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Subject</TableCell>
                                    <TableCell>Max Marks</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {classItem.subjects.map((subjectItem, subIndex) => {
                                    // Find the subject name
                                    const subjectObj = subjects.find(s => s._id === subjectItem.subject);
                                    const subjectName = subjectObj ? subjectObj.name : 'Unknown Subject';

                                    return (
                                      <TableRow key={subIndex}>
                                        <TableCell>{subjectName}</TableCell>
                                        <TableCell>{subjectItem.maxMarks || 'Not set'}</TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No subjects assigned to this class
                            </Typography>
                          )}
                        </Box>
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No classes assigned to this exam
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the exam "{selectedExam?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDeleteExam} color="error" variant="contained">
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamCreation;
