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
  Tooltip,
  Card,
  CardContent,
  Divider,
  Stack,
  Fade
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import SchoolIcon from '@mui/icons-material/School';
import SubjectIcon from '@mui/icons-material/Subject';
import api from '../../services/api';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)'
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: 'none',
  padding: '8px 24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(3)
}));

// Class Subjects Selector Component
const ClassSubjectsSelector = ({ cls, fetchClassSubjects, selectedSubjects, onSubjectsChange }) => {
  const [classSubjects, setClassSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SubjectIcon color="primary" />
        Subjects for {cls.name}
      </Typography>
      {loading ? (
        <Alert severity="info" sx={{ mt: 1 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          Loading subjects...
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
              placeholder="Search subjects..."
              required
              variant="outlined"
              sx={{ mt: 1 }}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={`${option.name} (${option.code})`}
                {...getTagProps({ index })}
                color="primary"
                variant="outlined"
                sx={{ borderRadius: 4 }}
              />
            ))
          }
        />
      ) : (
        <Alert severity="warning" sx={{ mt: 1 }}>
          No subjects found for this class. Please assign subjects first.
        </Alert>
      )}
    </Grid>
  );
};

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
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" sx={{
          fontWeight: 600,
          color: 'primary.main',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: 0,
            width: 60,
            height: 4,
            backgroundColor: 'secondary.main',
            borderRadius: 2
          }
        }}>
          Exam Creation
        </Typography>
        <ActionButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Create New Exam
        </ActionButton>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {exams.map((exam) => (
            <Grid item xs={12} md={6} lg={4} key={exam._id}>
              <Fade in={true}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      {exam.name}
                    </Typography>
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <EventIcon color="action" />
                        <Typography variant="body2">
                          {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <SchoolIcon color="action" />
                        <Typography variant="body2">
                          {exam.academicYear?.name || 'N/A'} - {exam.term}
                        </Typography>
                      </Box>
                      <Chip
                        label={exam.status}
                        color={exam.status === 'ACTIVE' ? 'success' : 'default'}
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        onClick={() => handleViewExam(exam)}
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditExam(exam)}
                        color="secondary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteExam(exam)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </StyledCard>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <StyledDialogTitle>
          {isEditing ? 'Edit Exam' : 'Create New Exam'}
        </StyledDialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Form fields go here */}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      {/* Delete Confirmation Dialog */}
    </Box>
  );
};

export default ExamCreation;
