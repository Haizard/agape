import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const RecordPaymentDialog = ({ open, onClose, studentFee, onSubmit, formatCurrency }) => {
  const [payment, setPayment] = useState({
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date(),
    referenceNumber: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setPayment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle date change
  const handleDateChange = (date) => {
    setPayment(prev => ({
      ...prev,
      paymentDate: date
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!payment.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(payment.amount) || parseFloat(payment.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    } else if (parseFloat(payment.amount) > studentFee.balance) {
      newErrors.amount = `Amount cannot exceed the balance (${formatCurrency(studentFee.balance)})`;
    }

    if (!payment.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    if (!payment.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    if (payment.paymentMethod !== 'cash' && !payment.referenceNumber) {
      newErrors.referenceNumber = 'Reference number is required for non-cash payments';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        ...payment,
        amount: parseFloat(payment.amount)
      });
    }
  };

  // Reset form on close
  const handleClose = () => {
    setPayment({
      amount: '',
      paymentMethod: 'cash',
      paymentDate: new Date(),
      referenceNumber: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Record Payment</DialogTitle>
      <DialogContent>
        {studentFee && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Student: {`${studentFee.student?.firstName} ${studentFee.student?.lastName}`}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Fee Structure:</strong> {studentFee.feeStructure?.name}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Total Amount:</strong> {formatCurrency(studentFee.totalAmount)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Amount Paid:</strong> {formatCurrency(studentFee.amountPaid)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Balance:</strong> {formatCurrency(studentFee.balance)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Amount"
              name="amount"
              value={payment.amount}
              onChange={handleInputChange}
              error={!!errors.amount}
              helperText={errors.amount}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">TZS</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.paymentMethod} required>
              <InputLabel>Payment Method</InputLabel>
              <Select
                name="paymentMethod"
                value={payment.paymentMethod}
                onChange={handleInputChange}
                label="Payment Method"
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="mobile_money">Mobile Money</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
              {errors.paymentMethod && (
                <Typography variant="caption" color="error">
                  {errors.paymentMethod}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Payment Date"
                value={payment.paymentDate}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.paymentDate}
                    helperText={errors.paymentDate}
                    required
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Reference Number"
              name="referenceNumber"
              value={payment.referenceNumber}
              onChange={handleInputChange}
              error={!!errors.referenceNumber}
              helperText={errors.referenceNumber || 'Required for bank transfers, mobile money, etc.'}
              required={payment.paymentMethod !== 'cash'}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={payment.notes}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
        >
          Record Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RecordPaymentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  studentFee: PropTypes.shape({
    student: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string
    }),
    feeStructure: PropTypes.shape({
      name: PropTypes.string
    }),
    totalAmount: PropTypes.number,
    amountPaid: PropTypes.number,
    balance: PropTypes.number
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired
};

export default RecordPaymentDialog;
