import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import { Refresh as RefreshIcon, ArrowBack as ArrowBackIcon, ErrorOutline as ErrorOutlineIcon } from '@mui/icons-material';
import useALevelClassReport from '../../../hooks/useALevelClassReport';
import { generateALevelClassReportPdf } from '../../../utils/pdfGenerationUtils';
import withCircuitBreaker from '../../../hocs/withCircuitBreaker';
import './ALevelResultReport.css';

// Import sub-components
import ClassHeaderSection from './ClassHeaderSection';
import ClassInfoSection from './ClassInfoSection';
import ClassActionButtons from './ClassActionButtons';
import ClassSummary from './ClassSummary';

// Import enhanced components
import EnhancedClassHeaderSection from './EnhancedClassHeaderSection';
import EnhancedClassResultsTable from './EnhancedClassResultsTable';
import EnhancedOverallPerformanceSection from './EnhancedOverallPerformanceSection';
import EnhancedExamPerformanceSummary from './EnhancedExamPerformanceSummary';
import EnhancedSubjectPerformanceSummary from './EnhancedSubjectPerformanceSummary';
import './ALevelClassReportStyles.css';

/**
 * TabPanel Component
 *
 * Displays content for a tab panel.
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

/**
 * ALevelClassReport Component
 *
 * Displays a comprehensive A-Level class result report.
 * Uses modular components and proper data management.
 */
const ALevelClassReport = ({ classId, examId, formLevel: propFormLevel, forceRefresh = false }) => {
  const params = useParams();
  const navigate = useNavigate();

  // Use the provided IDs or get them from URL params
  const resolvedClassId = classId || params.classId;
  const resolvedExamId = examId || params.examId;

  // State for form level filter
  const [formLevel, setFormLevel] = useState(propFormLevel || params.formLevel || null);

  // State for active tab
  const [activeTab, setActiveTab] = useState(0);

  // Fetch report data using the custom hook
  const {
    report,
    loading,
    error,
    isFromCache,
    fetchReport,
    refreshReport
  } = useALevelClassReport({
    classId: resolvedClassId,
    examId: resolvedExamId,
    formLevel,
    autoFetch: true,
    initialForceRefresh: forceRefresh
  });

  // Handle form level change
  const handleFormLevelChange = useCallback((newFormLevel) => {
    setFormLevel(newFormLevel === '' ? null : newFormLevel);
  }, []);

  // Refetch report when form level changes
  useEffect(() => {
    if (resolvedClassId && resolvedExamId) {
      fetchReport(true);
    }
  }, [formLevel, resolvedClassId, resolvedExamId, fetchReport]);

  // Prepare exam info for ClassInfoSection
  const examInfo = useMemo(() => {
    if (!report) return null;

    return {
      name: report.examName,
      date: report.examDate,
      term: 'Term 1', // This should come from the API
      academicYear: report.academicYear
    };
  }, [report]);

  // Prepare class details for ClassInfoSection
  const classDetails = useMemo(() => {
    if (!report) return null;

    return {
      className: report.className,
      formLevel: report.formLevel,
      section: report.section,
      stream: report.stream,
      totalStudents: report.totalStudents,
      classAverage: report.classAverage
    };
  }, [report]);

  // Handle PDF generation
  const handleGeneratePdf = useCallback(async () => {
    try {
      await generateALevelClassReportPdf(report);
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }, [report]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // If no class or exam ID is provided, show an error
  if (!resolvedClassId || !resolvedExamId) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Class ID and Exam ID are required to view the report.
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/admin/a-level-class-reports')}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '50vh', justifyContent: 'center' }}>
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>
            Loading A-Level Class Report
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please wait while we generate the report...
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Show error state
  if (error) {
    console.log('Error in ALevelClassReport:', error);
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '30vh', justifyContent: 'center' }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }} color="error">
            Error Loading Report
          </Typography>
          <Alert severity="error" sx={{ mb: 3, width: '100%', maxWidth: 600 }}>
            {error.message || 'Failed to load the report. Please try again.'}
          </Alert>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => refreshReport()}
            >
              Retry Loading
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/admin/a-level-class-reports')}
            >
              Go Back
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Show empty state
  if (!report) {
    console.log('No report data in ALevelClassReport');
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          No report data available for this class and exam.
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/admin/a-level-class-reports')}
        >
          Go Back
        </Button>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mt: 2, ml: 2 }}
          onClick={() => refreshReport()}
        >
          Retry Loading
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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

      {/* Form level filter notification */}
      {formLevel && (
        <Alert severity="info" sx={{ mb: 2 }} className="no-print">
          Showing results for Form {formLevel} students only.
        </Alert>
      )}

      {/* Main report container */}
      <Paper
        sx={{ p: 3 }}
        id="a-level-class-report-container"
        className="report-container print-container"
      >
        {/* Enhanced Header Section */}
        <EnhancedClassHeaderSection
          reportTitle="A-LEVEL CLASS RESULT REPORT"
          academicYear={report.academicYear}
          className={report.className}
          formLevel={report.formLevel}
          examName={report.examName}
        />

        {/* Tabs for different sections */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className="no-print">
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="report tabs">
            <Tab label="Results" id="tab-0" aria-controls="tabpanel-0" />
            <Tab label="Statistics" id="tab-1" aria-controls="tabpanel-1" />
          </Tabs>
        </Box>

        {/* Results Tab */}
        <TabPanel value={activeTab} index={0}>
          {/* Class Info Section */}
          <ClassInfoSection
            classDetails={classDetails}
            examInfo={examInfo}
          />

          {/* Enhanced Class Results Table */}
          <EnhancedClassResultsTable
            students={report.students || []}
            subjectCombination={report.subjectCombination}
          />

          {/* Enhanced Overall Performance Section */}
          <EnhancedOverallPerformanceSection classReport={report} />

          {/* Enhanced Examination Performance Summary */}
          <EnhancedExamPerformanceSummary classReport={report} />

          {/* Enhanced Subject Performance Summary */}
          <EnhancedSubjectPerformanceSummary classReport={report} />
        </TabPanel>

        {/* Statistics Tab */}
        <TabPanel value={activeTab} index={1}>
          {/* Class Summary */}
          <ClassSummary
            classReport={report}
          />
        </TabPanel>

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
      <ClassActionButtons
        report={report}
        onGeneratePdf={handleGeneratePdf}
        onFormLevelChange={handleFormLevelChange}
        currentFormLevel={formLevel}
        backUrl="/admin/a-level-class-reports"
      />
    </Container>
  );
};

ALevelClassReport.propTypes = {
  classId: PropTypes.string,
  examId: PropTypes.string,
  formLevel: PropTypes.string,
  forceRefresh: PropTypes.bool
};

// Export the component with circuit breaker
export default withCircuitBreaker(ALevelClassReport, {
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
