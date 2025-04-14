import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { getClassResultReport } from '../../services/normalizedApi';
import EnhancedOLevelClassReport from './EnhancedOLevelClassReport';

/**
 * Container component for the Enhanced O-Level Class Report
 * Handles data fetching and integration with the existing API
 */
const EnhancedOLevelClassReportContainer = () => {
  const { classId, examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const educationLevel = queryParams.get('educationLevel');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  
  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (!classId || !examId) {
      setError('Class ID and Exam ID are required');
      setLoading(false);
      return;
    }
    
    // Enforce O-Level education level
    if (educationLevel && educationLevel !== 'O_LEVEL') {
      setError('This report is only for O-Level results. Please use the A-Level report for A-Level results.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching O-Level class report for class ${classId}, exam ${examId}`);
      
      // Use the existing API service to fetch the report
      const reportData = await getClassResultReport(classId, examId, 'O_LEVEL');
      
      console.log('Report data received:', reportData);
      
      // Validate that this is O-Level data
      if (reportData.educationLevel && reportData.educationLevel !== 'O_LEVEL') {
        setError('This report is only for O-Level results. Please use the A-Level report for A-Level results.');
        setLoading(false);
        return;
      }
      
      // Set the current year for the report title
      reportData.year = new Date().getFullYear();
      
      setReport(reportData);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(`Failed to load report: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [classId, examId, educationLevel]);
  
  // Fetch report on component mount or when parameters change
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);
  
  // Handle download events
  const handleDownload = (format) => {
    console.log(`Report downloaded in ${format} format`);
  };
  
  // Handle print events
  const handlePrint = () => {
    console.log('Report printed');
  };
  
  // Handle back button
  const handleBack = () => {
    navigate('/admin/result-reports');
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Button variant="outlined" onClick={handleBack}>
            Back to Reports
          </Button>
        </Grid>
        <Grid item xs>
          <Typography variant="h4" gutterBottom>
            Enhanced O-Level Class Result Report
          </Typography>
        </Grid>
      </Grid>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <EnhancedOLevelClassReport
          data={report}
          onDownload={handleDownload}
          onPrint={handlePrint}
        />
      )}
    </Box>
  );
};

export default EnhancedOLevelClassReportContainer;
