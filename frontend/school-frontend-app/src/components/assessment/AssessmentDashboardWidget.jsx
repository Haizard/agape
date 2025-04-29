import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  RemoveRedEye as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../../contexts/AssessmentContext';

const AssessmentDashboardWidget = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { assessments } = useAssessment();

  useEffect(() => {
    fetchAssessmentStats();
  }, []);

  const fetchAssessmentStats = async () => {
    try {
      const response = await fetch('/api/assessments/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setError('Failed to fetch assessment statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%', bgcolor: '#fff3f0' }}>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Assessment Overview
          </Typography>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => navigate('/assessments/report')}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>
                {stats?.totalAssessments || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Assessments
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="h4" gutterBottom>
                {stats?.completionRate ? `${stats.completionRate}%` : '0%'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Completion Rate
              </Typography>
              {stats?.completionRate > 75 ? (
                <TrendingUpIcon sx={{ color: 'success.main' }} />
              ) : (
                <TrendingDownIcon sx={{ color: 'error.main' }} />
              )}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Recent Assessments
        </Typography>

        {stats?.recentAssessments?.map((assessment) => (
          <Box
            key={assessment._id}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1
            }}
          >
            <Typography variant="body2">
              {assessment.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: assessment.status === 'active' ? 'success.main' : 'text.secondary'
              }}
            >
              {assessment.weightage}%
            </Typography>
          </Box>
        ))}

        {(!stats?.recentAssessments || stats.recentAssessments.length === 0) && (
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
            No recent assessments
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default AssessmentDashboardWidget;