import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getClassResultReport } from '../../services/normalizedApi';
import SimpleALevelClassReport from './SimpleALevelClassReport';
import { Box, CircularProgress } from '@mui/material';

/**
 * Container component for the simplified A-Level class report
 * Handles data fetching and error handling
 */
const SimpleALevelClassReportContainer = ({ classId, examId, educationLevel = 'A_LEVEL' }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch report data
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching A-Level class report for class ${classId}, exam ${examId}`);
        
        // Try to fetch the report data
        const reportData = await getClassResultReport(classId, examId, educationLevel);
        
        // If no data received, create a placeholder structure
        const finalReport = reportData || {
          className: classId,
          examName: 'Not Available',
          educationLevel: 'A_LEVEL',
          students: [],
          subjects: []
        };
        
        // Set the current year for the report title
        finalReport.year = new Date().getFullYear();
        
        setReport(finalReport);
      } catch (err) {
        console.error('Error fetching report:', err);
        
        // Create a user-friendly error message
        let errorMessage = 'Failed to load report';
        
        let useSampleData = false;
        
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (err.response.status === 403) {
            errorMessage = 'You do not have permission to access this report. Using sample data for demonstration.';
            useSampleData = true;
          } else if (err.response.status === 404) {
            errorMessage = 'Report not found. The class or exam may not exist. Using sample data for demonstration.';
            useSampleData = true;
          } else {
            errorMessage = `Server error: ${err.response.status}. Using sample data for demonstration.`;
            useSampleData = true;
          }
        } else if (err.request) {
          // The request was made but no response was received
          errorMessage = 'No response from server. Using sample data for demonstration.';
          useSampleData = true;
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage = `Error: ${err.message || 'Unknown error'}. Using sample data for demonstration.`;
          useSampleData = true;
        }
        
        setError(errorMessage);
        
        // Create sample data or placeholder based on the error
        let reportData;
        
        if (useSampleData) {
          // Use sample data for demonstration
          reportData = {
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
            }
          };
        } else {
          // Use empty placeholder
          reportData = {
            className: classId,
            examName: 'Not Available',
            educationLevel: 'A_LEVEL',
            year: new Date().getFullYear(),
            students: [],
            subjects: []
          };
        }
        
        setReport(reportData);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [classId, examId, educationLevel]);

  // Show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render the report component
  return <SimpleALevelClassReport data={report} error={error} />;
};

SimpleALevelClassReportContainer.propTypes = {
  classId: PropTypes.string.isRequired,
  examId: PropTypes.string.isRequired,
  educationLevel: PropTypes.string
};

export default SimpleALevelClassReportContainer;
