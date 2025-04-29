import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import { useAssessment } from '../../contexts/AssessmentContext';
import assessmentService from '../../services/assessmentService';

const StudentResultView = ({ studentId, examId }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [finalScore, setFinalScore] = useState(null);
  const { assessments } = useAssessment();

  useEffect(() => {
    if (studentId && examId) {
      fetchStudentResults();
    }
  }, [studentId, examId]);

  const fetchStudentResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/results/${studentId}/${examId}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        calculateFinalScore(data.results);
      } else {
        setError(data.message || 'Failed to fetch results');
      }
    } catch (error) {
      setError('Error fetching student results');
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalScore = (assessmentResults) => {
    if (!assessmentResults?.length) return;

    const weightedTotal = assessmentService.calculateFinalMarks(assessmentResults);
    setFinalScore(weightedTotal);
  };

  const getGradeColor = (score) => {
    if (score >= 75) return '#2e7d32'; // A - Green
    if (score >= 65) return '#1976d2'; // B - Blue
    if (score >= 45) return '#ed6c02'; // C - Orange
    if (score >= 30) return '#d32f2f'; // D - Red
    return '#d32f2f'; // F - Red
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Assessment Results
      </Typography>

      {finalScore !== null && (
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Final Score</Typography>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    color: getGradeColor(finalScore),
                    fontWeight: 'bold' 
                  }}
                >
                  {finalScore.toFixed(2)}%
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: { md: 'right' } }}>
                  <Typography variant="subtitle1">
                    Total Assessments: {results.length}
                  </Typography>
                  <Typography variant="subtitle1">
                    Completed: {results.filter(r => r.marksObtained != null).length}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Assessment</TableCell>
              <TableCell align="right">Weightage</TableCell>
              <TableCell align="right">Max Marks</TableCell>
              <TableCell align="right">Marks Obtained</TableCell>
              <TableCell align="right">Weighted Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result) => {
              const assessment = assessments.find(a => a._id === result.assessmentId);
              const weightedScore = (result.marksObtained / result.maxMarks) * result.weightage;
              
              return (
                <TableRow key={result._id}>
                  <TableCell>{assessment?.name || 'Unknown Assessment'}</TableCell>
                  <TableCell align="right">{result.weightage}%</TableCell>
                  <TableCell align="right">{result.maxMarks}</TableCell>
                  <TableCell align="right">
                    {result.marksObtained !== null ? result.marksObtained : '-'}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: getGradeColor(weightedScore),
                      fontWeight: 'bold'
                    }}
                  >
                    {weightedScore.toFixed(2)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {results.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="subtitle1" color="text.secondary">
            No assessment results found
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StudentResultView;