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
  IconButton,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const ExamTypeManagement = () => {
  const [examTypes, setExamTypes] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedExamType, setSelectedExamType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMarks: 100,
    isActive: true
  });

  const fetchExamTypes = async () => {
    try {
      const response = await axios.get('/api/exam-types');
      setExamTypes(response.data);
    } catch (error) {
      console.error('Error fetching exam types:', error);
    }
  };

  useEffect(() => {
    fetchExamTypes();
  }, []);

  const handleOpen = (examType = null) => {
    if (examType) {
      setSelectedExamType(examType);
      setFormData({
        name: examType.name,
        description: examType.description || '',
        maxMarks: examType.maxMarks,
        isActive: examType.isActive
      });
    } else {
      setSelectedExamType(null);
      setFormData({
        name: '',
        description: '',
        maxMarks: 100,
        isActive: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedExamType(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedExamType) {
        await axios.put(`/api/exam-types/${selectedExamType._id}`, formData);
      } else {
        await axios.post('/api/exam-types', formData);
      }
      fetchExamTypes();
      handleClose();
    } catch (error) {
      console.error('Error saving exam type:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam type?')) {
      try {
        await axios.delete(`/api/exam-types/${id}`);
        fetchExamTypes();
      } catch (error) {
        console.error('Error deleting exam type:', error);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpen()}
        sx={{ mb: 3 }}
      >
        Add New Exam Type
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Max Marks</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {examTypes.map((examType) => (
              <TableRow key={examType._id}>
                <TableCell>{examType.name}</TableCell>
                <TableCell>{examType.description}</TableCell>
                <TableCell>{examType.maxMarks}</TableCell>
                <TableCell>{examType.isActive ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(examType)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(examType._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {selectedExamType ? 'Edit Exam Type' : 'Add New Exam Type'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            type="number"
            label="Max Marks"
            value={formData.maxMarks}
            onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) })}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedExamType ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamTypeManagement;