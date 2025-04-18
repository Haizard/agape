import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';

// Import our new ALevelResultReport component
import ALevelResultReport from './ALevelResultReport';

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
    fetchReport('a-level-student');
  }, [fetchReport, studentId, examId]);

  return null;
};

/**
 * A-Level Student Report Router
 *
 * This component now directly renders the ALevelResultReport component
 * wrapped in the ReportProvider context.
 */
const ALevelStudentReportRouter = () => {
  return (
    <ReportProvider>
      <ReportFetcher />
      <Box sx={{ width: '100%' }}>
        <ALevelResultReport />
      </Box>
    </ReportProvider>
  );
};

export default ALevelStudentReportRouter;
