import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { 
  EducationLevels, 
  getEducationLevelDisplayName, 
  getRoutePathForEducationLevel 
} from '../../utils/educationLevelUtils';
import { validateEducationLevel } from '../../utils/errorHandling';

/**
 * Higher-order component that adds education level validation to a component
 * @param {React.ComponentType} WrappedComponent - The component to wrap
 * @param {Object} options - Options for education level handling
 * @param {string} options.educationLevel - Expected education level ('O_LEVEL' or 'A_LEVEL')
 * @param {boolean} options.redirectOnMismatch - Whether to redirect on education level mismatch
 * @returns {React.ComponentType} Component with education level validation
 */
const withEducationLevel = (WrappedComponent, { educationLevel, redirectOnMismatch = true } = {}) => {
  // Return a new component with education level validation
  return (props) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validatedData, setValidatedData] = useState(null);
    const navigate = useNavigate();

    // Validate data when it changes
    useEffect(() => {
      if (!props.data) return;
      
      // Validate education level
      const { isValid, error } = validateEducationLevel(
        props.data, 
        educationLevel,
        (err) => {
          console.error('Education level validation error:', err);
          setError(err);
        }
      );
      
      if (isValid) {
        setValidatedData(props.data);
        setError(null);
      }
    }, [props.data]);

    // Handle redirect to correct component
    const handleRedirect = () => {
      if (!props.data || !props.data.educationLevel) return;
      
      const actualLevel = props.data.educationLevel;
      const routePath = getRoutePathForEducationLevel(actualLevel);
      
      // Extract IDs from current URL
      const urlParts = window.location.pathname.split('/');
      const studentId = urlParts[urlParts.length - 2];
      const examId = urlParts[urlParts.length - 1];
      
      // Navigate to correct route
      navigate(`/results/${routePath}/${studentId}/${examId}`);
    };

    // If there's an education level mismatch, show an error
    if (error && error.type === 'EDUCATION_LEVEL_MISMATCH') {
      const actualLevel = props.data?.educationLevel;
      const expectedDisplayName = getEducationLevelDisplayName(educationLevel);
      const actualDisplayName = getEducationLevelDisplayName(actualLevel);
      
      return (
        <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Education Level Mismatch: This component is for {expectedDisplayName} students, but the data is for {actualDisplayName} students.
          </Alert>
          
          <Typography variant="body1" paragraph>
            You are trying to view a {expectedDisplayName} report for a student who is registered as {actualDisplayName}.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
            
            {redirectOnMismatch && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleRedirect}
              >
                Go to {actualDisplayName} Report
              </Button>
            )}
          </Box>
        </Paper>
      );
    }

    // If loading, show a loading indicator
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    // If no data, render nothing or a placeholder
    if (!props.data && !validatedData) {
      return props.loadingComponent || null;
    }

    // If data is valid, render the wrapped component
    return (
      <WrappedComponent
        {...props}
        data={validatedData || props.data}
        educationLevel={educationLevel}
        educationLevelDisplayName={getEducationLevelDisplayName(educationLevel)}
      />
    );
  };
};

export default withEducationLevel;
