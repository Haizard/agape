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
  Tabs,
  Tab
} from '@mui/material';
import { Refresh as RefreshIcon, ArrowBack as ArrowBackIcon, ErrorOutline as ErrorOutlineIcon } from '@mui/icons-material';
import useALevelClassReport from '../../../hooks/useALevelClassReport';
import { generateALevelClassReportPdf } from '../../../utils/pdfGenerationUtils';
import withCircuitBreaker from '../../../hocs/withCircuitBreaker';
import './ALevelResultReport.css';

// Import enhanced components from common
import {
  AnimatedContainer,
  FadeIn,
  GradientButton,
  SectionContainer,
  SectionHeader
} from '../../common';

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
        <Box sx={{ p: 0, width: '100%' }}>
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
  }, [resolvedClassId, resolvedExamId, fetchReport]);

  // Add polling for real-time auto-refresh
  useEffect(() => {
    if (!resolvedClassId || !resolvedExamId) return;
    const interval = setInterval(() => {
      refreshReport();
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [resolvedClassId, resolvedExamId, refreshReport]);

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
      <AnimatedContainer animation="fadeIn" duration={0.5}>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <SectionContainer>
            <SectionHeader
              title="Missing Information"
              color="error"
              icon={<ErrorOutlineIcon />}
            />
            <FadeIn delay={0.2}>
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                Class ID and Exam ID are required to view the report.
              </Alert>
            </FadeIn>
            <FadeIn delay={0.3}>
              <GradientButton
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => navigate('/results/a-level/class-reports')}
                startIcon={<ArrowBackIcon />}
              >
                Go Back to Reports
              </GradientButton>
            </FadeIn>
          </SectionContainer>
        </Container>
      </AnimatedContainer>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <AnimatedContainer animation="fadeIn" duration={0.5}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <SectionContainer sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '50vh',
            justifyContent: 'center'
          }}>
            <FadeIn>
              <CircularProgress
                size={60}
                thickness={4}
                sx={{ mb: 3 }}
                color="primary"
              />
            </FadeIn>
            <FadeIn delay={0.2}>
              <Typography
                variant="h5"
                sx={{ mb: 1 }}
                className="gradient-text"
              >
                Loading A-Level Class Report
              </Typography>
            </FadeIn>
            <FadeIn delay={0.3}>
              <Typography variant="body1" color="text.secondary">
                Please wait while we generate the report...
              </Typography>
            </FadeIn>
          </SectionContainer>
        </Container>
      </AnimatedContainer>
    );
  }

  // Show error state
  if (error) {
    console.log('Error in ALevelClassReport:', error);
    return (
      <AnimatedContainer animation="fadeIn" duration={0.5}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <SectionContainer sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '30vh',
            justifyContent: 'center'
          }}>
            <FadeIn>
              <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            </FadeIn>
            <FadeIn delay={0.1}>
              <Typography
                variant="h5"
                sx={{ mb: 2 }}
                color="error"
                className="gradient-text"
              >
                Error Loading Report
              </Typography>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  width: '100%',
                  maxWidth: 600,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                {error.message || 'Failed to load the report. Please try again.'}
              </Alert>
            </FadeIn>
            <FadeIn delay={0.3}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <GradientButton
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={() => refreshReport()}
                >
                  Retry Loading
                </GradientButton>
                <GradientButton
                  variant="outlined"
                  color="secondary"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/results/a-level/class-reports')}
                >
                  Go Back
                </GradientButton>
              </Box>
            </FadeIn>
          </SectionContainer>
        </Container>
      </AnimatedContainer>
    );
  }

  // Show empty state
  if (!report) {
    console.log('No report data in ALevelClassReport');
    return (
      <AnimatedContainer animation="fadeIn" duration={0.5}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <SectionContainer sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '30vh',
            justifyContent: 'center'
          }}>
            <FadeIn>
              <Typography
                variant="h5"
                sx={{ mb: 2 }}
                className="gradient-text"
              >
                No Report Data Available
              </Typography>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Alert
                severity="warning"
                sx={{
                  mb: 3,
                  width: '100%',
                  maxWidth: 600,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                No report data available for this class and exam. Please check if marks have been entered.
              </Alert>
            </FadeIn>
            <FadeIn delay={0.3}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <GradientButton
                  variant="contained"
                  color="primary"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/results/a-level/class-reports')}
                >
                  Go Back to Reports
                </GradientButton>
                <GradientButton
                  variant="contained"
                  color="secondary"
                  startIcon={<RefreshIcon />}
                  onClick={() => refreshReport()}
                >
                  Retry Loading
                </GradientButton>
              </Box>
            </FadeIn>
          </SectionContainer>
        </Container>
      </AnimatedContainer>
    );
  }

  return (
    <AnimatedContainer animation="fadeIn" duration={0.5}>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 2 }}>
        {/* Cache notification */}
        {isFromCache && (
          <FadeIn>
            <Alert
              severity="info"
              sx={{
                mb: 2,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
              className="no-print"
            >
              Showing cached report data.
              <GradientButton
                size="small"
                onClick={() => refreshReport()}
                sx={{ ml: 2 }}
                startIcon={<RefreshIcon />}
              >
                Refresh
              </GradientButton>
            </Alert>
          </FadeIn>
        )}

        {/* Form level filter notification */}
        {formLevel && (
          <FadeIn delay={0.1}>
            <Alert
              severity="info"
              sx={{
                mb: 2,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
              className="no-print"
            >
              Showing results for Form {formLevel} students only.
            </Alert>
          </FadeIn>
        )}

      {/* Main report container */}
      <FadeIn delay={0.2}>
        <SectionContainer
          sx={{ p: 3, width: '100%', maxWidth: '100%' }}
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
        </SectionContainer>
      </FadeIn>

      {/* Action Buttons */}
      <FadeIn delay={0.3}>
        <ClassActionButtons
          report={report}
          onGeneratePdf={handleGeneratePdf}
          onFormLevelChange={handleFormLevelChange}
          currentFormLevel={formLevel}
          backUrl="/results/a-level/class-reports"
        />
      </FadeIn>
    </Container>
    </AnimatedContainer>
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
    <AnimatedContainer animation="fadeIn" duration={0.5}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <SectionContainer sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '30vh',
          justifyContent: 'center'
        }}>
          <FadeIn>
            <Typography
              variant="h5"
              sx={{ mb: 2 }}
              color="error"
              className="gradient-text"
            >
              Report Processing Error
            </Typography>
          </FadeIn>
          <FadeIn delay={0.2}>
            <Alert
              severity="error"
              sx={{
                mb: 3,
                width: '100%',
                maxWidth: 600,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              Too many renders detected. The report has been stopped to prevent browser freezing.
              Please refresh the page and try again.
            </Alert>
          </FadeIn>
          <FadeIn delay={0.3}>
            <GradientButton
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </GradientButton>
          </FadeIn>
        </SectionContainer>
      </Container>
    </AnimatedContainer>
  )
});
