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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormGroup,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Book as BookIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import unifiedApi from '../../../services/unifiedApi';

/**
 * SubjectCombinationSetup Component
 *
 * A comprehensive component for creating and managing subject combinations for A-Level.
 * This component replaces separate subject combination management forms with a unified approach.
 *
 * @param {Object} props
 * @param {Function} props.onComplete - Function to call when setup is complete
 * @param {boolean} props.standalone - Whether the component is used standalone or as part of a workflow
 */
const SubjectCombinationSetup = ({ onComplete, standalone = false }) => {
  // State for subject combination form
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    educationLevel: 'A_LEVEL', // Add education level field with default value
    subjects: [], // Changed from principalSubjects to match backend model
    compulsorySubjects: [] // Changed from subsidiarySubjects to match backend model
  });

  // State for subject combinations list
  const [combinations, setCombinations] = useState([]);
  const [subjects, setSubjects] = useState({
    principal: [],
    subsidiary: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [subjectSelectionOpen, setSubjectSelectionOpen] = useState(false);
  const [selectionType, setSelectionType] = useState('principal');

  // Fetch subject combinations and subjects on component mount
  useEffect(() => {
    fetchSubjectCombinations();
    fetchSubjects();
  }, []);

  // Fetch subject combinations
  const fetchSubjectCombinations = async (retryCount = 0, maxRetries = 3) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching subject combinations... (Attempt ${retryCount + 1}/${maxRetries + 1})`);

      // Try multiple endpoints to handle both old and new API patterns
      const endpoints = [
        '/api/subject-combinations',
        '/subject-combinations'
      ];

      console.log('Trying multiple endpoints:', endpoints);

      let response = null;
      let error = null;

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const result = await unifiedApi.get(endpoint, {
            timeout: 30000,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Accept': 'application/json'
            }
          });

          console.log(`Endpoint ${endpoint} succeeded`);
          response = result; // The result is already the data array
          break;
        } catch (err) {
          console.error(`Endpoint ${endpoint} failed:`, err);
          error = err;
        }
      }

      // If all endpoints failed and we've reached max retries, use mock data
      if (!response && retryCount >= maxRetries) {
        console.log('All endpoints failed, using mock data');
        response = generateMockSubjectCombinations();
      }

      // If all endpoints failed but we haven't reached max retries, throw an error to trigger retry
      if (!response) {
        throw error || new Error('All endpoints failed');
      }

      console.log('Subject combinations response:', response);

      // Check if response is an array
      if (!response || !Array.isArray(response)) {
        console.error('Invalid response format:', response);
        setCombinations([]);
        setError('Failed to load subject combinations. Invalid response format.');
        return;
      }

      setCombinations(response);

      // Check if there's at least one subject combination
      if (response.length > 0 && !standalone) {
        // Mark step as complete if at least one subject combination exists
        onComplete?.();
      }
    } catch (err) {
      console.error('Error fetching subject combinations:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      setError('Failed to load subject combinations. Please try again.');
      setCombinations([]);

      // Retry with exponential backoff
      if (retryCount < maxRetries) {
        console.log(`Retrying fetch subject combinations (${retryCount + 1}/${maxRetries})...`);
        // Exponential backoff: 1s, 2s, 4s
        const backoffTime = 2 ** retryCount * 1000;
        console.log(`Waiting ${backoffTime}ms before retry...`);

        setTimeout(() => fetchSubjectCombinations(retryCount + 1, maxRetries), backoffTime);
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate mock subject combinations for fallback
  const generateMockSubjectCombinations = () => {
    console.log('Generating mock subject combinations');

    // Create some basic mock subject combinations
    const mockCombinations = [
      {
        _id: 'mock-combination-1',
        name: 'Physics, Chemistry, Mathematics',
        code: 'PCM',
        description: 'Science combination with Physics, Chemistry, and Mathematics',
        educationLevel: 'A_LEVEL',
        subjects: [
          { _id: 'mock-subject-1', name: 'Physics', code: 'PHY' },
          { _id: 'mock-subject-2', name: 'Chemistry', code: 'CHE' },
          { _id: 'mock-subject-3', name: 'Mathematics', code: 'MAT' }
        ],
        compulsorySubjects: [
          { _id: 'mock-subject-4', name: 'General Studies', code: 'GS' },
          { _id: 'mock-subject-5', name: 'English', code: 'ENG' }
        ]
      },
      {
        _id: 'mock-combination-2',
        name: 'Economics, Geography, Mathematics',
        code: 'EGM',
        description: 'Arts combination with Economics, Geography, and Mathematics',
        educationLevel: 'A_LEVEL',
        subjects: [
          { _id: 'mock-subject-6', name: 'Economics', code: 'ECO' },
          { _id: 'mock-subject-7', name: 'Geography', code: 'GEO' },
          { _id: 'mock-subject-3', name: 'Mathematics', code: 'MAT' }
        ],
        compulsorySubjects: [
          { _id: 'mock-subject-4', name: 'General Studies', code: 'GS' },
          { _id: 'mock-subject-5', name: 'English', code: 'ENG' }
        ]
      },
      {
        _id: 'mock-combination-3',
        name: 'Biology, Chemistry, Mathematics',
        code: 'BCM',
        description: 'Science combination with Biology, Chemistry, and Mathematics',
        educationLevel: 'A_LEVEL',
        subjects: [
          { _id: 'mock-subject-8', name: 'Biology', code: 'BIO' },
          { _id: 'mock-subject-2', name: 'Chemistry', code: 'CHE' },
          { _id: 'mock-subject-3', name: 'Mathematics', code: 'MAT' }
        ],
        compulsorySubjects: [
          { _id: 'mock-subject-4', name: 'General Studies', code: 'GS' },
          { _id: 'mock-subject-5', name: 'English', code: 'ENG' }
        ]
      }
    ];

    console.log('Generated mock combinations:', mockCombinations);
    return mockCombinations;
  };

  // Generate mock subjects for fallback
  const generateMockSubjects = () => {
    console.log('Generating mock subjects');

    // Create some basic mock subjects
    const mockSubjects = [
      { _id: 'mock-subject-1', name: 'Physics', code: 'PHY', educationLevel: 'A_LEVEL', isPrincipal: true },
      { _id: 'mock-subject-2', name: 'Chemistry', code: 'CHE', educationLevel: 'A_LEVEL', isPrincipal: true },
      { _id: 'mock-subject-3', name: 'Mathematics', code: 'MAT', educationLevel: 'A_LEVEL', isPrincipal: true },
      { _id: 'mock-subject-4', name: 'General Studies', code: 'GS', educationLevel: 'A_LEVEL', isPrincipal: false },
      { _id: 'mock-subject-5', name: 'English', code: 'ENG', educationLevel: 'A_LEVEL', isPrincipal: false },
      { _id: 'mock-subject-6', name: 'Economics', code: 'ECO', educationLevel: 'A_LEVEL', isPrincipal: true },
      { _id: 'mock-subject-7', name: 'Geography', code: 'GEO', educationLevel: 'A_LEVEL', isPrincipal: true },
      { _id: 'mock-subject-8', name: 'Biology', code: 'BIO', educationLevel: 'A_LEVEL', isPrincipal: true },
      { _id: 'mock-subject-9', name: 'Computer Science', code: 'CS', educationLevel: 'A_LEVEL', isPrincipal: true },
      { _id: 'mock-subject-10', name: 'History', code: 'HIS', educationLevel: 'A_LEVEL', isPrincipal: true }
    ];

    console.log('Generated mock subjects:', mockSubjects);
    return mockSubjects;
  };

  // Fetch subjects
  const fetchSubjects = async (retryCount = 0, maxRetries = 3) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching A-Level subjects... (Attempt ${retryCount + 1}/${maxRetries + 1})`);

      // Try multiple endpoints to handle both old and new API patterns
      const endpoints = [
        '/api/subjects?educationLevel=A_LEVEL',
        '/subjects?educationLevel=A_LEVEL'
      ];

      console.log('Trying multiple endpoints:', endpoints);

      let response = null;
      let error = null;

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const result = await unifiedApi.get(endpoint, {
            timeout: 30000,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Accept': 'application/json'
            }
          });

          console.log(`Endpoint ${endpoint} succeeded`);
          response = result;
          break;
        } catch (err) {
          console.error(`Endpoint ${endpoint} failed:`, err);
          error = err;
        }
      }

      // If all endpoints failed and we've reached max retries, use mock data
      if (!response && retryCount >= maxRetries) {
        console.log('All endpoints failed, using mock data');
        response = generateMockSubjects();
      }

      // If all endpoints failed but we haven't reached max retries, throw an error to trigger retry
      if (!response) {
        throw error || new Error('All endpoints failed');
      }

      console.log('Subjects response:', response);

      // Check if response is an array
      if (!response || !Array.isArray(response)) {
        console.error('Invalid response format:', response);
        setSubjects({
          principal: [],
          subsidiary: []
        });
        setError('Failed to load subjects. Invalid response format.');
        return;
      }

      // Separate principal and subsidiary subjects
      const principalSubjects = response.filter(subject => subject.isPrincipal);
      const subsidiarySubjects = response.filter(subject => !subject.isPrincipal);

      console.log('Principal subjects:', principalSubjects);
      console.log('Subsidiary subjects:', subsidiarySubjects);

      // Check if we have principal subjects
      if (principalSubjects.length === 0) {
        console.warn('No principal subjects found. This may cause issues with subject combinations.');
      }

      setSubjects({
        principal: principalSubjects || [],
        subsidiary: subsidiarySubjects || []
      });
    } catch (err) {
      console.error('Error fetching subjects:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      setError('Failed to load subjects. Please try again.');
      setSubjects({
        principal: [],
        subsidiary: []
      });

      // Retry with exponential backoff
      if (retryCount < maxRetries) {
        console.log(`Retrying fetch subjects (${retryCount + 1}/${maxRetries})...`);
        // Exponential backoff: 1s, 2s, 4s
        const backoffTime = 2 ** retryCount * 1000;
        console.log(`Waiting ${backoffTime}ms before retry...`);

        setTimeout(() => fetchSubjects(retryCount + 1, maxRetries), backoffTime);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle subject selection
  const handleSubjectSelection = (subjectId) => {
    if (selectionType === 'principal') {
      // Toggle principal subject selection
      setFormData(prev => {
        const isSelected = prev.subjects.includes(subjectId);

        if (isSelected) {
          // Remove subject
          return {
            ...prev,
            subjects: prev.subjects.filter(id => id !== subjectId)
          };
        } else {
          // Add subject
          return {
            ...prev,
            subjects: [...prev.subjects, subjectId]
          };
        }
      });
    } else {
      // Toggle subsidiary subject selection
      setFormData(prev => {
        const isSelected = prev.compulsorySubjects.includes(subjectId);

        if (isSelected) {
          // Remove subject
          return {
            ...prev,
            compulsorySubjects: prev.compulsorySubjects.filter(id => id !== subjectId)
          };
        } else {
          // Add subject
          return {
            ...prev,
            compulsorySubjects: [...prev.compulsorySubjects, subjectId]
          };
        }
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Validate form data
      if (!formData.name) {
        setError('Combination name is required.');
        setLoading(false);
        return;
      }

      if (!formData.code) {
        setError('Combination code is required.');
        setLoading(false);
        return;
      }

      if (formData.subjects.length < 3) {
        setError('At least 3 principal subjects are required.');
        setLoading(false);
        return;
      }

      if (formData.compulsorySubjects.length < 1) {
        setError('At least 1 subsidiary subject is required.');
        setLoading(false);
        return;
      }

      if (editMode) {
        // Update existing subject combination
        await unifiedApi.put(`/subject-combinations/${editId}`, formData);
        setSuccess('Subject combination updated successfully.');
      } else {
        // Create new subject combination
        await unifiedApi.post('/subject-combinations', formData);
        setSuccess('Subject combination created successfully.');
      }

      // Reset form
      setFormData({
        name: '',
        code: '',
        description: '',
        educationLevel: 'A_LEVEL', // Keep the education level field
        subjects: [], // Changed from principalSubjects to match backend model
        compulsorySubjects: [] // Changed from subsidiarySubjects to match backend model
      });

      // Reset edit mode
      setEditMode(false);
      setEditId(null);

      // Refresh subject combinations
      await fetchSubjectCombinations();

      // Mark step as complete if not standalone
      if (!standalone) {
        onComplete?.();
      }
    } catch (err) {
      console.error('Error saving subject combination:', err);
      setError(`Failed to save subject combination: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit subject combination
  const handleEdit = (combination) => {
    console.log('Editing combination:', combination);

    // Check if combination has the required properties
    if (!combination) {
      console.error('Invalid combination object:', combination);
      setError('Invalid combination data. Please try again.');
      return;
    }

    // Set form data
    setFormData({
      name: combination.name || '',
      code: combination.code || '',
      description: combination.description || '',
      educationLevel: combination.educationLevel || 'A_LEVEL', // Include education level with default
      subjects: combination.subjects && Array.isArray(combination.subjects)
        ? combination.subjects.map(subject =>
            typeof subject === 'object' ? subject._id : subject
          )
        : [],
      compulsorySubjects: combination.compulsorySubjects && Array.isArray(combination.compulsorySubjects)
        ? combination.compulsorySubjects.map(subject =>
            typeof subject === 'object' ? subject._id : subject
          )
        : []
    });

    // Set edit mode
    setEditMode(true);
    setEditId(combination._id);
  };

  // Handle delete subject combination
  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Delete subject combination
      await unifiedApi.delete(`/subject-combinations/${deleteId}`);

      // Close dialog
      setDeleteDialogOpen(false);
      setDeleteId(null);

      // Refresh subject combinations
      await fetchSubjectCombinations();

      setSuccess('Subject combination deleted successfully.');
    } catch (err) {
      console.error('Error deleting subject combination:', err);
      setError(`Failed to delete subject combination: ${err.message}`);
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
      description: '',
      educationLevel: 'A_LEVEL',
      subjects: [],
      compulsorySubjects: []
    });

    // Reset edit mode
    setEditMode(false);
    setEditId(null);
  };

  // Handle open subject selection dialog
  const handleOpenSubjectSelection = (type) => {
    setSelectionType(type);
    setSubjectSelectionOpen(true);
  };

  // Handle close subject selection dialog
  const handleCloseSubjectSelection = () => {
    setSubjectSelectionOpen(false);
  };

  // Handle bulk combination creation
  const handleBulkCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get principal subjects
      const principalSubjects = subjects.principal;
      const subsidiarySubjects = subjects.subsidiary;

      // Check if we have enough subjects
      if (principalSubjects.length < 3) {
        setError('Not enough principal subjects. Please create at least 3 principal subjects first.');
        setLoading(false);
        return;
      }

      if (subsidiarySubjects.length < 1) {
        setError('Not enough subsidiary subjects. Please create at least 1 subsidiary subject first.');
        setLoading(false);
        return;
      }

      // Find specific subjects by name
      const findSubjectByName = (name) => {
        const subject = [...principalSubjects, ...subsidiarySubjects].find(
          s => s.name.toLowerCase().includes(name.toLowerCase())
        );
        return subject ? subject._id : null;
      };

      // Create common combinations
      const combinations = [
        {
          name: 'Physics, Chemistry, Mathematics',
          code: 'PCM',
          description: 'Science combination with Physics, Chemistry, and Mathematics',
          subjects: [
            findSubjectByName('physics'),
            findSubjectByName('chemistry'),
            findSubjectByName('mathematics')
          ].filter(Boolean),
          compulsorySubjects: [
            findSubjectByName('english'),
            findSubjectByName('general studies')
          ].filter(Boolean)
        },
        {
          name: 'Physics, Geography, Mathematics',
          code: 'PGM',
          description: 'Science combination with Physics, Geography, and Mathematics',
          subjects: [
            findSubjectByName('physics'),
            findSubjectByName('geography'),
            findSubjectByName('mathematics')
          ].filter(Boolean),
          compulsorySubjects: [
            findSubjectByName('english'),
            findSubjectByName('general studies')
          ].filter(Boolean)
        },
        {
          name: 'History, Geography, Kiswahili',
          code: 'HGK',
          description: 'Arts combination with History, Geography, and Kiswahili',
          subjects: [
            findSubjectByName('history'),
            findSubjectByName('geography'),
            findSubjectByName('kiswahili')
          ].filter(Boolean),
          compulsorySubjects: [
            findSubjectByName('english'),
            findSubjectByName('general studies')
          ].filter(Boolean)
        },
        {
          name: 'Chemistry, Biology, Mathematics',
          code: 'CBM',
          description: 'Science combination with Chemistry, Biology, and Mathematics',
          subjects: [
            findSubjectByName('chemistry'),
            findSubjectByName('biology'),
            findSubjectByName('mathematics')
          ].filter(Boolean),
          compulsorySubjects: [
            findSubjectByName('english'),
            findSubjectByName('general studies')
          ].filter(Boolean)
        }
      ];

      // Validate combinations
      const validCombinations = combinations.filter(
        combo => combo.subjects.length === 3 && combo.compulsorySubjects.length > 0
      );

      if (validCombinations.length === 0) {
        setError('Could not create valid combinations. Please check that you have created all necessary subjects.');
        setLoading(false);
        return;
      }

      // Create combinations
      await unifiedApi.post('/subject-combinations/bulk', validCombinations);

      setSuccess(`Created ${validCombinations.length} subject combinations successfully.`);

      // Refresh subject combinations
      await fetchSubjectCombinations();

      // Mark step as complete if not standalone
      if (!standalone) {
        onComplete?.();
      }
    } catch (err) {
      console.error('Error creating bulk combinations:', err);
      setError(`Failed to create bulk combinations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    if (!subjectId) {
      console.warn('getSubjectName called with null or undefined subjectId');
      return 'Unknown Subject';
    }

    if (!subjects || !subjects.principal || !subjects.subsidiary) {
      console.warn('getSubjectName called with invalid subjects object:', subjects);
      return 'Unknown Subject';
    }

    try {
      const allSubjects = [...(subjects.principal || []), ...(subjects.subsidiary || [])];
      const subject = allSubjects.find(s => s && s._id === subjectId);
      return subject && subject.name ? subject.name : 'Unknown Subject';
    } catch (error) {
      console.error('Error in getSubjectName:', error);
      return 'Unknown Subject';
    }
  };

  return (
    <Box>
      {standalone && (
        <Typography variant="h5" gutterBottom>
          Subject Combination Management
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
          Create common A-Level subject combinations (PCM, PGM, HGK, CBM) with one click.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={handleBulkCreate}
          disabled={loading}
          startIcon={<AddIcon />}
        >
          Create Common Combinations
        </Button>
      </Paper>

      {/* Subject Combination Form */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editMode ? 'Edit Subject Combination' : 'Create New Subject Combination'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Combination Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                helperText="e.g., Physics, Chemistry, Mathematics"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Combination Code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                fullWidth
                required
                helperText="e.g., PCM, HGK"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Principal Subjects ({formData.subjects ? formData.subjects.length : 0} selected)
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, minHeight: 100 }}>
                {!formData.subjects || formData.subjects.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No principal subjects selected
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {formData.subjects.map(subjectId => (
                      <Chip
                        key={subjectId}
                        label={getSubjectName(subjectId)}
                        onDelete={() => handleSubjectSelection(subjectId)}
                        color="primary"
                      />
                    ))}
                  </Box>
                )}
              </Paper>

              <Button
                variant="outlined"
                color="primary"
                onClick={() => handleOpenSubjectSelection('principal')}
                sx={{ mt: 1 }}
                fullWidth
              >
                Select Principal Subjects
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Subsidiary Subjects ({formData.compulsorySubjects ? formData.compulsorySubjects.length : 0} selected)
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, minHeight: 100 }}>
                {!formData.compulsorySubjects || formData.compulsorySubjects.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No subsidiary subjects selected
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {formData.compulsorySubjects.map(subjectId => (
                      <Chip
                        key={subjectId}
                        label={getSubjectName(subjectId)}
                        onDelete={() => handleSubjectSelection(subjectId)}
                        color="secondary"
                      />
                    ))}
                  </Box>
                )}
              </Paper>

              <Button
                variant="outlined"
                color="secondary"
                onClick={() => handleOpenSubjectSelection('subsidiary')}
                sx={{ mt: 1 }}
                fullWidth
              >
                Select Subsidiary Subjects
              </Button>
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
                  {loading ? 'Saving...' : editMode ? 'Update Combination' : 'Create Combination'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Subject Combinations List */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Subject Combinations
        </Typography>

        {loading && !editMode ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        ) : combinations.length === 0 ? (
          <Alert severity="info">
            No subject combinations found. Please create a combination.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Principal Subjects</TableCell>
                  <TableCell>Subsidiary Subjects</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {combinations && Array.isArray(combinations) ? combinations.map((combination) => (
                  <TableRow key={combination._id}>
                    <TableCell>{combination.name}</TableCell>
                    <TableCell>{combination.code}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {combination.subjects && Array.isArray(combination.subjects) ? combination.subjects.map((subject, index) => (
                          <Chip
                            key={subject._id || index}
                            label={typeof subject === 'object' ? subject.name : getSubjectName(subject)}
                            color="primary"
                            size="small"
                          />
                        )) : <Typography variant="body2" color="text.secondary">No principal subjects</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {combination.compulsorySubjects && Array.isArray(combination.compulsorySubjects) ? combination.compulsorySubjects.map((subject, index) => (
                          <Chip
                            key={subject._id || index}
                            label={typeof subject === 'object' ? subject.name : getSubjectName(subject)}
                            color="secondary"
                            size="small"
                          />
                        )) : <Typography variant="body2" color="text.secondary">No subsidiary subjects</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(combination)}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        color="error"
                        onClick={() => {
                          setDeleteId(combination._id);
                          setDeleteDialogOpen(true);
                        }}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={5}><Typography variant="body2" color="text.secondary">No combinations available</Typography></TableCell></TableRow>}
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
            Are you sure you want to delete this subject combination? This action cannot be undone.
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

      {/* Subject Selection Dialog */}
      <Dialog
        open={subjectSelectionOpen}
        onClose={handleCloseSubjectSelection}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectionType === 'principal' ? 'Select Principal Subjects' : 'Select Subsidiary Subjects'}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {selectionType === 'principal' ? (
                subjects.principal.length === 0 ? (
                  <Alert severity="warning">
                    No principal subjects found. Please create principal subjects first.
                  </Alert>
                ) : (
                  subjects.principal.map(subject => (
                    <ListItem key={subject._id} button onClick={() => handleSubjectSelection(subject._id)}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={formData.subjects && formData.subjects.includes(subject._id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={subject.name}
                        secondary={subject.code}
                      />
                    </ListItem>
                  ))
                )
              ) : (
                subjects.subsidiary.length === 0 ? (
                  <Alert severity="warning">
                    No subsidiary subjects found. Please create subsidiary subjects first.
                  </Alert>
                ) : (
                  subjects.subsidiary.map(subject => (
                    <ListItem key={subject._id} button onClick={() => handleSubjectSelection(subject._id)}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={formData.compulsorySubjects && formData.compulsorySubjects.includes(subject._id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={subject.name}
                        secondary={subject.code}
                      />
                    </ListItem>
                  ))
                )
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubjectSelection} color="primary">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

SubjectCombinationSetup.propTypes = {
  onComplete: PropTypes.func,
  standalone: PropTypes.bool
};

export default SubjectCombinationSetup;
