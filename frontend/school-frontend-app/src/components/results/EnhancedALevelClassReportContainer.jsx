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
import EnhancedALevelClassReport from './EnhancedALevelClassReport';

/**
 * Container component for the Enhanced A-Level Class Report
 * Handles data fetching and integration with the existing API
 */
const EnhancedALevelClassReportContainer = () => {
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

    // Enforce A-Level education level
    if (educationLevel && educationLevel !== 'A_LEVEL') {
      setError('This report is only for A-Level results. Please use the O-Level report for O-Level results.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching A-Level class report for class ${classId}, exam ${examId}`);

      // Use the existing API service to fetch the report
      const reportData = await getClassResultReport(classId, examId, 'A_LEVEL');

      console.log('Report data received:', reportData);

      // Validate that this is A-Level data
      if (reportData?.educationLevel && reportData.educationLevel !== 'A_LEVEL') {
        setError('This report is only for A-Level results. Please use the O-Level report for O-Level results.');
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
          educationLevel: 'A_LEVEL',
          year: new Date().getFullYear(),
          students: [
            // Add placeholder student to show structure
            {
              id: 'placeholder-1',
              studentName: 'No Data Available',
              sex: '-',
              points: '-',
              division: '-',
              subjectResults: [],
              totalMarks: '-',
              averageMarks: '-',
              rank: '-'
            }
          ],
          subjects: [
            { id: 'gs', name: 'General Studies' },
            { id: 'hist', name: 'History' },
            { id: 'phys', name: 'Physics' },
            { id: 'chem', name: 'Chemistry' },
            { id: 'kisw', name: 'Kiswahili' },
            { id: 'math', name: 'Advanced Mathematics' },
            { id: 'bio', name: 'Biology' },
            { id: 'geo', name: 'Geography' },
            { id: 'eng', name: 'English' },
            { id: 'bam', name: 'BAM' },
            { id: 'econ', name: 'Economics' }
          ],
          divisionSummary: { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 },
          subjectPerformance: {},
          overallPerformance: { totalPassed: 0, examGpa: 'N/A' }
        };

        // Add a message to indicate this is placeholder data
        setError('No data available for this report. Showing placeholder structure.');
      } else {
        // Use the actual data
        finalReport = reportData;
      }

      // Set the current year for the report title
      if (!finalReport.year) {
        finalReport.year = new Date().getFullYear();
      } else if (typeof finalReport.year === 'object' && finalReport.year !== null) {
        // If year is an object, extract the year value
        finalReport.year = finalReport.year.year || finalReport.year.name || new Date().getFullYear();
      }

      // Handle academicYear if it's an object
      if (typeof finalReport.academicYear === 'object' && finalReport.academicYear !== null) {
        finalReport.academicYear = finalReport.academicYear.name || finalReport.academicYear.year || new Date().getFullYear();
      }

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
        className: 'FORM V',
        examName: 'MIDTERM EXAMINATION',
        educationLevel: 'A_LEVEL',
        year: new Date().getFullYear(),
        students: [
          {
            id: '1',
            studentName: 'Jane Daniel',
            sex: 'F',
            points: 18,
            division: 'II',
            subjectResults: [
              { subject: { name: 'General Studies' }, marks: 67.8 },
              { subject: { name: 'History' }, marks: 36.0 },
              { subject: { name: 'Physics' }, marks: 34.1 },
              { subject: { name: 'Chemistry' }, marks: null },
              { subject: { name: 'Kiswahili' }, marks: null },
              { subject: { name: 'Advanced Mathematics' }, marks: null },
              { subject: { name: 'Biology' }, marks: null },
              { subject: { name: 'Geography' }, marks: 41.7 },
              { subject: { name: 'English' }, marks: 60.0 },
              { subject: { name: 'BAM' }, marks: null },
              { subject: { name: 'Economics' }, marks: 55.3 }
            ],
            totalMarks: 224.9,
            averageMarks: 44.9,
            rank: 3
          },
          {
            id: '2',
            studentName: 'John Michael',
            sex: 'M',
            points: 12,
            division: 'I',
            subjectResults: [
              { subject: { name: 'General Studies' }, marks: 74.2 },
              { subject: { name: 'History' }, marks: null },
              { subject: { name: 'Physics' }, marks: 78.1 },
              { subject: { name: 'Chemistry' }, marks: 67.0 },
              { subject: { name: 'Kiswahili' }, marks: null },
              { subject: { name: 'Advanced Mathematics' }, marks: 85.5 },
              { subject: { name: 'Biology' }, marks: null },
              { subject: { name: 'Geography' }, marks: null },
              { subject: { name: 'English' }, marks: 71.4 },
              { subject: { name: 'BAM' }, marks: null },
              { subject: { name: 'Economics' }, marks: null }
            ],
            totalMarks: 376.2,
            averageMarks: 62.7,
            rank: 1
          },
          {
            id: '3',
            studentName: 'Sarah Paul',
            sex: 'F',
            points: 21,
            division: 'III',
            subjectResults: [
              { subject: { name: 'General Studies' }, marks: 58.9 },
              { subject: { name: 'History' }, marks: null },
              { subject: { name: 'Physics' }, marks: null },
              { subject: { name: 'Chemistry' }, marks: 41.1 },
              { subject: { name: 'Kiswahili' }, marks: 47.6 },
              { subject: { name: 'Advanced Mathematics' }, marks: null },
              { subject: { name: 'Biology' }, marks: 55.3 },
              { subject: { name: 'Geography' }, marks: 33.2 },
              { subject: { name: 'English' }, marks: null },
              { subject: { name: 'BAM' }, marks: null },
              { subject: { name: 'Economics' }, marks: null }
            ],
            totalMarks: 236.1,
            averageMarks: 47.2,
            rank: 2
          }
        ],
        subjects: [
          { id: 'gs', name: 'General Studies' },
          { id: 'hist', name: 'History' },
          { id: 'phys', name: 'Physics' },
          { id: 'chem', name: 'Chemistry' },
          { id: 'kisw', name: 'Kiswahili' },
          { id: 'math', name: 'Advanced Mathematics' },
          { id: 'bio', name: 'Biology' },
          { id: 'geo', name: 'Geography' },
          { id: 'eng', name: 'English' },
          { id: 'bam', name: 'BAM' },
          { id: 'econ', name: 'Economics' }
        ],
        divisionSummary: {
          'I': 1,
          'II': 1,
          'III': 1,
          'IV': 0,
          '0': 0
        },
        subjectPerformance: {
          'gs': {
            name: 'General Studies',
            registered: 3,
            grades: { A: 0, B: 2, C: 1, D: 0, E: 0, S: 0, F: 0 },
            passed: 3,
            gpa: '2.33'
          },
          'hist': {
            name: 'History',
            registered: 1,
            grades: { A: 0, B: 0, C: 0, D: 1, E: 0, S: 0, F: 0 },
            passed: 1,
            gpa: '4.00'
          },
          'phys': {
            name: 'Physics',
            registered: 2,
            grades: { A: 0, B: 1, C: 0, D: 1, E: 0, S: 0, F: 0 },
            passed: 2,
            gpa: '3.00'
          },
          'chem': {
            name: 'Chemistry',
            registered: 2,
            grades: { A: 0, B: 0, C: 1, D: 1, E: 0, S: 0, F: 0 },
            passed: 2,
            gpa: '3.50'
          },
          'kisw': {
            name: 'Kiswahili',
            registered: 1,
            grades: { A: 0, B: 0, C: 1, D: 0, E: 0, S: 0, F: 0 },
            passed: 1,
            gpa: '3.00'
          },
          'math': {
            name: 'Advanced Mathematics',
            registered: 1,
            grades: { A: 1, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 },
            passed: 1,
            gpa: '1.00'
          },
          'bio': {
            name: 'Biology',
            registered: 1,
            grades: { A: 0, B: 0, C: 1, D: 0, E: 0, S: 0, F: 0 },
            passed: 1,
            gpa: '3.00'
          },
          'geo': {
            name: 'Geography',
            registered: 2,
            grades: { A: 0, B: 0, C: 0, D: 2, E: 0, S: 0, F: 0 },
            passed: 2,
            gpa: '4.00'
          },
          'eng': {
            name: 'English',
            registered: 2,
            grades: { A: 0, B: 1, C: 1, D: 0, E: 0, S: 0, F: 0 },
            passed: 2,
            gpa: '2.50'
          },
          'econ': {
            name: 'Economics',
            registered: 1,
            grades: { A: 0, B: 0, C: 1, D: 0, E: 0, S: 0, F: 0 },
            passed: 1,
            gpa: '3.00'
          }
        },
        overallPerformance: {
          totalPassed: 3,
          examGpa: '2.67'
        }
      };

      setReport(sampleReport);
    } finally {
      setLoading(false);
    }
  }, [classId, examId, educationLevel]);

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
            Enhanced A-Level Class Result Report
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
        <EnhancedALevelClassReport
          data={report}
          onDownload={handleDownload}
          onPrint={handlePrint}
        />
      )}
    </Box>
  );
};

export default EnhancedALevelClassReportContainer;
