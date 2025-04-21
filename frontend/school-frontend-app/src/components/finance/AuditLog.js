import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  Download,
  Person,
  AttachMoney,
  Receipt,
  Edit,
  Delete,
  Settings,
  AccountBalance
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';
import { useSelector } from 'react-redux';

/**
 * AuditLog component
 * 
 * This component displays a log of all financial activities for auditing purposes.
 */
const AuditLog = () => {
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    action: '',
    user: '',
    startDate: null,
    endDate: null,
    entityType: '',
    searchQuery: ''
  });
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [openLogDetailsDialog, setOpenLogDetailsDialog] = useState(false);

  // Fetch audit logs
  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/finance/audit-logs', {
          params: {
            action: filters.action,
            user: filters.user,
            startDate: filters.startDate ? filters.startDate.toISOString() : null,
            endDate: filters.endDate ? filters.endDate.toISOString() : null,
            entityType: filters.entityType,
            search: filters.searchQuery
          }
        });
        setAuditLogs(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        setError('Failed to load audit logs. Please try again later.');
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [filters]);

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
      action: '',
      user: '',
      startDate: null,
      endDate: null,
      entityType: '',
      searchQuery: ''
    });
    setOpenFiltersDialog(false);
    setPage(0);
  };

  // View log details
  const handleViewLogDetails = (log) => {
    setSelectedLog(log);
    setOpenLogDetailsDialog(true);
  };

  // Export logs to CSV
  const handleExportLogs = async () => {
    try {
      const response = await api.get('/api/finance/audit-logs/export', {
        params: {
          action: filters.action,
          user: filters.user,
          startDate: filters.startDate ? filters.startDate.toISOString() : null,
          endDate: filters.endDate ? filters.endDate.toISOString() : null,
          entityType: filters.entityType,
          search: filters.searchQuery
        },
        responseType: 'blob'
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `finance-audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      setError('Failed to export audit logs. Please try again later.');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get action color
  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'primary';
      case 'DELETE':
        return 'error';
      case 'APPROVE':
        return 'success';
      case 'REJECT':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get entity icon
  const getEntityIcon = (entityType) => {
    switch (entityType) {
      case 'PAYMENT':
        return <Receipt />;
      case 'FEE_STRUCTURE':
        return <AttachMoney />;
      case 'STUDENT_FEE':
        return <Person />;
      case 'SETTINGS':
        return <Settings />;
      case 'QUICKBOOKS':
        return <AccountBalance />;
      default:
        return <Receipt />;
    }
  };

  // Get action icon
  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return <Add />;
      case 'UPDATE':
        return <Edit />;
      case 'DELETE':
        return <Delete />;
      case 'APPROVE':
        return <CheckCircle />;
      case 'REJECT':
        return <Cancel />;
      default:
        return <Edit />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>
      <Typography variant="h5" gutterBottom>
        Audit Log
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={filters.searchQuery}
            onChange={handleFilterChange('searchQuery')}
            sx={{ mr: 2, width: 250 }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setOpenFiltersDialog(true)}
          >
            Filters
          </Button>
        </Box>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExportLogs}
          disabled={loading || auditLogs.length === 0}
        >
          Export
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="audit logs table">
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity Type</TableCell>
                <TableCell>Entity ID</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((log) => (
                    <TableRow hover key={log._id}>
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                      <TableCell>{log.user?.username || 'System'}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.action}
                          color={getActionColor(log.action)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getEntityIcon(log.entityType)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {log.entityType.replace(/_/g, ' ')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{log.entityId}</TableCell>
                      <TableCell>{log.description}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewLogDetails(log)}
                          >
                            <Visibility />
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
          count={auditLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Filters Dialog */}
      <Dialog open={openFiltersDialog} onClose={() => setOpenFiltersDialog(false)}>
        <DialogTitle>Filter Audit Logs</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Action"
                select
                fullWidth
                value={filters.action}
                onChange={handleFilterChange('action')}
                SelectProps={{
                  native: true
                }}
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="APPROVE">Approve</option>
                <option value="REJECT">Reject</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Entity Type"
                select
                fullWidth
                value={filters.entityType}
                onChange={handleFilterChange('entityType')}
                SelectProps={{
                  native: true
                }}
              >
                <option value="">All Entities</option>
                <option value="PAYMENT">Payment</option>
                <option value="FEE_STRUCTURE">Fee Structure</option>
                <option value="STUDENT_FEE">Student Fee</option>
                <option value="SETTINGS">Settings</option>
                <option value="QUICKBOOKS">QuickBooks</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="User"
                fullWidth
                value={filters.user}
                onChange={handleFilterChange('user')}
              />
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={handleDateFilterChange('startDate')}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={handleDateFilterChange('endDate')}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
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

      {/* Log Details Dialog */}
      <Dialog open={openLogDetailsDialog} onClose={() => setOpenLogDetailsDialog(false)}>
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Timestamp
              </Typography>
              <Typography variant="body2" gutterBottom>
                {formatDate(selectedLog.timestamp)}
              </Typography>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                User
              </Typography>
              <Typography variant="body2" gutterBottom>
                {selectedLog.user?.username || 'System'} ({selectedLog.user?.role || 'N/A'})
              </Typography>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Action
              </Typography>
              <Chip
                label={selectedLog.action}
                color={getActionColor(selectedLog.action)}
                size="small"
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Entity
              </Typography>
              <Typography variant="body2" gutterBottom>
                {selectedLog.entityType.replace(/_/g, ' ')} (ID: {selectedLog.entityId})
              </Typography>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Description
              </Typography>
              <Typography variant="body2" gutterBottom>
                {selectedLog.description}
              </Typography>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Changes
              </Typography>
              {selectedLog.changes ? (
                <Box component="pre" sx={{ 
                  bgcolor: 'background.paper', 
                  p: 2, 
                  borderRadius: 1,
                  overflowX: 'auto',
                  fontSize: '0.875rem'
                }}>
                  {JSON.stringify(selectedLog.changes, null, 2)}
                </Box>
              ) : (
                <Typography variant="body2">No detailed changes recorded</Typography>
              )}

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                IP Address
              </Typography>
              <Typography variant="body2" gutterBottom>
                {selectedLog.ipAddress || 'Not recorded'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLog;
