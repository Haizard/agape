import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  Add,
  Search,
  Print,
  Email,
  Visibility,
  Receipt,
  CalendarToday,
  AccountBalance,
  Person,
  AttachMoney,
  FilterList,
  GetApp,
  Sync
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import api from '../../services/api';
import { useSelector } from 'react-redux';
import PaymentDetails from './PaymentDetails';
import RecordPaymentDialog from './RecordPaymentDialog';

const Payments = () => {
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payments, setPayments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({
    academicYear: '',
    class: '',
    paymentMethod: '',
    startDate: null,
    endDate: null,
    searchQuery: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false);
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentStats, setPaymentStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    todayPayments: 0,
    todayAmount: 0,
    pendingPayments: 0,
    pendingAmount: 0
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch payments
        const paymentsResponse = await api.get('/api/finance/payments', {
          params: {
            academicYear: filters.academicYear,
            class: filters.class,
            paymentMethod: filters.paymentMethod,
            startDate: filters.startDate ? filters.startDate.toISOString() : null,
            endDate: filters.endDate ? filters.endDate.toISOString() : null,
            search: filters.searchQuery
          }
        });
        setPayments(paymentsResponse.data.payments);
        setPaymentStats(paymentsResponse.data.stats);

        // Fetch academic years
        const academicYearsResponse = await api.get('/api/academic-years');
        setAcademicYears(academicYearsResponse.data);

        // Fetch classes
        const classesResponse = await api.get('/api/classes');
        setClasses(classesResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };

  // Handle date filter changes
  const handleDateChange = (name, date) => {
    setFilters(prev => ({
      ...prev,
      [name]: date
    }));
    setPage(0);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      academicYear: '',
      class: '',
      paymentMethod: '',
      startDate: null,
      endDate: null,
      searchQuery: ''
    });
    setPage(0);
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // View payment details
  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setViewMode('detail');
  };

  // Back to list view
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPayment(null);
  };

  // Open payment dialog
  const handleOpenPaymentDialog = () => {
    setOpenPaymentDialog(true);
  };

  // Close payment dialog
  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
  };

  // Handle payment submission
  const handlePaymentSubmit = async (paymentData) => {
    try {
      await api.post('/api/finance/payments', paymentData);

      // Refresh payments list
      const paymentsResponse = await api.get('/api/finance/payments', {
        params: {
          academicYear: filters.academicYear,
          class: filters.class,
          paymentMethod: filters.paymentMethod,
          startDate: filters.startDate ? filters.startDate.toISOString() : null,
          endDate: filters.endDate ? filters.endDate.toISOString() : null,
          search: filters.searchQuery
        }
      });
      setPayments(paymentsResponse.data.payments);
      setPaymentStats(paymentsResponse.data.stats);

      setOpenPaymentDialog(false);
    } catch (error) {
      console.error('Error recording payment:', error);
      setError('Failed to record payment. Please try again later.');
    }
  };

  // Search students
  const handleSearchStudents = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await api.get('/api/students/search', {
        params: { query: searchQuery }
      });
      setStudentSearchResults(response.data);
      setSearchDialogOpen(true);
      setLoading(false);
    } catch (error) {
      console.error('Error searching students:', error);
      setError('Failed to search students. Please try again later.');
      setLoading(false);
    }
  };

  // Select student from search results
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchDialogOpen(false);
    setOpenPaymentDialog(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  // Generate receipt
  const handleGenerateReceipt = (paymentId) => {
    // Implement receipt generation logic
    window.open(`/api/finance/payments/${paymentId}/receipt`, '_blank');
  };

  // Send receipt via email
  const handleSendReceiptEmail = (paymentId) => {
    // Implement email sending logic
    console.log('Send receipt email for payment:', paymentId);
  };

  // Export payments to CSV
  const handleExportPayments = () => {
    // Implement export logic
    window.open('/api/finance/payments/export?format=csv', '_blank');
  };

  // Sync payments with QuickBooks
  const handleSyncWithQuickbooks = async () => {
    try {
      setLoading(true);
      await api.post('/api/finance/quickbooks/sync-payments');
      setLoading(false);
      // Refresh payments list
      const paymentsResponse = await api.get('/api/finance/payments', {
        params: {
          academicYear: filters.academicYear,
          class: filters.class,
          paymentMethod: filters.paymentMethod,
          startDate: filters.startDate ? filters.startDate.toISOString() : null,
          endDate: filters.endDate ? filters.endDate.toISOString() : null,
          search: filters.searchQuery
        }
      });
      setPayments(paymentsResponse.data.payments);
      setPaymentStats(paymentsResponse.data.stats);
    } catch (error) {
      console.error('Error syncing with QuickBooks:', error);
      setError('Failed to sync with QuickBooks. Please try again later.');
      setLoading(false);
    }
  };

  // Render student search dialog
  const renderStudentSearchDialog = () => {
    return (
      <Dialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Search Results</DialogTitle>
        <DialogContent>
          {studentSearchResults.length === 0 ? (
            <Alert severity="info">No students found matching your search criteria.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Admission Number</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentSearchResults.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>{student.admissionNumber}</TableCell>
                      <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                      <TableCell>
                        {student.class?.name}
                        {student.class?.section && ` - ${student.class.section}`}
                        {student.class?.stream && ` (${student.class.stream})`}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleSelectStudent(student)}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
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
        <DialogTitle>Advanced Filters</DialogTitle>
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearFilters}>Clear Filters</Button>
          <Button onClick={() => setOpenFiltersDialog(false)}>Close</Button>
          <Button
            onClick={() => setOpenFiltersDialog(false)}
            variant="contained"
            color="primary"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render payment stats
  const renderPaymentStats = () => {
    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Payments
              </Typography>
              <Typography variant="h4">{paymentStats.totalPayments}</Typography>
              <Typography variant="body2" color="textSecondary">
                {formatCurrency(paymentStats.totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Payments
              </Typography>
              <Typography variant="h4">{paymentStats.todayPayments}</Typography>
              <Typography variant="body2" color="textSecondary">
                {formatCurrency(paymentStats.todayAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Reconciliation
              </Typography>
              <Typography variant="h4">{paymentStats.pendingPayments}</Typography>
              <Typography variant="body2" color="textSecondary">
                {formatCurrency(paymentStats.pendingAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<GetApp />}
                  onClick={handleExportPayments}
                  size="small"
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Sync />}
                  onClick={handleSyncWithQuickbooks}
                  size="small"
                >
                  Sync with QuickBooks
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render list view
  const renderListView = () => {
    return (
      <>
        {/* Payment Stats */}
        {renderPaymentStats()}

        {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="Search by receipt number, student name, or reference..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange({ target: { name: 'searchQuery', value: e.target.value } })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setOpenFiltersDialog(true)}
                >
                  Filters
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Payments Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
          ) : payments.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>No payments found matching your criteria.</Alert>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Receipt #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Payment Method</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Received By</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((payment) => (
                        <TableRow key={payment._id} hover>
                          <TableCell>{payment.receiptNumber}</TableCell>
                          <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {payment.studentFee?.student?.firstName} {payment.studentFee?.student?.lastName}
                          </TableCell>
                          <TableCell>
                            {payment.studentFee?.class?.name}
                            {payment.studentFee?.class?.section && ` - ${payment.studentFee.class.section}`}
                          </TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            <Chip
                              label={payment.paymentMethod.replace('_', ' ').toUpperCase()}
                              size="small"
                              color={payment.paymentMethod === 'cash' ? 'success' : 'primary'}
                            />
                          </TableCell>
                          <TableCell>{payment.referenceNumber || 'N/A'}</TableCell>
                          <TableCell>{payment.receivedBy?.username || 'System'}</TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewPayment(payment)}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Print Receipt">
                              <IconButton
                                size="small"
                                onClick={() => handleGenerateReceipt(payment._id)}
                              >
                                <Print fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Email Receipt">
                              <IconButton
                                size="small"
                                onClick={() => handleSendReceiptEmail(payment._id)}
                              >
                                <Email fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={payments.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          {viewMode === 'list' ? 'Payments' : 'Payment Details'}
        </Typography>
        {viewMode === 'list' ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 250 }}
            />
            <Button
              variant="outlined"
              onClick={handleSearchStudents}
              disabled={!searchQuery.trim()}
            >
              Search
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleOpenPaymentDialog}
            >
              Record Payment
            </Button>
          </Box>
        ) : (
          <Button
            variant="outlined"
            onClick={handleBackToList}
          >
            Back to List
          </Button>
        )}
      </Box>

      {viewMode === 'list' ? (
        renderListView()
      ) : (
        <PaymentDetails
          payment={selectedPayment}
          formatCurrency={formatCurrency}
          onPrintReceipt={() => handleGenerateReceipt(selectedPayment._id)}
          onEmailReceipt={() => handleSendReceiptEmail(selectedPayment._id)}
        />
      )}

      {/* Dialogs */}
      {renderStudentSearchDialog()}
      {renderFiltersDialog()}

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={openPaymentDialog}
        onClose={handleClosePaymentDialog}
        onSubmit={handlePaymentSubmit}
        formatCurrency={formatCurrency}
        selectedStudent={selectedStudent}
      />
    </Box>
  );
};

export default Payments;
