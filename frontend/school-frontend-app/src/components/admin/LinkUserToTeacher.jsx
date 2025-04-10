import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  TextField,
  Alert,
  Typography,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import api from '../../services/api';

const LinkUserToTeacher = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    employeeId: '',
    status: 'active'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching users with role=teacher and withoutTeacherProfile=true...');
      const response = await api.get('/api/users', {
        params: { role: 'teacher', withoutTeacherProfile: true }
      });
      console.log('Users response:', response.data);
      setUsers(response.data);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching users:', err);
      let errorMessage = 'Failed to fetch users';
      if (err.response) {
        errorMessage = err.response.data?.message || err.response.statusText || errorMessage;
      } else if (err.request) {
        errorMessage = 'No response received from server. Please check your network connection.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUserSelect = (e) => {
    const userId = e.target.value;
    const user = users.find(u => u._id === userId);
    if (user) {
      setFormData({
        ...formData,
        userId: user._id,
        email: user.email,
        employeeId: user.username || ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Submitting teacher profile data:', formData);

      const response = await api.post('/api/teachers/create-profile', formData);
      console.log('Teacher profile creation response:', response.data);

      setSuccess('Teacher profile created successfully!');
      setFormData({
        userId: '',
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        employeeId: '',
        status: 'active'
      });
      setOpenDialog(false);
      fetchUsers();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      let errorMessage = 'Failed to create teacher profile';

      // Extract more detailed error message if available
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setSelectedUser(null);
    setFormData({
      userId: '',
      firstName: '',
      lastName: '',
      email: '',
      contactNumber: '',
      employeeId: '',
      status: 'active'
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      userId: '',
      firstName: '',
      lastName: '',
      email: '',
      contactNumber: '',
      employeeId: '',
      status: 'active'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Link Users to Teacher Profiles
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Create Teacher Profile
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.status}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setSelectedUser(user);
                        setFormData({
                          userId: user._id,
                          firstName: '',
                          lastName: '',
                          email: user.email,
                          contactNumber: '',
                          employeeId: user.username || '',
                          status: 'active'
                        });
                        setOpenDialog(true);
                      }}
                    >
                      Create Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No teacher users without profiles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedUser ? `Create Teacher Profile for ${selectedUser.username}` : 'Create Teacher Profile'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {!selectedUser && (
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="user-select-label">Select User</InputLabel>
                    <Select
                      labelId="user-select-label"
                      id="user-select"
                      value={formData.userId}
                      label="Select User"
                      onChange={handleUserSelect}
                    >
                      {users.map((user) => (
                        <MenuItem key={user._id} value={user._id}>
                          {user.username} ({user.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={selectedUser}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="outlined"
                onClick={handleCloseDialog}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Teacher Profile'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LinkUserToTeacher;
