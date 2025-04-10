import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const ParentContactManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [parentContacts, setParentContacts] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentContact, setCurrentContact] = useState({
    studentId: '',
    parentName: '',
    phoneNumber: '',
    relationship: 'Guardian'
  });

  useEffect(() => {
    fetchParentContacts();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsByClass();
    }
  }, [selectedClass]);

  const fetchParentContacts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/parent-contacts');
      setParentContacts(response.data);
    } catch (err) {
      setError('Failed to fetch parent contacts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/classes');
      setClasses(response.data);
    } catch (err) {
      setError('Failed to fetch classes');
      console.error(err);
    }
  };

  const fetchStudentsByClass = async () => {
    try {
      const response = await axios.get(`/api/students/class/${selectedClass}`);
      setStudents(response.data);
    } catch (err) {
      setError('Failed to fetch students');
      console.error(err);
    }
  };

  const handleOpenDialog = (contact = null) => {
    if (contact) {
      setCurrentContact({
        id: contact._id,
        studentId: contact.studentId._id,
        parentName: contact.parentName,
        phoneNumber: contact.phoneNumber,
        relationship: contact.relationship
      });
      setIsEditing(true);
    } else {
      setCurrentContact({
        studentId: '',
        parentName: '',
        phoneNumber: '',
        relationship: 'Guardian'
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentContact({
      studentId: '',
      parentName: '',
      phoneNumber: '',
      relationship: 'Guardian'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentContact(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!currentContact.studentId) {
      setError('Student is required');
      return false;
    }
    if (!currentContact.parentName) {
      setError('Parent name is required');
      return false;
    }
    if (!currentContact.phoneNumber) {
      setError('Phone number is required');
      return false;
    }
    // Basic phone number validation
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(currentContact.phoneNumber)) {
      setError('Invalid phone number format');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isEditing) {
        // Update existing contact
        await axios.put(`/api/parent-contacts/${currentContact.id}`, {
          parentName: currentContact.parentName,
          phoneNumber: currentContact.phoneNumber,
          relationship: currentContact.relationship
        });
        setSuccess('Parent contact updated successfully');
      } else {
        // Create new contact
        await axios.post('/api/parent-contacts', currentContact);
        setSuccess('Parent contact added successfully');
      }
      
      // Refresh the list
      fetchParentContacts();
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save parent contact');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this parent contact?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.delete(`/api/parent-contacts/${id}`);
      setSuccess('Parent contact deleted successfully');
      
      // Refresh the list
      fetchParentContacts();
    } catch (err) {
      setError('Failed to delete parent contact');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Parent Contact Management</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Class</InputLabel>
            <Select
              value={selectedClass}
              label="Filter by Class"
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <MenuItem value="">All Classes</MenuItem>
              {classes.map((cls) => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.name} {cls.section}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Parent Contact
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Parent Name</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Relationship</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parentContacts.length > 0 ? (
                  parentContacts.map((contact) => (
                    <TableRow key={contact._id}>
                      <TableCell>
                        {contact.studentId.firstName} {contact.studentId.lastName}
                      </TableCell>
                      <TableCell>{contact.studentId.rollNumber}</TableCell>
                      <TableCell>
                        {contact.studentId.class?.name} {contact.studentId.class?.section}
                      </TableCell>
                      <TableCell>{contact.parentName}</TableCell>
                      <TableCell>{contact.phoneNumber}</TableCell>
                      <TableCell>{contact.relationship}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(contact)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(contact._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No parent contacts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Parent Contact' : 'Add Parent Contact'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Student</InputLabel>
                <Select
                  name="studentId"
                  value={currentContact.studentId}
                  label="Student"
                  onChange={handleInputChange}
                  disabled={isEditing}
                >
                  {students.map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.firstName} {student.lastName} ({student.rollNumber})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Parent Name"
                name="parentName"
                value={currentContact.parentName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={currentContact.phoneNumber}
                onChange={handleInputChange}
                helperText="Format: +255XXXXXXXXX or 0XXXXXXXXX"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Relationship</InputLabel>
                <Select
                  name="relationship"
                  value={currentContact.relationship}
                  label="Relationship"
                  onChange={handleInputChange}
                >
                  <MenuItem value="Father">Father</MenuItem>
                  <MenuItem value="Mother">Mother</MenuItem>
                  <MenuItem value="Guardian">Guardian</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
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
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParentContactManagement;
