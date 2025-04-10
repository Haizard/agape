import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  CalendarToday,
  AccountBalance
} from '@mui/icons-material';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

const PaymentMethodReport = ({ data }) => {
  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No payment method data available.</Typography>
      </Box>
    );
  }

  // Extract data with defaults for missing properties
  const payments = data.payments || [];
  const summary = {
    totalAmount: data.totalAmount || 0,
    totalPayments: data.totalPayments || 0,
    startDate: data.startDate ? new Date(data.startDate) : new Date(),
    endDate: data.endDate ? new Date(data.endDate) : new Date()
  };

  // Create byMethod object from paymentsByMethod array
  const byMethod = {};
  if (data.paymentsByMethod && Array.isArray(data.paymentsByMethod)) {
    for (const method of data.paymentsByMethod) {
      byMethod[method.method] = {
        count: method.count,
        amount: method.amount
      };
    }
  }

  // Create byDate object (this is a simplified version since we don't have date-based data)
  const byDate = {};

  // Format currency
  const formatCurrency = (amount) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  // Prepare data for payment method chart
  const methodChartData = Object.keys(byMethod).length > 0 ? Object.entries(byMethod).map(([method, { count, amount }], index) => ({
    name: method.replace('_', ' ').toUpperCase(),
    count,
    amount,
    color: COLORS[index % COLORS.length]
  })) : [];

  // Prepare data for trend chart
  const trendChartData = Object.keys(byDate).length > 0 ? Object.entries(byDate).map(([date, methodData]) => {
    const dataPoint = {
      date: new Date(date).toLocaleDateString(),
    };

    for (const [method, amount] of Object.entries(methodData)) {
      dataPoint[method.replace('_', ' ').toUpperCase()] = amount;
    }

    return dataPoint;
  }) : [];

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ mr: 1 }} /> Total Payments
              </Typography>
              <Typography variant="h4">{formatCurrency(summary.totalAmount)}</Typography>
              <Typography variant="body2" color="textSecondary">
                {summary.totalPayments} payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarToday sx={{ mr: 1 }} /> Period
              </Typography>
              <Typography variant="body1">
                {new Date(summary.startDate).toLocaleDateString()} - {new Date(summary.endDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {Math.ceil((summary.endDate - summary.startDate) / (1000 * 60 * 60 * 24))} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalance sx={{ mr: 1 }} /> Methods
              </Typography>
              <Typography variant="h4">{summary.methodCount}</Typography>
              <Typography variant="body2" color="textSecondary">
                Most used: {summary.mostUsedMethod.replace('_', ' ').toUpperCase()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 1 }} /> Daily Average
              </Typography>
              <Typography variant="h4">{formatCurrency(summary.dailyAverage)}</Typography>
              <Typography variant="body2" color="textSecondary">
                {(summary.paymentCount / summary.daysInPeriod).toFixed(1)} payments/day
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Payment Methods Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={methodChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {methodChartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Payment Methods Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={trendChartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                {Object.keys(byMethod).map((method, index) => (
                  <Line
                    key={method}
                    type="monotone"
                    dataKey={method.replace('_', ' ').toUpperCase()}
                    stroke={COLORS[index % COLORS.length]}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Payments Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Payments by Method
        </Typography>
        <Divider />
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Receipt #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Received By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id} hover>
                  <TableCell>{payment.receiptNumber}</TableCell>
                  <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {payment.student?.firstName} {payment.student?.lastName}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

PaymentMethodReport.propTypes = {
  data: PropTypes.shape({
    payments: PropTypes.array,
    summary: PropTypes.shape({
      totalAmount: PropTypes.number,
      paymentCount: PropTypes.number,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      daysInPeriod: PropTypes.number,
      methodCount: PropTypes.number,
      mostUsedMethod: PropTypes.string,
      dailyAverage: PropTypes.number
    }),
    byMethod: PropTypes.object,
    byDate: PropTypes.object,
    paymentsByMethod: PropTypes.arrayOf(
      PropTypes.shape({
        method: PropTypes.string,
        count: PropTypes.number,
        amount: PropTypes.number,
        percentage: PropTypes.number
      })
    ),
    totalAmount: PropTypes.number,
    totalPayments: PropTypes.number,
    startDate: PropTypes.string,
    endDate: PropTypes.string
  })
};

export default PaymentMethodReport;
