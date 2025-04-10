import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import unifiedApi from '../../../services/unifiedApi';

/**
 * ClassSetup Component
 *
 * A comprehensive component for creating and managing classes for both O-Level and A-Level.
 * This component replaces separate class management forms with a unified approach.
 *
 * @param {Object} props
 * @param {Function} props.onComplete - Function to call when setup is complete
 * @param {boolean} props.standalone - Whether the component is used standalone or as part of a workflow
 */
const ClassSetup = ({ onComplete, standalone = false }) => {
  // State for class form
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    stream: '',
    academicYear: '',
    educationLevel: 'O_LEVEL',
    capacity: 40,
    isActive: true,
    customFields: []
  });

  // State for custom fields
  const [customFields, setCustomFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [showCustomFields, setShowCustomFields] = useState(false);

  // State for classes list
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filter, setFilter] = useState({
    academicYear: '',
    educationLevel: ''
  });

  // Fetch classes and academic years on component mount
  useEffect(() => {
    fetchAcademicYears();
    fetchClasses();
  }, []);

  // Fetch classes when filter changes
  useEffect(() => {
    fetchClasses();
  }, [filter]);

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      setLoading(true);

      const response = await unifiedApi.getAcademicYears();
      setAcademicYears(response);

      // Set default academic year to current
      const currentYear = response.find(year => year.isCurrent);
      if (currentYear) {
        setFormData(prev => ({
          ...prev,
          academicYear: currentYear._id
        }));

        setFilter(prev => ({
          ...prev,
          academicYear: currentYear._id
        }));
      }
    } catch (err) {
      console.error('Error fetching academic years:', err);
      setError('Failed to load academic years. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filter.academicYear) {
        params.append('academicYear', filter.academicYear);
      }
      if (filter.educationLevel) {
        params.append('educationLevel', filter.educationLevel);
      }

      const response = await unifiedApi.get(`/classes?${params.toString()}`);
      setClasses(response);

      // Check if there's at least one class for each education level
      if (!standalone) {
        const oLevelClasses = response.filter(cls => cls.educationLevel === 'O_LEVEL');
        const aLevelClasses = response.filter(cls => cls.educationLevel === 'A_LEVEL');

        if (oLevelClasses.length > 0 && aLevelClasses.length > 0) {
          // Mark step as complete if at least one class exists for each education level
          onComplete && onComplete();
        }
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'capacity') {
      // Ensure capacity is a number
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue > 0) {
        setFormData(prev => ({
          ...prev,
          [name]: numValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    // Update education level filter based on tab
    setFilter(prev => ({
      ...prev,
      educationLevel: newValue === 0 ? '' : newValue === 1 ? 'O_LEVEL' : 'A_LEVEL'
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Validate form data
      if (!formData.name) {
        setError('Class name is required.');
        setLoading(false);
        return;
      }

      if (!formData.academicYear) {
        setError('Academic year is required.');
        setLoading(false);
        return;
      }

      if (editMode) {
        // Update existing class
        await unifiedApi.put(`/classes/${editId}`, formData);
        setSuccess('Class updated successfully.');
      } else {
        // Create new class
        await unifiedApi.post('/classes', formData);
        setSuccess('Class created successfully.');
      }

      // Reset form
      setFormData({
        name: '',
        section: '',
        stream: '',
        academicYear: formData.academicYear, // Keep the selected academic year
        educationLevel: 'O_LEVEL',
        capacity: 40,
        isActive: true,
        customFields: []
      });

      // Reset custom fields state
      setShowCustomFields(false);

      // Reset edit mode
      setEditMode(false);
      setEditId(null);

      // Refresh classes
      await fetchClasses();

      // Check if we have classes for both education levels
      if (!standalone) {
        const oLevelClasses = classes.filter(cls => cls.educationLevel === 'O_LEVEL');
        const aLevelClasses = classes.filter(cls => cls.educationLevel === 'A_LEVEL');

        if (oLevelClasses.length > 0 && aLevelClasses.length > 0) {
          // Mark step as complete
          onComplete && onComplete();
        }
      }
    } catch (err) {
      console.error('Error saving class:', err);
      setError(`Failed to save class: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit class
  const handleEdit = (classObj) => {
    // Set form data
    setFormData({
      name: classObj.name,
      section: classObj.section || '',
      stream: classObj.stream || '',
      academicYear: classObj.academicYear._id || classObj.academicYear,
      educationLevel: classObj.educationLevel,
      capacity: classObj.capacity,
      isActive: classObj.isActive,
      customFields: classObj.customFields || []
    });

    // Show custom fields if there are any
    if (classObj.customFields && classObj.customFields.length > 0) {
      setShowCustomFields(true);
    }

    // Set edit mode
    setEditMode(true);
    setEditId(classObj._id);
  };

  // Handle delete class
  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Delete class
      await unifiedApi.delete(`/classes/${deleteId}`);

      // Close dialog
      setDeleteDialogOpen(false);
      setDeleteId(null);

      // Refresh classes
      await fetchClasses();

      setSuccess('Class deleted successfully.');
    } catch (err) {
      console.error('Error deleting class:', err);
      setError(`Failed to delete class: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    // Reset form
    setFormData({
      name: '',
      section: '',
      stream: '',
      academicYear: formData.academicYear, // Keep the selected academic year
      educationLevel: 'O_LEVEL',
      capacity: 40,
      isActive: true,
      customFields: []
    });

    // Reset custom fields state
    setShowCustomFields(false);

    // Reset edit mode
    setEditMode(false);
    setEditId(null);
  };

  // Handle bulk class creation
  const handleBulkCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate academic year
      if (!formData.academicYear) {
        setError('Academic year is required for bulk creation.');
        setLoading(false);
        return;
      }

      // Create O-Level classes (Form 1-4)
      const oLevelClasses = [];
      for (let form = 1; form <= 4; form++) {
        oLevelClasses.push({
          name: `Form ${form}`,
          academicYear: formData.academicYear,
          educationLevel: 'O_LEVEL',
          capacity: 40,
          isActive: true
        });

        // Add sections A and B for each form
        oLevelClasses.push({
          name: `Form ${form}`,
          section: 'A',
          academicYear: formData.academicYear,
          educationLevel: 'O_LEVEL',
          capacity: 40,
          isActive: true
        });

        oLevelClasses.push({
          name: `Form ${form}`,
          section: 'B',
          academicYear: formData.academicYear,
          educationLevel: 'O_LEVEL',
          capacity: 40,
          isActive: true
        });
      }

      // Create A-Level classes (Form 5-6)
      const aLevelClasses = [];
      for (let form = 5; form <= 6; form++) {
        aLevelClasses.push({
          name: `Form ${form}`,
          academicYear: formData.academicYear,
          educationLevel: 'A_LEVEL',
          capacity: 40,
          isActive: true
        });

        // Add sections for science and arts
        aLevelClasses.push({
          name: `Form ${form}`,
          section: 'Science',
          academicYear: formData.academicYear,
          educationLevel: 'A_LEVEL',
          capacity: 40,
          isActive: true
        });

        aLevelClasses.push({
          name: `Form ${form}`,
          section: 'Arts',
          academicYear: formData.academicYear,
          educationLevel: 'A_LEVEL',
          capacity: 40,
          isActive: true
        });
      }

      // Create all classes
      await unifiedApi.post('/classes/bulk', [...oLevelClasses, ...aLevelClasses]);

      setSuccess('Bulk class creation successful.');

      // Refresh classes
      await fetchClasses();

      // Mark step as complete if not standalone
      if (!standalone) {
        onComplete && onComplete();
      }
    } catch (err) {
      console.error('Error creating bulk classes:', err);
      setError(`Failed to create bulk classes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {standalone && (
        <Typography variant="h5" gutterBottom>
          Class Management
        </Typography>
      )}

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

      {/* Quick Setup */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Setup
        </Typography>

        <Typography variant="body2" paragraph>
          Create all standard classes for both O-Level (Form 1-4) and A-Level (Form 5-6) with one click.
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleInputChange}
                label="Academic Year"
                required
              >
                {academicYears.map((year) => (
                  <MenuItem key={year._id} value={year._id}>
                    {year.name} {year.isCurrent && '(Current)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleBulkCreate}
              disabled={loading || !formData.academicYear}
              startIcon={<AddIcon />}
            >
              Create All Standard Classes
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Class Form */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editMode ? 'Edit Class' : 'Create New Class'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Class Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                helperText="e.g., Form 1, Form 5"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  label="Academic Year"
                  required
                >
                  {academicYears.map((year) => (
                    <MenuItem key={year._id} value={year._id}>
                      {year.name} {year.isCurrent && '(Current)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Section"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                fullWidth
                helperText="e.g., A, B, Science, Arts (optional)"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Stream"
                name="stream"
                value={formData.stream}
                onChange={handleInputChange}
                fullWidth
                helperText="e.g., Day, Boarding (optional)"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleInputChange}
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Education Level</InputLabel>
                <Select
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleInputChange}
                  label="Education Level"
                  required
                >
                  <MenuItem value="O_LEVEL">O-Level</MenuItem>
                  <MenuItem value="A_LEVEL">A-Level</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="Active Class"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                  Custom Fields
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowCustomFields(!showCustomFields)}
                >
                  {showCustomFields ? 'Hide Custom Fields' : 'Add Custom Fields'}
                </Button>
              </Box>

              {showCustomFields && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                      <TextField
                        label="Field Name"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        fullWidth
                        placeholder="e.g., Room Number, Special Notes"
                      />
                    </Grid>

                    <Grid item xs={12} md={5}>
                      <TextField
                        label="Field Value"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        fullWidth
                        placeholder="e.g., 101, Special needs class"
                      />
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={!newFieldName}
                        onClick={() => {
                          // Add custom field to form data
                          const updatedCustomFields = [
                            ...formData.customFields,
                            { name: newFieldName, value: newFieldValue }
                          ];

                          setFormData(prev => ({
                            ...prev,
                            customFields: updatedCustomFields
                          }));

                          // Reset field inputs
                          setNewFieldName('');
                          setNewFieldValue('');
                        }}
                        sx={{ height: '100%' }}
                      >
                        Add Field
                      </Button>
                    </Grid>

                    {formData.customFields.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Current Custom Fields:
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {formData.customFields.map((field, index) => (
                            <Chip
                              key={index}
                              label={`${field.name}: ${field.value}`}
                              onDelete={() => {
                                const updatedFields = formData.customFields.filter((_, i) => i !== index);
                                setFormData(prev => ({
                                  ...prev,
                                  customFields: updatedFields
                                }));
                              }}
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              )}
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {editMode && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editMode ? 'Update Class' : 'Create Class'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Classes List */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Classes
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Academic Year</InputLabel>
              <Select
                name="academicYear"
                value={filter.academicYear}
                onChange={handleFilterChange}
                label="Academic Year"
              >
                <MenuItem value="">All Years</MenuItem>
                {academicYears.map((year) => (
                  <MenuItem key={year._id} value={year._id}>
                    {year.name} {year.isCurrent && '(Current)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="All Classes" />
          <Tab label="O-Level" />
          <Tab label="A-Level" />
        </Tabs>

        {loading && !editMode ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        ) : classes.length === 0 ? (
          <Alert severity="info">
            No classes found. Please create a class.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Stream</TableCell>
                  <TableCell>Academic Year</TableCell>
                  <TableCell>Education Level</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.map((classObj) => (
                  <TableRow key={classObj._id}>
                    <TableCell>{classObj.name}</TableCell>
                    <TableCell>{classObj.section || '-'}</TableCell>
                    <TableCell>{classObj.stream || '-'}</TableCell>
                    <TableCell>
                      {classObj.academicYear?.name || 'Unknown'}
                      {classObj.academicYear?.isCurrent && (
                        <Chip
                          label="Current"
                          color="success"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={classObj.educationLevel === 'O_LEVEL' ? 'O-Level' : 'A-Level'}
                        color={classObj.educationLevel === 'O_LEVEL' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{classObj.capacity}</TableCell>
                    <TableCell>
                      <Chip
                        label={classObj.isActive ? 'Active' : 'Inactive'}
                        color={classObj.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(classObj)}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        color="error"
                        onClick={() => {
                          setDeleteId(classObj._id);
                          setDeleteDialogOpen(true);
                        }}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this class? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

ClassSetup.propTypes = {
  onComplete: PropTypes.func,
  standalone: PropTypes.bool
};

export default ClassSetup;
