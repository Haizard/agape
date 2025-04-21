import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  Download,
  Visibility,
  Edit,
  FilterList,
  ArrowForward,
  BarChart,
  PieChart,
  TableChart,
  LineChart
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';
import { useSelector } from 'react-redux';

/**
 * CustomReportBuilder component
 * 
 * This component allows users to build custom financial reports by selecting
 * data sources, filters, and visualization options.
 */
const CustomReportBuilder = () => {
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [savedReports, setSavedReports] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    dataSource: 'payments', // payments, student_fees, fee_structures
    filters: {
      startDate: null,
      endDate: null,
      academicYear: '',
      class: '',
      paymentMethod: '',
      status: ''
    },
    groupBy: 'none', // none, date, class, payment_method, status
    chartType: 'bar', // bar, pie, line, table
    fields: {
      amount: true,
      date: true,
      student: true,
      class: true,
      paymentMethod: true,
      status: true
    }
  });

  // Fetch saved reports
  useEffect(() => {
    const fetchSavedReports = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/finance/custom-reports');
        setSavedReports(response.data);
      } catch (error) {
        console.error('Error fetching saved reports:', error);
        setError('Failed to load saved reports. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedReports();
  }, []);

  // Fetch academic years and classes for filters
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        // Fetch academic years
        const academicYearsResponse = await api.get('/api/academic-years');
        setAcademicYears(academicYearsResponse.data);

        // Fetch classes
        const classesResponse = await api.get('/api/classes');
        setClasses(classesResponse.data);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };

    fetchFilterData();
  }, []);

  // Steps for the report builder
  const steps = ['Select Data Source', 'Configure Filters', 'Choose Visualization', 'Preview & Save'];

  // Handle next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    if (activeStep === 2) {
      // Generate report preview
      generateReport();
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Handle reset
  const handleReset = () => {
    setActiveStep(0);
    setReportConfig({
      name: '',
      description: '',
      dataSource: 'payments',
      filters: {
        startDate: null,
        endDate: null,
        academicYear: '',
        class: '',
        paymentMethod: '',
        status: ''
      },
      groupBy: 'none',
      chartType: 'bar',
      fields: {
        amount: true,
        date: true,
        student: true,
        class: true,
        paymentMethod: true,
        status: true
      }
    });
    setReportData(null);
  };

  // Handle input change
  const handleInputChange = (field) => (event) => {
    setReportConfig({
      ...reportConfig,
      [field]: event.target.value
    });
  };

  // Handle filter change
  const handleFilterChange = (field) => (event) => {
    setReportConfig({
      ...reportConfig,
      filters: {
        ...reportConfig.filters,
        [field]: event.target.value
      }
    });
  };

  // Handle date filter change
  const handleDateFilterChange = (field) => (date) => {
    setReportConfig({
      ...reportConfig,
      filters: {
        ...reportConfig.filters,
        [field]: date
      }
    });
  };

  // Handle field toggle
  const handleFieldToggle = (field) => (event) => {
    setReportConfig({
      ...reportConfig,
      fields: {
        ...reportConfig.fields,
        [field]: event.target.checked
      }
    });
  };

  // Generate report
  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/finance/custom-reports/generate', reportConfig);
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Save report
  const handleSaveReport = async () => {
    if (!reportConfig.name) {
      setError('Report name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/finance/custom-reports', reportConfig);
      setSavedReports([...savedReports, response.data]);
      setSuccess('Report saved successfully');
      setOpenSaveDialog(false);
    } catch (error) {
      console.error('Error saving report:', error);
      setError('Failed to save report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load saved report
  const handleLoadReport = (report) => {
    setReportConfig(report.config);
    setSelectedReport(report);
    setActiveStep(0);
  };

  // Delete saved report
  const handleDeleteReport = async () => {
    if (!selectedReport) return;

    setLoading(true);
    try {
      await api.delete(`/api/finance/custom-reports/${selectedReport._id}`);
      setSavedReports(savedReports.filter(report => report._id !== selectedReport._id));
      setSuccess('Report deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error deleting report:', error);
      setError('Failed to delete report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Export report
  const handleExportReport = async (format) => {
    if (!reportData) return;

    try {
      const response = await api.post('/api/finance/custom-reports/export', {
        config: reportConfig,
        format: format
      }, {
        responseType: 'blob'
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportConfig.name || 'custom-report'}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Failed to export report. Please try again later.');
    }
  };

  // Render data source selection step
  const renderDataSourceStep = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Select Data Source
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              select
              label="Data Source"
              fullWidth
              value={reportConfig.dataSource}
              onChange={handleInputChange('dataSource')}
              helperText="Select the primary data source for your report"
            >
              <MenuItem value="payments">Payments</MenuItem>
              <MenuItem value="student_fees">Student Fees</MenuItem>
              <MenuItem value="fee_structures">Fee Structures</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Data Source Description
            </Typography>
            {reportConfig.dataSource === 'payments' && (
              <Typography variant="body2">
                Payment data includes all financial transactions, with details such as amount, date, payment method, and student information.
              </Typography>
            )}
            {reportConfig.dataSource === 'student_fees' && (
              <Typography variant="body2">
                Student fees data includes assigned fees, amounts due, amounts paid, and balances for each student.
              </Typography>
            )}
            {reportConfig.dataSource === 'fee_structures' && (
              <Typography variant="body2">
                Fee structures data includes fee components, amounts, and configurations for different classes and academic years.
              </Typography>
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Render filters step
  const renderFiltersStep = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Configure Filters
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={reportConfig.filters.startDate}
                onChange={handleDateFilterChange('startDate')}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={reportConfig.filters.endDate}
                onChange={handleDateFilterChange('endDate')}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Academic Year"
              fullWidth
              value={reportConfig.filters.academicYear}
              onChange={handleFilterChange('academicYear')}
            >
              <MenuItem value="">All Academic Years</MenuItem>
              {academicYears.map((year) => (
                <MenuItem key={year._id} value={year._id}>
                  {year.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Class"
              fullWidth
              value={reportConfig.filters.class}
              onChange={handleFilterChange('class')}
            >
              <MenuItem value="">All Classes</MenuItem>
              {classes.map((cls) => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.name} {cls.section}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {reportConfig.dataSource === 'payments' && (
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Payment Method"
                fullWidth
                value={reportConfig.filters.paymentMethod}
                onChange={handleFilterChange('paymentMethod')}
              >
                <MenuItem value="">All Payment Methods</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="mobile_money">Mobile Money</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
              </TextField>
            </Grid>
          )}
          {(reportConfig.dataSource === 'student_fees' || reportConfig.dataSource === 'payments') && (
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Status"
                fullWidth
                value={reportConfig.filters.status}
                onChange={handleFilterChange('status')}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {reportConfig.dataSource === 'student_fees' ? (
                  <>
                    <MenuItem value="unpaid">Unpaid</MenuItem>
                    <MenuItem value="partial">Partially Paid</MenuItem>
                    <MenuItem value="paid">Fully Paid</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </>
                )}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Group By
            </Typography>
            <TextField
              select
              label="Group Results By"
              fullWidth
              value={reportConfig.groupBy}
              onChange={handleInputChange('groupBy')}
              helperText="Select how to group the report data"
            >
              <MenuItem value="none">No Grouping</MenuItem>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="class">Class</MenuItem>
              {reportConfig.dataSource === 'payments' && (
                <MenuItem value="payment_method">Payment Method</MenuItem>
              )}
              {(reportConfig.dataSource === 'student_fees' || reportConfig.dataSource === 'payments') && (
                <MenuItem value="status">Status</MenuItem>
              )}
            </TextField>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Render visualization step
  const renderVisualizationStep = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Choose Visualization
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Chart Type
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: reportConfig.chartType === 'bar' ? '2px solid #1976d2' : 'none',
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => setReportConfig({ ...reportConfig, chartType: 'bar' })}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <BarChart fontSize="large" color="primary" />
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      Bar Chart
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: reportConfig.chartType === 'pie' ? '2px solid #1976d2' : 'none',
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => setReportConfig({ ...reportConfig, chartType: 'pie' })}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PieChart fontSize="large" color="primary" />
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      Pie Chart
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: reportConfig.chartType === 'line' ? '2px solid #1976d2' : 'none',
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => setReportConfig({ ...reportConfig, chartType: 'line' })}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <LineChart fontSize="large" color="primary" />
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      Line Chart
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: reportConfig.chartType === 'table' ? '2px solid #1976d2' : 'none',
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => setReportConfig({ ...reportConfig, chartType: 'table' })}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TableChart fontSize="large" color="primary" />
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      Table
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Fields to Include
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.fields.amount}
                      onChange={handleFieldToggle('amount')}
                    />
                  }
                  label="Amount"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.fields.date}
                      onChange={handleFieldToggle('date')}
                    />
                  }
                  label="Date"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.fields.student}
                      onChange={handleFieldToggle('student')}
                    />
                  }
                  label="Student"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.fields.class}
                      onChange={handleFieldToggle('class')}
                    />
                  }
                  label="Class"
                />
              </Grid>
              {reportConfig.dataSource === 'payments' && (
                <Grid item xs={6} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportConfig.fields.paymentMethod}
                        onChange={handleFieldToggle('paymentMethod')}
                      />
                    }
                    label="Payment Method"
                  />
                </Grid>
              )}
              {(reportConfig.dataSource === 'student_fees' || reportConfig.dataSource === 'payments') && (
                <Grid item xs={6} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportConfig.fields.status}
                        onChange={handleFieldToggle('status')}
                      />
                    }
                    label="Status"
                  />
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Render preview step
  const renderPreviewStep = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Preview & Save
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : !reportData ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No data available for the selected filters.
          </Alert>
        ) : (
          <Box>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Report Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>Data Source:</strong> {reportConfig.dataSource.replace('_', ' ')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date Range:</strong> {reportConfig.filters.startDate ? new Date(reportConfig.filters.startDate).toLocaleDateString() : 'All'} to {reportConfig.filters.endDate ? new Date(reportConfig.filters.endDate).toLocaleDateString() : 'All'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Academic Year:</strong> {reportConfig.filters.academicYear ? academicYears.find(y => y._id === reportConfig.filters.academicYear)?.name || 'Unknown' : 'All'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>Class:</strong> {reportConfig.filters.class ? classes.find(c => c._id === reportConfig.filters.class)?.name || 'Unknown' : 'All'}
                  </Typography>
                  {reportConfig.dataSource === 'payments' && (
                    <Typography variant="body2">
                      <strong>Payment Method:</strong> {reportConfig.filters.paymentMethod ? reportConfig.filters.paymentMethod.replace('_', ' ') : 'All'}
                    </Typography>
                  )}
                  {(reportConfig.dataSource === 'student_fees' || reportConfig.dataSource === 'payments') && (
                    <Typography variant="body2">
                      <strong>Status:</strong> {reportConfig.filters.status || 'All'}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Report Data
              </Typography>
              {/* Placeholder for actual chart/table rendering */}
              <Box sx={{ height: 300, bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  {reportConfig.chartType.charAt(0).toUpperCase() + reportConfig.chartType.slice(1)} visualization would appear here
                </Typography>
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<Save />}
                onClick={() => setOpenSaveDialog(true)}
              >
                Save Report
              </Button>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleExportReport('pdf')}
                  sx={{ mr: 1 }}
                >
                  Export PDF
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleExportReport('csv')}
                >
                  Export CSV
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  // Render saved reports
  const renderSavedReports = () => {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Saved Reports
        </Typography>
        {savedReports.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No saved reports found. Create and save a report to see it here.
          </Typography>
        ) : (
          <List>
            {savedReports.map((report) => (
              <ListItem key={report._id} divider>
                <ListItemText
                  primary={report.name}
                  secondary={report.description || 'No description'}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Load Report">
                    <IconButton edge="end" onClick={() => handleLoadReport(report)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Report">
                    <IconButton edge="end" onClick={() => {
                      setSelectedReport(report);
                      setOpenDeleteDialog(true);
                    }}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>
      <Typography variant="h5" gutterBottom>
        Custom Report Builder
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {renderSavedReports()}

      <Paper sx={{ p: 2 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 2, mb: 2 }}>
          {activeStep === 0 && renderDataSourceStep()}
          {activeStep === 1 && renderFiltersStep()}
          {activeStep === 2 && renderVisualizationStep()}
          {activeStep === 3 && renderPreviewStep()}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </Button>
          <Box>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={activeStep === steps.length - 1 || loading}
              endIcon={<ArrowForward />}
            >
              {activeStep === steps.length - 2 ? 'Generate Report' : 'Next'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Save Report Dialog */}
      <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)}>
        <DialogTitle>Save Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Report Name"
                fullWidth
                value={reportConfig.name}
                onChange={handleInputChange('name')}
                required
                error={!reportConfig.name}
                helperText={!reportConfig.name ? 'Report name is required' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={reportConfig.description}
                onChange={handleInputChange('description')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSaveDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveReport}
            color="primary"
            disabled={!reportConfig.name || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Report Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Report</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the report "{selectedReport?.name}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteReport}
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomReportBuilder;
