import React, { useState } from 'react';
import PropTypes from 'prop-types';
import api from '../../services/api';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  Print,
  Email,
  Receipt,
  Payment,
  Person,
  School,
  CalendarToday,
  AttachMoney,
  AccountBalance,
  Notifications,
  Message,
  Download
} from '@mui/icons-material';
import FeeReminderDialog from './FeeReminderDialog';

const StudentFeeDetails = ({ studentFee, onRecordPayment, formatCurrency, getStatusColor }) => {
  const [openReminderDialog, setOpenReminderDialog] = useState(false);

  if (!studentFee || !studentFee.studentFee) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>No student fee details available.</Typography>
      </Paper>
    );
  }

  const { studentFee: fee, payments } = studentFee;

  // Use the formatCurrency function passed as prop

  // Generate receipt
  const handleGenerateReceipt = (paymentId) => {
    // Open a new window or tab with the receipt
    window.open(`/api/finance/payments/${paymentId}/receipt`, '_blank');
  };

  // Send receipt via email
  const handleSendReceiptEmail = async (paymentId) => {
    try {
      const response = await api.post(`/api/finance/payments/${paymentId}/email`);
      alert(`Receipt sent successfully to ${response.data.email}`);
    } catch (error) {
      console.error('Error sending receipt email:', error);
      alert(error.response?.data?.message || 'Failed to send receipt email. Please try again later.');
    }
  };

  // Print all receipts
  const handlePrintAllReceipts = () => {
    // Open each receipt in a new tab
    if (payments && payments.length > 0) {
      for (const payment of payments) {
        window.open(`/api/finance/payments/${payment._id}/receipt`, '_blank');
      }
    }
  };

  // Open reminder dialog
  const handleOpenReminderDialog = () => {
    setOpenReminderDialog(true);
  };

  // Close reminder dialog
  const handleCloseReminderDialog = () => {
    setOpenReminderDialog(false);
  };

  // Download fee statement
  const handleDownloadStatement = () => {
    // Open the statement in a new tab
    window.open(`/api/finance/student-fees/${fee._id}/statement`, '_blank');
  };

  return (
    <Box>
      {/* Student and Fee Information */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Student Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1 }} /> Student Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Name</Typography>
                  <Typography variant="body1">{`${fee.student?.firstName} ${fee.student?.lastName}`}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Admission Number</Typography>
                  <Typography variant="body1">{fee.student?.admissionNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Class</Typography>
                  <Typography variant="body1">
                    {fee.class?.name}
                    {fee.class?.section && ` - ${fee.class.section}`}
                    {fee.class?.stream && ` (${fee.class.stream})`}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Academic Year</Typography>
                  <Typography variant="body1">{fee.academicYear?.name || fee.academicYear?.year}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Fee Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalance sx={{ mr: 1 }} /> Fee Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Fee Structure</Typography>
                  <Typography variant="body1">{fee.feeStructure?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Chip
                    label={fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                    color={getStatusColor(fee.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                  <Typography variant="body1" fontWeight="bold">{formatCurrency(fee.totalAmount)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Amount Paid</Typography>
                  <Typography variant="body1" color="success.main">{formatCurrency(fee.amountPaid)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Balance</Typography>
                  <Typography variant="body1" color={fee.balance > 0 ? "error.main" : "success.main"}>
                    {formatCurrency(fee.balance)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Due Date</Typography>
                  <Typography variant="body1">{new Date(fee.dueDate).toLocaleDateString()}</Typography>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleDownloadStatement}
                >
                  Download Statement
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Notifications />}
                  onClick={handleOpenReminderDialog}
                  disabled={fee.status === 'paid'}
                  color="warning"
                >
                  Send Reminder
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Payment />}
                  onClick={onRecordPayment}
                  disabled={fee.status === 'paid'}
                >
                  Record Payment
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fee Components */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AttachMoney sx={{ mr: 1 }} /> Fee Components
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Component</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Amount Paid</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fee.feeComponents.map((component) => (
                <TableRow key={`${component.name}-${component.amount}`}>
                  <TableCell>{component.name}</TableCell>
                  <TableCell>{formatCurrency(component.amount)}</TableCell>
                  <TableCell>{formatCurrency(component.amountPaid)}</TableCell>
                  <TableCell>{formatCurrency(component.balance)}</TableCell>
                  <TableCell>
                    <Chip
                      label={component.status.charAt(0).toUpperCase() + component.status.slice(1)}
                      color={getStatusColor(component.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {component.dueDate ? new Date(component.dueDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={1} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{formatCurrency(fee.totalAmount)}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{formatCurrency(fee.amountPaid)}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{formatCurrency(fee.balance)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Payment History */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Receipt sx={{ mr: 1 }} /> Payment History
          </Typography>
          {payments && payments.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrintAllReceipts}
            >
              Print All Receipts
            </Button>
          )}
        </Box>

        {!payments || payments.length === 0 ? (
          <Typography>No payment records found.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Receipt #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Received By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{payment.receiptNumber}</TableCell>
                    <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>{payment.referenceNumber || 'N/A'}</TableCell>
                    <TableCell>{payment.receivedBy?.username || 'System'}</TableCell>
                    <TableCell>
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
        )}
      </Paper>

      {/* Fee Reminder Dialog */}
      <FeeReminderDialog
        open={openReminderDialog}
        onClose={handleCloseReminderDialog}
        studentFee={fee}
        formatCurrency={formatCurrency}
      />
    </Box>
  );
};

StudentFeeDetails.propTypes = {
  studentFee: PropTypes.object,
  onRecordPayment: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func.isRequired
};

export default StudentFeeDetails;
