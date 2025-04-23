import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import prismaResultsApi from '../../services/prismaResultsApi';
import ClassResultsView from './ClassResultsView';

/**
 * PrismaClassResults component
 * Displays class results using the Prisma backend
 */
const PrismaClassResults = () => {
  const { classId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch results using the Prisma backend
        const response = await prismaResultsApi.getClassResults(classId, examId);
        
        if (response.success) {
          setResults(response.data);
        } else {
          setError(response.message || 'Failed to fetch results');
        }
      } catch (err) {
        console.error('Error fetching class results:', err);
        setError('Failed to fetch results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (classId && examId) {
      fetchResults();
    } else {
      setError('Missing required parameters: classId and examId');
      setLoading(false);
    }
  }, [classId, examId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePrint = () => {
    const reportUrl = prismaResultsApi.getClassReportUrl(classId, examId);
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
        <Alert severity="info">No results found for this class and exam.</Alert>
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
          Class Results: {results.class?.name || 'Unknown Class'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print Report
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Student Rankings" />
          <Tab label="Subject Statistics" />
          <Tab label="Division Statistics" />
        </Tabs>
      </Paper>

      {/* Use the existing ClassResultsView component with the Prisma data */}
      <ClassResultsView 
        results={results} 
        activeTab={activeTab} 
        isOLevel={results.class?.educationLevel === 'O_LEVEL'}
      />
    </Box>
  );
};

export default PrismaClassResults;
