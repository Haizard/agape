import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import prismaResultsApi from '../../services/prismaResultsApi';
import StudentResultsView from './StudentResultsView';

/**
 * PrismaStudentResults component
 * Displays student results using the Prisma backend
 */
const PrismaStudentResults = () => {
  const { studentId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch results using the Prisma backend
        const response = await prismaResultsApi.getStudentResults(studentId, examId);
        
        if (response.success) {
          setResults(response.data);
        } else {
          setError(response.message || 'Failed to fetch results');
        }
      } catch (err) {
        console.error('Error fetching student results:', err);
        setError('Failed to fetch results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (studentId && examId) {
      fetchResults();
    } else {
      setError('Missing required parameters: studentId and examId');
      setLoading(false);
    }
  }, [studentId, examId]);

  const handlePrint = () => {
    const reportUrl = prismaResultsApi.getStudentReportUrl(studentId, examId);
    window.open(reportUrl, '_blank');
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (!results) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No results found for this student and exam.</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back
        </Button>
        <Typography variant="h5" component="h1">
          Student Results
        </Typography>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print Report
        </Button>
      </Box>

      {/* Use the existing StudentResultsView component with the Prisma data */}
      <StudentResultsView results={results} />
    </Box>
  );
};

export default PrismaStudentResults;
