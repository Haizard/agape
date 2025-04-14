import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CharacterAssessmentComments from './CharacterAssessmentComments';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Snackbar
} from '@mui/material';
import {
  Print as PrintIcon,
  Share as ShareIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import SubjectCombinationDisplay from '../common/SubjectCombinationDisplay';

// Import services
import { useALevelStudentReport } from '../../services/dataFetchingService';
import { generateALevelStudentResultPDF } from '../../utils/aLevelPdfGenerator';

// Import utilities
import { EducationLevels } from '../../utils/educationLevelUtils';
import { handleApiError, getUserFriendlyErrorMessage } from '../../utils/errorHandler';

// Import context
import { useResultContext } from '../../contexts/ResultContext';

// Import reusable components
import {
  ResultTable,
  GradeChip,
  DivisionChip,
  ReportSummary,
  StudentDetails,
  withErrorHandling,
  withEducationLevel
} from '../../components/common';
import ALevelReportSummary from './common/ALevelReportSummary';

/**
 * A-Level Student Result Report Component
 * Displays a student's A-Level result report with options to print, download, and share
 */
const ALevelStudentResultReport = () => {
  const { studentId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [gradeDistribution, setGradeDistribution] = useState({
    A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0
  });
  const [smsSending, setSmsSending] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);
  const [smsError, setSmsError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [updatingEducationLevel, setUpdatingEducationLevel] = useState(false);

  // Use the useCachedData hook for fetching with cache support
  const {
    data: reportData,
    loading: reportLoading,
    error: reportError,
    isFromCache,
    isMockData,
    refetch
  } = useCachedData({
    fetchFn: async () => {
      const reportUrl = resultApi.getALevelStudentReportUrl(studentId, examId);
      const response = await axios.get(reportUrl);
      return response.data;
    },
    resourceType: 'result',
    resourceId: `${studentId}_${examId}`,
    params: { educationLevel: EducationLevels.A_LEVEL },
    useMockOnError: true
  });

  // Process report data when it changes
  useEffect(() => {
    if (!reportData) return;

    // Validate education level
    const { isValid, error } = validateEducationLevel(
      reportData,
      EducationLevels.A_LEVEL,
      (err) => setError(err)
    );

    if (!isValid) return;

    // Set report data
    setReport(reportData);
    setLoading(reportLoading);

    // Calculate grade distribution
    const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 };
    for (const result of reportData.subjectResults || []) {
      if (distribution[result.grade] !== undefined) {
        distribution[result.grade]++;
      }
    }
      setGradeDistribution(distribution);

      // Log the report data for debugging
      console.log('A-Level report data:', data);
      console.log('Subject results:', data.subjectResults);
    } catch (err) {
      console.error('Error fetching report:', err);

      // Check if this is a 400 error with detailed information
      if (err.response && err.response.status === 400 && err.response.data) {
        const errorData = err.response.data;

        // If we have detailed error information, display it
        if (errorData.message) {
          let errorMessage = errorData.message;

          // Add education level information if available
          if (errorData.educationLevel) {
            errorMessage += ` (Current education level: ${errorData.educationLevel})`;
          }

          // Add suggestion if available
          if (errorData.suggestion) {
            errorMessage += `\n\n${errorData.suggestion}`;
          }

          setError(errorMessage);
        } else {
          setError('This student cannot be processed as an A-Level student. Please use the O-Level report component.');
        }
      } else {
        // Generic error
        setError(err.message || 'Failed to load report');
      }
    } finally {
      setLoading(false);
    }
  }, [studentId, examId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle download
  const handleDownload = () => {
    if (!report) {
      setSnackbar({ open: true, message: 'No report data available to download' });
      return;
    }

    try {
      // Generate the PDF
      const doc = generateALevelStudentResultPDF({ ...report, gradeDistribution });

      // Save the PDF
      const fileName = `${report.student?.fullName || 'Student'}_${report.exam?.name || 'Exam'}_A_Level_Report.pdf`;
      doc.save(fileName);

      setSnackbar({ open: true, message: 'Report downloaded successfully' });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setSnackbar({ open: true, message: 'Failed to download report' });
    }
  };

  // Handle SMS sending
  const handleSendSMS = async () => {
    if (!report) {
      setSnackbar({ open: true, message: 'No report data available to send' });
      return;
    }

    try {
      setSmsSending(true);
      setSmsError(null);
      setSmsSuccess(false);

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
      setSnackbar({ open: true, message: 'SMS sent successfully' });
    } catch (err) {
      console.error('Error sending SMS:', err);
      setSmsError(err.message || 'Failed to send SMS');
      setSnackbar({ open: true, message: err.message || 'Failed to send SMS' });
    } finally {
      setSmsSending(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Update student education level to A-Level
  const updateStudentToALevel = async () => {
    try {
      setUpdatingEducationLevel(true);

      // Call the API to update the student's education level
      const response = await axios.put(`/api/student-education-level/${studentId}/education-level`, {
        educationLevel: 'A_LEVEL'
      });

      // Show success message
      setSnackbar({
        open: true,
        message: 'Student education level updated to A-Level. Refreshing report...',
        severity: 'success'
      });

      // Refresh the report after a short delay
      setTimeout(() => {
        fetchReport();
      }, 1500);
    } catch (err) {
      console.error('Error updating student education level:', err);

      // Show error message
      setSnackbar({
        open: true,
        message: `Failed to update education level: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setUpdatingEducationLevel(false);
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
      <Alert
        severity="error"
        sx={{ m: 2 }}
        action={
          error.includes('not marked as an A-Level student') && (
            <Button
              color="inherit"
              size="small"
              onClick={updateStudentToALevel}
              disabled={updatingEducationLevel}
            >
              {updatingEducationLevel ? 'Updating...' : 'Update to A-Level'}
            </Button>
          )
        }
      >
        {error}
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

export default ALevelStudentResultReport;
