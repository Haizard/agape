import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider
} from '@mui/material';
import {
  Sync,
  CheckCircle,
  Error,
  Warning,
  Visibility,
  Refresh,
  FilterList,
  Search,
  CompareArrows
} from '@mui/icons-material';
import api from '../../../services/api';

/**
 * QuickbooksReconciliation component
 * 
 * This component handles the reconciliation of transactions between the school system and QuickBooks.
 */
const QuickbooksReconciliation = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    startDate: null,
    endDate: null,
    searchQuery: ''
  });
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [syncStats, setSyncStats] = useState({
    total: 0,
    synced: 0,
    failed: 0,
    pending: 0
  });

  // Fetch transactions
  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/api/finance/quickbooks/transactions', {
        params: {
          status: filters.status,
          startDate: filters.startDate ? filters.startDate.toISOString() : null,
          endDate: filters.endDate ? filters.endDate.toISOString() : null,
          search: filters.searchQuery
        }
      });

      setTransactions(response.data.transactions || []);
      setSyncStats(response.data.stats || {
        total: 0,
        synced: 0,
        failed: 0,
        pending: 0
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions. Please try again later.');
      setLoading(false);
    }
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter change
  const handleFilterChange = (field) => (event) => {
    setFilters({
      ...filters,
      [field]: event.target.value
    });
  };

  // Handle date filter change
  const handleDateFilterChange = (field) => (date) => {
    setFilters({
      ...filters,
      [field]: date
    });
  };

  // Apply filters
  const handleApplyFilters = () => {
    setOpenFiltersDialog(false);
    setPage(0);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      status: '',
      startDate: null,
      endDate: null,
      searchQuery: ''
    });
    setOpenFiltersDialog(false);
    setPage(0);
  };

  // View transaction details
  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setOpenTransactionDialog(true);
  };

  // Sync all transactions
  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      setError('');
      setSuccess('');

      const response = await api.post('/api/finance/quickbooks/sync-all');
      setSuccess(`Sync initiated. ${response.data.message}`);
      
      // Refresh transactions after a short delay
      setTimeout(() => {
        fetchTransactions();
        setSyncing(false);
      }, 2000);
    } catch (error) {
      console.error('Error syncing transactions:', error);
      setError('Failed to sync transactions. Please try again later.');
      setSyncing(false);
    }
  };

  // Sync single transaction
  const handleSyncTransaction = async (transactionId) => {
    try {
      setSyncing(true);
      setError('');
      setSuccess('');

      const response = await api.post(`/api/finance/quickbooks/sync-transaction/${transactionId}`);
      setSuccess(`Transaction synced successfully. ${response.data.message}`);
      
      // Refresh transactions after a short delay
      setTimeout(() => {
        fetchTransactions();
        setSyncing(false);
      }, 1000);
    } catch (error) {
      console.error('Error syncing transaction:', error);
      setError('Failed to sync transaction. Please try again later.');
      setSyncing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'synced':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'synced':
        return <CheckCircle fontSize="small" />;
      case 'failed':
        return <Error fontSize="small" />;
      case 'pending':
        return <Warning fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>
      <Typography variant="h5" gutterBottom>
        QuickBooks Reconciliation
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

      {/* Sync Stats */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6">{syncStats.total}</Typography>
              <Typography variant="body2" color="textSecondary">Total Transactions</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">{syncStats.synced}</Typography>
              <Typography variant="body2" color="textSecondary">Synced</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">{syncStats.failed}</Typography>
              <Typography variant="body2" color="textSecondary">Failed</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">{syncStats.pending}</Typography>
              <Typography variant="body2" color="textSecondary">Pending</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Filters and Actions */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={filters.searchQuery}
            onChange={handleFilterChange('searchQuery')}
            sx={{ mr: 2, width: 250 }}
            InputProps={{
              startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setOpenFiltersDialog(true)}
          >
            Filters
          </Button>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchTransactions}
            sx={{ mr: 1 }}
            disabled={loading || syncing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={syncing ? <CircularProgress size={20} /> : <Sync />}
            onClick={handleSyncAll}
            disabled={loading || syncing}
          >
            {syncing ? 'Syncing...' : 'Sync All'}
          </Button>
        </Box>
      </Box>

      {/* Transactions Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="transactions table">
            <TableHead>
              <TableRow>
                <TableCell>Receipt #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Sync</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                transactions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((transaction) => (
                    <TableRow hover key={transaction._id}>
                      <TableCell>{transaction.receiptNumber}</TableCell>
                      <TableCell>{formatDate(transaction.paymentDate)}</TableCell>
                      <TableCell>
                        {transaction.studentName || 'N/A'}
                      </TableCell>
                      <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.paymentMethod.replace('_', ' ').toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(transaction.syncStatus)}
                          label={transaction.syncStatus.toUpperCase()}
                          color={getStatusColor(transaction.syncStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(transaction.lastSyncDate)}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewTransaction(transaction)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sync to QuickBooks">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleSyncTransaction(transaction._id)}
                            disabled={syncing || transaction.syncStatus === 'synced'}
                          >
                            <Sync fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={transactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Filters Dialog */}
      <Dialog open={openFiltersDialog} onClose={() => setOpenFiltersDialog(false)}>
        <DialogTitle>Filter Transactions</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={handleFilterChange('status')}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="synced">Synced</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  handleDateFilterChange('startDate')({ target: { value: date } });
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  handleDateFilterChange('endDate')({ target: { value: date } });
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetFilters}>Reset</Button>
          <Button onClick={handleApplyFilters} color="primary">
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Details Dialog */}
      <Dialog
        open={openTransactionDialog}
        onClose={() => setOpenTransactionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Transaction Details</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Receipt Number</Typography>
                <Typography variant="body1" gutterBottom>{selectedTransaction.receiptNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Payment Date</Typography>
                <Typography variant="body1" gutterBottom>{formatDate(selectedTransaction.paymentDate)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Student</Typography>
                <Typography variant="body1" gutterBottom>{selectedTransaction.studentName || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Class</Typography>
                <Typography variant="body1" gutterBottom>{selectedTransaction.className || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Amount</Typography>
                <Typography variant="body1" gutterBottom>{formatCurrency(selectedTransaction.amount)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Payment Method</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedTransaction.paymentMethod.replace('_', ' ').toUpperCase()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>QuickBooks Information</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Sync Status</Typography>
                <Chip
                  icon={getStatusIcon(selectedTransaction.syncStatus)}
                  label={selectedTransaction.syncStatus.toUpperCase()}
                  color={getStatusColor(selectedTransaction.syncStatus)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Last Sync Date</Typography>
                <Typography variant="body1" gutterBottom>{formatDate(selectedTransaction.lastSyncDate)}</Typography>
              </Grid>
              {selectedTransaction.quickbooksId && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">QuickBooks ID</Typography>
                  <Typography variant="body1" gutterBottom>{selectedTransaction.quickbooksId}</Typography>
                </Grid>
              )}
              {selectedTransaction.syncError && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Sync Error</Typography>
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {selectedTransaction.syncError}
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTransactionDialog(false)}>Close</Button>
          {selectedTransaction && selectedTransaction.syncStatus !== 'synced' && (
            <Button
              color="primary"
              variant="contained"
              startIcon={syncing ? <CircularProgress size={20} /> : <Sync />}
              onClick={() => {
                handleSyncTransaction(selectedTransaction._id);
                setOpenTransactionDialog(false);
              }}
              disabled={syncing}
            >
              {syncing ? 'Syncing...' : 'Sync to QuickBooks'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickbooksReconciliation;
