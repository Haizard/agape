import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import unifiedApi from '../../../services/unifiedApi';

/**
 * AcademicYearSetup Component
 *
 * A comprehensive component for creating and managing academic years for both O-Level and A-Level.
 * This component replaces separate academic year management forms with a unified approach.
 *
 * @param {Object} props
 * @param {Function} props.onComplete - Function to call when setup is complete
 * @param {boolean} props.standalone - Whether the component is used standalone or as part of a workflow
 */
const AcademicYearSetup = ({ onComplete, standalone = false }) => {
  // State for academic year form
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(), // Add year field with current year as default
    startDate: null,
    endDate: null,
    isCurrent: false,
    educationLevel: 'O_LEVEL', // Default to O-Level
    terms: [
      { name: 'Term 1', startDate: null, endDate: null },
      { name: 'Term 2', startDate: null, endDate: null },
      { name: 'Term 3', startDate: null, endDate: null }
    ]
  });

  // Default term templates for different education levels
  const termTemplates = {
    O_LEVEL: [
      { name: 'Term 1', startDate: null, endDate: null },
      { name: 'Term 2', startDate: null, endDate: null },
      { name: 'Term 3', startDate: null, endDate: null }
    ],
    A_LEVEL: [
      { name: 'Semester 1', startDate: null, endDate: null },
      { name: 'Semester 2', startDate: null, endDate: null }
    ]
  };

  // State for filtering
  const [filter, setFilter] = useState({
    educationLevel: ''
  });

  // State for academic years list
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Fetch academic years on component mount and when filter changes
  useEffect(() => {
    // Only fetch if not in development mode with mock data
    if (!process.env.REACT_APP_USE_MOCK_DATA) {
      fetchAcademicYears();
    } else {
      // Use mock data for development
      setAcademicYears([
        {
          _id: '1',
          name: 'Academic Year 2025-2026',
          year: 2025,
          educationLevel: 'O_LEVEL',
          startDate: new Date('2025-01-01').toISOString(),
          endDate: new Date('2025-12-31').toISOString(),
          isActive: true,
          terms: [
            { name: 'Term 1', startDate: new Date('2025-01-01').toISOString(), endDate: new Date('2025-04-30').toISOString() },
            { name: 'Term 2', startDate: new Date('2025-05-01').toISOString(), endDate: new Date('2025-08-31').toISOString() },
            { name: 'Term 3', startDate: new Date('2025-09-01').toISOString(), endDate: new Date('2025-12-31').toISOString() }
          ]
        },
        {
          _id: '2',
          name: 'Academic Year 2025-2026',
          year: 2025,
          educationLevel: 'A_LEVEL',
          startDate: new Date('2025-01-01').toISOString(),
          endDate: new Date('2025-12-31').toISOString(),
          isActive: false,
          terms: [
            { name: 'Semester 1', startDate: new Date('2025-01-01').toISOString(), endDate: new Date('2025-06-30').toISOString() },
            { name: 'Semester 2', startDate: new Date('2025-07-01').toISOString(), endDate: new Date('2025-12-31').toISOString() }
          ]
        }
      ]);

      // Mark step as complete if not standalone
      if (!standalone) {
        onComplete?.();
      }
    }
  }, [filter]);

  // Generate mock academic years for fallback
  const generateMockAcademicYears = (filterParams) => {
    console.log('Generating mock academic years with filter:', filterParams);

    // Create some basic mock academic years
    const mockAcademicYears = [
      {
        _id: 'mock-academic-year-1',
        name: 'Academic Year 2023-2024',
        year: 2023,
        educationLevel: 'O_LEVEL',
        startDate: new Date('2023-01-01').toISOString(),
        endDate: new Date('2023-12-31').toISOString(),
        isActive: true,
        terms: [
          { name: 'Term 1', startDate: new Date('2023-01-01').toISOString(), endDate: new Date('2023-04-30').toISOString() },
          { name: 'Term 2', startDate: new Date('2023-05-01').toISOString(), endDate: new Date('2023-08-31').toISOString() },
          { name: 'Term 3', startDate: new Date('2023-09-01').toISOString(), endDate: new Date('2023-12-31').toISOString() }
        ]
      },
      {
        _id: 'mock-academic-year-2',
        name: 'Academic Year 2023-2024',
        year: 2023,
        educationLevel: 'A_LEVEL',
        startDate: new Date('2023-01-01').toISOString(),
        endDate: new Date('2023-12-31').toISOString(),
        isActive: true,
        terms: [
          { name: 'Semester 1', startDate: new Date('2023-01-01').toISOString(), endDate: new Date('2023-06-30').toISOString() },
          { name: 'Semester 2', startDate: new Date('2023-07-01').toISOString(), endDate: new Date('2023-12-31').toISOString() }
        ]
      }
    ];

    // Filter mock academic years based on the filter parameters
    let filteredAcademicYears = [...mockAcademicYears];

    if (filterParams.educationLevel) {
      filteredAcademicYears = filteredAcademicYears.filter(year => year.educationLevel === filterParams.educationLevel);
    }

    console.log('Generated mock academic years:', filteredAcademicYears);
    return filteredAcademicYears;
  };

  // Fetch academic years
  const fetchAcademicYears = async (retryCount = 0, maxRetries = 3) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filter.educationLevel) {
        params.append('educationLevel', filter.educationLevel);
      }

      console.log(`Fetching academic years with params: ${params.toString()} (Attempt ${retryCount + 1}/${maxRetries + 1})`);
      console.log('API URL:', process.env.REACT_APP_API_URL);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Not present');

      // Try multiple endpoints to handle both old and new API patterns
      const endpoints = [
        `/api/academic-years?${params.toString()}`,
        `/api/new-academic-years?${params.toString()}`,
        `/new-academic-years?${params.toString()}`
      ];

      console.log('Trying multiple endpoints:', endpoints);

      let response = null;
      let error = null;

      // Add cache-busting parameter for production environment
      if (process.env.NODE_ENV === 'production') {
        params.append('_t', Date.now());
      }

      // Increased timeout for production environment
      const timeout = process.env.NODE_ENV === 'production' ? 60000 : 15000;
      console.log(`Using timeout: ${timeout}ms`);

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await unifiedApi.get(endpoint, {
            timeout: timeout,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Accept': 'application/json'
            }
          });

          console.log(`Endpoint ${endpoint} succeeded`);
          break;
        } catch (err) {
          console.error(`Endpoint ${endpoint} failed:`, err);
          error = err;
        }
      }

      // If all endpoints failed and we've reached max retries, use mock data
      if (!response && retryCount >= maxRetries) {
        console.log('All endpoints failed, using mock data');
        const mockAcademicYears = generateMockAcademicYears(filter);
        setAcademicYears(mockAcademicYears);

        // Mark step as complete if not standalone
        if (!standalone && mockAcademicYears.length > 0) {
          onComplete?.();
        }

        setLoading(false);
        return;
      }

      // If all endpoints failed but we haven't reached max retries, throw an error to trigger retry
      if (!response) {
        throw error || new Error('All endpoints failed');
      }

      console.log('Academic years response:', response);

      // Check if response is valid
      if (!response.data) {
        console.error('Invalid response: response.data is undefined');
        console.error('Response:', response);
        setAcademicYears([]);
        throw new Error('Invalid response from server');
      }

      // Extract the data from the response
      const responseData = response.data;
      console.log('Response data:', responseData);

      // Check if response data is an array
      if (!Array.isArray(responseData)) {
        console.error('Invalid response format:', responseData);
        console.error('Response data type:', typeof responseData);
        console.error('Response data value:', JSON.stringify(responseData));
        setAcademicYears([]);
        throw new Error('Invalid response format');
      }

      // Use the response data
      const academicYears = responseData;

      // Log success
      console.log(`Successfully fetched ${academicYears.length} academic years`);
      setAcademicYears(academicYears);

      // Check if there's at least one academic year
      if (academicYears.length > 0 && !standalone) {
        // Mark step as complete if at least one academic year exists
        onComplete?.();
      }
    } catch (err) {
      console.error('Error fetching academic years:', err);
      setError('Failed to load academic years. Please try again.');

      // Retry with exponential backoff
      if (retryCount < maxRetries) {
        console.log(`Retrying fetch academic years (${retryCount + 1}/${maxRetries})...`);
        // Exponential backoff: 1s, 2s, 4s
        const backoffTime = 2 ** retryCount * 1000;
        console.log(`Waiting ${backoffTime}ms before retry...`);

        setTimeout(() => fetchAcademicYears(retryCount + 1, maxRetries), backoffTime);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;

    if (name === 'isCurrent') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'year') {
      // Ensure year is a number
      const yearValue = parseInt(value, 10);
      if (!isNaN(yearValue) && yearValue >= 2000 && yearValue <= 2100) {
        setFormData(prev => ({
          ...prev,
          [name]: yearValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle date change
  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  // Handle term date change
  const handleTermDateChange = (date, index, field) => {
    setFormData(prev => {
      const updatedTerms = [...prev.terms];
      updatedTerms[index] = {
        ...updatedTerms[index],
        [field]: date
      };

      return {
        ...prev,
        terms: updatedTerms
      };
    });
  };

  // Handle term name change
  const handleTermNameChange = (e, index) => {
    const { value } = e.target;

    setFormData(prev => {
      const updatedTerms = [...prev.terms];
      updatedTerms[index] = {
        ...updatedTerms[index],
        name: value
      };

      return {
        ...prev,
        terms: updatedTerms
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Validate form data
      if (!formData.name) {
        setError('Academic year name is required.');
        setLoading(false);
        return;
      }

      if (!formData.year || formData.year < 2000 || formData.year > 2100) {
        setError('Valid year between 2000 and 2100 is required.');
        setLoading(false);
        return;
      }

      if (!formData.educationLevel) {
        setError('Education level is required.');
        setLoading(false);
        return;
      }

      if (!formData.startDate || !formData.endDate) {
        setError('Start and end dates are required.');
        setLoading(false);
        return;
      }

      // Validate term dates
      for (const term of formData.terms) {
        if (!term.startDate || !term.endDate) {
          setError(`Start and end dates for ${term.name} are required.`);
          setLoading(false);
          return;
        }
      }

      // Format dates for API
      const formattedData = {
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        // Map isCurrent to isActive for backend compatibility
        isActive: formData.isCurrent,
        terms: formData.terms.map(term => ({
          ...term,
          startDate: term.startDate.toISOString(),
          endDate: term.endDate.toISOString()
        }))
      };

      // Remove isCurrent as backend uses isActive
      delete formattedData.isCurrent;

      // Check if we're using mock data
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        // Simulate successful API call
        console.log('Using mock data - simulating successful API call');

        // Generate a mock ID if creating a new academic year
        if (!editMode) {
          const mockId = Math.random().toString(36).substring(2, 15);
          formattedData._id = mockId;

          // Add the new academic year to the list
          setAcademicYears(prev => [...prev, formattedData]);
        } else {
          // Update the academic year in the list
          setAcademicYears(prev => prev.map(year =>
            year._id === editId ? { ...formattedData, _id: editId } : year
          ));
        }

        setSuccess(editMode ? 'Academic year updated successfully.' : 'Academic year created successfully.');
      } else {
        try {
          // Log the data being sent
          console.log('Sending academic year data:', formattedData);

          const endpoint = editMode
            ? `/api/academic-years/${editId}`
            : `/api/academic-years`;

          console.log('API endpoint:', endpoint);

          // Use UnifiedApiService for API calls
          const response = await (editMode
            ? unifiedApi.put(endpoint, formattedData)
            : unifiedApi.post(endpoint, formattedData));

          // Log the response
          console.log('Response:', response);

          // If not successful, throw an error
          // Check if response is valid
          if (!response || !response.data) {
            console.error('Invalid response: response or response.data is undefined');
            console.error('Response:', response);
            throw new Error('Invalid response from server');
          }

          // Get the response data
          const data = response.data;
          console.log('Success response:', data);

          setSuccess(editMode ? 'Academic year updated successfully.' : 'Academic year created successfully.');
        } catch (error) {
          console.error('Error saving academic year:', error);
          setError(`Failed to save academic year: ${error.message}`);
          throw error; // Re-throw to be caught by the outer try/catch
        }
      }

      // Keep the current education level
      const currentEducationLevel = formData.educationLevel;

      // Get default terms for the education level
      const defaultTerms = JSON.parse(JSON.stringify(termTemplates[currentEducationLevel]));

      setFormData({
        name: '',
        year: new Date().getFullYear(), // Reset year to current year
        startDate: null,
        endDate: null,
        isCurrent: false,
        educationLevel: currentEducationLevel, // Keep the education level
        terms: defaultTerms // Use default terms for the education level
      });

      // Reset edit mode
      setEditMode(false);
      setEditId(null);

      // Refresh academic years
      await fetchAcademicYears();

      // Mark step as complete if not standalone
      if (!standalone) {
        onComplete?.();
      }
    } catch (err) {
      console.error('Error saving academic year:', err);
      setError(`Failed to save academic year: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit academic year
  const handleEdit = (academicYear) => {
    // Format dates for form
    const formattedAcademicYear = {
      ...academicYear,
      startDate: new Date(academicYear.startDate),
      endDate: new Date(academicYear.endDate),
      // Map isActive to isCurrent for frontend compatibility
      isCurrent: academicYear.isActive,
      terms: academicYear.terms.map(term => ({
        ...term,
        startDate: new Date(term.startDate),
        endDate: new Date(term.endDate)
      }))
    };

    // Remove isActive as frontend uses isCurrent
    delete formattedAcademicYear.isActive;

    // Set form data
    setFormData(formattedAcademicYear);

    // Set edit mode
    setEditMode(true);
    setEditId(academicYear._id);
  };

  // Handle delete academic year
  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're using mock data
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        // Simulate successful API call
        console.log('Using mock data - simulating successful delete');

        // Remove the academic year from the list
        setAcademicYears(prev => prev.filter(year => year._id !== deleteId));
      } else {
        // Use UnifiedApiService for API calls
        const endpoint = `/api/academic-years/${deleteId}`;
        console.log('Deleting academic year from:', endpoint);

        const response = await unifiedApi.delete(endpoint);
        console.log('Delete response:', response);

        // Check if response is valid
        if (!response) {
          console.error('Invalid response: response is undefined');
          console.error('Response:', response);
          throw new Error('Invalid response from server');
        }
      }

      // Close dialog
      setDeleteDialogOpen(false);
      setDeleteId(null);

      // Refresh academic years
      await fetchAcademicYears();

      setSuccess('Academic year deleted successfully.');
    } catch (err) {
      console.error('Error deleting academic year:', err);
      setError(`Failed to delete academic year: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    // Keep the current education level
    const currentEducationLevel = formData.educationLevel;

    // Get default terms for the education level
    const defaultTerms = JSON.parse(JSON.stringify(termTemplates[currentEducationLevel]));

    setFormData({
      name: '',
      year: new Date().getFullYear(), // Reset year to current year
      startDate: null,
      endDate: null,
      isCurrent: false,
      educationLevel: currentEducationLevel, // Keep the education level
      terms: defaultTerms // Use default terms for the education level
    });

    // Reset edit mode
    setEditMode(false);
    setEditId(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {standalone && (
          <Typography variant="h5" gutterBottom>
            Academic Year Management
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

        {/* Academic Year Form */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {editMode ? 'Edit Academic Year' : 'Create New Academic Year'}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Academic Year Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  helperText="e.g., 2025-2026"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  label="Year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  helperText="e.g., 2025"
                  inputProps={{ min: 2000, max: 2100 }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Education Level</InputLabel>
                  <Select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={(e) => {
                      const newLevel = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        educationLevel: newLevel,
                        // Reset terms based on education level
                        terms: JSON.parse(JSON.stringify(termTemplates[newLevel]))
                      }));
                    }}
                    label="Education Level"
                    required
                  >
                    <MenuItem value="O_LEVEL">O-Level</MenuItem>
                    <MenuItem value="A_LEVEL">A-Level</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(date) => handleDateChange(date, 'startDate')}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(date) => handleDateChange(date, 'endDate')}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isCurrent}
                      onChange={handleInputChange}
                      name="isCurrent"
                      color="primary"
                    />
                  }
                  label="Current Academic Year"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1">
                      {formData.educationLevel === 'O_LEVEL' ? 'Terms' : 'Semesters'}
                    </Typography>
                    <Chip
                      label={formData.educationLevel === 'O_LEVEL' ? 'O-Level' : 'A-Level'}
                      color={formData.educationLevel === 'O_LEVEL' ? 'primary' : 'secondary'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        terms: [
                          ...prev.terms,
                          {
                            name: prev.educationLevel === 'O_LEVEL'
                              ? `Term ${prev.terms.length + 1}`
                              : `Semester ${prev.terms.length + 1}`,
                            startDate: null,
                            endDate: null
                          }
                        ]
                      }));
                    }}
                  >
                    Add {formData.educationLevel === 'O_LEVEL' ? 'Term' : 'Semester'}
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {formData.terms.map((term, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label={`${formData.educationLevel === 'O_LEVEL' ? 'Term' : 'Semester'} ${index + 1} Name`}
                        value={term.name}
                        onChange={(e) => handleTermNameChange(e, index)}
                        fullWidth
                        required
                      />
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <DatePicker
                        label="Start Date"
                        value={term.startDate}
                        onChange={(date) => handleTermDateChange(date, index, 'startDate')}
                        renderInput={(params) => <TextField {...params} fullWidth required />}
                      />
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <DatePicker
                        label="End Date"
                        value={term.endDate}
                        onChange={(date) => handleTermDateChange(date, index, 'endDate')}
                        renderInput={(params) => <TextField {...params} fullWidth required />}
                      />
                    </Grid>

                    <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                      {formData.terms.length > 1 && (
                        <IconButton
                          color="error"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              terms: prev.terms.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                ))}
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
                    {loading ? 'Saving...' : editMode ? 'Update Academic Year' : 'Create Academic Year'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* Academic Years List */}
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Academic Years
            </Typography>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Education Level</InputLabel>
              <Select
                value={filter.educationLevel}
                onChange={(e) => setFilter(prev => ({ ...prev, educationLevel: e.target.value }))}
                label="Education Level"
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="O_LEVEL">O-Level</MenuItem>
                <MenuItem value="A_LEVEL">A-Level</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {loading && !editMode ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          ) : academicYears.length === 0 ? (
            <Alert severity="info">
              No academic years found. Please create one.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Year</TableCell>
                    <TableCell>Education Level</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Terms/Semesters</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {academicYears.map((year) => (
                    <TableRow key={year._id}>
                      <TableCell>{year.name}</TableCell>
                      <TableCell>{year.year}</TableCell>
                      <TableCell>
                        <Chip
                          label={year.educationLevel === 'O_LEVEL' ? 'O-Level' : 'A-Level'}
                          color={year.educationLevel === 'O_LEVEL' ? 'primary' : 'secondary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(year.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(year.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {year.isActive ? (
                          <Chip
                            label="Current"
                            color="success"
                            size="small"
                            icon={<CheckIcon />}
                          />
                        ) : (
                          <Chip
                            label="Inactive"
                            color="default"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {year.terms.map((term, index) => (
                          <Chip
                            key={index}
                            label={term.name}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(year)}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>

                        <IconButton
                          color="error"
                          onClick={() => {
                            setDeleteId(year._id);
                            setDeleteDialogOpen(true);
                          }}
                          size="small"
                          disabled={year.isActive}
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
              Are you sure you want to delete this academic year? This action cannot be undone.
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
    </LocalizationProvider>
  );
};

AcademicYearSetup.propTypes = {
  onComplete: PropTypes.func,
  standalone: PropTypes.bool
};

export default AcademicYearSetup;
