import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import PublicALevelReport from './PublicALevelReport';

/**
 * Container component for the Public A-Level Report
 * This component doesn't require authentication
 */
const PublicALevelReportContainer = () => {
  const { classId, examId } = useParams();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        A-Level Class Result Report (Public Access)
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        This report is accessible without authentication
      </Typography>

      <PublicALevelReport />
    </Box>
  );
};

export default PublicALevelReportContainer;
