import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

/**
 * LegacyReportRedirect Component
 * 
 * Redirects legacy report routes to the new standardized routes.
 * Shows a brief message explaining the redirect.
 */
const LegacyReportRedirect = ({ type, targetPath }) => {
  const params = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Extract parameters from the URL
    const { classId, examId, studentId, formLevel } = params;
    
    // Construct the target path based on the type
    let path = '';
    
    if (type === 'class') {
      path = `/results/a-level/class/${classId}/${examId}`;
      if (formLevel) {
        path += `/form/${formLevel}`;
      }
    } else if (type === 'student') {
      path = `/results/a-level/student/${studentId}/${examId}`;
    } else {
      // Default to the provided target path
      path = targetPath;
    }
    
    // Set a timeout to show the message briefly before redirecting
    const timer = setTimeout(() => {
      navigate(path, { replace: true });
    }, 2000);
    
    // Clean up the timer
    return () => clearTimeout(timer);
  }, [params, navigate, type, targetPath]);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Redirecting to the new report page...
      </Typography>
      <Alert severity="info" sx={{ mt: 2, maxWidth: 600 }}>
        This report URL has been updated. You'll be automatically redirected to the new location.
      </Alert>
    </Box>
  );
};

export default LegacyReportRedirect;
