import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Alert,
  Snackbar,
  Grid
} from '@mui/material';
import {
  Print as PrintIcon,
  Share as ShareIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

// Import components
import CharacterAssessmentComments from './CharacterAssessmentComments';
import SubjectCombinationDisplay from '../common/SubjectCombinationDisplay';
import ALevelReportSummary from './common/ALevelReportSummary';
import LoadingIndicator from '../common/LoadingIndicator';
import ErrorDisplay from '../common/ErrorDisplay';

// Import utilities
import { generateALevelStudentResultPDF } from '../../utils/aLevelPdfGenerator';

// Import HOCs
import withCircuitBreaker from '../../hocs/withCircuitBreaker';

// Import hooks
import useTraceRender from '../../hooks/useTraceRender';

// Import context
import { useReport } from '../../contexts/ReportContext';

/**
 * A-Level Student Result Report Component
 * Displays a student's A-Level result report with options to print, download, and share
 */
const ALevelResultReport = () => {
  // Use the report context
  const { data: report, loading, error, isFromCache, isMockData, fetchReport } = useReport();

  // Trace renders for debugging
  useTraceRender('ALevelResultReport', { report, loading, error });

  const navigate = useNavigate();

  const [smsSending, setSmsSending] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);
  const [smsError, setSmsError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Memoize grade distribution calculation
  const gradeDistribution = useMemo(() => {
    if (!report || !report.subjectResults) {
      return { A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 };
    }

    const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 };
    for (const result of report.subjectResults) {
      if (distribution[result.grade] !== undefined) {
        distribution[result.grade]++;
      }
    }

    return distribution;
  }, [report]);

  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Handle download
  const handleDownload = useCallback(() => {
    if (!report) {
      setSnackbar({
        open: true,
        message: 'No report data available to download',
        severity: 'warning'
      });
      return;
    }

    try {
      // Generate the PDF
      const doc = generateALevelStudentResultPDF({ ...report, gradeDistribution });

      // Save the PDF
      const fileName = `${report.studentDetails?.name || 'Student'}_${report.examName || 'Exam'}_A_Level_Report.pdf`;
      doc.save(fileName);

      setSnackbar({
        open: true,
        message: 'Report downloaded successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setSnackbar({
        open: true,
        message: 'Failed to download report',
        severity: 'error'
      });
    }
  }, [report, gradeDistribution]);

  // Handle send SMS
  const handleSendSMS = useCallback(async () => {
    if (!report || !report.studentDetails) {
      setSnackbar({
        open: true,
        message: 'No report data available to send',
        severity: 'warning'
      });
      return;
    }

    setSmsSending(true);
    setSmsError(null);
    setSmsSuccess(false);

    try {
      // Get the student ID and exam ID from the report
      const studentId = report.studentId || report.studentDetails?._id;
      const examId = report.examId || report.exam?._id;

      if (!studentId || !examId) {
        throw new Error('Missing student ID or exam ID');
      }

      // Get the A-Level SMS endpoint URL
      const smsUrl = `/api/a-level-results/send-sms/${studentId}/${examId}`;

      // Call the API to send SMS
      const response = await fetch(smsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send SMS');
      }

      setSmsSuccess(true);
      setSnackbar({
        open: true,
        message: 'SMS sent successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      setSmsError(error.message || 'Failed to send SMS');
      setSnackbar({
        open: true,
        message: error.message || 'Failed to send SMS',
        severity: 'error'
      });
    } finally {
      setSmsSending(false);
    }
  }, [report]);

  // Handle snackbar close
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Refresh data
  const handleRefresh = useCallback(() => {
    fetchReport('a-level-student', true);
  }, [fetchReport]);

  // Show data source indicator
  const dataSourceIndicator = useMemo(() => {
    if (isMockData) {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Using demo data. Real data could not be loaded.
        </Alert>
      );
    }

    if (isFromCache) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          Using cached data. <Button size="small" onClick={handleRefresh}>Refresh</Button>
        </Alert>
      );
    }

    return null;
  }, [isMockData, isFromCache, handleRefresh]);

  // If no report data, show loading or error
  if (!report) {
    if (loading) {
      return <LoadingIndicator message="Loading A-Level report..." />;
    }

    if (error) {
      return <ErrorDisplay error={error} onRetry={handleRefresh} />;
    }

    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        No report data available
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }} className="print-container">
      {/* Report Header */}
      <Box sx={{ mb: 3 }} className="print-header">
        {/* Header with church name */}
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant="h6" gutterBottom>
            Evangelical Lutheran Church in Tanzania - Northern Diocese
          </Typography>
          <Typography variant="h4" gutterBottom>
            Agape Lutheran Junior Seminary
          </Typography>
        </Box>

        {/* Contact information */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Left side - P.O. Box */}
          <Grid item xs={4} sx={{ textAlign: 'left' }}>
            <Typography variant="body2">
              P.O.BOX 8882,<br />
              Moshi, Tanzania
            </Typography>
          </Grid>

          {/* Center - Logo */}
          <Grid item xs={4} sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src={`${process.env.PUBLIC_URL}/images/lutheran_logo.png`}
                alt="Lutheran Church Logo"
                style={{ width: '80px', height: '80px' }}
                onError={(e) => {
                  console.error('Error loading image:', e);
                  e.target.src = `${process.env.PUBLIC_URL}/favicon.ico`; // Fallback image
                }}
              />
            </Box>
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
            A-LEVEL STUDENT RESULT REPORT
          </Typography>
          <Typography variant="subtitle1">
            Academic Year: {report.academicYear || 'Unknown'}
          </Typography>
        </Box>
      </Box>

      {/* A-Level Report Summary */}
      <ALevelReportSummary
        studentDetails={report.studentDetails}
        subjectResults={report.subjectResults || []}
        summary={{
          averageMarks: report.summary?.averageMarks,
          totalPoints: report.summary?.totalPoints,
          bestThreePoints: report.summary?.bestThreePoints,
          division: report.summary?.division,
          rank: report.summary?.rank,
          totalStudents: report.summary?.totalStudents,
          examName: report.examName
        }}
      />

      {/* Student Information */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Student Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Name:</strong> {report.studentDetails?.name || report.student?.fullName || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Roll Number:</strong> {report.studentDetails?.rollNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Class:</strong> {report.studentDetails?.class || report.class?.fullName || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Gender:</strong> {report.studentDetails?.gender || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Rank:</strong> {report.studentDetails?.rank || 'N/A'} of {report.studentDetails?.totalStudents || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Exam Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Exam:</strong> {report.examName || report.exam?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Date:</strong> {report.examDate || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Term:</strong> {report.exam?.term || 'Term 1'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Subject Combination */}
      {report.subjectCombination && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Subject Combination
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <SubjectCombinationDisplay
              combination={report.subjectCombination}
              showCompulsory={true}
              variant="full"
            />
          </Box>
        </Paper>
      )}

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
              {/* Principal Subjects */}
              <TableRow>
                <TableCell colSpan={5} sx={{ backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle1"><strong>Principal Subjects</strong></Typography>
                </TableCell>
              </TableRow>
              {report.subjectResults
                .filter(result => result.isPrincipal)
                .map((result, index) => (
                  <TableRow key={`principal-${result.subject}`} sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">{result.subject}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                          <Chip
                            label="Principal"
                            color="primary"
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          {result.isCompulsory && (
                            <Chip
                              label="Compulsory"
                              color="secondary"
                              size="small"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {result.marksObtained || result.marks || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={result.grade || 'N/A'}
                        color={
                          result.grade === 'A' ? 'success' :
                          result.grade === 'B' ? 'success' :
                          result.grade === 'C' ? 'primary' :
                          result.grade === 'D' ? 'warning' :
                          result.grade === 'E' ? 'warning' :
                          result.grade === 'S' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {result.points || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>{result.remarks || 'N/A'}</TableCell>
                  </TableRow>
                ))}

              {/* Subsidiary Subjects */}
              <TableRow>
                <TableCell colSpan={5} sx={{ backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle1"><strong>Subsidiary Subjects</strong></Typography>
                </TableCell>
              </TableRow>
              {report.subjectResults
                .filter(result => !result.isPrincipal)
                .map((result, index) => (
                  <TableRow key={`subsidiary-${result.subject}`}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">{result.subject}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                          <Chip
                            label="Subsidiary"
                            color="default"
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          {result.isCompulsory && (
                            <Chip
                              label="Compulsory"
                              color="secondary"
                              size="small"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">{result.marksObtained || result.marks || 0}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={result.grade || 'N/A'}
                        color={
                          result.grade === 'A' ? 'success' :
                          result.grade === 'B' ? 'success' :
                          result.grade === 'C' ? 'primary' :
                          result.grade === 'D' ? 'warning' :
                          result.grade === 'E' ? 'warning' :
                          result.grade === 'S' ? 'warning' : 'error'
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

      {/* Character Assessment */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Character Assessment
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>
        <TableContainer>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell><strong>Punctuality:</strong></TableCell>
                <TableCell>{report.characterAssessment?.punctuality || 'Good'}</TableCell>
                <TableCell><strong>Discipline:</strong></TableCell>
                <TableCell>{report.characterAssessment?.discipline || 'Good'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Respect:</strong></TableCell>
                <TableCell>{report.characterAssessment?.respect || 'Good'}</TableCell>
                <TableCell><strong>Leadership:</strong></TableCell>
                <TableCell>{report.characterAssessment?.leadership || 'Good'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Participation:</strong></TableCell>
                <TableCell>{report.characterAssessment?.participation || 'Good'}</TableCell>
                <TableCell><strong>Overall:</strong></TableCell>
                <TableCell>{report.characterAssessment?.overallAssessment || 'Good'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Comments:</strong></TableCell>
                <TableCell colSpan={3}>{report.characterAssessment?.comments || 'No comments available'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Editable Comments Section */}
        {report.characterAssessment?._id && (
          <Box sx={{ p: 2 }}>
            <CharacterAssessmentComments
              assessmentId={report.characterAssessment._id}
              initialComments={report.characterAssessment?.comments || ''}
            />
          </Box>
        )}
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
                  <strong>Best 3 Principal Points:</strong> {report.summary?.bestThreePoints || report.bestThreePoints || 0}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Division:</strong> {report.summary?.division || report.division || 'N/A'}
                  {report.summary?.division && (
                    <Chip
                      label={`Division ${report.summary.division}`}
                      color={
                        report.summary.division === 'I' ? 'success' :
                        report.summary.division === 'II' ? 'primary' :
                        report.summary.division === 'III' ? 'info' :
                        report.summary.division === 'IV' ? 'warning' :
                        report.summary.division === 'V' ? 'warning' : 'error'
                      }
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Rank:</strong> {report.summary?.rank || 'N/A'} of {report.summary?.totalStudents || report.studentDetails?.totalStudents || 'N/A'}
                  {report.summary?.rank && report.summary?.totalStudents && (
                    <Chip
                      label={`${report.summary.rank}/${report.summary.totalStudents}`}
                      color={report.summary.rank <= 3 ? 'success' : 'primary'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
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
                    <TableCell align="center"><strong>A</strong></TableCell>
                    <TableCell align="center"><strong>B</strong></TableCell>
                    <TableCell align="center"><strong>C</strong></TableCell>
                    <TableCell align="center"><strong>D</strong></TableCell>
                    <TableCell align="center"><strong>E</strong></TableCell>
                    <TableCell align="center"><strong>S</strong></TableCell>
                    <TableCell align="center"><strong>F</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell align="center">{gradeDistribution.A || 0}</TableCell>
                    <TableCell align="center">{gradeDistribution.B || 0}</TableCell>
                    <TableCell align="center">{gradeDistribution.C || 0}</TableCell>
                    <TableCell align="center">{gradeDistribution.D || 0}</TableCell>
                    <TableCell align="center">{gradeDistribution.E || 0}</TableCell>
                    <TableCell align="center">{gradeDistribution.S || 0}</TableCell>
                    <TableCell align="center">{gradeDistribution.F || 0}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* A-Level Division Guide */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            A-Level Division Guide
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
                <TableCell>3-9 points</TableCell>
                <TableCell rowSpan={5}>
                  A (80-100%) = 1 point<br />
                  B (70-79%) = 2 points<br />
                  C (60-69%) = 3 points<br />
                  D (50-59%) = 4 points<br />
                  E (40-49%) = 5 points<br />
                  S (35-39%) = 6 points<br />
                  F (0-34%) = 7 points
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Division II</TableCell>
                <TableCell>10-12 points</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Division III</TableCell>
                <TableCell>13-17 points</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Division IV</TableCell>
                <TableCell>18-19 points</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Division V</TableCell>
                <TableCell>20-21 points</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Approval Section */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Approved By
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>TEACHER</strong>
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                NAME: {report.teacher?.name || 'N/A'}
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                SIGN: ___________________
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>HEAD OF SCHOOL</strong>
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                NAME: {report.headOfSchool?.name || 'N/A'}
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                SIGN: ___________________
              </Typography>
            </Grid>
          </Grid>
        </Box>
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
          onClick={() => navigate('/results/a-level/enter-marks')}
        >
          Enter A-Level Marks
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

      {/* Success/Error Messages */}
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Apply circuit breaker HOC
export default withCircuitBreaker(ALevelResultReport, {
  maxRenders: 30,  // Allow more renders for initial load
  timeWindowMs: 2000  // Increase time window to 2 seconds
});
