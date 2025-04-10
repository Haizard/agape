import React from 'react';
import PropTypes from 'prop-types';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  Box,
  Chip
} from '@mui/material';
import { Receipt, AttachMoney, CreditCard, AccountBalance, Phone } from '@mui/icons-material';

const RecentPaymentsWidget = ({ payments }) => {
  // Function to get icon based on payment method
  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return <AttachMoney />;
      case 'bank_transfer':
        return <AccountBalance />;
      case 'check':
        return <AccountBalance />;
      case 'credit_card':
        return <CreditCard />;
      case 'mobile_money':
        return <Phone />;
      default:
        return <Receipt />;
    }
  };

  // Function to format payment method for display
  const formatPaymentMethod = (method) => {
    return method.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
      {payments.length > 0 ? (
        payments.map((payment, index) => (
          <React.Fragment key={payment._id}>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {getPaymentMethodIcon(payment.paymentMethod)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" component="span">
                    {payment.student ? `${payment.student.firstName} ${payment.student.lastName}` : 'Unknown Student'}
                  </Typography>
                }
                secondary={
                  <React.Fragment>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      TZS {payment.amount.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(payment.paymentDate)}
                      </Typography>
                      <Chip
                        label={formatPaymentMethod(payment.paymentMethod)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </React.Fragment>
                }
              />
            </ListItem>
            {index < payments.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))
      ) : (
        <ListItem>
          <ListItemText
            primary="No recent payments"
            secondary="Payments will appear here as they are recorded"
          />
        </ListItem>
      )}
    </List>
  );
};

RecentPaymentsWidget.propTypes = {
  payments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      student: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string
      }),
      amount: PropTypes.number.isRequired,
      paymentDate: PropTypes.string.isRequired,
      paymentMethod: PropTypes.string.isRequired
    })
  ).isRequired
};

export default RecentPaymentsWidget;
