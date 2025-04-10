import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormHelperText,
  FormControlLabel,
  Radio,
  RadioGroup,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CloudUpload,
  CloudDownload,
  CheckCircle,
  Error as ErrorIcon,
  Delete,
  Save,
  Visibility,
  InsertDriveFile,
  Description,
  ArrowForward
} from '@mui/icons-material';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const ImportExport = () => {
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFilters, setExportFilters] = useState({
    academicYear: '',
    class: '',
    status: ''
  });
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importOptions, setImportOptions] = useState({
    updateExisting: false,
    academicYear: '',
    defaultClass: ''
  });
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // Steps for import/export
  const importSteps = ['Select File', 'Preview Data', 'Configure Options', 'Import'];
  const exportSteps = ['Configure Export', 'Download'];

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch academic years
        const academicYearsResponse = await api.get('/api/academic-years');
        setAcademicYears(academicYearsResponse.data);

        // Fetch classes
        const classesResponse = await api.get('/api/classes');
        setClasses(classesResponse.data);

        // Set default academic year to active year
        const activeYear = academicYearsResponse.data.find(year => year.isActive);
        if (activeYear) {
          setExportFilters(prev => ({
            ...prev,
            academicYear: activeYear._id
          }));
          setImportOptions(prev => ({
            ...prev,
            academicYear: activeYear._id
          }));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle export filter changes
  const handleExportFilterChange = (event) => {
    const { name, value } = event.target;
    setExportFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle export format change
  const handleExportFormatChange = (event) => {
    setExportFormat(event.target.value);
  };

  // Handle import option changes
  const handleImportOptionChange = (event) => {
    const { name, value, type, checked } = event.target;
    setImportOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const fileType = file.name.split('.').pop().toLowerCase();
    if (fileType !== 'csv' && fileType !== 'xlsx' && fileType !== 'json') {
      setError('Invalid file type. Please upload a CSV, Excel, or JSON file.');
      return;
    }

    setImportFile(file);
    setActiveStep(1); // Move to preview step

    // Preview file
    previewFile(file);
  };

  // Preview file
  const previewFile = async (file) => {
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/finance/fee-structures/preview-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportPreview(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error previewing file:', error);
      setError(error.response?.data?.message || 'Failed to preview file. Please check the file format and try again.');
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    setLoading(true);
    setError('');

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (exportFilters.academicYear) params.append('academicYear', exportFilters.academicYear);
      if (exportFilters.class) params.append('class', exportFilters.class);
      if (exportFilters.status) params.append('status', exportFilters.status);
      params.append('format', exportFormat);

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `fee-structures-${timestamp}.${exportFormat}`;

      // Trigger download
      const response = await api.get(`/api/finance/fee-structures/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setActiveStep(1); // Move to download step
      setLoading(false);
    } catch (error) {
      console.error('Error exporting fee structures:', error);
      setError('Failed to export fee structures. Please try again later.');
      setLoading(false);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!importFile) {
      setError('Please select a file to import.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('updateExisting', importOptions.updateExisting);
    if (importOptions.academicYear) formData.append('academicYear', importOptions.academicYear);
    if (importOptions.defaultClass) formData.append('defaultClass', importOptions.defaultClass);

    try {
      const response = await api.post('/api/finance/fee-structures/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResult(response.data);
      setActiveStep(3); // Move to result step
      setLoading(false);
    } catch (error) {
      console.error('Error importing fee structures:', error);
      setError(error.response?.data?.message || 'Failed to import fee structures. Please try again later.');
      setLoading(false);
    }
  };

  // Reset import
  const handleResetImport = () => {
    setImportFile(null);
    setImportPreview(null);
    setImportResult(null);
    setImportOptions({
      updateExisting: false,
      academicYear: academicYears.find(year => year.isActive)?._id || '',
      defaultClass: ''
    });
    setActiveStep(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset export
  const handleResetExport = () => {
    setExportFilters({
      academicYear: academicYears.find(year => year.isActive)?._id || '',
      class: '',
      status: ''
    });
    setExportFormat('csv');
    setActiveStep(0);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  // Render import content
  const renderImportContent = () => {
    switch (activeStep) {
      case 0: // Select File
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select File to Import
            </Typography>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <input
                type="file"
                accept=".csv,.xlsx,.json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current.click()}
                sx={{ mb: 2 }}
              >
                Select File
              </Button>
              <Typography variant="body2" color="text.secondary">
                Supported formats: CSV, Excel (.xlsx), JSON
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                File Format Requirements:
              </Typography>
              <Typography variant="body2" align="left">
                <ul>
                  <li>CSV/Excel files should have headers in the first row</li>
                  <li>Required columns: name, components (or individual component columns)</li>
                  <li>Optional columns: description, academicYear, class, status</li>
                  <li>Components can be specified as JSON in a single column or as separate columns</li>
                  <li>JSON files should contain an array of fee structure objects</li>
                </ul>
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CloudDownload />}
                onClick={() => window.open('/api/finance/fee-structures/template', '_blank')}
                sx={{ mt: 2 }}
              >
                Download Template
              </Button>
            </Paper>
          </Box>
        );

      case 1: // Preview Data
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Preview Import Data
            </Typography>
            <Paper sx={{ p: 3 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              ) : !importPreview ? (
                <Alert severity="info">
                  No preview data available. Please select a file to import.
                </Alert>
              ) : (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Found {importPreview.structures.length} fee structures in the file.
                    {importPreview.warnings.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" color="warning.main">
                          Warnings: {importPreview.warnings.length}
                        </Typography>
                        <ul>
                          {importPreview.warnings.slice(0, 3).map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                          {importPreview.warnings.length > 3 && (
                            <li>...and {importPreview.warnings.length - 3} more warnings</li>
                          )}
                        </ul>
                      </Box>
                    )}
                  </Alert>

                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Academic Year</TableCell>
                          <TableCell>Class</TableCell>
                          <TableCell>Components</TableCell>
                          <TableCell>Total Amount</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importPreview.structures.map((structure, index) => (
                          <TableRow key={index}>
                            <TableCell>{structure.name}</TableCell>
                            <TableCell>
                              {structure.academicYear
                                ? academicYears.find(y => y._id === structure.academicYear)?.name || structure.academicYear
                                : 'Not specified'}
                            </TableCell>
                            <TableCell>
                              {structure.class
                                ? classes.find(c => c._id === structure.class)?.name || structure.class
                                : 'Not specified'}
                            </TableCell>
                            <TableCell>{structure.feeComponents.length}</TableCell>
                            <TableCell>
                              {formatCurrency(structure.feeComponents.reduce((sum, comp) => sum + comp.amount, 0))}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={structure.status || 'draft'}
                                size="small"
                                color={structure.status === 'active' ? 'success' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Paper>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleResetImport}>
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setActiveStep(2)}
                disabled={!importPreview || importPreview.structures.length === 0}
              >
                Next
              </Button>
            </Box>
          </Box>
        );

      case 2: // Configure Options
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Import Options
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={importOptions.updateExisting}
                        onChange={handleImportOptionChange}
                        name="updateExisting"
                      />
                    }
                    label="Update existing fee structures if names match"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Default Academic Year</InputLabel>
                    <Select
                      name="academicYear"
                      value={importOptions.academicYear}
                      onChange={handleImportOptionChange}
                      label="Default Academic Year"
                    >
                      <MenuItem value="">None (Use values from file)</MenuItem>
                      {academicYears.map((year) => (
                        <MenuItem key={year._id} value={year._id}>
                          {year.name || year.year}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Used for fee structures without specified academic year
                    </FormHelperText>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Default Class</InputLabel>
                    <Select
                      name="defaultClass"
                      value={importOptions.defaultClass}
                      onChange={handleImportOptionChange}
                      label="Default Class"
                    >
                      <MenuItem value="">None (Use values from file)</MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name} {cls.section && `- ${cls.section}`} {cls.stream && `(${cls.stream})`}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Used for fee structures without specified class
                    </FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="subtitle2">
                  Import Summary:
                </Typography>
                <ul>
                  <li>{importPreview.structures.length} fee structures will be imported</li>
                  <li>
                    {importPreview.structures.filter(s => !s.academicYear).length} structures need default academic year
                  </li>
                  <li>
                    {importPreview.structures.filter(s => !s.class).length} structures need default class
                  </li>
                  <li>
                    {importOptions.updateExisting
                      ? 'Existing fee structures with matching names will be updated'
                      : 'All fee structures will be created as new'}
                  </li>
                </ul>
              </Alert>
            </Paper>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setActiveStep(1)}>
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleImport}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Import'}
              </Button>
            </Box>
          </Box>
        );

      case 3: // Import Result
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Import Result
            </Typography>
            <Paper sx={{ p: 3 }}>
              {importResult && (
                <>
                  <Alert
                    severity={importResult.success ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                  >
                    {importResult.message}
                  </Alert>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Typography variant="h6" align="center">
                          {importResult.created}
                        </Typography>
                        <Typography variant="body2" align="center">
                          Created
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                        <Typography variant="h6" align="center">
                          {importResult.updated}
                        </Typography>
                        <Typography variant="body2" align="center">
                          Updated
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                        <Typography variant="h6" align="center">
                          {importResult.failed}
                        </Typography>
                        <Typography variant="body2" align="center">
                          Failed
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Errors:
                      </Typography>
                      <List dense>
                        {importResult.errors.map((error, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <ErrorIcon color="error" />
                            </ListItemIcon>
                            <ListItemText primary={error} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </>
              )}
            </Paper>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleResetImport}
              >
                Done
              </Button>
            </Box>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  // Render export content
  const renderExportContent = () => {
    switch (activeStep) {
      case 0: // Configure Export
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Export
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Academic Year</InputLabel>
                    <Select
                      name="academicYear"
                      value={exportFilters.academicYear}
                      onChange={handleExportFilterChange}
                      label="Academic Year"
                    >
                      <MenuItem value="">All Academic Years</MenuItem>
                      {academicYears.map((year) => (
                        <MenuItem key={year._id} value={year._id}>
                          {year.name || year.year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Class</InputLabel>
                    <Select
                      name="class"
                      value={exportFilters.class}
                      onChange={handleExportFilterChange}
                      label="Class"
                    >
                      <MenuItem value="">All Classes</MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name} {cls.section && `- ${cls.section}`} {cls.stream && `(${cls.stream})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={exportFilters.status}
                      onChange={handleExportFilterChange}
                      label="Status"
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="archived">Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl component="fieldset">
                    <Typography variant="subtitle2" gutterBottom>
                      Export Format
                    </Typography>
                    <RadioGroup
                      row
                      name="exportFormat"
                      value={exportFormat}
                      onChange={handleExportFormatChange}
                    >
                      <FormControlLabel value="csv" control={<Radio />} label="CSV" />
                      <FormControlLabel value="xlsx" control={<Radio />} label="Excel" />
                      <FormControlLabel value="json" control={<Radio />} label="JSON" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleExport}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Export'}
              </Button>
            </Box>
          </Box>
        );

      case 1: // Download
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Export Complete
            </Typography>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Export Successful
              </Typography>
              <Typography variant="body1" paragraph>
                Your fee structures have been exported successfully.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                If the download didn't start automatically, click the button below.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudDownload />}
                onClick={handleExport}
                sx={{ mt: 2 }}
              >
                Download Again
              </Button>
            </Paper>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleResetExport}
              >
                Start New Export
              </Button>
            </Box>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Import/Export Fee Structures</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Import</Typography>
              <CloudUpload color="primary" fontSize="large" />
            </Box>

            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              {importSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {renderImportContent()}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Export</Typography>
              <CloudDownload color="primary" fontSize="large" />
            </Box>

            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              {exportSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderExportContent()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ImportExport;
