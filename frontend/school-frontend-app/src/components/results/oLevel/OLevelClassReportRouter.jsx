import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, CircularProgress, Alert, Button, Box } from '@mui/material';
import OLevelClassReport from './OLevelClassReport';

/**
 * O-Level Class Report Router Component
 *
 * This component serves as a router for O-Level class reports.
 * It extracts parameters from the URL and passes them to the OLevelClassReport component.
 * It also handles loading state, error handling, and parameter validation.
 */
const OLevelClassReportRouter = () => {
  // Get parameters from URL
  const { classId, examId, formLevel } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // State for error handling
  const [error, setError] = useState(null);

  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const forceRefresh = queryParams.get('forceRefresh') === 'true';

  // Log router initialization
  console.log('OLevelClassReportRouter initialized:', {
    classId,
    examId,
    formLevel,
    forceRefresh,
    pathname: location.pathname,
    search: location.search
  });

  // Validate parameters
  useEffect(() => {
    console.log('OLevelClassReportRouter params:', { classId, examId, formLevel });

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
          onClick={() => navigate('/results/o-level/class-reports')}
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
            Loading O-Level Class Result Report...
          </Typography>
        </Container>
      }
    >
      <ErrorBoundary>
        <OLevelClassReport
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
    console.error('Error in OLevelClassReport:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error">
            <Typography variant="h6">Something went wrong</Typography>
            <Typography variant="body1">{this.state.error?.message || 'Unknown error'}</Typography>
          </Alert>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => window.location.href = '/results/o-level/class-reports'}
          >
            Go Back to Report Selector
          </Button>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default OLevelClassReportRouter;
