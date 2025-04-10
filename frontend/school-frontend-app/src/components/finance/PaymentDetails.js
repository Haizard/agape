import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Print,
  Email,
  Receipt,
  Person,
  School,
  CalendarToday,
  AccountBalance,
  AttachMoney
} from '@mui/icons-material';

const PaymentDetails = ({ payment, formatCurrency, onPrintReceipt, onEmailReceipt }) => {
  if (!payment) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>No payment details available.</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Print />}
          onClick={onPrintReceipt}
        >
          Print Receipt
        </Button>
        <Button
          variant="outlined"
          startIcon={<Email />}
          onClick={onEmailReceipt}
        >
          Email Receipt
        </Button>
      </Box>

      {/* Payment Information */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Payment Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Receipt sx={{ mr: 1 }} /> Payment Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Receipt Number</Typography>
                  <Typography variant="body1">{payment.receiptNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Payment Date</Typography>
                  <Typography variant="body1">{new Date(payment.paymentDate).toLocaleDateString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Amount</Typography>
                  <Typography variant="body1" fontWeight="bold">{formatCurrency(payment.amount)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Payment Method</Typography>
                  <Chip
                    label={payment.paymentMethod.replace('_', ' ').toUpperCase()}
                    size="small"
                    color={payment.paymentMethod === 'cash' ? 'success' : 'primary'}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Reference Number</Typography>
                  <Typography variant="body1">{payment.referenceNumber || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Received By</Typography>
                  <Typography variant="body1">{payment.receivedBy?.username || 'System'}</Typography>
                </Grid>
                {payment.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Notes</Typography>
                    <Typography variant="body1">{payment.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

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
                  <Typography variant="body1">
                    {payment.studentFee?.student?.firstName} {payment.studentFee?.student?.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Admission Number</Typography>
                  <Typography variant="body1">{payment.studentFee?.student?.admissionNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Class</Typography>
                  <Typography variant="body1">
                    {payment.studentFee?.class?.name}
                    {payment.studentFee?.class?.section && ` - ${payment.studentFee.class.section}`}
                    {payment.studentFee?.class?.stream && ` (${payment.studentFee.class.stream})`}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Academic Year</Typography>
                  <Typography variant="body1">
                    {payment.studentFee?.academicYear?.name || payment.studentFee?.academicYear?.year}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Fee Structure</Typography>
                  <Typography variant="body1">{payment.studentFee?.feeStructure?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Total Fee Amount</Typography>
                  <Typography variant="body1">{formatCurrency(payment.studentFee?.totalAmount)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fee Payment Status */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AttachMoney sx={{ mr: 1 }} /> Fee Payment Status
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Total Amount</TableCell>
                <TableCell>Amount Paid (Before)</TableCell>
                <TableCell>This Payment</TableCell>
                <TableCell>Amount Paid (After)</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{formatCurrency(payment.studentFee?.totalAmount)}</TableCell>
                <TableCell>{formatCurrency(payment.previousAmountPaid)}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{formatCurrency(payment.studentFee?.amountPaid)}</TableCell>
                <TableCell>{formatCurrency(payment.studentFee?.balance)}</TableCell>
                <TableCell>
                  <Chip
                    label={payment.studentFee?.status.charAt(0).toUpperCase() + payment.studentFee?.status.slice(1)}
                    color={
                      payment.studentFee?.status === 'paid'
                        ? 'success'
                        : payment.studentFee?.status === 'partial'
                          ? 'warning'
                          : 'default'
                    }
                    size="small"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* QuickBooks Information */}
      {payment.quickbooksInfo && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <AccountBalance sx={{ mr: 1 }} /> QuickBooks Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">QuickBooks ID</Typography>
              <Typography variant="body1">{payment.quickbooksInfo.id}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Sync Status</Typography>
              <Chip
                label={payment.quickbooksInfo.syncStatus}
                color={payment.quickbooksInfo.syncStatus === 'synced' ? 'success' : 'warning'}
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Last Sync</Typography>
              <Typography variant="body1">
                {payment.quickbooksInfo.lastSyncDate
                  ? new Date(payment.quickbooksInfo.lastSyncDate).toLocaleString()
                  : 'Never'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Document Number</Typography>
              <Typography variant="body1">{payment.quickbooksInfo.documentNumber || 'N/A'}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

PaymentDetails.propTypes = {
  payment: PropTypes.shape({
    receiptNumber: PropTypes.string,
    paymentDate: PropTypes.string,
    amount: PropTypes.number,
    paymentMethod: PropTypes.string,
    referenceNumber: PropTypes.string,
    receivedBy: PropTypes.shape({
      username: PropTypes.string
    }),
    notes: PropTypes.string,
    previousAmountPaid: PropTypes.number,
    studentFee: PropTypes.shape({
      student: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        admissionNumber: PropTypes.string
      }),
      class: PropTypes.shape({
        name: PropTypes.string,
        section: PropTypes.string,
        stream: PropTypes.string
      }),
      academicYear: PropTypes.shape({
        name: PropTypes.string,
        year: PropTypes.string
      }),
      feeStructure: PropTypes.shape({
        name: PropTypes.string
      }),
      totalAmount: PropTypes.number,
      amountPaid: PropTypes.number,
      balance: PropTypes.number,
      status: PropTypes.string
    }),
    quickbooksInfo: PropTypes.shape({
      id: PropTypes.string,
      syncStatus: PropTypes.string,
      lastSyncDate: PropTypes.string,
      documentNumber: PropTypes.string
    })
  }),
  formatCurrency: PropTypes.func.isRequired,
  onPrintReceipt: PropTypes.func,
  onEmailReceipt: PropTypes.func
};

export default PaymentDetails;
