import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
import EnhancedClassReport from './EnhancedClassReport';

/**
 * Container component for the Enhanced Class Report
 * Handles data fetching and integration with the existing API
 */
const EnhancedClassReportContainer = () => {
  const { classId, examId } = useParams();
  const location = useLocation();
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
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching class report for class ${classId}, exam ${examId}, education level ${educationLevel || 'not specified'}`);
      
      // Use the existing API service to fetch the report
      const reportData = await getClassResultReport(classId, examId, educationLevel);
      
      console.log('Report data received:', reportData);
      
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
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enhanced Class Result Report
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <EnhancedClassReport
          data={report}
          onDownload={handleDownload}
          onPrint={handlePrint}
        />
      )}
    </Box>
  );
};

export default EnhancedClassReportContainer;
