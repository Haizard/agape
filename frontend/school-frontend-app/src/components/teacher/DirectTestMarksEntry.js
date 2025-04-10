import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import api from '../../services/api';

const DirectTestMarksEntry = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState(null);
  
  // Test data
  const [studentId, setStudentId] = useState('67f2fe0fdcc60fd7fef2ef37');
  const [subjectId, setSubjectId] = useState('67f31fdcb9315b9d40ed06a7');
  const [classId, setClassId] = useState('67f2fe0fdcc60fd7fef2ef36');
  const [academicYearId, setAcademicYearId] = useState('67f300efdcc60fd7fef2ef72');
  const [examId, setExamId] = useState('67f30d8c734cbb555f38b33a');
  const [marksObtained, setMarksObtained] = useState('85');
  
  const handleDirectTest = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setResult(null);
      
      // Create the test data
      const testData = {
        marksData: [
          {
            studentId,
            subjectId,
            classId,
            academicYearId,
            examId,
            marksObtained: Number(marksObtained)
          }
        ]
      };
      
      console.log('Sending test data:', testData);
      
      // Make the API call
      const response = await api.post('/api/direct-test/marks-entry', testData);
      
      console.log('API Response:', response.status, response.statusText);
      console.log('Response data:', response.data);
      
      setSuccess('Direct test successful');
      setResult(response.data);
    } catch (err) {
      console.error('Error in direct test:', err);
      let errorMessage = 'Direct test failed. Please try again.';
      
      if (err.response) {
        console.error('Error response:', err.response.data);
        
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.errors) {
          if (typeof err.response.data.errors === 'object') {
            const errorFields = Object.keys(err.response.data.errors);
            errorMessage = `Validation failed: ${errorFields.join(', ')}`;
          } else {
            errorMessage = `Validation failed: ${err.response.data.errors}`;
          }
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Direct Test Marks Entry</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Test Data</Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <TextField
            label="Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            fullWidth
          />
          
          <TextField
            label="Subject ID"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            fullWidth
          />
          
          <TextField
            label="Class ID"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            fullWidth
          />
          
          <TextField
            label="Academic Year ID"
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            fullWidth
          />
          
          <TextField
            label="Exam ID"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            fullWidth
          />
          
          <TextField
            label="Marks Obtained"
            value={marksObtained}
            onChange={(e) => setMarksObtained(e.target.value)}
            type="number"
            fullWidth
          />
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        
        <Button
          variant="contained"
          onClick={handleDirectTest}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Run Direct Test'}
        </Button>
        
        {result && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Test Result</Typography>
            <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default DirectTestMarksEntry;
