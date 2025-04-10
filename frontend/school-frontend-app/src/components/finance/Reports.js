import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import {
  Assessment,
  AttachMoney,
  AccountBalance,
  TrendingUp,
  GetApp,
  Print,
  Email,
  FilterList,
  CalendarToday,
  Search,
  PictureAsPdf,
  InsertDriveFile,
  Schedule
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import api from '../../services/api';
import { useSelector } from 'react-redux';
import FeeCollectionReport from './reports/FeeCollectionReport';
import FeeBalanceReport from './reports/FeeBalanceReport';
import PaymentMethodReport from './reports/PaymentMethodReport';
import FinancialSummaryReport from './reports/FinancialSummaryReport';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired
};

const Reports = () => {
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({
    academicYear: '',
    class: '',
    startDate: null,
    endDate: null,
    paymentMethod: '',
    reportType: 'fee-collection'
  });
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');

  // Fetch initial data
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
          setFilters(prev => ({
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

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Update report type based on tab
    const reportTypes = ['fee-collection', 'fee-balance', 'payment-method', 'financial-summary'];
    setFilters(prev => ({
      ...prev,
      reportType: reportTypes[newValue]
    }));
  };

  // Handle filter changes
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle date filter changes
  const handleDateChange = (name, date) => {
    setFilters(prev => ({
      ...prev,
      [name]: date
    }));
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      academicYear: '',
      class: '',
      startDate: null,
      endDate: null,
      paymentMethod: '',
      reportType: ['fee-collection', 'fee-balance', 'payment-method', 'financial-summary'][tabValue]
    });
  };

  // Generate report
  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/finance/reports/${filters.reportType}`, {
        params: {
          academicYear: filters.academicYear,
          class: filters.class,
          startDate: filters.startDate ? filters.startDate.toISOString() : null,
          endDate: filters.endDate ? filters.endDate.toISOString() : null,
          paymentMethod: filters.paymentMethod
        }
      });
      setReportData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again later.');
      setLoading(false);
    }
  };

  // Export report
  const handleExportReport = () => {
    const reportTypes = ['fee-collection', 'fee-balance', 'payment-method', 'financial-summary'];
    const reportType = reportTypes[tabValue];

    // Build query parameters
    const params = new URLSearchParams();
    if (filters.academicYear) params.append('academicYear', filters.academicYear);
    if (filters.class) params.append('class', filters.class);
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    params.append('format', exportFormat);

    // Open in new window
    window.open(`/api/finance/reports/${reportType}/export?${params.toString()}`, '_blank');
  };

  // Render filters dialog
  const renderFiltersDialog = () => {
    return (
      <Dialog
        open={openFiltersDialog}
        onClose={() => setOpenFiltersDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Report Filters</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  name="academicYear"
                  value={filters.academicYear}
                  onChange={handleFilterChange}
                  label="Academic Year"
                >
                  <MenuItem value="">All</MenuItem>
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
                  value={filters.class}
                  onChange={handleFilterChange}
                  label="Class"
                >
                  <MenuItem value="">All</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name} {cls.section && `- ${cls.section}`} {cls.stream && `(${cls.stream})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {(filters.reportType === 'fee-collection' || filters.reportType === 'payment-method') && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={filters.paymentMethod}
                    onChange={handleFilterChange}
                    label="Payment Method"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="mobile_money">Mobile Money</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(date) => handleDateChange('startDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(date) => handleDateChange('endDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  label="Export Format"
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearFilters}>Clear Filters</Button>
          <Button onClick={() => setOpenFiltersDialog(false)}>Close</Button>
          <Button
            onClick={() => {
              setOpenFiltersDialog(false);
              handleGenerateReport();
            }}
            variant="contained"
            color="primary"
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render report cards
  const renderReportCards = () => {
    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
              bgcolor: tabValue === 0 ? 'primary.light' : 'background.paper'
            }}
            onClick={() => setTabValue(0)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment color={tabValue === 0 ? 'inherit' : 'primary'} sx={{ mr: 1 }} />
                <Typography variant="h6">Fee Collection</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                View fee collection reports by class, date range, or payment method.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
              bgcolor: tabValue === 1 ? 'primary.light' : 'background.paper'
            }}
            onClick={() => setTabValue(1)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney color={tabValue === 1 ? 'inherit' : 'primary'} sx={{ mr: 1 }} />
                <Typography variant="h6">Fee Balance</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                View fee balance reports by student, class, or academic year.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
              bgcolor: tabValue === 2 ? 'primary.light' : 'background.paper'
            }}
            onClick={() => setTabValue(2)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalance color={tabValue === 2 ? 'inherit' : 'primary'} sx={{ mr: 1 }} />
                <Typography variant="h6">Payment Method</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                View payment reports by payment method, date range, or receiver.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
              bgcolor: tabValue === 3 ? 'primary.light' : 'background.paper'
            }}
            onClick={() => setTabValue(3)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color={tabValue === 3 ? 'inherit' : 'primary'} sx={{ mr: 1 }} />
                <Typography variant="h6">Financial Summary</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                View financial summary reports with income, expenses, and balance.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Financial Reports</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setOpenFiltersDialog(true)}
          >
            Filters
          </Button>
          <Button
            variant="outlined"
            startIcon={exportFormat === 'pdf' ? <PictureAsPdf /> : <InsertDriveFile />}
            onClick={handleExportReport}
            disabled={!reportData}
          >
            Export {exportFormat.toUpperCase()}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Assessment />}
            onClick={handleGenerateReport}
          >
            Generate Report
          </Button>
        </Box>
      </Box>

      {/* Report Cards */}
      {renderReportCards()}

      {/* Report Content */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : !reportData ? (
          <Alert severity="info" sx={{ m: 2 }}>
            Select report type and filters, then click "Generate Report" to view data.
          </Alert>
        ) : (
          <TabPanel value={tabValue} index={tabValue}>
            {tabValue === 0 && <FeeCollectionReport data={reportData} />}
            {tabValue === 1 && <FeeBalanceReport data={reportData} />}
            {tabValue === 2 && <PaymentMethodReport data={reportData} />}
            {tabValue === 3 && <FinancialSummaryReport data={reportData} />}
          </TabPanel>
        )}
      </Paper>

      {/* Filters Dialog */}
      {renderFiltersDialog()}
    </Box>
  );
};

export default Reports;
