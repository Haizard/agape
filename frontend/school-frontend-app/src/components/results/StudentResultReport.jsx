import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
  Grid,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Print as PrintIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import api from '../../services/api';
import SafeDisplay from '../common/SafeDisplay';
import DirectPdfLink from '../common/DirectPdfLink';

const StudentResultReport = () => {
  const { studentId, examId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [gradeDistribution, setGradeDistribution] = useState({});

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      console.log(`Fetching result report for student ${studentId} and exam ${examId}`);
      const response = await api.get(`/api/results/report/student/${studentId}/${examId}`);
      console.log('Report data:', response.data);

      setReport(response.data);

      // Calculate grade distribution if needed
      if (response.data?.results) {
        const distribution = {};
        for (const result of response.data.results) {
          const grade = String(result.grade || 'N/A');
          distribution[grade] = (distribution[grade] || 0) + 1;
        }
        setGradeDistribution(distribution);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching result report:', err);
      let errorMessage = 'Failed to fetch result report';
      if (err.response) {
        errorMessage = err.response.data?.message || err.response.statusText || errorMessage;
      } else if (err.request) {
        errorMessage = 'No response received from server. Please check your network connection.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [studentId, examId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    window.print();
  };

  // Download functionality is now handled by the DirectPdfDownload component

  const [smsSending, setSmsSending] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);
  const [smsError, setSmsError] = useState(null);

  const handleSendSMS = async () => {
    setSmsSending(true);
    setSmsSuccess(false);
    setSmsError(null);

    try {
      // Send the SMS using the API
      const response = await api.post(`/api/sms/send-result/${studentId}`, {
        examId: examId,
        examName: report.examName
      });

      console.log('SMS sent successfully:', response.data);
      setSmsSuccess(true);
      alert(`SMS sent successfully to ${response.data.recipientCount} parent contact(s)`);
    } catch (error) {
      console.error('Error sending SMS:', error);
      setSmsError(error.response?.data?.message || 'Failed to send SMS');
      alert(`Error sending SMS: ${error.response?.data?.message || 'Failed to send SMS'}`);
    } finally {
      setSmsSending(false);
    }
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
        {typeof error === 'object' ? JSON.stringify(error) : error}
      </Alert>
    );
  }

  if (!report) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No result report found for this student and exam.
      </Alert>
    );
  }

  // We're now calculating grade distribution in the fetchReport function
  // and storing it in the gradeDistribution state

  return (
    <Box sx={{ p: 3 }} className="result-report-container">
      {/* Report Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            <SafeDisplay value={report.schoolName} />
          </Typography>
          <Typography variant="h5" gutterBottom>
            <SafeDisplay value={report.reportTitle} />
          </Typography>
          <Typography variant="subtitle1">
            Academic Year: <SafeDisplay value={report.academicYear} />
          </Typography>
          <Typography variant="subtitle2">
            Exam Date: <SafeDisplay value={report.examDate} />
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Student Details */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              <strong>Student Name:</strong> <SafeDisplay value={report.studentDetails.name} />
            </Typography>
            <Typography variant="subtitle1">
              <strong>Roll Number:</strong> <SafeDisplay value={report.studentDetails.rollNumber} />
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              <strong>Class:</strong> <SafeDisplay value={report.studentDetails.class} />
            </Typography>
            <Typography variant="subtitle1">
              <strong>Gender:</strong> <SafeDisplay value={report.studentDetails.gender} />
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Subject Results */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Subject Results
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Subject</strong></TableCell>
                <TableCell align="center"><strong>Marks</strong></TableCell>
                <TableCell align="center"><strong>Grade</strong></TableCell>
                <TableCell align="center"><strong>Points</strong></TableCell>
                <TableCell><strong>Remarks</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(report.subjectResults) ? report.subjectResults.map((result) => (
                <TableRow key={typeof result.subject === 'object' ? result.subject._id : result.subject}>
                  <TableCell><SafeDisplay value={result.subject} /></TableCell>
                  <TableCell align="center"><SafeDisplay value={result.marks} /></TableCell>
                  <TableCell align="center">
                    <Chip
                      label={<SafeDisplay value={result.grade} />}
                      color={
                        result.grade === "A" ? 'success' :
                        result.grade === "B" ? 'primary' :
                        result.grade === "C" ? 'info' :
                        result.grade === "D" ? 'warning' :
                        'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center"><SafeDisplay value={result.points} /></TableCell>
                  <TableCell><SafeDisplay value={result.remarks} /></TableCell>
                </TableRow>
              )) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Summary */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Performance Summary
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">
                <strong>Total Marks:</strong> <SafeDisplay value={report.summary?.totalMarks} />
              </Typography>
              <Typography variant="subtitle1">
                <strong>Average Marks:</strong> <SafeDisplay value={report.summary?.averageMarks} />
              </Typography>
              <Typography variant="subtitle1">
                <strong>Total Points:</strong> <SafeDisplay value={report.summary?.totalPoints} />
              </Typography>
              <Typography variant="subtitle1">
                <strong>Best Seven Points:</strong> <SafeDisplay value={report.summary?.bestSevenPoints} />
              </Typography>
              <Typography variant="subtitle1">
                <strong>Division:</strong> <SafeDisplay value={report.summary?.division} />
              </Typography>
              <Typography variant="subtitle1">
                <strong>Rank:</strong> <SafeDisplay value={report.summary?.rank} />
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Grade Distribution
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3 }}>
              {gradeDistribution ? Object.entries(gradeDistribution).map(([grade, count]) => (
                <Card key={grade} sx={{ width: 60, textAlign: 'center', bgcolor:
                  grade === "A" ? '#e8f5e9' :
                  grade === "B" ? '#e3f2fd' :
                  grade === "C" ? '#e0f7fa' :
                  grade === "D" ? '#fff8e1' :
                  '#ffebee'
                }}>
                  <CardContent>
                    <Typography variant="h6"><SafeDisplay value={grade} /></Typography>
                    <Typography variant="h4"><SafeDisplay value={count} /></Typography>
                  </CardContent>
                </Card>
              )) : null}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print Report
        </Button>
        <DirectPdfLink
          type="student"
          studentId={studentId}
          examId={examId}
          label="Download PDF"
          variant="contained"
          color="secondary"
        />
        <Button
          variant="contained"
          color="success"
          startIcon={smsSending ? <CircularProgress size={20} color="inherit" /> : <ShareIcon />}
          onClick={handleSendSMS}
          disabled={smsSending}
        >
          {smsSending ? 'Sending...' : 'Send SMS to Parent'}
        </Button>
        {smsSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            SMS sent successfully to parent(s).
          </Alert>
        )}
        {smsError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {smsError}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default StudentResultReport;
