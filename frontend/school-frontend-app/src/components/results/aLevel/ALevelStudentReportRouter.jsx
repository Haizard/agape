import React, { Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  CircularProgress,
  Typography
} from '@mui/material';

// Lazy load the report component for better performance
const ALevelResultReport = lazy(() => import('./ALevelResultReport'));

/**
 * ALevelStudentReportRouter Component
 * 
 * Router component for A-Level student reports.
 * Handles loading the appropriate report component based on URL parameters.
 */
const ALevelStudentReportRouter = () => {
  const { studentId, examId } = useParams();
  
  return (
    <Suspense
      fallback={
        <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Report...
          </Typography>
        </Container>
      }
    >
      <ALevelResultReport 
        studentId={studentId} 
        examId={examId} 
      />
    </Suspense>
  );
};

export default ALevelStudentReportRouter;
