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
  Tabs,
  Tab,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Search,
  Visibility,
  Payment,
  Receipt,
  History,
  ExpandMore,
  Print,
  Email,
  AttachMoney,
  AccountBalance,
  School,
  Person,
  CalendarToday,
  Add,
  Edit,
  Delete,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  ArrowBack
} from '@mui/icons-material';
import api from '../../services/api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import StudentFeeDetails from './StudentFeeDetails';
import RecordPaymentDialog from './RecordPaymentDialog';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-fees-tabpanel-${index}`}
      aria-labelledby={`student-fees-tab-${index}`}
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

const StudentFees = () => {
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentFees, setStudentFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [filters, setFilters] = useState({
    academicYear: '',
    class: '',
    status: '',
    student: '',
    searchQuery: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [selectedStudentFee, setSelectedStudentFee] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignFeeDialogOpen, setAssignFeeDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState('');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch student fees
        const studentFeesResponse = await api.get('/api/finance/student-fees', {
          params: {
            academicYear: filters.academicYear,
            class: filters.class,
            status: filters.status,
            student: filters.student
          }
        });
        setStudentFees(studentFeesResponse.data);

        // Fetch academic years
        const academicYearsResponse = await api.get('/api/academic-years');
        setAcademicYears(academicYearsResponse.data);

        // Fetch classes
        const classesResponse = await api.get('/api/classes');
        setClasses(classesResponse.data);

        // Fetch fee structures
        const feeStructuresResponse = await api.get('/api/finance/fee-structures', {
          params: { status: 'active' }
        });
        setFeeStructures(feeStructuresResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.academicYear, filters.class, filters.status, filters.student]);

  // Handle filter changes
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // View student fee details
  const handleViewStudentFee = async (studentFeeId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/finance/student-fees/${studentFeeId}`);
      setSelectedStudentFee(response.data);
      setViewMode('detail');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student fee details:', error);
      setError('Failed to load student fee details. Please try again later.');
      setLoading(false);
    }
  };

  // Back to list view
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedStudentFee(null);
  };

  // Open payment dialog
  const handleOpenPaymentDialog = (studentFee) => {
    setSelectedStudentFee(studentFee);
    setOpenPaymentDialog(true);
  };

  // Close payment dialog
  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
  };

  // Handle payment submission
  const handlePaymentSubmit = async (paymentData) => {
    try {
      await api.post('/api/finance/payments', {
        ...paymentData,
        studentFee: selectedStudentFee.studentFee._id
      });

      // Refresh student fee details
      const response = await api.get(`/api/finance/student-fees/${selectedStudentFee.studentFee._id}`);
      setSelectedStudentFee(response.data);

      // Refresh student fees list
      const studentFeesResponse = await api.get('/api/finance/student-fees', {
        params: {
          academicYear: filters.academicYear,
          class: filters.class,
          status: filters.status,
          student: filters.student
        }
      });
      setStudentFees(studentFeesResponse.data);

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
    setAssignFeeDialogOpen(true);
  };

  // Assign fee structure to student
  const handleAssignFeeStructure = async () => {
    if (!selectedStudent || !selectedFeeStructure) return;

    try {
      setLoading(true);
      await api.post('/api/finance/student-fees/assign', {
        studentId: selectedStudent._id,
        feeStructureId: selectedFeeStructure
      });

      // Refresh student fees list
      const studentFeesResponse = await api.get('/api/finance/student-fees', {
        params: {
          academicYear: filters.academicYear,
          class: filters.class,
          status: filters.status,
          student: filters.student
        }
      });
      setStudentFees(studentFeesResponse.data);

      setAssignFeeDialogOpen(false);
      setSelectedStudent(null);
      setSelectedFeeStructure('');
      setLoading(false);
    } catch (error) {
      console.error('Error assigning fee structure:', error);
      setError('Failed to assign fee structure. Please try again later.');
      setLoading(false);
    }
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `TZS ${amount.toLocaleString()}`;
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

  // Render assign fee structure dialog
  const renderAssignFeeDialog = () => {
    return (
      <Dialog
        open={assignFeeDialogOpen}
        onClose={() => setAssignFeeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Fee Structure</DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Student Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Admission Number:</strong> {selectedStudent.admissionNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Class:</strong> {selectedStudent.class?.name}
                    {selectedStudent.class?.section && ` - ${selectedStudent.class.section}`}
                    {selectedStudent.class?.stream && ` (${selectedStudent.class.stream})`}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Fee Structure</InputLabel>
            <Select
              value={selectedFeeStructure}
              onChange={(e) => setSelectedFeeStructure(e.target.value)}
              label="Fee Structure"
            >
              <MenuItem value="">Select a fee structure</MenuItem>
              {feeStructures
                .filter(fs => fs.class?._id === selectedStudent?.class?._id)
                .map((feeStructure) => (
                  <MenuItem key={feeStructure._id} value={feeStructure._id}>
                    {feeStructure.name} - {formatCurrency(feeStructure.totalAmount)}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignFeeDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignFeeStructure}
            variant="contained"
            color="primary"
            disabled={!selectedFeeStructure}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render list view
  const renderListView = () => {
    return (
      <>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
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

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
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

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                onClick={() => setFilters({ academicYear: '', class: '', status: '', student: '', searchQuery: '' })}
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="All Students" />
            <Tab label="Pending Fees" />
            <Tab label="Partial Payments" />
            <Tab label="Paid" />
            <Tab label="Overdue" />
          </Tabs>
        </Paper>

        {/* Student Fees Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
          ) : studentFees.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>No student fees found matching your criteria.</Alert>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Admission #</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Fee Structure</TableCell>
                      <TableCell>Total Amount</TableCell>
                      <TableCell>Amount Paid</TableCell>
                      <TableCell>Balance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentFees
                      .filter(fee => {
                        if (tabValue === 0) return true;
                        if (tabValue === 1) return fee.status === 'pending';
                        if (tabValue === 2) return fee.status === 'partial';
                        if (tabValue === 3) return fee.status === 'paid';
                        if (tabValue === 4) return fee.status === 'overdue';
                        return true;
                      })
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((fee) => (
                        <TableRow key={fee._id} hover>
                          <TableCell>{`${fee.student?.firstName} ${fee.student?.lastName}`}</TableCell>
                          <TableCell>{fee.student?.admissionNumber}</TableCell>
                          <TableCell>
                            {fee.class?.name}
                            {fee.class?.section && ` - ${fee.class.section}`}
                            {fee.class?.stream && ` (${fee.class.stream})`}
                          </TableCell>
                          <TableCell>{fee.feeStructure?.name}</TableCell>
                          <TableCell>{formatCurrency(fee.totalAmount)}</TableCell>
                          <TableCell>{formatCurrency(fee.amountPaid)}</TableCell>
                          <TableCell>{formatCurrency(fee.balance)}</TableCell>
                          <TableCell>
                            <Chip
                              label={fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                              color={getStatusColor(fee.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewStudentFee(fee._id)}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Record Payment">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenPaymentDialog(fee)}
                                color="primary"
                              >
                                <Payment fontSize="small" />
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
                count={studentFees.filter(fee => {
                  if (tabValue === 0) return true;
                  if (tabValue === 1) return fee.status === 'pending';
                  if (tabValue === 2) return fee.status === 'partial';
                  if (tabValue === 3) return fee.status === 'paid';
                  if (tabValue === 4) return fee.status === 'overdue';
                  return true;
                }).length}
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
          {viewMode === 'list' ? 'Student Fees' : 'Student Fee Details'}
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
              onClick={() => setSearchDialogOpen(true)}
            >
              Assign Fee
            </Button>
          </Box>
        ) : (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBackToList}
          >
            Back to List
          </Button>
        )}
      </Box>

      {viewMode === 'list' ? (
        renderListView()
      ) : (
        <StudentFeeDetails
          studentFee={selectedStudentFee}
          onRecordPayment={() => setOpenPaymentDialog(true)}
          formatCurrency={formatCurrency}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Dialogs */}
      {renderStudentSearchDialog()}
      {renderAssignFeeDialog()}

      {/* Record Payment Dialog */}
      {selectedStudentFee && (
        <RecordPaymentDialog
          open={openPaymentDialog}
          onClose={handleClosePaymentDialog}
          studentFee={selectedStudentFee.studentFee}
          onSubmit={handlePaymentSubmit}
          formatCurrency={formatCurrency}
        />
      )}
    </Box>
  );
};

export default StudentFees;
