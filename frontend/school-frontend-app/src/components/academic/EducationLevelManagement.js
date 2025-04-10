import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Snackbar, Alert,
  IconButton, Tooltip, Switch, FormControlLabel, Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../../services/api';

const EducationLevelManagement = () => {
  const [educationLevels, setEducationLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchEducationLevels();
  }, []);

  const fetchEducationLevels = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching education levels...');
      const response = await api.get('/api/education-levels');
      console.log('Education levels response:', response.data);
      setEducationLevels(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching education levels:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      setError('Failed to fetch education levels. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOpenDialog = (level = null) => {
    if (level) {
      // Edit mode
      setEditMode(true);
      setSelectedLevel(level);
      setFormData({
        name: level.name,
        displayName: level.displayName || '',
        description: level.description || '',
        isActive: level.isActive !== false // Default to true if not specified
      });
    } else {
      // Create mode
      setEditMode(false);
      setSelectedLevel(null);
      setFormData({
        name: '',
        displayName: '',
        description: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedLevel(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      isActive: true
    });
  };

  const handleOpenDeleteDialog = (level) => {
    setSelectedLevel(level);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedLevel(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (editMode && selectedLevel) {
        // Update existing education level
        await api.put(`/api/education-levels/${selectedLevel._id}`, formData);
        setSuccess('Education level updated successfully');
      } else {
        // Create new education level
        await api.post('/api/education-levels', formData);
        setSuccess('Education level created successfully');
      }

      fetchEducationLevels();
      handleCloseDialog();
      setLoading(false);
    } catch (error) {
      console.error('Error saving education level:', error);
      setError(editMode ? 'Failed to update education level' : 'Failed to create education level');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/api/education-levels/${selectedLevel._id}`);
      fetchEducationLevels();
      handleCloseDeleteDialog();
      setSuccess('Education level deleted successfully');
      setLoading(false);
    } catch (error) {
      console.error('Error deleting education level:', error);
      setError('Failed to delete education level');
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
        <Typography variant="h5">Education Levels</Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchEducationLevels} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
            Add Education Level
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
                <TableCell>Display Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {educationLevels.map((level) => (
                <TableRow key={level._id}>
                  <TableCell>{level.name}</TableCell>
                  <TableCell>{level.displayName}</TableCell>
                  <TableCell>{level.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={level.isActive ? 'Active' : 'Inactive'}
                      color={level.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton color="primary" onClick={() => handleOpenDialog(level)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleOpenDeleteDialog(level)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {educationLevels.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No education levels found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Education Level' : 'Add Education Level'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal" disabled={editMode}>
            <InputLabel>Name</InputLabel>
            <Select
              name="name"
              value={formData.name}
              onChange={handleChange}
            >
              <MenuItem value="O_LEVEL">O Level</MenuItem>
              <MenuItem value="A_LEVEL">A Level</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Display Name"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="e.g., O Level (Form 1-4)"
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
          />
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
            Are you sure you want to delete the education level "{selectedLevel?.displayName || selectedLevel?.name}"?
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

export default EducationLevelManagement;
