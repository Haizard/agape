import React, { useState } from 'react';
import { 
  Alert, 
  AlertTitle, 
  Box, 
  Button, 
  Collapse, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Paper, 
  Typography 
} from '@mui/material';
import { 
  Error as ErrorIcon, 
  Refresh as RefreshIcon, 
  ArrowBack as ArrowBackIcon,
  WifiOff as WifiOffIcon,
  Storage as StorageIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getUserFriendlyErrorMessage, getErrorRecoveryOptions } from '../../utils/errorHandling';

/**
 * Higher-order component that adds error handling to a component
 * @param {React.ComponentType} WrappedComponent - The component to wrap
 * @param {Object} options - Options for error handling
 * @param {string} options.componentName - Name of the component (for logging)
 * @param {string} options.expectedEducationLevel - Expected education level ('O_LEVEL' or 'A_LEVEL')
 * @returns {React.ComponentType} Component with error handling
 */
const withErrorHandling = (WrappedComponent, { componentName, expectedEducationLevel } = {}) => {
  // Return a new component with error handling
  return (props) => {
    const [error, setError] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const navigate = useNavigate();

    // Handle errors from the wrapped component
    const handleError = (err) => {
      console.error(`Error in ${componentName || 'component'}:`, err);
      setError(err);
    };

    // Clear the error
    const clearError = () => {
      setError(null);
    };

    // Retry the operation
    const handleRetry = () => {
      if (props.onRetry) {
        props.onRetry();
      }
      clearError();
    };

    // Use offline data
    const handleUseOfflineData = () => {
      if (props.onUseOfflineData) {
        props.onUseOfflineData();
      }
      clearError();
    };

    // Redirect to the correct component
    const handleRedirect = (url) => {
      navigate(url);
    };

    // Toggle error details
    const toggleDetails = () => {
      setShowDetails(!showDetails);
    };

    // If there's an error, show an error component
    if (error) {
      const errorMessage = getUserFriendlyErrorMessage(error);
      const recoveryOptions = getErrorRecoveryOptions(error);

      return (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            m: 2, 
            maxWidth: '800px', 
            mx: 'auto',
            border: '1px solid #f44336',
            borderRadius: 2
          }}
        >
          <Alert 
            severity="error" 
            variant="filled"
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={toggleDetails}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
            }
          >
            <AlertTitle>Error</AlertTitle>
            {errorMessage}
          </Alert>

          <Collapse in={showDetails}>
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Error Details:
              </Typography>
              <Typography variant="body2" component="pre" sx={{ mt: 1, overflow: 'auto' }}>
                {JSON.stringify(error, null, 2)}
              </Typography>
            </Box>
          </Collapse>

          {recoveryOptions.suggestions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Suggestions:
              </Typography>
              <List dense>
                {recoveryOptions.suggestions.map((suggestion, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <NavigateNextIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={suggestion} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>

            <Box>
              {recoveryOptions.canUseOfflineData && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<StorageIcon />}
                  onClick={handleUseOfflineData}
                  sx={{ mr: 1 }}
                >
                  Use Offline Data
                </Button>
              )}

              {recoveryOptions.canRedirect && recoveryOptions.redirectUrl && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<WifiOffIcon />}
                  onClick={() => handleRedirect(recoveryOptions.redirectUrl)}
                  sx={{ mr: 1 }}
                >
                  Go to Correct Report
                </Button>
              )}

              {recoveryOptions.canRetry && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={handleRetry}
                >
                  Retry
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      );
    }

    // If no error, render the wrapped component with additional props
    return (
      <WrappedComponent
        {...props}
        onError={handleError}
        clearError={clearError}
        expectedEducationLevel={expectedEducationLevel}
      />
    );
  };
};

export default withErrorHandling;
