import React from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress
} from '@mui/material';

/**
 * DownloadProgress Component
 * 
 * Shows download progress for batch report downloads
 */
const DownloadProgress = ({
  downloadProgress,
  downloadResults,
  selectedStudents
}) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Download Progress
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <LinearProgress 
          variant="determinate" 
          value={downloadProgress} 
          sx={{ height: 10, borderRadius: 5 }}
        />
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          {downloadProgress}% Complete
        </Typography>
      </Box>
      
      <Typography variant="subtitle1" gutterBottom>
        Processing: {downloadResults.length} of {selectedStudents.length} students
      </Typography>
    </Paper>
  );
};

export default DownloadProgress;
