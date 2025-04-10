import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const RecordStudentFeePaymentDialog = ({ open, onClose, studentFee, onSubmit, formatCurrency }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [amount, setAmount] = useState(studentFee ? studentFee.balance.toString() : '0');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [useInstallments, setUseInstallments] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState([]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open && studentFee) {
      setAmount(studentFee.balance.toString());
      setPaymentMethod('cash');
      setPaymentDate(new Date());
      setReferenceNumber('');
      setNotes('');
      setUseInstallments(false);
      setSelectedInstallments([]);
    }
  }, [open, studentFee]);

  // Handle payment method change
  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  // Handle payment date change
  const handlePaymentDateChange = (date) => {
    setPaymentDate(date);
  };

  // Handle amount change
  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };

  // Handle reference number change
  const handleReferenceNumberChange = (event) => {
    setReferenceNumber(event.target.value);
  };

  // Handle notes change
  const handleNotesChange = (event) => {
    setNotes(event.target.value);
  };

  // Handle use installments change
  const handleUseInstallmentsChange = (event) => {
    setUseInstallments(event.target.checked);
    if (!event.target.checked) {
      setSelectedInstallments([]);
    }
  };

  // Handle installment selection
  const handleInstallmentSelection = (installmentIndex) => {
    const newSelectedInstallments = [...selectedInstallments];
    const index = newSelectedInstallments.indexOf(installmentIndex);
    
    if (index === -1) {
      newSelectedInstallments.push(installmentIndex);
    } else {
      newSelectedInstallments.splice(index, 1);
    }
    
    setSelectedInstallments(newSelectedInstallments);
    
    // Calculate total amount based on selected installments
    if (newSelectedInstallments.length > 0 && studentFee && studentFee.installments) {
      const totalAmount = newSelectedInstallments.reduce((sum, index) => {
        const installment = studentFee.installments[index];
        return sum + (installment ? installment.balance : 0);
      }, 0);
      
      setAmount(totalAmount.toString());
    } else {
      setAmount(studentFee ? studentFee.balance.toString() : '0');
    }
  };

  // Handle submit
  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    
    if (parseFloat(amount) > studentFee.balance) {
      setError('Payment amount cannot exceed the balance.');
      return;
    }
    
    if (paymentMethod === 'bank_transfer' && !referenceNumber) {
      setError('Reference number is required for bank transfers.');
      return;
    }
    
    const paymentData = {
      studentFee: studentFee._id,
      amount: parseFloat(amount),
      paymentMethod,
      paymentDate: paymentDate.toISOString(),
      referenceNumber: referenceNumber || null,
      notes: notes || null,
      installments: useInstallments ? selectedInstallments : null
    };
    
    onSubmit(paymentData);
  };

  if (!studentFee) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Record Payment</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Student Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Student Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Name</Typography>
                <Typography variant="body1">{`${studentFee.student?.firstName} ${studentFee.student?.lastName}`}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Admission Number</Typography>
                <Typography variant="body1">{studentFee.student?.admissionNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Class</Typography>
                <Typography variant="body1">
                  {studentFee.class?.name}
                  {studentFee.class?.section && ` - ${studentFee.class.section}`}
                  {studentFee.class?.stream && ` (${studentFee.class.stream})`}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Fee Structure</Typography>
                <Typography variant="body1">{studentFee.feeStructure?.name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                <Typography variant="body1">{formatCurrency(studentFee.totalAmount)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Balance</Typography>
                <Typography variant="body1" color="error.main">{formatCurrency(studentFee.balance)}</Typography>
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          {/* Payment Details */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Payment Details
            </Typography>
            
            {studentFee.installments && studentFee.installments.length > 0 && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useInstallments}
                    onChange={handleUseInstallmentsChange}
                  />
                }
                label="Pay specific installments"
                sx={{ mb: 2 }}
              />
            )}
            
            {useInstallments && studentFee.installments && studentFee.installments.length > 0 ? (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Installments to Pay
                </Typography>
                <List>
                  {studentFee.installments.map((installment, index) => (
                    <ListItem 
                      key={index}
                      button
                      onClick={() => handleInstallmentSelection(index)}
                      disabled={installment.status === 'paid'}
                    >
                      <Checkbox
                        edge="start"
                        checked={selectedInstallments.includes(index)}
                        disabled={installment.status === 'paid'}
                      />
                      <ListItemText
                        primary={`${installment.name} (${installment.percentage}%)`}
                        secondary={`Due: ${new Date(installment.dueDate).toLocaleDateString()} - Balance: ${formatCurrency(installment.balance)}`}
                      />
                      <ListItemSecondaryAction>
                        <Chip 
                          label={installment.status.charAt(0).toUpperCase() + installment.status.slice(1)} 
                          color={
                            installment.status === 'paid' 
                              ? 'success' 
                              : installment.status === 'partial' 
                                ? 'warning' 
                                : installment.status === 'overdue'
                                  ? 'error'
                                  : 'default'
                          }
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    InputProps={{
                      inputProps: { min: 0, max: studentFee.balance }
                    }}
                    required
                  />
                </Grid>
              </Grid>
            )}
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    onChange={handlePaymentMethodChange}
                    label="Payment Method"
                  >
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
                    label="Payment Date"
                    value={paymentDate}
                    onChange={handlePaymentDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reference Number"
                  value={referenceNumber}
                  onChange={handleReferenceNumberChange}
                  helperText={paymentMethod === 'bank_transfer' ? 'Required for bank transfers' : 'Optional'}
                  required={paymentMethod === 'bank_transfer'}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={notes}
                  onChange={handleNotesChange}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > studentFee.balance}
        >
          {loading ? <CircularProgress size={24} /> : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RecordStudentFeePaymentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  studentFee: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired
};

export default RecordStudentFeePaymentDialog;
