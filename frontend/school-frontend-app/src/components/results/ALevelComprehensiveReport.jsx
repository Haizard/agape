import React, { useState, useCallback, useMemo } from 'react';
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
  Alert,
  Card,
  CardContent,
  Chip,
  Snackbar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Print as PrintIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  School as SchoolIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import SubjectCombinationDisplay from '../common/SubjectCombinationDisplay';
import { normalizeSubjectResult } from '../../utils/aLevelDataUtils';

// Import HOCs
import withCircuitBreaker from '../../hocs/withCircuitBreaker';

// Import hooks
import useTraceRender from '../../hooks/useTraceRender';
import useDeepMemo from '../../hooks/useDeepMemo';

// Import context
import { useReport } from '../../contexts/ReportContext';

// Import components
import LoadingIndicator from '../common/LoadingIndicator';
import ErrorDisplay from '../common/ErrorDisplay';

/**
 * A-Level Comprehensive Report Component
 * Displays a comprehensive report for Form 5 and Form 6 students
 * showing both Principal and Subsidiary subjects with all performance metrics
 */
const ALevelComprehensiveReport = () => {
  // Use the report context
  const { data: report, loading, error, isFromCache, isMockData, fetchReport } = useReport();

  // Trace renders for debugging
  useTraceRender('ALevelComprehensiveReport', { report, loading, error });
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Handle tab change
  const handleTabChange = useCallback((event, newValue) => {
    setTabValue(newValue);
  }, []);

  // Print report
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Download report as PDF
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
      // Open the PDF version in a new tab (backend will generate PDF)
      const studentId = report.studentId || report.studentDetails?._id;
      const examId = report.examId || report.exam?._id;

      if (!studentId || !examId) {
        throw new Error('Missing student ID or exam ID');
      }

      const pdfUrl = `/api/a-level-comprehensive/student/${studentId}/${examId}`;
      window.open(pdfUrl, '_blank');

      setSnackbar({
        open: true,
        message: 'PDF opened in a new tab',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error opening PDF:', error);
      setSnackbar({
        open: true,
        message: `Error opening PDF: ${error.message}`,
        severity: 'error'
      });
    }
  }, [report]);

  // Handle share report
  const handleShare = useCallback(() => {
    if (!report) {
      setSnackbar({
        open: true,
        message: 'No report data available to share',
        severity: 'warning'
      });
      return;
    }

    try {
      // Create a shareable link
      const studentId = report.studentId || report.studentDetails?._id;
      const examId = report.examId || report.exam?._id;

      if (!studentId || !examId) {
        throw new Error('Missing student ID or exam ID');
      }

      const shareUrl = `${window.location.origin}/results/a-level-comprehensive/${studentId}/${examId}`;

      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setSnackbar({
            open: true,
            message: 'Report link copied to clipboard',
            severity: 'success'
          });
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
          setSnackbar({
            open: true,
            message: 'Failed to copy link to clipboard',
            severity: 'error'
          });
        });
    } catch (error) {
      console.error('Error sharing report:', error);
      setSnackbar({
        open: true,
        message: `Error sharing report: ${error.message}`,
        severity: 'error'
      });
    }
  }, [report]);

  // Handle snackbar close
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Compute all subjects
  const allSubjects = useMemo(() => {
    if (!report) return [];

    const principalSubjects = report.principalSubjects || [];
    const subsidiarySubjects = report.subsidiarySubjects || [];

    return [...principalSubjects, ...subsidiarySubjects];
  }, [report]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    fetchReport('a-level-comprehensive', true);
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
      return <LoadingIndicator message="Loading comprehensive A-Level report..." />;
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
      {dataSourceIndicator}

      {/* Report Header */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Evangelical Lutheran Church in Tanzania - Northern Diocese
        </Typography>
        <Typography variant="h4" gutterBottom>
          Agape Lutheran Junior Seminary
        </Typography>
        <Typography variant="h6" gutterBottom>
          {report.formLevel === 5 ? 'Form 5' : 'Form 6'} A-Level Academic Report
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          {report.examName} - {report.academicYear}
        </Typography>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }} className="no-print">
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ mr: 1 }}
        >
          Print
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          sx={{ mr: 1 }}
        >
          Download PDF
        </Button>
        <Button
          variant="contained"
          startIcon={<ShareIcon />}
          onClick={handleShare}
        >
          Share
        </Button>
      </Box>

      {/* Student Details */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Student Information
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              <strong>Name:</strong> {report.studentDetails?.name || 'N/A'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Admission Number:</strong> {report.studentDetails?.admissionNumber || report.studentDetails?.rollNumber || 'N/A'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Form:</strong> {report.formLevel || 'N/A'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Gender:</strong> {report.studentDetails?.gender || 'N/A'}
            </Typography>
            {report.studentDetails?.combination && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Combination:</strong>
                </Typography>
                <SubjectCombinationDisplay
                  combination={report.studentDetails.combination}
                  showCompulsory={false}
                />
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Exam Information
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              <strong>Exam:</strong> {report.examName || 'N/A'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Academic Year:</strong> {report.academicYear || 'N/A'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Term:</strong> {report.term || 'N/A'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Date:</strong> {report.examDate || 'N/A'}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Performance Summary:</strong>
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Average Marks: {report.summary?.averageMarks || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Total Points: {report.summary?.totalPoints || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Best Three Points: {report.summary?.bestThreePoints || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Division: {report.summary?.division || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Rank: {report.summary?.rank || 'N/A'}/{report.summary?.totalStudents || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs for Subject Results */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          className="no-print"
        >
          <Tab label="Principal Subjects" />
          <Tab label="Subsidiary Subjects" />
          <Tab label="All Subjects" />
        </Tabs>

        {/* Principal Subjects Tab */}
        <Box sx={{ p: 2, display: tabValue === 0 ? 'block' : 'none' }}>
          <Typography variant="h6" gutterBottom className="print-only">
            Principal Subjects
          </Typography>
          <Divider sx={{ mb: 2 }} className="print-only" />

          {report.principalSubjects && report.principalSubjects.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell align="center">Marks</TableCell>
                    <TableCell align="center">Grade</TableCell>
                    <TableCell align="center">Points</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.principalSubjects.map((subject, index) => (
                    <TableRow key={index}>
                      <TableCell>{subject.code}</TableCell>
                      <TableCell>{subject.subject}</TableCell>
                      <TableCell align="center">
                        {subject.marksObtained !== null ? subject.marksObtained : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={subject.grade}
                          color={
                            subject.grade === 'A' ? 'success' :
                            subject.grade === 'B' ? 'primary' :
                            subject.grade === 'C' ? 'info' :
                            subject.grade === 'D' ? 'warning' :
                            subject.grade === 'E' ? 'secondary' :
                            subject.grade === 'S' ? 'default' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{subject.points}</TableCell>
                      <TableCell>{subject.remarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" color="text.secondary" align="center">
              No principal subjects found
            </Typography>
          )}
        </Box>

        {/* Subsidiary Subjects Tab */}
        <Box sx={{ p: 2, display: tabValue === 1 ? 'block' : 'none' }}>
          <Typography variant="h6" gutterBottom className="print-only">
            Subsidiary Subjects
          </Typography>
          <Divider sx={{ mb: 2 }} className="print-only" />

          {report.subsidiarySubjects && report.subsidiarySubjects.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell align="center">Marks</TableCell>
                    <TableCell align="center">Grade</TableCell>
                    <TableCell align="center">Points</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.subsidiarySubjects.map((subject, index) => (
                    <TableRow key={index}>
                      <TableCell>{subject.code}</TableCell>
                      <TableCell>{subject.subject}</TableCell>
                      <TableCell align="center">
                        {subject.marksObtained !== null ? subject.marksObtained : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={subject.grade}
                          color={
                            subject.grade === 'A' ? 'success' :
                            subject.grade === 'B' ? 'primary' :
                            subject.grade === 'C' ? 'info' :
                            subject.grade === 'D' ? 'warning' :
                            subject.grade === 'E' ? 'secondary' :
                            subject.grade === 'S' ? 'default' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{subject.points}</TableCell>
                      <TableCell>{subject.remarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" color="text.secondary" align="center">
              No subsidiary subjects found
            </Typography>
          )}
        </Box>

        {/* All Subjects Tab */}
        <Box sx={{ p: 2, display: tabValue === 2 ? 'block' : 'none' }}>
          <Typography variant="h6" gutterBottom className="print-only">
            All Subjects
          </Typography>
          <Divider sx={{ mb: 2 }} className="print-only" />

          {allSubjects.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell align="center">Type</TableCell>
                    <TableCell align="center">Marks</TableCell>
                    <TableCell align="center">Grade</TableCell>
                    <TableCell align="center">Points</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allSubjects.map((subject, index) => (
                    <TableRow key={index}>
                      <TableCell>{subject.code}</TableCell>
                      <TableCell>{subject.subject}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={subject.isPrincipal ? 'Principal' : 'Subsidiary'}
                          color={subject.isPrincipal ? 'primary' : 'secondary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {subject.marksObtained !== null ? subject.marksObtained : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={subject.grade}
                          color={
                            subject.grade === 'A' ? 'success' :
                            subject.grade === 'B' ? 'primary' :
                            subject.grade === 'C' ? 'info' :
                            subject.grade === 'D' ? 'warning' :
                            subject.grade === 'E' ? 'secondary' :
                            subject.grade === 'S' ? 'default' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{subject.points}</TableCell>
                      <TableCell>{subject.remarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" color="text.secondary" align="center">
              No subjects found
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Performance Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Average Marks</strong></TableCell>
                    <TableCell align="right">{report.summary?.averageMarks || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Total Points</strong></TableCell>
                    <TableCell align="right">{report.summary?.totalPoints || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Best Three Points</strong></TableCell>
                    <TableCell align="right">{report.summary?.bestThreePoints || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Division</strong></TableCell>
                    <TableCell align="right">
                      <Chip
                        label={report.summary?.division || 'N/A'}
                        color={
                          report.summary?.division === 'I' ? 'success' :
                          report.summary?.division === 'II' ? 'primary' :
                          report.summary?.division === 'III' ? 'info' :
                          report.summary?.division === 'IV' ? 'warning' : 'default'
                        }
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Rank</strong></TableCell>
                    <TableCell align="right">{report.summary?.rank || 'N/A'} / {report.summary?.totalStudents || 'N/A'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Grade Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Grade</TableCell>
                    <TableCell align="center">Count</TableCell>
                    <TableCell align="center">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.summary?.gradeDistribution && Object.entries(report.summary.gradeDistribution).map(([grade, count]) => (
                    <TableRow key={grade}>
                      <TableCell>
                        <Chip
                          label={grade}
                          color={
                            grade === 'A' ? 'success' :
                            grade === 'B' ? 'primary' :
                            grade === 'C' ? 'info' :
                            grade === 'D' ? 'warning' :
                            grade === 'E' ? 'secondary' :
                            grade === 'S' ? 'default' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{count}</TableCell>
                      <TableCell align="center">
                        {allSubjects.length
                          ? `${Math.round((count / allSubjects.length) * 100)}%`
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

      {/* Character Assessment */}
      {report.characterAssessment && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Character Assessment
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant="body1">
                <strong>Discipline:</strong> {report.characterAssessment.discipline || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body1">
                <strong>Attendance:</strong> {report.characterAssessment.attendance || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body1">
                <strong>Attitude:</strong> {report.characterAssessment.attitude || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body1">
                <strong>Participation:</strong> {report.characterAssessment.participation || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ mt: 2 }}>
                <strong>Comments:</strong>
              </Typography>
              <Typography variant="body2" paragraph sx={{ mt: 1, fontStyle: 'italic' }}>
                {report.characterAssessment.comments || 'No comments provided.'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* A-Level Division Guide */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          A-Level Division Guide
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" paragraph>
          A-LEVEL Division is calculated based on best 3 principal subjects:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" align="center">Division I</Typography>
                <Typography variant="body2" align="center">3-9 points</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" align="center">Division II</Typography>
                <Typography variant="body2" align="center">10-12 points</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" align="center">Division III</Typography>
                <Typography variant="body2" align="center">13-17 points</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" align="center">Division IV</Typography>
                <Typography variant="body2" align="center">18-19 points</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" align="center">Division 0</Typography>
                <Typography variant="body2" align="center">20+ points</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

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
export default withCircuitBreaker(ALevelComprehensiveReport, {
  maxRenders: 30,  // Allow more renders for initial load
  timeWindowMs: 2000  // Increase time window to 2 seconds
});
