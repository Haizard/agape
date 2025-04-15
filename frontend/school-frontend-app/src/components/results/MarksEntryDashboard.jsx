import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Paper,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Marks Entry Dashboard Component
 * Provides navigation to different marks entry components
 */
const MarksEntryDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Marks Entry Dashboard
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Welcome to the Marks Entry Dashboard</AlertTitle>
        Select the appropriate marks entry option based on your needs. Use the bulk entry options for entering marks for multiple students at once.
      </Alert>

      <Grid container spacing={3}>
        {/* A-Level Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5">A-Level Marks Entry</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      A-Level Bulk Marks Entry
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enter marks for multiple A-Level students at once. Supports principal subject designation and batch saving.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/results/a-level/bulk-marks-entry')}
                      fullWidth
                    >
                      Go to A-Level Bulk Entry
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      A-Level Individual Marks Entry
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enter marks for individual A-Level students. Provides detailed options for each student.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="outlined"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/results/a-level/marks-entry')}
                      fullWidth
                    >
                      Go to A-Level Individual Entry
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* O-Level Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SchoolIcon sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h5">O-Level Marks Entry</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      O-Level Bulk Marks Entry
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enter marks for multiple O-Level students at once. Supports batch saving and automatic grade calculation.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      color="secondary"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/results/o-level/bulk-marks-entry')}
                      fullWidth
                    >
                      Go to O-Level Bulk Entry
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      O-Level Individual Marks Entry
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enter marks for individual O-Level students. Provides detailed options for each student.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="outlined"
                      color="secondary"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/results/o-level/marks-entry')}
                      fullWidth
                    >
                      Go to O-Level Individual Entry
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Direct Marks Entry Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssignmentIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h5">Direct Marks Entry</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ bgcolor: '#f9fff9' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Direct Marks Entry (Recommended)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use this simplified marks entry form to directly enter marks for any class and subject. This is the most reliable way to ensure marks are correctly saved and displayed in reports.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      color="success"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/results/direct-marks-entry')}
                      fullWidth
                    >
                      Go to Direct Marks Entry
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Marks History Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <HistoryIcon sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h5">Marks History</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      View Marks History
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View the history of marks changes for students, subjects, and exams. Track who made changes and when.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="outlined"
                      color="info"
                      endIcon={<HistoryIcon />}
                      onClick={() => navigate('/marks-history')}
                      fullWidth
                    >
                      View Marks History
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MarksEntryDashboard;
