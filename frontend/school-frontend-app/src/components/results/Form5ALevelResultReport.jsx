import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Paper
} from '@mui/material';
import {
  Print as PrintIcon,
  Share as ShareIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import resultApi from '../../services/resultApi';
import SubjectCombinationDisplay from '../common/SubjectCombinationDisplay';
import CharacterAssessmentComments from './CharacterAssessmentComments';

// Import common components
import ALevelReportHeader from './common/ALevelReportHeader';
import StudentInfoSection from './common/StudentInfoSection';
import ExamInfoSection from './common/ExamInfoSection';
import SubjectResultsSection from './common/SubjectResultsSection';
import SummarySection from './common/SummarySection';
import DivisionGuideSection from './common/DivisionGuideSection';
import SignaturesSection from './common/SignaturesSection';
import ALevelReportSummary from './common/ALevelReportSummary';

/**
 * Form 5 A-Level Student Result Report Component
 * Displays a Form 5 student's A-Level result report with options to print, download, and share
 */
const Form5ALevelResultReport = () => {
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

  // Fetch report data
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the report data from the A-Level endpoint
      const reportUrl = resultApi.getALevelStudentReportUrl(studentId, examId);
      const response = await axios.get(reportUrl);
      const data = response.data;

      // Ensure this is an A-Level report
      if (!data.educationLevel || data.educationLevel !== 'A_LEVEL') {
        throw new Error('This is not an A-Level report. Please use the O-Level report component.');
      }

      // Ensure this is a Form 5 student - check multiple possible formats
      const studentForm = data.studentDetails?.form;
      const isForm5 =
        studentForm === 5 ||
        studentForm === '5' ||
        (typeof studentForm === 'string' &&
          (studentForm.includes('Form 5') ||
           studentForm.includes('Form V') ||
           studentForm.toLowerCase().includes('form 5') ||
           studentForm.toLowerCase().includes('form v')));

      if (!isForm5) {
        throw new Error('This is not a Form 5 student. Please use the Form 6 report component.');
      }

      setReport(data);

      // Calculate grade distribution
      const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 };
      data.subjectResults?.forEach(result => {
        if (distribution[result.grade] !== undefined) {
          distribution[result.grade]++;
        }
      });
      setGradeDistribution(distribution);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.message || 'Failed to load report');
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
  const handleDownload = async () => {
    if (!report) {
      setSnackbar({
        open: true,
        message: 'No report data available to download',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      const pdfBlob = await resultApi.generateALevelStudentResultPDF(studentId, examId);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Form5_A_Level_Result_${report.studentDetails?.name || 'Student'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setSnackbar({
        open: true,
        message: 'Failed to download PDF',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle share via SMS
  const handleShare = async () => {
    if (!report) {
      setSnackbar({
        open: true,
        message: 'No report data available to share',
        severity: 'error'
      });
      return;
    }

    try {
      setSmsSending(true);
      setSmsError(null);

      // Call the SMS API
      await resultApi.sendResultSMS(studentId, examId);

      setSmsSuccess(true);
      setSnackbar({
        open: true,
        message: 'Result shared via SMS successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error sharing via SMS:', err);
      setSmsError(err.message || 'Failed to share via SMS');
      setSnackbar({
        open: true,
        message: 'Failed to share via SMS',
        severity: 'error'
      });
    } finally {
      setSmsSending(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
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
      <ALevelReportHeader formLevel={5} academicYear={report.academicYear} />

      {/* A-Level Report Summary */}
      <ALevelReportSummary
        studentDetails={report.studentDetails}
        subjectResults={report.subjectResults || []}
        summary={report.summary || {}}
      />

      {/* Student and Exam Information */}
      <Box sx={{ mb: 3 }}>
        <Box container spacing={2} sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <StudentInfoSection studentDetails={report.studentDetails} summary={report.summary} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <ExamInfoSection
              examName={report.examName}
              examDate={report.examDate}
              term={report.exam?.term}
            />
          </Box>
        </Box>
      </Box>

      {/* Subject Combination */}
      {report.subjectCombination && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <SubjectCombinationDisplay
              combination={report.subjectCombination}
              showCompulsory={true}
              variant="full"
            />
          </Box>
        </Paper>
      )}

      {/* Subject Results */}
      <SubjectResultsSection subjectResults={report.subjectResults || []} />

      {/* Character Assessment */}
      {report.characterAssessment && (
        <CharacterAssessmentComments
          assessmentId={report.characterAssessment._id}
          initialComments={report.characterAssessment?.comments || ''}
          characterAssessment={report.characterAssessment}
        />
      )}

      {/* Summary */}
      <SummarySection
        summary={report.summary || {}}
        gradeDistribution={gradeDistribution}
      />

      {/* A-Level Division Guide */}
      <DivisionGuideSection />

      {/* Signatures */}
      <SignaturesSection />

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }} className="no-print">
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={loading}
        >
          Download PDF
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<ShareIcon />}
          onClick={handleShare}
          disabled={smsSending}
        >
          {smsSending ? 'Sending...' : 'Share via SMS'}
        </Button>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Form5ALevelResultReport;
