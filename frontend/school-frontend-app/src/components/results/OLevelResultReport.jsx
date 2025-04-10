import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  Chip,
  Snackbar
} from '@mui/material';
import {
  Print as PrintIcon,
  Share as ShareIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import resultApi from '../../services/resultApi';
import { generateOLevelStudentResultPDF } from '../../utils/oLevelPdfGenerator';
import OLevelReportSummary from './common/OLevelReportSummary';

/**
 * O-Level Student Result Report Component
 * Displays a student's O-Level result report with options to print, download, and share
 */
const OLevelStudentResultReport = () => {
  const { studentId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [gradeDistribution, setGradeDistribution] = useState({
    A: 0, B: 0, C: 0, D: 0, F: 0
  });
  const [smsSending, setSmsSending] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);
  const [smsError, setSmsError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch report data
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the report data from the dedicated O-Level API endpoint
      const reportUrl = resultApi.getOLevelStudentReportUrl(studentId, examId);
      console.log('Fetching O-Level report from dedicated API endpoint:', reportUrl);

      // Make the API request
      const response = await axios.get(reportUrl);
      console.log('O-Level report response:', response.data);
      const data = response.data;

      // Ensure this is an O-Level report
      if (data.educationLevel && data.educationLevel === 'A_LEVEL') {
        throw new Error('This is not an O-Level student. Please use the A-Level report component.');
      }

      // If data is empty or doesn't have expected structure, show error message
      if (!data || !data.subjectResults || data.subjectResults.length === 0) {
        console.log('No data from O-Level endpoint');
        // Set error message
        setError('No results found for this student. Please check if marks have been entered for this exam.');
        setLoading(false);
        return;
      }

      // We have valid data, set it and calculate grade distribution
      setReport(data);

      // Calculate grade distribution
      const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      for (const result of data.subjectResults || []) {
        if (distribution[result.grade] !== undefined) {
          distribution[result.grade]++;
        }
      }
      setGradeDistribution(distribution);
    } catch (err) {
      console.error('Error fetching O-Level report:', err);
      setError(`Failed to load report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [studentId, examId]);

  // Load report on component mount
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // Download report as PDF
  const handleDownload = () => {
    if (!report) return;

    try {
      const doc = generateOLevelStudentResultPDF({ ...report, gradeDistribution });
      doc.save(`${report.studentDetails?.name || 'Student'}_O_Level_Report.pdf`);

      setSnackbar({
        open: true,
        message: 'Report downloaded successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setSnackbar({
        open: true,
        message: `Failed to download report: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Send report via SMS
  const handleSendSMS = async () => {
    if (!report || !report.studentDetails) return;

    try {
      setSmsSending(true);
      setSmsError(null);

      // Call the SMS API
      const response = await axios.post(`/api/results/report/send-sms/${studentId}/${examId}`, {
        educationLevel: 'O_LEVEL'
      });

      setSmsSuccess(true);
      setSnackbar({
        open: true,
        message: 'SMS sent successfully to parent',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error sending SMS:', err);
      setSmsError(`Failed to send SMS: ${err.message}`);
      setSnackbar({
        open: true,
        message: `Failed to send SMS: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setSmsSending(false);
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  // Show empty state
  if (!report) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No result report found for this student and exam.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }} className="print-container">
      {/* Report Header */}
      <Box sx={{ mb: 3 }} className="print-header">
        {/* School header with logo and contact details */}
        <Grid container spacing={2} alignItems="center">
          {/* Left side - P.O. Box */}
          <Grid item xs={4} sx={{ textAlign: 'left' }}>
            <Typography variant="body2">
              P.O.BOX 8882,<br />
              Moshi, Tanzania.
            </Typography>
          </Grid>

          {/* Center - School name and logo */}
          <Grid item xs={4} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Evangelical Lutheran Church in Tanzania - Northern Diocese
            </Typography>
            <Typography variant="h5">
              AGAPE LUTHERAN JUNIOR SEMINARY
            </Typography>
          </Grid>

          {/* Right side - Contact details */}
          <Grid item xs={4} sx={{ textAlign: 'right' }}>
            <Typography variant="body2">
              Mobile phone: 0759767735<br />
              Email: infoagapeseminary@gmail.co
            </Typography>
          </Grid>
        </Grid>

        {/* Report title */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="h5" gutterBottom>
            O-LEVEL STUDENT RESULT REPORT
          </Typography>
          <Typography variant="subtitle1">
            Academic Year: {report.academicYear || 'Unknown'}
          </Typography>
        </Box>
      </Box>

      {/* O-Level Report Summary */}
      <OLevelReportSummary
        studentDetails={report.studentDetails}
        subjectResults={report.subjectResults || []}
        summary={{
          averageMarks: report.summary?.averageMarks,
          totalPoints: report.summary?.totalPoints,
          division: report.summary?.division,
          rank: report.summary?.rank,
          totalStudents: report.summary?.totalStudents,
          examName: report.examName
        }}
      />

      {/* Student Information */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Name:</strong> {report.studentDetails?.name || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Class:</strong> {report.studentDetails?.class || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Roll Number:</strong> {report.studentDetails?.rollNumber || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Gender:</strong> {report.studentDetails?.gender || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Subject Results */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Subject Results
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>
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
              {report.subjectResults?.map((result, index) => (
                <TableRow key={`subject-${index}`}>
                  <TableCell>{result.subject}</TableCell>
                  <TableCell align="center">{result.marksObtained || result.marks || 0}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={result.grade || 'N/A'}
                      color={
                        result.grade === 'A' ? 'success' :
                        result.grade === 'B' ? 'primary' :
                        result.grade === 'C' ? 'info' :
                        result.grade === 'D' ? 'warning' : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{result.points || 0}</TableCell>
                  <TableCell>{result.remarks || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Total Marks:</strong> {report.summary?.totalMarks || report.totalMarks || 0}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Average Marks:</strong> {report.summary?.averageMarks || report.averageMarks || '0.00'}%
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Total Points:</strong> {report.summary?.totalPoints || report.points || 0}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Best 7 Points:</strong> {report.summary?.bestSevenPoints || report.bestSevenPoints || 0}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Division:</strong> {report.summary?.division || report.division || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Rank:</strong> {report.summary?.rank || 'N/A'} of {report.summary?.totalStudents || report.studentDetails?.totalStudents || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Grade Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Grade</TableCell>
                    <TableCell align="center">Count</TableCell>
                    <TableCell align="center">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(gradeDistribution).map(([grade, count]) => (
                    <TableRow key={grade}>
                      <TableCell>
                        <Chip
                          label={grade}
                          color={
                            grade === 'A' ? 'success' :
                            grade === 'B' ? 'primary' :
                            grade === 'C' ? 'info' :
                            grade === 'D' ? 'warning' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{count}</TableCell>
                      <TableCell align="center">
                        {report.subjectResults?.length
                          ? `${Math.round((count / report.subjectResults.length) * 100)}%`
                          : '0%'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* O-Level Division Guide */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            O-Level Division Guide
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Division</strong></TableCell>
                <TableCell><strong>Points Range</strong></TableCell>
                <TableCell><strong>Grade Points</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Division I</TableCell>
                <TableCell>7-14 points</TableCell>
                <TableCell rowSpan={5}>
                  A (75-100%) = 1 point<br />
                  B (65-74%) = 2 points<br />
                  C (50-64%) = 3 points<br />
                  D (30-49%) = 4 points<br />
                  F (0-29%) = 5 points
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Division II</TableCell>
                <TableCell>15-21 points</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Division III</TableCell>
                <TableCell>22-25 points</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Division IV</TableCell>
                <TableCell>26-32 points</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Division 0</TableCell>
                <TableCell>33+ points</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }} className="no-print">
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print Report
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={() => navigate('/teacher/marks-entry')}
        >
          Enter O-Level Marks
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download PDF
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={smsSending ? <CircularProgress size={20} color="inherit" /> : <ShareIcon />}
          onClick={handleSendSMS}
          disabled={smsSending}
        >
          {smsSending ? 'Sending...' : 'Send SMS to Parent'}
        </Button>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
          }
          .print-header {
            margin-bottom: 10px !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default OLevelStudentResultReport;
