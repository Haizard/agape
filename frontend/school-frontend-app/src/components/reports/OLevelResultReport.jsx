import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Divider
} from '@mui/material';
import {
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const OLevelResultReport = () => {
  const { studentId, examId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [studentId, examId]);

  const fetchReport = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cacheKey = `o-level-report-${studentId}-${examId}`;
      const cachedData = sessionStorage.getItem(cacheKey);

      if (!forceRefresh && cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;

          // Use cache if it's less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            setReport(parsed.data);
            setIsFromCache(true);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing cached report data:', e);
        }
      }

      // Fetch from API
      // Use the new standardized API endpoint
      const response = await axios.get(`${API_URL}api/o-level/reports/student/${studentId}/${examId}`);
      const reportData = response.data.data;

      // Update state
      setReport(reportData);
      setIsFromCache(false);

      // Cache the data
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: reportData,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error('Error caching report data:', e);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.message || 'Error fetching report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Use the new standardized API endpoint for PDF download
    window.open(`${API_URL}api/o-level/reports/student/${studentId}/${examId}?format=pdf`, '_blank');
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => fetchReport(true)}
          sx={{ ml: 2 }}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  if (!report) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        No report data available
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Action buttons */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }} className="no-print">
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchReport(true)}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ mr: 1 }}
          >
            Download PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Cache indicator */}
      {isFromCache && (
        <Alert severity="info" sx={{ mb: 2 }} className="no-print">
          Showing cached report data. <Button size="small" onClick={() => fetchReport(true)}>Refresh</Button>
        </Alert>
      )}

      {/* Main report */}
      <Paper sx={{ p: 3 }} className="print-container">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5">AGAPE LUTHERAN JUNIOR SEMINARY</Typography>
          <Typography variant="h6">O-LEVEL STUDENT RESULT REPORT</Typography>
          <Typography variant="body1">Academic Year: {report.academicYear}</Typography>
        </Box>

        {/* Student Info */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1"><strong>Name:</strong> {report.studentDetails?.name}</Typography>
            <Typography variant="body1"><strong>Class:</strong> {report.studentDetails?.class}</Typography>
            <Typography variant="body1"><strong>Roll Number:</strong> {report.studentDetails?.rollNumber}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1"><strong>Gender:</strong> {report.studentDetails?.gender}</Typography>
            <Typography variant="body1"><strong>Exam:</strong> {report.examName}</Typography>
            <Typography variant="body1"><strong>Date:</strong> {report.examDate}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Subject Results */}
        <Typography variant="h6" gutterBottom>Subject Results</Typography>
        <Box sx={{ overflowX: 'auto', mb: 3 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Subject</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Marks</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Grade</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Points</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {report.subjectResults?.map((result, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.subject}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{result.marks}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{result.grade}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{result.points}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.remarks}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>Total</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{report.summary?.totalMarks}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}></td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{report.summary?.totalPoints}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
              </tr>
            </tbody>
          </table>
        </Box>

        {/* Summary */}
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body1"><strong>Average Marks:</strong> {report.summary?.averageMarks}</Typography>
              <Typography variant="body1"><strong>Best 7 Points:</strong> {report.summary?.bestSevenPoints}</Typography>
              <Typography variant="body1"><strong>Division:</strong> {report.summary?.division}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body1"><strong>Rank:</strong> {report.summary?.rank} of {report.summary?.totalStudents}</Typography>
              <Typography variant="body1"><strong>Grade Distribution:</strong></Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                {Object.entries(report.summary?.gradeDistribution || {}).map(([grade, count]) => (
                  <Typography key={grade} variant="body2">
                    {grade}: {count}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" sx={{ borderTop: '1px solid #000', pt: 1, width: 150 }}>Class Teacher</Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ borderTop: '1px solid #000', pt: 1, width: 150 }}>Academic Master</Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ borderTop: '1px solid #000', pt: 1, width: 150 }}>Head of School</Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption">
            O-LEVEL Division Guide: Division I: 7-17 points, Division II: 18-21 points, Division III: 22-25 points, Division IV: 26-33 points, Division 0: 34+ points
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default OLevelResultReport;
