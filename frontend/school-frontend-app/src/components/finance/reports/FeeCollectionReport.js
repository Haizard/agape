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
  School
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

const FeeCollectionReport = ({ data }) => {
  if (!data || !data.collections) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No fee collection data available.</Typography>
      </Box>
    );
  }

  const { collections, summary, byClass, byPaymentMethod, byDate } = data;

  // Format currency
  const formatCurrency = (amount) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  // Prepare data for payment method chart
  const paymentMethodChartData = Object.entries(byPaymentMethod).map(([method, amount], index) => ({
    name: method.replace('_', ' ').toUpperCase(),
    value: amount,
    color: COLORS[index % COLORS.length]
  }));

  // Prepare data for class chart
  const classChartData = Object.entries(byClass).map(([className, amount], index) => ({
    name: className,
    amount: amount,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ mr: 1 }} /> Total Collection
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
                {summary.daysInPeriod} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <School sx={{ mr: 1 }} /> Classes
              </Typography>
              <Typography variant="h4">{summary.classCount}</Typography>
              <Typography variant="body2" color="textSecondary">
                {summary.studentCount} students
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
                {(summary.totalPayments / summary.daysInPeriod).toFixed(1)} payments/day
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
              Collection by Payment Method
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {paymentMethodChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Collection by Class
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={classChartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="amount" name="Amount Collected" fill="#8884d8">
                  {classChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Collections Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Fee Collections
        </Typography>
        <Divider />
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Receipt #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Received By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {collections.map((payment) => (
                <TableRow key={payment._id} hover>
                  <TableCell>{payment.receiptNumber}</TableCell>
                  <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {payment.student?.firstName} {payment.student?.lastName}
                  </TableCell>
                  <TableCell>{payment.class?.name}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={payment.paymentMethod.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={payment.paymentMethod === 'cash' ? 'success' : 'primary'}
                    />
                  </TableCell>
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

FeeCollectionReport.propTypes = {
  data: PropTypes.shape({
    collections: PropTypes.array,
    summary: PropTypes.shape({
      totalAmount: PropTypes.number,
      totalPayments: PropTypes.number,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      daysInPeriod: PropTypes.number,
      classCount: PropTypes.number,
      studentCount: PropTypes.number,
      dailyAverage: PropTypes.number
    }),
    byClass: PropTypes.object,
    byPaymentMethod: PropTypes.object,
    byDate: PropTypes.object
  })
};

export default FeeCollectionReport;
