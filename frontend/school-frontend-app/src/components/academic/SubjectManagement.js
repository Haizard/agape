import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import api from '../../services/api';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    educationLevel: 'BOTH', // Default to BOTH so it works for both O_LEVEL and A_LEVEL
    type: 'CORE',
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to access this page');
      return;
    }

    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching subjects...');
      const response = await api.get('/api/subjects');
      console.log('Subjects fetched successfully:', response.data);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      let errorMessage = 'Failed to fetch subjects';

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection.';
      } else if (error.response) {
        // The server responded with a status code outside the 2xx range
        errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || error.message}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your network connection.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (subject = null) => {
    if (subject) {
      setSelectedSubject(subject);
      setFormData({
        name: subject.name,
        code: subject.code,
        description: subject.description || '',
        educationLevel: subject.educationLevel || 'BOTH',
        type: subject.type || 'CORE',
      });
    } else {
      setSelectedSubject(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        educationLevel: 'BOTH', // Default to BOTH so it works for both O_LEVEL and A_LEVEL
        type: 'CORE',
      });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedSubject) {
        await api.put(`/api/subjects/${selectedSubject._id}`, formData);
      } else {
        await api.post('/api/subjects', formData);
      }
      setOpenDialog(false);
      fetchSubjects();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      let errorMessage = selectedSubject ? 'Failed to update subject' : 'Failed to create subject';

      // Extract more detailed error message if available
      if (error.response?.data) {
        errorMessage = error.response.data.message || errorMessage;
        console.log('Server error details:', error.response.data);
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/subjects/${subjectId}`);
      setSubjects(subjects.filter(s => s._id !== subjectId));
    } catch (error) {
      console.error('Error in handleDelete:', error);
      let errorMessage = 'Failed to delete subject';

      // Extract more detailed error message if available
      if (error.response?.data) {
        errorMessage = error.response.data.message || errorMessage;
        console.log('Server error details:', error.response.data);
      }

      setError(errorMessage);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Subject Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button
            size="small"
            onClick={fetchSubjects}
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      <Button
        variant="contained"
        onClick={() => handleOpenDialog()}
        sx={{ mb: 3 }}
      >
        Create New Subject
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Subject Code</TableCell>
              <TableCell>Subject Name</TableCell>
              <TableCell>Education Level</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject._id}>
                <TableCell>{subject.code}</TableCell>
                <TableCell>{subject.name}</TableCell>
                <TableCell>{subject.educationLevel || 'O_LEVEL'}</TableCell>
                <TableCell>{subject.type || 'CORE'}</TableCell>
                <TableCell>{subject.description}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(subject)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(subject._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {selectedSubject ? 'Edit Subject' : 'Create New Subject'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Subject Code"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Subject Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Education Level</InputLabel>
              <Select
                value={formData.educationLevel}
                label="Education Level"
                onChange={(e) => setFormData({...formData, educationLevel: e.target.value})}
              >
                <MenuItem value="O_LEVEL">O Level</MenuItem>
                <MenuItem value="A_LEVEL">A Level</MenuItem>
                <MenuItem value="BOTH">Both Levels</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Subject Type</InputLabel>
              <Select
                value={formData.type}
                label="Subject Type"
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <MenuItem value="CORE">Core</MenuItem>
                <MenuItem value="OPTIONAL">Optional</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              multiline
              rows={4}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {selectedSubject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubjectManagement;
