import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Snackbar, Alert,
  Chip, OutlinedInput, ListItemText, Checkbox, IconButton, Tooltip,
  Switch, FormControlLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../../services/api';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const SubjectCombinationManagement = () => {
  const [combinations, setCombinations] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCombination, setSelectedCombination] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    educationLevel: 'A_LEVEL',
    subjects: [],
    compulsorySubjects: [],
    isActive: true
  });

  useEffect(() => {
    fetchCombinations();
    fetchSubjects();
  }, []);

  const fetchCombinations = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching subject combinations...');
      const response = await api.get('/api/subject-combinations');
      console.log('Subject combinations response:', response.data);
      setCombinations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subject combinations:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      setError('Failed to fetch subject combinations. Please try again.');
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      console.log('Fetching subjects for A_LEVEL and BOTH...');
      // Get subjects with educationLevel A_LEVEL or BOTH
      const response = await api.get('/api/subjects');

      // Filter subjects to include only those with educationLevel A_LEVEL or BOTH
      const filteredSubjects = response.data.filter(subject =>
        subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
      );

      console.log(`Fetched ${filteredSubjects.length} subjects:`, filteredSubjects);
      setSubjects(filteredSubjects);
      return filteredSubjects; // Return the data for potential use by the caller
    } catch (error) {
      console.error('Error fetching subjects:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      setError('Failed to fetch subjects. Please try again.');
      return []; // Return empty array in case of error
    }
  };

  const handleOpenDialog = async (combination = null) => {
    // Refresh subjects list to ensure we have the latest data
    await fetchSubjects();

    if (combination) {
      // Edit mode
      setEditMode(true);
      setSelectedCombination(combination);
      setFormData({
        name: combination.name,
        code: combination.code,
        description: combination.description || '',
        educationLevel: combination.educationLevel || 'A_LEVEL',
        subjects: combination.subjects?.map(s => s._id || s) || [],
        compulsorySubjects: combination.compulsorySubjects?.map(s => s._id || s) || [],
        isActive: combination.isActive !== false // Default to true if not specified
      });
    } else {
      // Create mode
      setEditMode(false);
      setSelectedCombination(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        educationLevel: 'A_LEVEL',
        subjects: [],
        compulsorySubjects: [],
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedCombination(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      educationLevel: 'A_LEVEL',
      subjects: [],
      compulsorySubjects: [],
      isActive: true
    });
  };

  const handleOpenDeleteDialog = (combination) => {
    setSelectedCombination(combination);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedCombination(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubjectsChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      subjects: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleCompulsorySubjectsChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      compulsorySubjects: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (editMode && selectedCombination) {
        // Update existing subject combination
        try {
          const response = await api.put(`/api/subject-combinations/${selectedCombination._id}`, formData);
          console.log('Update response:', response.data);
          setSuccess('Subject combination updated successfully');
          fetchCombinations();
          handleCloseDialog();
        } catch (updateError) {
          console.error('Error updating subject combination:', updateError);
          const errorMessage = updateError.response?.data?.message || 'Failed to update subject combination';
          setError(errorMessage);
        }
      } else {
        // Create new subject combination
        try {
          const response = await api.post('/api/subject-combinations', formData);
          console.log('Create response:', response.data);
          setSuccess('Subject combination created successfully');
          fetchCombinations();
          handleCloseDialog();
        } catch (createError) {
          console.error('Error creating subject combination:', createError);
          const errorMessage = createError.response?.data?.message || 'Failed to create subject combination';
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error('General error in handleSubmit:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/api/subject-combinations/${selectedCombination._id}`);
      fetchCombinations();
      handleCloseDeleteDialog();
      setSuccess('Subject combination deleted successfully');
      setLoading(false);
    } catch (error) {
      console.error('Error deleting subject combination:', error);
      setError('Failed to delete subject combination');
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Subject Combinations</Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchCombinations} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
            Add Subject Combination
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Subjects</TableCell>
                <TableCell>Compulsory Subjects</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {combinations.map((combination) => (
                <TableRow key={combination._id}>
                  <TableCell>{combination.name}</TableCell>
                  <TableCell>{combination.code}</TableCell>
                  <TableCell>
                    {combination.subjects?.map(subject => (
                      <Chip
                        key={subject._id}
                        label={subject.name || subject.code}
                        size="small"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    {combination.compulsorySubjects?.map(subject => (
                      <Chip
                        key={subject._id}
                        label={subject.name || subject.code}
                        size="small"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={combination.isActive ? 'Active' : 'Inactive'}
                      color={combination.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton color="primary" onClick={() => handleOpenDialog(combination)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleOpenDeleteDialog(combination)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {combinations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No subject combinations found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Subject Combination' : 'Add Subject Combination'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Physics, Chemistry, Mathematics"
          />
          <TextField
            fullWidth
            margin="normal"
            label="Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., PCM"
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={2}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Education Level</InputLabel>
            <Select
              name="educationLevel"
              value={formData.educationLevel}
              onChange={handleChange}
            >
              <MenuItem value="A_LEVEL">A Level</MenuItem>
              <MenuItem value="O_LEVEL">O Level</MenuItem>
              <MenuItem value="BOTH">Both</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <InputLabel>Subjects</InputLabel>
              <Tooltip title="Refresh Subjects List">
                <IconButton size="small" onClick={fetchSubjects} sx={{ mt: 1 }}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Select
              multiple
              value={formData.subjects}
              onChange={handleSubjectsChange}
              input={<OutlinedInput label="Subjects" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const subject = subjects.find(s => s._id === value);
                    return <Chip key={value} label={subject ? subject.name : value} />;
                  })}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {subjects.map((subject) => (
                <MenuItem key={subject._id} value={subject._id}>
                  <Checkbox checked={formData.subjects.indexOf(subject._id) > -1} />
                  <ListItemText primary={`${subject.name} (${subject.code})`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <InputLabel>Compulsory Subjects</InputLabel>
              <Tooltip title="Refresh Subjects List">
                <IconButton size="small" onClick={fetchSubjects} sx={{ mt: 1 }}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Select
              multiple
              value={formData.compulsorySubjects}
              onChange={handleCompulsorySubjectsChange}
              input={<OutlinedInput label="Compulsory Subjects" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const subject = subjects.find(s => s._id === value);
                    return <Chip key={value} label={subject ? subject.name : value} />;
                  })}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {subjects.map((subject) => (
                <MenuItem key={subject._id} value={subject._id}>
                  <Checkbox checked={formData.compulsorySubjects.indexOf(subject._id) > -1} />
                  <ListItemText primary={`${subject.name} (${subject.code})`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                color="primary"
              />
            }
            label="Active"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success">
          {success}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the subject combination "{selectedCombination?.name || selectedCombination?.code}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubjectCombinationManagement;
