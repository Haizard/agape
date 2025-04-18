import React, { useEffect, useMemo, useCallback } from 'react';
import './ALevelResultReport.css';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import useALevelReport from '../../../hooks/useALevelReport';
import { generateALevelReportPdf } from '../../../utils/pdfGenerationUtils';
import withCircuitBreaker from '../../../hocs/withCircuitBreaker';

// Import sub-components
import HeaderSection from './HeaderSection';
import StudentInfoSection from './StudentInfoSection';
import SubjectResultsTable from './SubjectResultsTable';
import ReportSummary from './ReportSummary';
import CharacterAssessmentSection from './CharacterAssessmentSection';
import ActionButtons from './ActionButtons';

/**
 * ALevelResultReport Component
 *
 * Displays a comprehensive A-Level result report for a student.
 * Uses modular components and proper data management.
 */
const ALevelResultReport = ({ studentId, examId }) => {
  const params = useParams();
  const navigate = useNavigate();

  // Use the provided IDs or get them from URL params
  const resolvedStudentId = studentId || params.studentId;
  const resolvedExamId = examId || params.examId;

  // Fetch report data using the custom hook
  const {
    report,
    loading,
    error,
    isFromCache,
    refreshReport
  } = useALevelReport({
    studentId: resolvedStudentId,
    examId: resolvedExamId,
    autoFetch: true
  });

  // Prepare exam info for StudentInfoSection
  const examInfo = useMemo(() => {
    if (!report) return null;

    return {
      name: report.examName,
      date: report.examDate,
      term: 'Term 1', // This should come from the API
      academicYear: report.academicYear
    };
  }, [report]);

  // Handle PDF generation
  const handleGeneratePdf = useCallback(async () => {
    try {
      await generateALevelReportPdf(report);
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }, [report]);

  // Handle character assessment update
  const handleCharacterAssessmentUpdate = useCallback((updatedAssessment) => {
    // In a real implementation, this would update the report state
    console.log('Character assessment updated:', updatedAssessment);
  }, []);

  // If no student or exam ID is provided, show an error
  if (!resolvedStudentId || !resolvedExamId) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Student ID and Exam ID are required to view the report.
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/results/a-level/enter-marks')}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading A-Level Result Report...
        </Typography>
      </Container>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error.message || 'Failed to load the report. Please try again.'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
          onClick={() => refreshReport()}
        >
          Retry
        </Button>
      </Container>
    );
  }

  // Show empty state
  if (!report) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          No report data available for this student and exam.
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/results/a-level/enter-marks')}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Cache notification */}
      {isFromCache && (
        <Alert severity="info" sx={{ mb: 2 }} className="no-print">
          Showing cached report data.
          <Button
            size="small"
            onClick={() => refreshReport()}
            sx={{ ml: 2 }}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </Alert>
      )}

      {/* Main report container */}
      <Paper
        sx={{ p: 3 }}
        id="a-level-report-container"
        className="print-container"
      >
        {/* Header Section */}
        <HeaderSection
          reportTitle="A-LEVEL STUDENT RESULT REPORT"
          academicYear={report.academicYear}
        />

        {/* Student Info Section */}
        <StudentInfoSection
          studentDetails={report.studentDetails}
          examInfo={examInfo}
        />

        {/* Subject Results Table */}
        <SubjectResultsTable
          subjectResults={report.subjectResults || []}
        />

        {/* Report Summary */}
        <ReportSummary
          summary={report.summary}
        />

        {/* Character Assessment Section */}
        <CharacterAssessmentSection
          characterAssessment={report.characterAssessment}
          canEdit={false} // Set to true for authorized users
          onUpdate={handleCharacterAssessmentUpdate}
        />

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            This is an official report from Agape Lutheran Junior Seminary.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generated on {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </Paper>

      {/* Action Buttons */}
      <ActionButtons
        report={report}
        onGeneratePdf={handleGeneratePdf}
        backUrl="/results/a-level/enter-marks"
      />
    </Container>
  );
};

ALevelResultReport.propTypes = {
  studentId: PropTypes.string,
  examId: PropTypes.string
};

// Export the component with circuit breaker
export default withCircuitBreaker(ALevelResultReport, {
  maxRenders: 30,
  timeWindowMs: 2000,
  fallback: () => (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Alert severity="error">
        Too many renders detected. The report has been stopped to prevent browser freezing.
        Please refresh the page and try again.
      </Alert>
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => window.location.reload()}
      >
        Refresh Page
      </Button>
    </Container>
  )
});
