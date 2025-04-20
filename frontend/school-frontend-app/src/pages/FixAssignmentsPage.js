import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Alert, 
  CircularProgress, 
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import api from '../services/api';

const FixAssignmentsPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFixAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await api.post('/api/teachers/fix-assignments');
      
      setResult(response.data);
      console.log('Fix assignments result:', response.data);
    } catch (err) {
      console.error('Error fixing assignments:', err);
      setError(err.response?.data?.message || 'An error occurred while fixing assignments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Fix Teacher-Subject Assignments</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          This tool will fix teacher-subject assignments by creating proper records in the TeacherSubject model
          for all existing assignments. This ensures that teachers will only see subjects they're specifically
          assigned to teach.
        </Typography>
        
        <Typography variant="body1" paragraph>
          Click the button below to fix all assignments:
        </Typography>
        
        <Button 
          variant="contained" 
          color="warning" 
          onClick={handleFixAssignments} 
          disabled={loading}
          sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
        >
          {loading && (
            <CircularProgress
              size={20}
              color="inherit"
              sx={{ mr: 1 }}
            />
          )}
          Fix All Teacher-Subject Assignments
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              {result.message}
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              Summary:
            </Typography>
            
            <Typography variant="body1">
              • Created {result.results.filter(r => r.action === 'created').length} new assignments
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              • Found {result.results.filter(r => r.action === 'exists').length} existing assignments
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Details:
            </Typography>
            
            <List sx={{ bgcolor: 'background.paper' }}>
              {result.results.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText 
                      primary={`${item.teacher} → ${item.subject}`}
                      secondary={`Class: ${item.class} | Action: ${item.action === 'created' ? 'Created new assignment' : 'Assignment already exists'}`}
                    />
                  </ListItem>
                  {index < result.results.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default FixAssignmentsPage;
