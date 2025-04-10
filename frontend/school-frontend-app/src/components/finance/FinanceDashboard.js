import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  AttachMoney,
  School,
  Receipt,
  AccountBalance,
  TrendingUp,
  Payment,
  Person,
  Settings,
  MonetizationOn,
  Add
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import DashboardCard from '../common/DashboardCard';
import RecentPaymentsWidget from './widgets/RecentPaymentsWidget';
import FeeCollectionChart from './widgets/FeeCollectionChart';
import CreateAcademicYear from './CreateAcademicYear';

const FinanceDashboard = () => {
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateAcademicYear, setShowCreateAcademicYear] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalFees: 0,
    totalCollected: 0,
    totalBalance: 0,
    recentPayments: [],
    feeCollectionByClass: [],
    paymentMethodStats: []
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Get current academic year
      let currentAcademicYear;
      try {
        const academicYearResponse = await api.get('/api/academic-years/active');
        currentAcademicYear = academicYearResponse.data._id;
        console.log('Current academic year:', currentAcademicYear);
      } catch (error) {
        console.error('Error fetching academic year:', error);
        // Create a placeholder dashboard with empty data
        setDashboardData({
          totalStudents: 0,
          totalFees: 0,
          totalCollected: 0,
          totalBalance: 0,
          recentPayments: [],
          feeCollectionByClass: [],
          paymentMethodStats: []
        });
        setLoading(false);
        setError('No academic year found. Please create an academic year first.');
        setShowCreateAcademicYear(true);
        return;
      }

      // Initialize data objects with default values
      let feeStatsData = { studentFees: [], totalAmount: 0, totalPaid: 0, totalBalance: 0, balanceByClass: [] };
      let recentPaymentsData = [];
      let paymentMethodData = { paymentsByMethod: [] };

      // Get fee collection stats
      try {
        const feeStatsResponse = await api.get('/api/finance/reports', {
          params: {
            reportType: 'fee_balance',
            academicYearId: currentAcademicYear
          }
        });
        feeStatsData = feeStatsResponse.data;
      } catch (error) {
        console.error('Error fetching fee stats:', error);
        // Continue with other requests
      }

      // Get recent payments
      try {
        const recentPaymentsResponse = await api.get('/api/finance/payments', {
          params: {
            limit: 5,
            sort: '-paymentDate'
          }
        });
        recentPaymentsData = recentPaymentsResponse.data;
      } catch (error) {
        console.error('Error fetching recent payments:', error);
        // Continue with other requests
      }

      // Get payment method stats
      try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const paymentMethodResponse = await api.get('/api/finance/reports', {
          params: {
            reportType: 'payment_method',
            startDate: thirtyDaysAgo.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
            academicYearId: currentAcademicYear
          }
        });
        paymentMethodData = paymentMethodResponse.data;
      } catch (error) {
        console.error('Error fetching payment method stats:', error);
        // Continue with other requests
      }

      setDashboardData({
        totalStudents: feeStatsData.studentFees?.length || 0,
        totalFees: feeStatsData.totalAmount || 0,
        totalCollected: feeStatsData.totalPaid || 0,
        totalBalance: feeStatsData.totalBalance || 0,
        recentPayments: recentPaymentsData.slice?.(0, 5) || [],
        feeCollectionByClass: feeStatsData.balanceByClass || [],
        paymentMethodStats: paymentMethodData.paymentsByMethod || []
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCardClick = (route) => {
    navigate(route);
  };

  const handleAcademicYearCreated = (academicYear) => {
    console.log('Academic year created:', academicYear);
    // Refresh the dashboard data
    fetchDashboardData();
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography variant="h4" gutterBottom>
          Finance Management
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography variant="h4" gutterBottom>
          Finance Management
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        {showCreateAcademicYear && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => setShowCreateAcademicYear(true)}
            >
              Create Academic Year
            </Button>
          </Box>
        )}
        <CreateAcademicYear
          open={showCreateAcademicYear}
          onClose={() => setShowCreateAcademicYear(false)}
          onSuccess={handleAcademicYearCreated}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Total Fees"
            value={`TZS ${dashboardData.totalFees.toLocaleString()}`}
            icon={<AttachMoney />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Collected"
            value={`TZS ${dashboardData.totalCollected.toLocaleString()}`}
            icon={<Payment />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Balance"
            value={`TZS ${dashboardData.totalBalance.toLocaleString()}`}
            icon={<AccountBalance />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Collection Rate"
            value={`${Math.round((dashboardData.totalCollected / (dashboardData.totalFees || 1)) * 100)}%`}
            icon={<TrendingUp />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Quick Access */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Access
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem button onClick={() => handleCardClick('/finance/fee-structures')}>
                <ListItemIcon>
                  <School />
                </ListItemIcon>
                <ListItemText primary="Fee Structures" />
              </ListItem>
              <ListItem button onClick={() => handleCardClick('/finance/student-fees')}>
                <ListItemIcon>
                  <Person />
                </ListItemIcon>
                <ListItemText primary="Student Fees" />
              </ListItem>
              <ListItem button onClick={() => handleCardClick('/finance/payments')}>
                <ListItemIcon>
                  <Receipt />
                </ListItemIcon>
                <ListItemText primary="Payments" />
              </ListItem>
              <ListItem button onClick={() => handleCardClick('/finance/reports')}>
                <ListItemIcon>
                  <TrendingUp />
                </ListItemIcon>
                <ListItemText primary="Reports" />
              </ListItem>
              <ListItem button onClick={() => handleCardClick('/finance/quickbooks')}>
                <ListItemIcon>
                  <MonetizationOn />
                </ListItemIcon>
                <ListItemText primary="QuickBooks" />
              </ListItem>
              <ListItem button onClick={() => handleCardClick('/finance/settings')}>
                <ListItemIcon>
                  <Settings />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Middle Column - Charts */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Fee Collection by Class
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <FeeCollectionChart data={dashboardData.feeCollectionByClass} />
          </Paper>
        </Grid>

        {/* Right Column - Recent Payments */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Payments
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <RecentPaymentsWidget payments={dashboardData.recentPayments} />
          </Paper>
        </Grid>
      </Grid>

      {/* Academic Year Creation Dialog */}
      <CreateAcademicYear
        open={showCreateAcademicYear}
        onClose={() => setShowCreateAcademicYear(false)}
        onSuccess={handleAcademicYearCreated}
      />
    </Box>
  );
};

export default FinanceDashboard;
