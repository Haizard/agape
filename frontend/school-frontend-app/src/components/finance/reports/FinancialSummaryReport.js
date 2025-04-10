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
  AccountBalance,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

const FinancialSummaryReport = ({ data }) => {
  if (!data || !data.summary) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No financial summary data available.</Typography>
      </Box>
    );
  }

  const { summary, incomeByCategory, expenseByCategory, monthlyData, transactions } = data;

  // Format currency
  const formatCurrency = (amount) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  // Prepare data for income/expense chart
  const categoryChartData = [
    ...Object.entries(incomeByCategory).map(([category, amount], index) => ({
      name: category,
      amount,
      type: 'Income',
      color: COLORS[index % COLORS.length]
    })),
    ...Object.entries(expenseByCategory).map(([category, amount], index) => ({
      name: category,
      amount,
      type: 'Expense',
      color: COLORS[(index + Object.keys(incomeByCategory).length) % COLORS.length]
    }))
  ];

  // Prepare data for monthly trend chart
  const monthlyChartData = Object.entries(monthlyData).map(([month, { income, expense }]) => ({
    month,
    income,
    expense,
    profit: income - expense
  }));

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ArrowUpward sx={{ mr: 1, color: 'success.main' }} /> Total Income
              </Typography>
              <Typography variant="h4" color="success.main">{formatCurrency(summary.totalIncome)}</Typography>
              <Typography variant="body2" color="textSecondary">
                {summary.incomeTransactionCount} transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ArrowDownward sx={{ mr: 1, color: 'error.main' }} /> Total Expenses
              </Typography>
              <Typography variant="h4" color="error.main">{formatCurrency(summary.totalExpense)}</Typography>
              <Typography variant="body2" color="textSecondary">
                {summary.expenseTransactionCount} transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalance sx={{ mr: 1 }} /> Net Profit
              </Typography>
              <Typography
                variant="h4"
                color={summary.netProfit >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(summary.netProfit)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Profit Margin: {((summary.netProfit / summary.totalIncome) * 100).toFixed(1)}%
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
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Income vs Expense by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={categoryChartData}
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
                <Bar dataKey="amount" name="Amount" fill="#8884d8">
                  {categoryChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.type === 'Income' ? '#82ca9d' : '#ff8042'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Financial Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={monthlyChartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#82ca9d" />
                <Bar dataKey="expense" name="Expense" fill="#ff8042" />
                <Bar dataKey="profit" name="Profit" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Transactions Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Recent Transactions
        </Typography>
        <Divider />
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Recorded By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction._id} hover>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.type.toUpperCase()}
                      size="small"
                      color={transaction.type === 'income' ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>{transaction.reference || 'N/A'}</TableCell>
                  <TableCell>{transaction.recordedBy?.username || 'System'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

FinancialSummaryReport.propTypes = {
  data: PropTypes.shape({
    summary: PropTypes.shape({
      totalIncome: PropTypes.number,
      totalExpense: PropTypes.number,
      netProfit: PropTypes.number,
      incomeTransactionCount: PropTypes.number,
      expenseTransactionCount: PropTypes.number,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      daysInPeriod: PropTypes.number
    }),
    incomeByCategory: PropTypes.object,
    expenseByCategory: PropTypes.object,
    monthlyData: PropTypes.object,
    transactions: PropTypes.array
  })
};

export default FinancialSummaryReport;
