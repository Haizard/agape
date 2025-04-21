import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  History,
  AttachMoney,
  School,
  Person,
  Receipt
} from '@mui/icons-material';
import api from '../../services/api';
import { useSelector } from 'react-redux';
import PaymentDetails from './PaymentDetails';

/**
 * PaymentApproval component
 * 
 * This component handles the approval workflow for payments that exceed the threshold
 * or require approval based on school policy.
 */
const PaymentApproval = () => {
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingPayments, setPendingPayments] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Fetch pending payments
  useEffect(() => {
    const fetchPendingPayments = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/finance/payments/pending-approval');
        setPendingPayments(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pending payments:', error);
        setError('Failed to load pending payments. Please try again later.');
        setLoading(false);
      }
    };

    fetchPendingPayments();
  }, []);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // View payment details
  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setViewMode('details');
  };

  // Back to list view
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPayment(null);
  };

  // Open approve dialog
  const handleOpenApproveDialog = (payment) => {
    setSelectedPayment(payment);
    setOpenApproveDialog(true);
  };

  // Close approve dialog
  const handleCloseApproveDialog = () => {
    setOpenApproveDialog(false);
    setApprovalNote('');
  };

  // Open reject dialog
  const handleOpenRejectDialog = (payment) => {
    setSelectedPayment(payment);
    setOpenRejectDialog(true);
  };

  // Close reject dialog
  const handleCloseRejectDialog = () => {
    setOpenRejectDialog(false);
    setRejectionReason('');
  };

  // Approve payment
  const handleApprovePayment = async () => {
    if (!selectedPayment) return;

    setProcessingAction(true);
    try {
      await api.post(`/api/finance/payments/${selectedPayment._id}/approve`, {
        approvedBy: user._id,
        approvalNote: approvalNote
      });

      // Update the list of pending payments
      setPendingPayments(pendingPayments.filter(p => p._id !== selectedPayment._id));
      setSuccess(`Payment #${selectedPayment.receiptNumber} has been approved successfully.`);
      handleCloseApproveDialog();
    } catch (error) {
      console.error('Error approving payment:', error);
      setError('Failed to approve payment. Please try again later.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Reject payment
  const handleRejectPayment = async () => {
    if (!selectedPayment || !rejectionReason) return;

    setProcessingAction(true);
    try {
      await api.post(`/api/finance/payments/${selectedPayment._id}/reject`, {
        rejectedBy: user._id,
        rejectionReason: rejectionReason
      });

      // Update the list of pending payments
      setPendingPayments(pendingPayments.filter(p => p._id !== selectedPayment._id));
      setSuccess(`Payment #${selectedPayment.receiptNumber} has been rejected.`);
      handleCloseRejectDialog();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      setError('Failed to reject payment. Please try again later.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render list view
  const renderListView = () => {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="pending payments table">
            <TableHead>
              <TableRow>
                <TableCell>Receipt #</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Reason for Approval</TableCell>
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
              ) : pendingPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No pending payments requiring approval.
                  </TableCell>
                </TableRow>
              ) : (
                pendingPayments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((payment) => (
                    <TableRow hover key={payment._id}>
                      <TableCell>{payment.receiptNumber}</TableCell>
                      <TableCell>
                        {payment.studentFee?.student?.firstName} {payment.studentFee?.student?.lastName}
                      </TableCell>
                      <TableCell>
                        {payment.studentFee?.class?.name} {payment.studentFee?.class?.section}
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.paymentMethod.replace('_', ' ').toUpperCase()}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>{payment.approvalReason}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewPayment(payment)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleOpenApproveDialog(payment)}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenRejectDialog(payment)}
                          >
                            <Cancel />
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
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pendingPayments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>
      <Typography variant="h5" gutterBottom>
        Payment Approval
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

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        {viewMode === 'details' ? (
          <Button variant="outlined" onClick={handleBackToList}>
            Back to List
          </Button>
        ) : (
          <Typography variant="subtitle1">
            Payments requiring approval are listed below.
          </Typography>
        )}
      </Box>

      {viewMode === 'list' ? (
        renderListView()
      ) : (
        <PaymentDetails
          payment={selectedPayment}
          formatCurrency={formatCurrency}
          onPrintReceipt={() => {}}
          onEmailReceipt={() => {}}
        />
      )}

      {/* Approve Dialog */}
      <Dialog open={openApproveDialog} onClose={handleCloseApproveDialog}>
        <DialogTitle>Approve Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to approve this payment?
          </Typography>
          <Typography variant="body2" gutterBottom>
            Receipt #: {selectedPayment?.receiptNumber}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Amount: {selectedPayment && formatCurrency(selectedPayment.amount)}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="approvalNote"
            label="Approval Note (Optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={approvalNote}
            onChange={(e) => setApprovalNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApproveDialog} disabled={processingAction}>
            Cancel
          </Button>
          <Button
            onClick={handleApprovePayment}
            color="primary"
            variant="contained"
            disabled={processingAction}
            startIcon={processingAction ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {processingAction ? 'Processing...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onClose={handleCloseRejectDialog}>
        <DialogTitle>Reject Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to reject this payment?
          </Typography>
          <Typography variant="body2" gutterBottom>
            Receipt #: {selectedPayment?.receiptNumber}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Amount: {selectedPayment && formatCurrency(selectedPayment.amount)}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="rejectionReason"
            label="Reason for Rejection"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            error={!rejectionReason}
            helperText={!rejectionReason ? 'Reason is required' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog} disabled={processingAction}>
            Cancel
          </Button>
          <Button
            onClick={handleRejectPayment}
            color="error"
            variant="contained"
            disabled={processingAction || !rejectionReason}
            startIcon={processingAction ? <CircularProgress size={20} /> : <Cancel />}
          >
            {processingAction ? 'Processing...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentApproval;
