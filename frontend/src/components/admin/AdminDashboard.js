import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  BugReport as BugReportIcon,
  MonitorHeart as MonitorIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import ResultMonitoringDashboard from './ResultMonitoringDashboard';

// Import other admin components as needed

const AdminDashboard = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          <Tab icon={<DashboardIcon />} label="Overview" />
          <Tab icon={<SchoolIcon />} label="Classes" />
          <Tab icon={<PersonIcon />} label="Students" />
          <Tab icon={<BookIcon />} label="Subjects" />
          <Tab icon={<AssignmentIcon />} label="Exams" />
          <Tab icon={<MonitorIcon />} label="Result Monitoring" />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>

        {/* Overview Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader title="School Overview" />
                <Divider />
                <CardContent>
                  <Typography variant="body1">
                    Welcome to the admin dashboard. Here you can manage all aspects of the school system.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Quick Actions
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Button
                          variant="outlined"
                          color="primary"
                          fullWidth
                          component={Link}
                          to="/admin/classes"
                          startIcon={<SchoolIcon />}
                        >
                          Manage Classes
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Button
                          variant="outlined"
                          color="primary"
                          fullWidth
                          component={Link}
                          to="/admin/students"
                          startIcon={<PersonIcon />}
                        >
                          Manage Students
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Button
                          variant="outlined"
                          color="primary"
                          fullWidth
                          component={Link}
                          to="/admin/results/monitor"
                          startIcon={<MonitorIcon />}
                        >
                          Monitor Results
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="System Health" />
                <Divider />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <BugReportIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Database Status"
                        secondary="Connected"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <BugReportIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="API Status"
                        secondary="Operational"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <BugReportIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Result Data Consistency"
                        secondary="Check Required"
                      />
                    </ListItem>
                  </List>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => setActiveTab(5)} // Switch to Result Monitoring tab
                  >
                    Run Data Consistency Check
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Classes Tab */}
        {activeTab === 1 && (
          <Typography variant="h6">Classes Management</Typography>
          // Add classes management component here
        )}

        {/* Students Tab */}
        {activeTab === 2 && (
          <Typography variant="h6">Students Management</Typography>
          // Add students management component here
        )}

        {/* Subjects Tab */}
        {activeTab === 3 && (
          <Typography variant="h6">Subjects Management</Typography>
          // Add subjects management component here
        )}

        {/* Exams Tab */}
        {activeTab === 4 && (
          <Typography variant="h6">Exams Management</Typography>
          // Add exams management component here
        )}

        {/* Result Monitoring Tab */}
        {activeTab === 5 && (
          <ResultMonitoringDashboard />
        )}

        {/* Settings Tab */}
        {activeTab === 6 && (
          <Typography variant="h6">Settings</Typography>
          // Add settings component here
        )}
      </Container>
    </Box>
  );
};

export default AdminDashboard;
