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
  Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';

const AssessmentManagement = () => {
  // State for assessments
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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

  // Fetch assessments on component mount
  useEffect(() => {
    fetchAssessments();
  }, []);

  // Fetch all assessments
  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/assessments');
      setAssessments(response.data);
    } catch (error) {
      setError('Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  };

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
    setLoading(true);
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
        await axios.post('/api/assessments', formData);
        setSuccess('Assessment created successfully');
      } else {
        await axios.put(`/api/assessments/${selectedAssessment._id}`, formData);
        setSuccess('Assessment updated successfully');
      }

      handleCloseDialog();
      fetchAssessments();
    } catch (error) {
      setError(error.message || 'Failed to save assessment');
    } finally {
      setLoading(false);
    }
  };

  // Handle assessment deletion
  const handleDelete = async (assessmentId) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`/api/assessments/${assessmentId}`);
      setSuccess('Assessment deleted successfully');
      fetchAssessments();
    } catch (error) {
      setError('Failed to delete assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Assessment Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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

export default AssessmentManagement;