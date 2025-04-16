import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { getClassResultReport } from '../../services/normalizedApi';
import EnhancedOLevelClassReport from './EnhancedOLevelClassReport';

/**
 * Container component for the Enhanced O-Level Class Report
 * Handles data fetching and integration with the existing API
 */
const EnhancedOLevelClassReportContainer = () => {
  const { classId, examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const educationLevel = queryParams.get('educationLevel');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (!classId || !examId) {
      setError('Class ID and Exam ID are required');
      setLoading(false);
      return;
    }

    // Enforce O-Level education level
    if (educationLevel && educationLevel !== 'O_LEVEL') {
      setError('This report is only for O-Level results. Please use the A-Level report for A-Level results.');
      setLoading(false);

      // Redirect to A-Level report if this is explicitly an A-Level class
      if (educationLevel === 'A_LEVEL') {
        console.log('Redirecting to A-Level report component...');
        const aLevelReportUrl = `/admin/enhanced-a-level-report/${classId}/${examId}`;

        setTimeout(() => {
          navigate(aLevelReportUrl);
        }, 1500);
      }

      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching O-Level class report for class ${classId}, exam ${examId}`);

      // Use the existing API service to fetch the report
      const reportData = await getClassResultReport(classId, examId, 'O_LEVEL');

      console.log('Report data received:', reportData);

      // Validate that this is O-Level data
      if (reportData?.educationLevel && reportData.educationLevel !== 'O_LEVEL') {
        setError('This report is only for O-Level results. Please use the A-Level report for A-Level results.');
        setLoading(false);
        return;
      }

      // If no data received or empty data, create a complete placeholder structure
      let finalReport;

      if (!reportData || reportData.students?.length === 0) {
        // Create a complete placeholder structure with default values
        finalReport = {
          className: reportData?.className || classId,
          examName: reportData?.examName || 'Not Available',
          educationLevel: 'O_LEVEL',
          year: new Date().getFullYear(),
          students: [
            // Add placeholder student to show structure
            {
              id: 'placeholder-1',
              studentName: 'No Data Available',
              sex: '-',
              totalMarks: '-',
              averageMarks: '-',
              division: '-',
              points: '-',
              rank: '-',
              subjects: {
                'math': { marks: '-', grade: '-' },
                'eng': { marks: '-', grade: '-' },
                'kis': { marks: '-', grade: '-' },
                'bio': { marks: '-', grade: '-' },
                'chem': { marks: '-', grade: '-' },
                'phy': { marks: '-', grade: '-' },
                'geo': { marks: '-', grade: '-' }
              }
            }
          ],
          subjects: [
            { id: 'math', name: 'Mathematics', code: 'MATH' },
            { id: 'eng', name: 'English', code: 'ENG' },
            { id: 'kis', name: 'Kiswahili', code: 'KIS' },
            { id: 'bio', name: 'Biology', code: 'BIO' },
            { id: 'chem', name: 'Chemistry', code: 'CHEM' },
            { id: 'phy', name: 'Physics', code: 'PHY' },
            { id: 'geo', name: 'Geography', code: 'GEO' }
          ]
        };

        // Add a message to indicate this is placeholder data
        setError('No data available for this report. Showing placeholder structure.');
      } else {
        // Use the actual data
        finalReport = reportData;
      }

      // Set the current year for the report title
      finalReport.year = new Date().getFullYear();

      setReport(finalReport);
    } catch (err) {
      console.error('Error fetching report:', err);

      // Create a user-friendly error message
      let errorMessage = 'Failed to load report';

      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (err.response.status === 403) {
          errorMessage = 'You do not have permission to access this report. Using sample data for demonstration.';
        } else if (err.response.status === 404) {
          errorMessage = 'Report not found. The class or exam may not exist. Using sample data for demonstration.';
        } else {
          errorMessage = `Server error: ${err.response.status}. Using sample data for demonstration.`;
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Using sample data for demonstration.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = `Error: ${err.message || 'Unknown error'}. Using sample data for demonstration.`;
      }

      setError(errorMessage);

      // Always use sample data for demonstration when there's an error
      // This ensures that the report structure is always displayed
      const sampleReport = {
        className: 'FORM 3',
        examName: 'MIDTERM EXAMINATION',
        educationLevel: 'O_LEVEL',
        year: new Date().getFullYear(),
        students: [
          {
            id: '1',
            studentName: 'John Smith',
            sex: 'M',
            totalMarks: 432,
            averageMarks: 72,
            division: 'I',
            points: 12,
            rank: 1,
            subjects: {
              'math': { marks: 85, grade: 'A' },
              'eng': { marks: 78, grade: 'B' },
              'kis': { marks: 82, grade: 'A' },
              'bio': { marks: 76, grade: 'B' },
              'chem': { marks: 68, grade: 'B' },
              'phy': { marks: 73, grade: 'B' },
              'geo': { marks: 70, grade: 'B' }
            }
          },
          {
            id: '2',
            studentName: 'Mary Johnson',
            sex: 'F',
            totalMarks: 410,
            averageMarks: 68.3,
            division: 'I',
            points: 14,
            rank: 2,
            subjects: {
              'math': { marks: 72, grade: 'B' },
              'eng': { marks: 85, grade: 'A' },
              'kis': { marks: 76, grade: 'B' },
              'bio': { marks: 65, grade: 'C' },
              'chem': { marks: 62, grade: 'C' },
              'phy': { marks: 70, grade: 'B' },
              'geo': { marks: 80, grade: 'A' }
            }
          },
          {
            id: '3',
            studentName: 'David Williams',
            sex: 'M',
            totalMarks: 385,
            averageMarks: 64.2,
            division: 'II',
            points: 18,
            rank: 3,
            subjects: {
              'math': { marks: 65, grade: 'C' },
              'eng': { marks: 70, grade: 'B' },
              'kis': { marks: 68, grade: 'B' },
              'bio': { marks: 60, grade: 'C' },
              'chem': { marks: 55, grade: 'C' },
              'phy': { marks: 62, grade: 'C' },
              'geo': { marks: 75, grade: 'B' }
            }
          }
        ],
        subjects: [
          { id: 'math', name: 'Mathematics', code: 'MATH' },
          { id: 'eng', name: 'English', code: 'ENG' },
          { id: 'kis', name: 'Kiswahili', code: 'KIS' },
          { id: 'bio', name: 'Biology', code: 'BIO' },
          { id: 'chem', name: 'Chemistry', code: 'CHEM' },
          { id: 'phy', name: 'Physics', code: 'PHY' },
          { id: 'geo', name: 'Geography', code: 'GEO' }
        ]
      };

      setReport(sampleReport);
    } finally {
      setLoading(false);
    }
  }, [classId, examId, educationLevel, navigate]);

  // Fetch report on component mount or when parameters change
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle download events
  const handleDownload = (format) => {
    console.log(`Report downloaded in ${format} format`);
  };

  // Handle print events
  const handlePrint = () => {
    console.log('Report printed');
  };

  // Handle back button
  const handleBack = () => {
    navigate('/admin/result-reports');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Button variant="outlined" onClick={handleBack}>
            Back to Reports
          </Button>
        </Grid>
        <Grid item xs>
          <Typography variant="h4" gutterBottom>
            Enhanced O-Level Class Result Report
          </Typography>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <EnhancedOLevelClassReport
          data={report}
          onDownload={handleDownload}
          onPrint={handlePrint}
        />
      )}
    </Box>
  );
};

export default EnhancedOLevelClassReportContainer;
