import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useAssessment } from '../../contexts/AssessmentContext';

const AssessmentList = () => {
  // Get assessment context
  const { 
    assessments, 
    loading, 
    error: contextError,
    toggleAssessmentVisibility, 
    updateAssessmentOrder,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    fetchAssessments
  } = useAssessment();

  // Add useEffect to fetch assessments on mount
  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Handle visibility toggle
  const handleVisibilityToggle = async (assessmentId, isVisible) => {
    try {
      const result = await toggleAssessmentVisibility(assessmentId, isVisible);
      if (result.success) {
        setSuccess(`Assessment ${isVisible ? 'activated' : 'deactivated'} successfully`);
      } else {
        setError(result.error || 'Failed to update assessment visibility');
      }
    } catch (error) {
      setError('Failed to update assessment visibility');
    }
  };

  // Handle order update
  const handleOrderUpdate = async (assessmentId, newOrder) => {
    try {
      const result = await updateAssessmentOrder(assessmentId, newOrder);
      if (result.success) {
        setSuccess('Assessment order updated successfully');
      } else {
        setError(result.error || 'Failed to update assessment order');
      }
    } catch (error) {
      setError('Failed to update assessment order');
    }
  };
  
  // State for dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    weightage: '',
    maxMarks: 100,
    term: '1',
    examDate: '',
    status: 'active'
  });



  // Handle dialog open
  const handleOpenDialog = (mode, assessment = null) => {
    setDialogMode(mode);
    if (assessment) {
      setSelectedAssessment(assessment);
      setFormData({
        name: assessment.name,
        weightage: assessment.weightage,
        maxMarks: assessment.maxMarks,
        term: assessment.term,
        examDate: assessment.examDate,
        status: assessment.status
      });
    } else {
      setSelectedAssessment(null);
      setFormData({
        name: '',
        weightage: '',
        maxMarks: 100,
        term: '1',
        examDate: '',
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAssessment(null);
    setFormData({
      name: '',
      weightage: '',
      maxMarks: 100,
      term: '1',
      examDate: '',
      status: 'active'
    });
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validate total weightage
      const totalWeightage = assessments.reduce((sum, assessment) => {
        if (selectedAssessment && assessment._id === selectedAssessment._id) {
          return sum;
        }
        return sum + Number(assessment.weightage);
      }, Number(formData.weightage));

      if (totalWeightage > 100) {
        throw new Error('Total weightage cannot exceed 100%');
      }

      if (dialogMode === 'create') {
        const result = await createAssessment(formData);
        if (result.success) {
          setSuccess('Assessment created successfully');
          handleCloseDialog();
        } else {
          setError(result.error || 'Failed to create assessment');
        }
      } else {
        const result = await updateAssessment(selectedAssessment._id, formData);
        if (result.success) {
          setSuccess('Assessment updated successfully');
          handleCloseDialog();
        } else {
          setError(result.error || 'Failed to update assessment');
        }
      }
    } catch (error) {
      setError(error.message || 'Failed to save assessment');
    }
  };

  // Handle assessment deletion
  const handleDelete = async (assessmentId) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) {
      return;
    }

    try {
      const result = await deleteAssessment(assessmentId);
      if (result.success) {
        setSuccess('Assessment deleted successfully');
      } else {
        setError(result.error || 'Failed to delete assessment');
      }
    } catch (error) {
      setError('Failed to delete assessment');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Assessment Management
      </Typography>

      {(error || contextError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || contextError}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenDialog('create')}
        sx={{ mb: 3 }}
      >
        Add New Assessment
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Weightage (%)</TableCell>
              <TableCell>Max Marks</TableCell>
              <TableCell>Term</TableCell>
              <TableCell>Exam Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Display Order</TableCell>
              <TableCell>Visibility</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : assessments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No assessments found
                </TableCell>
              </TableRow>
            ) : (
              assessments.map((assessment) => (
                <TableRow key={assessment._id}>
                  <TableCell>{assessment.name}</TableCell>
                  <TableCell>{assessment.weightage}%</TableCell>
                  <TableCell>{assessment.maxMarks}</TableCell>
                  <TableCell>{assessment.term}</TableCell>
                  <TableCell>
                    {new Date(assessment.examDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{assessment.status}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={assessment.displayOrder || 0}
                      onChange={(e) => handleOrderUpdate(assessment._id, parseInt(e.target.value))}
                      inputProps={{ min: 0 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color={assessment.isVisible ? 'success' : 'warning'}
                      onClick={() => handleVisibilityToggle(assessment._id, !assessment.isVisible)}
                      size="small"
                    >
                      {assessment.isVisible ? 'Visible' : 'Hidden'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        onClick={() => handleOpenDialog('edit', assessment)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => handleDelete(assessment._id)}
                        size="small"
                        color="error"
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Add New Assessment' : 'Edit Assessment'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assessment Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weightage (%)"
                name="weightage"
                type="number"
                value={formData.weightage}
                onChange={handleInputChange}
                required
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Marks"
                name="maxMarks"
                type="number"
                value={formData.maxMarks}
                onChange={handleInputChange}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Term</InputLabel>
                <Select
                  name="term"
                  value={formData.term}
                  onChange={handleInputChange}
                  label="Term"
                  required
                >
                  <MenuItem value="1">Term 1</MenuItem>
                  <MenuItem value="2">Term 2</MenuItem>
                  <MenuItem value="3">Term 3</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Exam Date"
                name="examDate"
                type="date"
                value={formData.examDate}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Status"
                  required
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssessmentList;