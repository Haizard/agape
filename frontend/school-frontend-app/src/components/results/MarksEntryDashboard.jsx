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
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%', bgcolor: '#f0f7ff' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      New A-Level Bulk Marks Entry
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Recommended:</strong> New and improved A-Level bulk marks entry with better validation and error handling.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/results/new-a-level/bulk-marks-entry')}
                      fullWidth
                    >
                      Go to New A-Level Bulk Entry
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      New A-Level Individual Marks Entry
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Recommended:</strong> New and improved A-Level individual marks entry with better validation and error handling.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/results/new-a-level/marks-entry')}
                      fullWidth
                    >
                      Go to New A-Level Individual Entry
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%', bgcolor: '#e8f5e9', border: '1px solid #4caf50' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main">
                      Legacy A-Level Bulk Marks Entry (Recommended)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Use this option</strong> for A-Level bulk marks entry. This implementation uses the old version's approach to bypass issues with the new implementation.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      color="success"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/results/a-level/legacy-bulk-marks-entry')}
                      fullWidth
                    >
                      Go to Legacy A-Level Bulk Entry
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%', opacity: 0.7 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Standard A-Level Marks Entry
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Standard A-Level marks entry system. May have issues with bulk entry.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="outlined"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/results/a-level/bulk-marks-entry', { state: { educationLevel: 'A_LEVEL' } })}
                      fullWidth
                    >
                      Go to Standard A-Level Entry
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
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%', bgcolor: '#f9f9ff' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Enhanced O-Level Bulk Marks Entry
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Recommended:</strong> New and improved bulk marks entry with automatic teacher-subject assignment fixing.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      color="secondary"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/results/o-level/enhanced-bulk-marks-entry')}
                      fullWidth
                    >
                      Go to Enhanced Bulk Entry
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
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
                      variant="outlined"
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
              <Grid item xs={12} md={4}>
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
                      Go to Individual Entry
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Unified Marks Entry Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssignmentIcon sx={{ mr: 1, color: 'error.main' }} />
              <Typography variant="h5">Unified Marks Entry</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ bgcolor: '#fff8f8', border: '1px solid #f44336' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="error.main">
                      Unified Bulk Marks Entry (NEW RECOMMENDED)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Use this new unified approach</strong> for both A-Level and O-Level marks entry. This implementation uses the assessment system for better organization and reliability.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      color="error"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/marks/unified-bulk-entry')}
                      fullWidth
                    >
                      Go to Unified Bulk Marks Entry
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
                      Direct Marks Entry
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
