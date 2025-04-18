import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  CircularProgress,
  Typography,
  Alert,
  Button
} from '@mui/material';

// Lazy load the report component for better performance
const ALevelClassReport = lazy(() => import('./ALevelClassReport'));

/**
 * ALevelClassReportRouter Component
 *
 * Router component for A-Level class reports.
 * Handles loading the appropriate report component based on URL parameters.
 */
const ALevelClassReportRouter = () => {
  const { classId, examId, formLevel } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);

  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const forceRefresh = queryParams.get('forceRefresh') === 'true';

  // Validate parameters
  useEffect(() => {
    console.log('ALevelClassReportRouter params:', { classId, examId, formLevel });

    if (!classId || !examId) {
      setError('Missing required parameters: classId and examId are required');
    }
  }, [classId, examId, formLevel]);

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error}
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/admin/a-level-class-reports')}
        >
          Go Back to Report Selector
        </Button>
      </Container>
    );
  }

  return (
    <Suspense
      fallback={
        <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading A-Level Class Result Report...
          </Typography>
        </Container>
      }
    >
      <ErrorBoundary>
        <ALevelClassReport
          classId={classId}
          examId={examId}
          formLevel={formLevel}
          forceRefresh={forceRefresh}
        />
      </ErrorBoundary>
    </Suspense>
  );
};

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in ALevelClassReport:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error">
            Something went wrong while loading the report. Please try again.
          </Alert>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Error details: {this.state.error?.message || 'Unknown error'}
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </Container>
      );
    }

    return this.props.children;
  }
};

export default ALevelClassReportRouter;
