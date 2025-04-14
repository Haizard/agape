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
  Book as BookIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import unifiedApi from '../../../services/unifiedApi';

/**
 * SubjectSetup Component
 *
 * A comprehensive component for creating and managing subjects for both O-Level and A-Level.
 * This component replaces separate subject management forms with a unified approach.
 *
 * @param {Object} props
 * @param {Function} props.onComplete - Function to call when setup is complete
 * @param {boolean} props.standalone - Whether the component is used standalone or as part of a workflow
 */
const SubjectSetup = ({ onComplete, standalone = false }) => {
  // State for subject form
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    educationLevel: 'O_LEVEL',
    isCompulsory: false,
    isPrincipal: false,
    description: '',
    customFields: []
  });

  // State for custom fields
  const [customFields, setCustomFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [showCustomFields, setShowCustomFields] = useState(false);

  // State for subjects list
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filter, setFilter] = useState({
    educationLevel: ''
  });

  // Fetch subjects on component mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Fetch subjects when filter changes
  useEffect(() => {
    fetchSubjects();
  }, [filter]);

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filter.educationLevel) {
        params.append('educationLevel', filter.educationLevel);
      }

      // Try multiple endpoint formats to handle potential URL issues
      let response;
      const endpoints = [
        `subjects?${params.toString()}`,
        `/subjects?${params.toString()}`,
        `/api/subjects?${params.toString()}`,
        `api/subjects?${params.toString()}`
      ];

      console.log('Trying endpoints:', endpoints);

      // Try each endpoint until one works
      let lastError;
      for (const endpoint of endpoints) {
        try {
          console.log('Trying endpoint:', endpoint);
          response = await unifiedApi.get(endpoint);
          console.log('Success with endpoint:', endpoint);
          break; // Exit the loop if successful
        } catch (endpointError) {
          console.error(`Error with endpoint ${endpoint}:`, endpointError);
          lastError = endpointError;
          // Continue to the next endpoint
        }
      }

      // If all endpoints failed, throw the last error
      if (!response) {
        throw lastError || new Error('All endpoints failed');
      }

      // Extract data from the response
      const subjectsData = response || [];
      console.log('Fetched subjects:', subjectsData);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);

      // Check if there's at least one subject for each education level
      if (!standalone) {
        const oLevelSubjects = Array.isArray(subjectsData) ? subjectsData.filter(subj => subj && subj.educationLevel === 'O_LEVEL') : [];
        const aLevelSubjects = Array.isArray(subjectsData) ? subjectsData.filter(subj => subj && subj.educationLevel === 'A_LEVEL') : [];

        if (oLevelSubjects.length > 0 && aLevelSubjects.length > 0) {
          // Mark step as complete if at least one subject exists for each education level
          onComplete?.();
        }
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError(`Failed to load subjects: ${err.message}. Please try again.`);
      // Set subjects to empty array to prevent map errors
      setSubjects([]);
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
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // If education level changes to O-Level, reset isPrincipal
    if (name === 'educationLevel' && value === 'O_LEVEL') {
      setFormData(prev => ({
        ...prev,
        isPrincipal: false
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
        setError('Subject name is required.');
        setLoading(false);
        return;
      }

      if (!formData.code) {
        setError('Subject code is required.');
        setLoading(false);
        return;
      }

      if (editMode) {
        // Update existing subject
        await unifiedApi.put(`/subjects/${editId}`, formData);
        setSuccess('Subject updated successfully.');
      } else {
        // Create new subject
        await unifiedApi.post('/subjects', formData);
        setSuccess('Subject created successfully.');
      }

      // Reset form
      setFormData({
        name: '',
        code: '',
        educationLevel: formData.educationLevel, // Keep the selected education level
        isCompulsory: false,
        isPrincipal: false,
        description: '',
        customFields: []
      });

      // Reset custom fields state
      setShowCustomFields(false);

      // Reset edit mode
      setEditMode(false);
      setEditId(null);

      // Refresh subjects
      await fetchSubjects();

      // Check if we have subjects for both education levels
      if (!standalone) {
        const oLevelSubjects = subjects.filter(subj => subj.educationLevel === 'O_LEVEL');
        const aLevelSubjects = subjects.filter(subj => subj.educationLevel === 'A_LEVEL');

        if (oLevelSubjects.length > 0 && aLevelSubjects.length > 0) {
          // Mark step as complete
          onComplete?.();
        }
      }
    } catch (err) {
      console.error('Error saving subject:', err);
      setError(`Failed to save subject: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit subject
  const handleEdit = (subject) => {
    // Set form data
    setFormData({
      name: subject.name,
      code: subject.code,
      educationLevel: subject.educationLevel,
      isCompulsory: subject.isCompulsory,
      isPrincipal: subject.isPrincipal,
      description: subject.description || '',
      customFields: subject.customFields || []
    });

    // Show custom fields if there are any
    if (subject.customFields && subject.customFields.length > 0) {
      setShowCustomFields(true);
    }

    // Set edit mode
    setEditMode(true);
    setEditId(subject._id);
  };

  // Handle delete subject
  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Delete subject
      await unifiedApi.delete(`/subjects/${deleteId}`);

      // Close dialog
      setDeleteDialogOpen(false);
      setDeleteId(null);

      // Refresh subjects
      await fetchSubjects();

      setSuccess('Subject deleted successfully.');
    } catch (err) {
      console.error('Error deleting subject:', err);
      setError(`Failed to delete subject: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    // Reset form
    setFormData({
      name: '',
      code: '',
      educationLevel: formData.educationLevel, // Keep the selected education level
      isCompulsory: false,
      isPrincipal: false,
      description: '',
      customFields: []
    });

    // Reset custom fields state
    setShowCustomFields(false);

    // Reset edit mode
    setEditMode(false);
    setEditId(null);
  };

  // Handle bulk subject creation
  const handleBulkCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create O-Level subjects
      const oLevelSubjects = [
        { name: 'Mathematics', code: 'MATH', educationLevel: 'O_LEVEL', isCompulsory: true },
        { name: 'English', code: 'ENG', educationLevel: 'O_LEVEL', isCompulsory: true },
        { name: 'Kiswahili', code: 'KIS', educationLevel: 'O_LEVEL', isCompulsory: true },
        { name: 'Physics', code: 'PHY', educationLevel: 'O_LEVEL', isCompulsory: false },
        { name: 'Chemistry', code: 'CHEM', educationLevel: 'O_LEVEL', isCompulsory: false },
        { name: 'Biology', code: 'BIO', educationLevel: 'O_LEVEL', isCompulsory: false },
        { name: 'History', code: 'HIST', educationLevel: 'O_LEVEL', isCompulsory: false },
        { name: 'Geography', code: 'GEO', educationLevel: 'O_LEVEL', isCompulsory: false },
        { name: 'Civics', code: 'CIV', educationLevel: 'O_LEVEL', isCompulsory: false },
        { name: 'Book Keeping', code: 'BK', educationLevel: 'O_LEVEL', isCompulsory: false },
        { name: 'Commerce', code: 'COM', educationLevel: 'O_LEVEL', isCompulsory: false },
        { name: 'Bible Knowledge', code: 'BK', educationLevel: 'O_LEVEL', isCompulsory: false }
      ];

      // Create A-Level subjects
      const aLevelSubjects = [
        { name: 'Advanced Mathematics', code: 'A-MATH', educationLevel: 'A_LEVEL', isCompulsory: false, isPrincipal: true },
        { name: 'Physics', code: 'A-PHY', educationLevel: 'A_LEVEL', isCompulsory: false, isPrincipal: true },
        { name: 'Chemistry', code: 'A-CHEM', educationLevel: 'A_LEVEL', isCompulsory: false, isPrincipal: true },
        { name: 'Biology', code: 'A-BIO', educationLevel: 'A_LEVEL', isCompulsory: false, isPrincipal: true },
        { name: 'History', code: 'A-HIST', educationLevel: 'A_LEVEL', isCompulsory: false, isPrincipal: true },
        { name: 'Geography', code: 'A-GEO', educationLevel: 'A_LEVEL', isCompulsory: false, isPrincipal: true },
        { name: 'Economics', code: 'A-ECON', educationLevel: 'A_LEVEL', isCompulsory: false, isPrincipal: true },
        { name: 'Kiswahili', code: 'A-KIS', educationLevel: 'A_LEVEL', isCompulsory: false, isPrincipal: true },
        { name: 'English', code: 'A-ENG', educationLevel: 'A_LEVEL', isCompulsory: true, isPrincipal: false },
        { name: 'General Studies', code: 'GS', educationLevel: 'A_LEVEL', isCompulsory: true, isPrincipal: false },
        { name: 'Basic Applied Mathematics', code: 'BAM', educationLevel: 'A_LEVEL', isCompulsory: false, isPrincipal: false }
      ];

      // Create all subjects
      await unifiedApi.post('/subjects/bulk', [...oLevelSubjects, ...aLevelSubjects]);

      setSuccess('Bulk subject creation successful.');

      // Refresh subjects
      await fetchSubjects();

      // Mark step as complete if not standalone
      if (!standalone) {
        onComplete?.();
      }
    } catch (err) {
      console.error('Error creating bulk subjects:', err);
      setError(`Failed to create bulk subjects: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {standalone && (
        <Typography variant="h5" gutterBottom>
          Subject Management
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
          Create all standard subjects for both O-Level and A-Level with one click.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={handleBulkCreate}
          disabled={loading}
          startIcon={<AddIcon />}
        >
          Create All Standard Subjects
        </Button>
      </Paper>

      {/* Subject Form */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editMode ? 'Edit Subject' : 'Create New Subject'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Subject Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                helperText="e.g., Mathematics, Physics"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Subject Code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                fullWidth
                required
                helperText="e.g., MATH, PHY"
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isCompulsory}
                      onChange={handleInputChange}
                      name="isCompulsory"
                      color="primary"
                    />
                  }
                  label="Compulsory Subject"
                />

                {formData.educationLevel === 'A_LEVEL' && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isPrincipal}
                        onChange={handleInputChange}
                        name="isPrincipal"
                        color="secondary"
                      />
                    }
                    label="Principal Subject (A-Level only)"
                  />
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
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
                        placeholder="e.g., Credits, Department, Prerequisites"
                      />
                    </Grid>

                    <Grid item xs={12} md={5}>
                      <TextField
                        label="Field Value"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        fullWidth
                        placeholder="e.g., 3, Science, Algebra I"
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
                  {loading ? 'Saving...' : editMode ? 'Update Subject' : 'Create Subject'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Subjects List */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Subjects
        </Typography>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="All Subjects" />
          <Tab label="O-Level" />
          <Tab label="A-Level" />
        </Tabs>

        {loading && !editMode ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        ) : subjects.length === 0 ? (
          <Alert severity="info">
            No subjects found. Please create a subject.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Education Level</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject._id}>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell>{subject.code}</TableCell>
                    <TableCell>
                      <Chip
                        label={subject.educationLevel === 'O_LEVEL' ? 'O-Level' : 'A-Level'}
                        color={subject.educationLevel === 'O_LEVEL' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {subject.isCompulsory && (
                          <Chip
                            label="Compulsory"
                            color="success"
                            size="small"
                          />
                        )}

                        {subject.isPrincipal && (
                          <Chip
                            label="Principal"
                            color="info"
                            size="small"
                          />
                        )}

                        {!subject.isCompulsory && !subject.isPrincipal && (
                          <Chip
                            label="Optional"
                            color="default"
                            size="small"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{subject.description || '-'}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(subject)}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        color="error"
                        onClick={() => {
                          setDeleteId(subject._id);
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
            Are you sure you want to delete this subject? This action cannot be undone.
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

SubjectSetup.propTypes = {
  onComplete: PropTypes.func,
  standalone: PropTypes.bool
};

export default SubjectSetup;
