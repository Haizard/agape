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
  Warning,
  School
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

const FeeBalanceReport = ({ data }) => {
  if (!data || !data.students) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No fee balance data available.</Typography>
      </Box>
    );
  }

  const { students, summary, byClass, byStatus } = data;

  // Format currency
  const formatCurrency = (amount) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  // Prepare data for status chart
  const statusChartData = Object.entries(byStatus).map(([status, { count, amount }], index) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    amount,
    color: COLORS[index % COLORS.length]
  }));

  // Prepare data for class chart
  const classChartData = Object.entries(byClass).map(([className, { totalAmount, paidAmount, balanceAmount }], index) => ({
    name: className,
    total: totalAmount,
    paid: paidAmount,
    balance: balanceAmount,
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
                <AttachMoney sx={{ mr: 1 }} /> Total Fees
              </Typography>
              <Typography variant="h4">{formatCurrency(summary.totalAmount)}</Typography>
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
                <AttachMoney sx={{ mr: 1, color: 'success.main' }} /> Amount Paid
              </Typography>
              <Typography variant="h4" color="success.main">{formatCurrency(summary.paidAmount)}</Typography>
              <Typography variant="body2" color="textSecondary">
                {((summary.paidAmount / summary.totalAmount) * 100).toFixed(1)}% of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ mr: 1, color: 'error.main' }} /> Outstanding
              </Typography>
              <Typography variant="h4" color="error.main">{formatCurrency(summary.balanceAmount)}</Typography>
              <Typography variant="body2" color="textSecondary">
                {((summary.balanceAmount / summary.totalAmount) * 100).toFixed(1)}% of total
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
                {summary.overdueCount} students overdue
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
              Fee Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Fee Balance by Class
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
                <Bar dataKey="total" name="Total Fees" fill="#8884d8" />
                <Bar dataKey="paid" name="Amount Paid" fill="#82ca9d" />
                <Bar dataKey="balance" name="Balance" fill="#ff8042" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Students Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Student Fee Balances
        </Typography>
        <Divider />
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Admission #</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Total Fees</TableCell>
                <TableCell>Amount Paid</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student._id} hover>
                  <TableCell>{student.admissionNumber}</TableCell>
                  <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                  <TableCell>{student.class?.name}</TableCell>
                  <TableCell>{formatCurrency(student.fee?.totalAmount)}</TableCell>
                  <TableCell>{formatCurrency(student.fee?.amountPaid)}</TableCell>
                  <TableCell>{formatCurrency(student.fee?.balance)}</TableCell>
                  <TableCell>
                    <Chip
                      label={student.fee?.status.charAt(0).toUpperCase() + student.fee?.status.slice(1)}
                      color={getStatusColor(student.fee?.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {student.fee?.dueDate ? new Date(student.fee.dueDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

FeeBalanceReport.propTypes = {
  data: PropTypes.shape({
    students: PropTypes.array,
    summary: PropTypes.shape({
      totalAmount: PropTypes.number,
      paidAmount: PropTypes.number,
      balanceAmount: PropTypes.number,
      studentCount: PropTypes.number,
      classCount: PropTypes.number,
      overdueCount: PropTypes.number
    }),
    byClass: PropTypes.object,
    byStatus: PropTypes.object
  })
};

export default FeeBalanceReport;
