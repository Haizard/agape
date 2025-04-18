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
  Snackbar,
  Grid
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
import { handleApiError, getUserFriendlyErrorMessage, getErrorRecoverySuggestion } from '../../utils/errorHandler';
import { validateALevelStudentResultData } from '../../utils/dataValidator';
import { normalizeSubjectResult } from '../../utils/aLevelDataUtils';

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

/**
 * A-Level Student Result Report Component (V2)
 * Displays a student's A-Level result report with options to print, download, and share
 * Uses the new reusable components and utilities
 */
const ALevelStudentResultReportComponent = ({ setError }) => {
  const { studentId, examId } = useParams();
  const navigate = useNavigate();
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

  // Use the ResultContext for shared state
  const { clearError } = useResultContext();

  // Use our custom hook for fetching A-Level student reports
  const {
    data: report,
    loading,
    error: fetchError,
    refetch
  } = useALevelStudentReport(studentId, examId);

  // Calculate grade distribution when report changes
  useEffect(() => {
    if (!report || !report.subjectResults) return;

    // Calculate grade distribution
    const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 };
    for (const result of report.subjectResults) {
      if (distribution[result.grade] !== undefined) {
        distribution[result.grade]++;
      }
    }
    setGradeDistribution(distribution);
  }, [report]);

  // Clear any errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Handle printing the report
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Handle downloading the report as PDF
  const handleDownload = useCallback(() => {
    if (!report) return;

    try {
      generateALevelStudentResultPDF(report, `${report.studentDetails?.name}_A_Level_Report.pdf`);

      setSnackbar({
        open: true,
        message: 'PDF downloaded successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error generating PDF:', err);

      setSnackbar({
        open: true,
        message: `Failed to generate PDF: ${err.message}`,
        severity: 'error'
      });
    }
  }, [report]);

  // Handle sending SMS to parent
  const handleSendSMS = useCallback(async () => {
    if (!report || !studentId || !examId) return;

    try {
      setSmsSending(true);
      setSmsError(null);
      setSmsSuccess(false);

      const response = await axios.post(`/api/a-level-results/send-sms/${studentId}/${examId}`);

      setSmsSuccess(true);
      setSnackbar({
        open: true,
        message: 'SMS sent successfully to parent',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error sending SMS:', err);

      setSmsError(getUserFriendlyErrorMessage(err));
      setSnackbar({
        open: true,
        message: `Failed to send SMS: ${getUserFriendlyErrorMessage(err)}`,
        severity: 'error'
      });
    } finally {
      setSmsSending(false);
    }
  }, [studentId, examId, report]);

  // Handle updating student to A-Level
  const updateStudentToALevel = useCallback(async () => {
    if (!studentId) return;

    try {
      setUpdatingEducationLevel(true);

      const response = await axios.patch(`/api/students/${studentId}`, {
        educationLevel: 'A_LEVEL'
      });

      setSnackbar({
        open: true,
        message: 'Student updated to A-Level successfully',
        severity: 'success'
      });

      // Refetch the report
      refetch();
    } catch (err) {
      console.error('Error updating student:', err);

      setSnackbar({
        open: true,
        message: `Failed to update student: ${getUserFriendlyErrorMessage(err)}`,
        severity: 'error'
      });
    } finally {
      setUpdatingEducationLevel(false);
    }
  }, [studentId, refetch]);

  // Handle snackbar close
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // If error, show error message
  if (fetchError) {
    const errorMessage = getUserFriendlyErrorMessage(fetchError);
    const recoverySuggestion = getErrorRecoverySuggestion(fetchError);

    return (
      <Alert
        severity="error"
        sx={{ m: 2 }}
        action={
          errorMessage.includes('education level') && (
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
        <Typography variant="body1" gutterBottom>
          {errorMessage}
        </Typography>
        {recoverySuggestion && (
          <Typography variant="body2">
            {recoverySuggestion}
          </Typography>
        )}
      </Alert>
    );
  }

  // If no report data, show warning
  if (!report) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        No report data available
      </Alert>
    );
  }

  // Validate report data
  const { isValid, errors } = validateALevelStudentResultData(report);
  if (!isValid) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        <Typography variant="body1" gutterBottom>
          The report data is incomplete or invalid
        </Typography>
        <Typography variant="body2">
          {errors.join(', ')}
        </Typography>
      </Alert>
    );
  }

  // Normalize and prepare data for the ResultTable component
  const normalizedResults = report.subjectResults.map(result => normalizeSubjectResult(result));
  const principalSubjects = normalizedResults.filter(result => result.isPrincipal);
  const subsidiarySubjects = normalizedResults.filter(result => !result.isPrincipal);

  // Define columns for the principal subjects table
  const principalColumns = [
    {
      id: 'subject',
      label: 'Subject',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body1">{row.subject}</Typography>
        </Box>
      )
    },
    {
      id: 'marks',
      label: 'Marks',
      align: 'center',
      render: (row) => row.marksObtained !== null ? row.marksObtained : '-'
    },
    {
      id: 'grade',
      label: 'Grade',
      align: 'center',
      render: (row) => <GradeChip grade={row.grade} educationLevel="A_LEVEL" />
    },
    {
      id: 'points',
      label: 'Points',
      align: 'center',
      render: (row) => row.points || 0
    },
    {
      id: 'remarks',
      label: 'Remarks',
      render: (row) => row.remarks || 'N/A'
    }
  ];

  return (
    <Box sx={{ p: 3 }} className="print-container">
      {/* Report Header */}
      <Box sx={{ mb: 3 }} className="print-header">
        {/* Header with school name */}
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant="h6" gutterBottom>
            Evangelical Lutheran Church in Tanzania - Northern Diocese
          </Typography>
          <Typography variant="h4" gutterBottom>
            St. John Vianney School Management System
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

      {/* Student and Exam Information */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <StudentDetails
            studentDetails={report.studentDetails}
            examDetails={{
              name: report.examName,
              academicYear: report.academicYear,
              examDate: report.examDate
            }}
            title="Student Information"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ReportSummary
            summary={report.summary}
            educationLevel="A_LEVEL"
            title="Performance Summary"
          />
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

      {/* Principal Subjects */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Principal Subjects
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>
        <ResultTable
          data={principalSubjects}
          columns={principalColumns}
          getRowKey={(row) => `principal-${row.subject}`}
          emptyMessage="No principal subjects found"
          tableProps={{ size: "small" }}
        />
      </Paper>

      {/* Subsidiary Subjects */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Subsidiary Subjects
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>
        <ResultTable
          data={subsidiarySubjects}
          columns={principalColumns} // Reuse the same columns
          getRowKey={(row) => `subsidiary-${row.subject}`}
          emptyMessage="No subsidiary subjects found"
          tableProps={{ size: "small" }}
        />
      </Paper>

      {/* Character Assessment */}
      {report.characterAssessment && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Character Assessment
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Box>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">
                  <strong>Punctuality:</strong> {report.characterAssessment.punctuality || 'Good'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">
                  <strong>Discipline:</strong> {report.characterAssessment.discipline || 'Good'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">
                  <strong>Respect:</strong> {report.characterAssessment.respect || 'Good'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">
                  <strong>Leadership:</strong> {report.characterAssessment.leadership || 'Good'}
                </Typography>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Comments:</strong> {report.characterAssessment.comments || 'No comments available'}
              </Typography>
            </Box>
          </Box>

          {/* Editable Comments Section */}
          {report.characterAssessment._id && (
            <Box sx={{ p: 2 }}>
              <CharacterAssessmentComments
                assessmentId={report.characterAssessment._id}
                initialComments={report.characterAssessment.comments || ''}
              />
            </Box>
          )}
        </Paper>
      )}

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

// Apply Higher-Order Components
const ALevelStudentResultReportWithEducationLevel = withEducationLevel(
  ALevelStudentResultReportComponent,
  {
    educationLevel: EducationLevels.A_LEVEL,
    redirectOnMismatch: true
  }
);

const ALevelStudentResultReport = withErrorHandling(
  ALevelStudentResultReportWithEducationLevel,
  {
    componentName: 'ALevelStudentResultReport',
    expectedEducationLevel: EducationLevels.A_LEVEL
  }
);

export default ALevelStudentResultReport;
