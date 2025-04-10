import React from 'react';
import {
  Typography,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * DownloadResults Component
 * 
 * Shows results of batch report downloads
 */
const DownloadResults = ({
  downloadResults,
  error,
  success
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Download Results
      </Typography>
      
      <List>
        {downloadResults.map((result, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              {result.success ? (
                <CheckCircleIcon color="success" />
              ) : (
                <ErrorIcon color="error" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={result.studentName}
              secondary={result.success ? result.filename : `Error: ${result.error}`}
            />
          </ListItem>
        ))}
      </List>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Paper>
  );
};

export default DownloadResults;
