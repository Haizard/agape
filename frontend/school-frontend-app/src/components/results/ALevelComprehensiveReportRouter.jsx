import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';

// Import our ALevelComprehensiveReport component
import ALevelComprehensiveReport from './ALevelComprehensiveReport';

// Import the ReportProvider
import { ReportProvider, useReport } from '../../contexts/ReportContext';

/**
 * Report data fetcher component that works with the ReportContext
 */
const ReportFetcher = () => {
  const { fetchReport } = useReport();
  const { studentId, examId } = useParams();
  
  // Fetch report data on mount
  useEffect(() => {
    fetchReport('a-level-comprehensive');
  }, [fetchReport, studentId, examId]);
  
  return null;
};

/**
 * A-Level Comprehensive Report Router
 * 
 * This component renders the ALevelComprehensiveReport component
 * wrapped in the ReportProvider context.
 */
const ALevelComprehensiveReportRouter = () => {
  return (
    <ReportProvider>
      <ReportFetcher />
      <Box sx={{ width: '100%' }}>
        <ALevelComprehensiveReport />
      </Box>
    </ReportProvider>
  );
};

export default ALevelComprehensiveReportRouter;
