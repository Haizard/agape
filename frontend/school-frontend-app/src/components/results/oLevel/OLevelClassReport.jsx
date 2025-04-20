import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  ButtonGroup,
  Button,
  IconButton,
  Tooltip,
  Container,
  Link
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EditIcon from '@mui/icons-material/Edit';
import useOLevelClassReport from '../../../hooks/useOLevelClassReport';
import { generateClassResultPDF } from '../../../utils/pdfGenerator';

// Import enhanced components
import {
  AnimatedContainer,
  FadeIn,
  GradientButton,
  SectionContainer,
  SectionHeader,
  StyledTableContainer,
  StyledTableHead,
  StyledTableRow,
  StyledChip,
  StyledCard
} from '../../common';

/**
 * O-Level Class Report Component
 *
 * Displays a comprehensive class report for O-Level classes with student results,
 * statistics, and performance metrics.
 */
const OLevelClassReport = (props) => {
  // Get parameters from props or URL
  const paramsFromUrl = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const urlForceRefresh = queryParams.get('forceRefresh') === 'true';

  // Use props if provided, otherwise use URL parameters
  const classId = props.classId || paramsFromUrl.classId;
  const examId = props.examId || paramsFromUrl.examId;
  const formLevel = props.formLevel || paramsFromUrl.formLevel;
  const forceRefresh = props.forceRefresh || urlForceRefresh;

  console.log('OLevelClassReport initialized with:', {
    classId,
    examId,
    formLevel,
    forceRefresh,
    propsProvided: !!props.classId,
    urlParamsProvided: !!paramsFromUrl.classId
  });

  // State for active tab
  const [activeTab, setActiveTab] = useState(0);

  // Fetch report data using custom hook
  const {
    report,
    loading,
    error,
    isFromCache,
    refreshReport
  } = useOLevelClassReport({
    classId,
    examId,
    autoFetch: true,
    initialForceRefresh: forceRefresh
  });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle PDF generation
  const handleGeneratePDF = async () => {
    if (!report) return;

    try {
      const doc = generateClassResultPDF(report);
      doc.save(`O-Level-Class-Report-${report.className}-${report.examName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refreshReport();
  };

  // Handle download PDF (alias for handleGeneratePDF)
  const handleDownloadPDF = () => {
    handleGeneratePDF();
  };

  // Navigate back to selector
  const handleBack = () => {
    navigate('/results/o-level/class-reports');
  };

  // If loading, show loading indicator
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
                color="success"
              />
            </FadeIn>
            <FadeIn delay={0.2}>
              <Typography
                variant="h5"
                sx={{ mb: 1 }}
                className="gradient-text"
              >
                Loading O-Level Class Report
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

  // If error, show error message
  if (error) {
    // Check if the error is related to no students found with force refresh
    const isNoStudentsError = error.message && (
      error.message.includes('No students found') ||
      error.message.includes('No real data found') ||
      error.message.includes('No data found') ||
      error.message.includes('No marks have been entered') ||
      error.message.includes('Frontend build not found')
    );

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
              <ErrorOutlineIcon color={isNoStudentsError ? "warning" : "error"} sx={{ fontSize: 60, mb: 2 }} />
            </FadeIn>
            <FadeIn delay={0.1}>
              <Typography
                variant="h5"
                sx={{ mb: 2 }}
                color={isNoStudentsError ? "warning" : "error"}
                className="gradient-text"
              >
                {isNoStudentsError ? "No Data Available" : "Error Loading Report"}
              </Typography>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Alert
                severity={isNoStudentsError ? "warning" : "error"}
                sx={{
                  mb: 3,
                  width: '100%',
                  maxWidth: 600,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                {isNoStudentsError ? (
                  <>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      No student data is available for this class and exam.
                    </Typography>
                    <Typography variant="body2">
                      This could be because:
                      <ul>
                        <li>No marks have been entered for this class and exam yet</li>
                        <li>You selected "Force real data" which prevents showing sample data</li>
                      </ul>
                    </Typography>
                  </>
                ) : (
                  <>Error loading report: {error.message || 'Unknown error'}</>
                )}
              </Alert>
            </FadeIn>
            <FadeIn delay={0.3}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <GradientButton
                  variant="contained"
                  color="success"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBack}
                >
                  Back to Report Selector
                </GradientButton>
                {isNoStudentsError && (
                  <GradientButton
                    variant="outlined"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={() => navigate('/results/o-level/bulk-marks-entry')}
                  >
                    Enter Marks
                  </GradientButton>
                )}
              </Box>
            </FadeIn>
          </SectionContainer>
        </Container>
      </AnimatedContainer>
    );
  }

  // If no report data, create an empty report structure to avoid rendering errors
  if (!report) {
    console.warn('No report data available in OLevelClassReport component, creating empty report structure');

    // Log additional debugging information
    console.log('OLevelClassReport state:', {
      loading,
      error: error ? { message: error.message, name: error.name } : null,
      isFromCache,
      hasReport: !!report,
      classId,
      examId
    });

    // Create a minimal empty report structure
    report = {
      classId,
      examId,
      className: 'Unknown Class',
      examName: 'Unknown Exam',
      academicYear: 'Unknown Academic Year',
      students: [],
      totalStudents: 0,
      classAverage: '0.00',
      divisionDistribution: { 'I': 0, 'II': 0, 'III': 0, 'IV': 0 },
      educationLevel: 'O_LEVEL',
      warning: 'No data available. This could be because no marks have been entered for this class and exam.',
      isEmpty: true // Flag to indicate this is an empty report
    };

    console.log('Created empty report structure:', report);
  }

  // If report has a warning, show it
  const hasWarning = report.warning || (report.students && report.students.length === 0);
  const warningMessage = report.warning || 'No student data available for this class and exam. Showing sample data.';

  // Check if we have partial data (some students have marks, some don't)
  const hasIncompleteStudentData = report.students && report.students.some(student =>
    student.results && student.results.some(result => result.marks && result.marks > 0) &&
    student.results && student.results.some(result => !result.marks || result.marks === 0)
  );

  // Add a warning for partial data
  if (hasIncompleteStudentData && !hasWarning) {
    report.warning = 'Some students have marks for some subjects but not all. The report shows real data where available.';
  }

  // Check if the report is using mock data
  const isMockData = report.mock === true || (report.warning && (
    report.warning.includes('sample data') ||
    report.warning.includes('mock data') ||
    report.warning.includes('fallback')
  ));

  // Explicitly override isMockData if mock is false
  if (report.mock === false) {
    console.log('Report explicitly marked as NOT mock data');
  }

  // Check if we have real data but it's empty or partial
  const hasRealData = report.students && report.students.length > 0;
  const hasPartialData = report.warning && (
    report.warning.includes('real-time data') ||
    report.warning.includes('marks are entered') ||
    report.warning.includes('partial data')
  );

  // Check if any students have results
  const studentsWithResults = report.students ? report.students.filter(student => student.hasResults) : [];
  const hasAnyStudentWithResults = studentsWithResults.length > 0;
  console.log(`Students with results: ${studentsWithResults.length} out of ${report.students?.length || 0}`);

  // Check if the report is completely empty
  const isEmpty = report.isEmpty === true || (!hasRealData && !isMockData) || (hasRealData && !hasAnyStudentWithResults);

  // Determine if we should show the empty state message
  const showEmptyState = isEmpty;

  // Add visual indicator for data state
  console.log('Report data state:', {
    hasRealData,
    hasPartialData,
    isMockData,
    isEmpty,
    showEmptyState,
    hasIncompleteStudentData,
    hasWarning,
    studentCount: report.students?.length || 0
  });


  // Get subjects from the report
  let allSubjects = [];

  // Log the full report structure for debugging
  console.log('Report structure:', {
    hasSubjects: !!report.subjects,
    subjectCount: report.subjects?.length || 0,
    hasStudents: !!report.students,
    studentCount: report.students?.length || 0,
    reportKeys: Object.keys(report)
  });

  // First try to use subjects from the report object (preferred)
  if (report.subjects && report.subjects.length > 0) {
    console.log('Using subjects directly from report object:', report.subjects);
    allSubjects = report.subjects.map(subject => ({
      name: subject.name,
      code: subject.code,
      isPrincipal: subject.isPrincipal || false,
      id: subject.id
    }));
    console.log(`Mapped ${allSubjects.length} subjects from report.subjects`);
  }
  // Fallback: extract subjects from student results
  else if (report.students && report.students.length > 0) {
    console.log('Extracting subjects from student results as fallback');
    const subjectSet = new Set();
    report.students.forEach(student => {
      if (student.results) {
        student.results.forEach(result => {
          if (!subjectSet.has(result.code)) {
            subjectSet.add(result.code);
            allSubjects.push({
              name: result.subject,
              code: result.code,
              isPrincipal: result.isPrincipal || false
            });
          }
        });
      }
    });
    console.log(`Extracted ${allSubjects.length} subjects from student results`);
  }

  // Sort subjects by name for consistent display
  allSubjects.sort((a, b) => a.name.localeCompare(b.name));

  console.log('All subjects for report:', allSubjects.map(s => `${s.name} (${s.code})`));

  return (
    <AnimatedContainer animation="fadeIn" duration={0.5}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, pb: 8 }}>
        {/* Non-printable controls */}
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            p: 2,
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.02)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
          className="no-print"
        >
          <GradientButton
            variant="outlined"
            color="success"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Reports
          </GradientButton>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <GradientButton
              variant="contained"
              color="success"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print
            </GradientButton>

            <GradientButton
              variant="contained"
              color="secondary"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleGeneratePDF}
            >
              PDF
            </GradientButton>

            <GradientButton
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={refreshReport}
            >
              Refresh
            </GradientButton>
          </Box>
        </Box>

        {/* Cache indicator */}
        {isFromCache && (
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
              This report is loaded from cache. Click refresh to get the latest data.
            </Alert>
          </FadeIn>
        )}

        {/* Warning indicator */}
        {hasWarning && (
          <FadeIn delay={0.2}>
            <Alert
              severity={isMockData ? "warning" : "info"}
              sx={{
                mb: 2,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                backgroundColor: isMockData ? undefined : '#e8f5e9'
              }}
              className="no-print"
            >
              <AlertTitle>{isMockData ? "Warning" : "Information"}</AlertTitle>
              {warningMessage}
              {isMockData && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    To see real data, please enter marks for this class and exam using the
                    <Link
                      component={RouterLink}
                      to="/results/o-level/bulk-marks-entry"
                      sx={{ mx: 1 }}
                    >
                      O-Level Bulk Marks Entry
                    </Link>
                    page.
                  </Typography>
                </Box>
              )}
              {!isMockData && report.warning && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    This report is showing real-time data from the database. It will automatically update as more marks are entered.
                  </Typography>
                </Box>
              )}
            </Alert>
          </FadeIn>
        )}

        {/* Mock data indicator */}
        {isMockData && (
          <FadeIn delay={0.3}>
            <Box
              sx={{
                mb: 2,
                p: 2,
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
                border: '1px dashed #dee2e6'
              }}
              className="no-print"
            >
              <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
                Sample Data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You are viewing sample data because no real marks have been entered for this class and exam.
                The report will automatically update with real data once marks are entered.
              </Typography>
              <Button
                component={RouterLink}
                to="/results/o-level/bulk-marks-entry"
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
                startIcon={<EditIcon />}
              >
                Enter Marks
              </Button>
            </Box>
          </FadeIn>
        )}

        {/* Report content */}
        <FadeIn delay={0.3}>
          <SectionContainer elevation={3} sx={{ p: 3, overflow: 'hidden' }} ref={reportRef}>
            {/* Report header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography
                variant="h4"
                gutterBottom
                className="gradient-text"
                color="success"
                sx={{ fontWeight: 'bold' }}
              >
                SCHOOL NAME
              </Typography>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 'bold',
                  letterSpacing: '1px'
                }}
              >
                O-LEVEL CLASS RESULT REPORT
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Academic Year: {report.academicYear || 'N/A'}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                <StyledChip label={`Class: ${report.className}`} color="success" />
                <StyledChip label={`Exam: ${report.examName}`} color="secondary" />
                <StyledChip label={`Total Students: ${report.totalStudents || 0}`} color="primary" />
                <StyledChip label={`Class Average: ${report.classAverage || '0.00'}`} color="info" />
                {report.mock === true && (
                  <StyledChip label="SAMPLE DATA" color="error" />
                )}
                {report.mock !== true && report.warning && (
                  <StyledChip label="REAL-TIME DATA" color="success" />
                )}
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Tabs for different views */}
            <Box
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTabs-indicator': {
                  backgroundColor: '#4caf50',
                  height: '3px',
                  borderRadius: '3px 3px 0 0'
                },
                '& .MuiTab-root': {
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: '#4caf50',
                    opacity: 0.8
                  },
                  '&.Mui-selected': {
                    color: '#4caf50'
                  }
                }
              }}
              className="no-print"
            >
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="report tabs">
                <Tab label="Results" id="tab-0" />
                <Tab label="Statistics" id="tab-1" />
              </Tabs>
            </Box>

            {/* Results Tab */}
            <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-0" sx={{ mt: 2 }}>
              {/* Empty state indicator */}
              {isEmpty && (
                <Alert
                  severity="info"
                  sx={{
                    mb: 3,
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    backgroundColor: '#e8f5e9'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    No Marks Available
                  </Typography>
                  <Typography variant="body1">
                    {report.students && report.students.length > 0 ? (
                      <>Students are assigned to this class, but no marks have been entered yet. The report will update automatically as marks are entered.</>
                    ) : (
                      <>No student data is available for this class and exam. This could be because no marks have been entered yet.</>
                    )}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      This is showing real-time data from the database. The report will automatically update as marks are entered.
                    </Typography>
                  </Box>
                  <Button
                    component={RouterLink}
                    to="/results/o-level/bulk-marks-entry"
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                    startIcon={<EditIcon />}
                  >
                    Enter Marks
                  </Button>
                </Alert>
              )}

              {/* Partial data indicator */}
              {hasPartialData && !isEmpty && (
                <Alert
                  severity="warning"
                  sx={{
                    mb: 3,
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Partial Data Available
                  </Typography>
                  <Typography variant="body1">
                    Some data is missing or incomplete. The report shows real data where available.
                  </Typography>
                </Alert>
              )}

              {/* Mock data indicator */}
              {isMockData && !isEmpty && (
                <Alert
                  severity="info"
                  sx={{
                    mb: 3,
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    backgroundColor: '#e3f2fd'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Sample Data
                  </Typography>
                  <Typography variant="body1">
                    You are viewing sample data because no real marks have been entered for this class and exam.
                    The report will automatically update with real data once marks are entered.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/results/o-level/bulk-marks-entry"
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                    startIcon={<EditIcon />}
                  >
                    Enter Marks
                  </Button>
                </Alert>
              )}

              {report.students && report.students.length > 0 ? (
                <>
                  <StyledTableContainer variant="outlined" sx={{ mt: 2 }}>
                    <Table size="small" aria-label="o-level class results table">
                      <StyledTableHead>
                        <StyledTableRow>
                          <TableCell sx={{ fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.85rem' }}>No.</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.85rem' }}>Student Name (3 NAMES)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.85rem' }}>SEX</TableCell>
                          {allSubjects.map(subject => {
                            // Truncate long subject names
                            const displayName = subject.name || subject.code;
                            const truncatedName = displayName.length > 12 ?
                              `${displayName.substring(0, 10)}...` : displayName;

                            return (
                              <TableCell
                                key={subject.code}
                                align="center"
                                sx={{
                                  fontWeight: 'bold',
                                  borderRight: '1px solid rgba(224, 224, 224, 1)',
                                  borderLeft: '1px solid rgba(224, 224, 224, 1)',
                                  position: 'relative',
                                  fontSize: '0.75rem',
                                  padding: '6px 4px',
                                  '&:hover::after': {
                                    content: displayName.length > 12 ? `"${displayName}"` : '""',
                                    display: displayName.length > 12 ? 'block' : 'none',
                                    position: 'absolute',
                                    backgroundColor: 'rgba(97, 97, 97, 0.9)',
                                    color: '#fff',
                                    padding: '5px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    zIndex: 1000,
                                    top: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    whiteSpace: 'nowrap'
                                  }
                                }}
                              >
                                {truncatedName}
                              </TableCell>
                            );
                          })}
                          <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)', borderLeft: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.85rem' }}>Total</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.85rem' }}>Average</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.85rem' }}>Division</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.85rem' }}>POINTS</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Rank</TableCell>
                        </StyledTableRow>
                      </StyledTableHead>
                      <TableBody>
                        {report.students.map((student, index) => {
                          // Create a map of subject code to result for this student
                          const studentResults = {};
                          student.results.forEach(result => {
                            studentResults[result.code] = result;
                          });

                          // Check if this student has any valid results
                          const hasValidResults = student.hasResults === true ||
                            (student.results && student.results.some(r => r.marks > 0 && r.grade !== 'N/A'));

                          console.log(`Rendering student ${student.name}: hasValidResults=${hasValidResults}`);

                          return (
                            <StyledTableRow
                              key={student.id}
                              hover
                              sx={{
                                '&:nth-of-type(odd)': {
                                  backgroundColor: 'rgba(76, 175, 80, 0.04)',
                                },
                                '&:hover': {
                                  backgroundColor: 'rgba(76, 175, 80, 0.08)',
                                },
                                // Highlight students with no results
                                ...(hasValidResults ? {} : {
                                  backgroundColor: 'rgba(255, 235, 235, 0.5)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 235, 235, 0.7)',
                                  }
                                })
                              }}
                            >
                              <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.8rem', padding: '6px 8px' }}>{index + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.8rem', padding: '6px 8px' }}>
                                {student.name}
                                {!hasValidResults && (
                                  <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                                    (No marks entered)
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.8rem', padding: '6px 8px' }}>{student.gender || student.sex || '-'}</TableCell>
                              {allSubjects.map(subject => {
                                const result = studentResults[subject.code];
                                const hasValidResult = result && result.marks > 0 && result.grade !== 'N/A';

                                return (
                                  <TableCell
                                    key={subject.code}
                                    align="center"
                                    sx={{
                                      borderRight: '1px solid rgba(224, 224, 224, 1)',
                                      borderLeft: '1px solid rgba(224, 224, 224, 1)',
                                      fontSize: '0.75rem',
                                      padding: '4px 2px'
                                    }}
                                  >
                                    {hasValidResult ? (
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>{result.marks}</Typography>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: result.grade === 'F' ? '#f44336' :
                                                   result.grade === 'A' ? '#4caf50' :
                                                   result.grade === 'B' ? '#2196f3' :
                                                   result.grade === 'C' ? '#ff9800' :
                                                   result.grade === 'D' ? '#ff5722' :
                                                   'text.secondary',
                                            fontWeight: 'bold',
                                            fontSize: '0.7rem'
                                          }}
                                        >
                                          {result.grade}
                                        </Typography>
                                      </Box>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">-</Typography>
                                    )}
                                  </TableCell>
                                );
                              })}
                              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)', borderLeft: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.8rem', padding: '6px 4px' }}>
                                {hasValidResults ? student.totalMarks : '-'}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.8rem', padding: '6px 4px' }}>
                                {hasValidResults ? student.averageMarks : '-'}
                              </TableCell>
                              <TableCell align="center" sx={{
                                fontWeight: 'bold',
                                borderRight: '1px solid rgba(224, 224, 224, 1)',
                                fontSize: '0.8rem',
                                padding: '6px 4px',
                                color: student.division === 'I' ? '#4caf50' :
                                       student.division === 'II' ? '#2196f3' :
                                       student.division === 'III' ? '#ff9800' :
                                       student.division === 'IV' ? '#f44336' :
                                       'text.primary'
                              }}>
                                {hasValidResults ? student.division : '-'}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.8rem', padding: '6px 4px' }}>
                                {hasValidResults ? (student.bestSevenPoints || student.totalPoints || student.points || '-') : '-'}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.8rem', padding: '6px 4px' }}>
                                {hasValidResults ? student.rank : '-'}
                              </TableCell>
                            </StyledTableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </StyledTableContainer>

                  {/* Result Summary Card */}
                  <StyledCard variant="outlined" sx={{ mt: 3 }}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 'bold',
                          color: '#4caf50',
                          display: 'flex',
                          alignItems: 'center',
                          '&::before': {
                            content: '""',
                            display: 'inline-block',
                            width: '4px',
                            height: '24px',
                            backgroundColor: '#4caf50',
                            marginRight: '8px',
                            borderRadius: '4px'
                          }
                        }}
                      >
                        RESULT SUMMARY
                      </Typography>
                      <StyledTableContainer>
                        <Table size="small">
                          <StyledTableHead>
                            <StyledTableRow>
                              <TableCell>SUBJECT NAME</TableCell>
                              <TableCell align="center">NO OF STUDENTS</TableCell>
                              <TableCell colSpan={6} align="center">PERFORMANCE</TableCell>
                              <TableCell align="center">GPA</TableCell>
                            </StyledTableRow>
                            <StyledTableRow>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell align="center">A</TableCell>
                              <TableCell align="center">B</TableCell>
                              <TableCell align="center">C</TableCell>
                              <TableCell align="center">D</TableCell>
                              <TableCell align="center">F</TableCell>
                              <TableCell></TableCell>
                            </StyledTableRow>
                          </StyledTableHead>
                          <TableBody>
                            {allSubjects.map(subject => {
                              // Calculate grade distribution for this subject
                              const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
                              let totalPoints = 0;
                              let studentCount = 0;

                              // Process each student's result for this subject
                              report.students.forEach(student => {
                                const result = student.results.find(r => r.code === subject.code);
                                if (result && result.grade) {
                                  gradeDistribution[result.grade] = (gradeDistribution[result.grade] || 0) + 1;
                                  totalPoints += result.points || 0;
                                  studentCount++;
                                }
                              });

                              // Calculate GPA (1-5 scale, A=1, F=5)
                              const gpa = studentCount > 0 ?
                                ((gradeDistribution.A * 1 + gradeDistribution.B * 2 + gradeDistribution.C * 3 +
                                  gradeDistribution.D * 4 + gradeDistribution.F * 5) / studentCount).toFixed(2) :
                                '-';

                              return (
                                <StyledTableRow key={subject.code}>
                                  <TableCell sx={{ fontWeight: 'bold' }}>{subject.name}</TableCell>
                                  <TableCell align="center">{studentCount}</TableCell>
                                  <TableCell align="center" sx={{ color: '#4caf50', fontWeight: 'bold' }}>{gradeDistribution.A || 0}</TableCell>
                                  <TableCell align="center" sx={{ color: '#2196f3', fontWeight: 'bold' }}>{gradeDistribution.B || 0}</TableCell>
                                  <TableCell align="center" sx={{ color: '#ff9800', fontWeight: 'bold' }}>{gradeDistribution.C || 0}</TableCell>
                                  <TableCell align="center" sx={{ color: '#ff5722', fontWeight: 'bold' }}>{gradeDistribution.D || 0}</TableCell>
                                  <TableCell align="center" sx={{ color: '#f44336', fontWeight: 'bold' }}>{gradeDistribution.F || 0}</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{gpa}</TableCell>
                                </StyledTableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </StyledTableContainer>
                    </CardContent>
                  </StyledCard>

                  {/* Approval Section */}
                  <StyledCard variant="outlined" sx={{ mt: 3, mb: 3 }}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 'bold',
                          textAlign: 'center',
                          borderBottom: '1px solid #e0e0e0',
                          pb: 1
                        }}
                      >
                        APPROVED BY
                      </Typography>
                      <Box sx={{ mt: 3 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
                              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>1. ACADEMIC TEACHER NAME:</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                <Typography variant="body2" sx={{ mr: 2 }}>SIGN:</Typography>
                                <Box sx={{ borderBottom: '1px solid #000', width: '200px', height: '24px' }} />
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
                              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>2. HEAD OF SCHOOL:</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                <Typography variant="body2" sx={{ mr: 2 }}>SIGN:</Typography>
                                <Box sx={{ borderBottom: '1px solid #000', width: '200px', height: '24px' }} />
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </>
              ) : (
                <Alert
                  severity="info"
                  sx={{
                    mt: 2,
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  No student results available for this class and exam.
                </Alert>
              )}
            </Box>

            {/* Statistics Tab */}
            <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-1" sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Division Distribution */}
                <Grid item xs={12} md={6}>
                  <StyledCard variant="outlined">
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 'bold',
                          color: '#4caf50',
                          display: 'flex',
                          alignItems: 'center',
                          '&::before': {
                            content: '""',
                            display: 'inline-block',
                            width: '4px',
                            height: '24px',
                            backgroundColor: '#4caf50',
                            marginRight: '8px',
                            borderRadius: '4px'
                          }
                        }}
                      >
                        Division Distribution
                      </Typography>
                      <StyledTableContainer>
                        <Table size="small">
                          <StyledTableHead>
                            <StyledTableRow>
                              <TableCell>Division</TableCell>
                              <TableCell align="center">Count</TableCell>
                              <TableCell align="center">Percentage</TableCell>
                            </StyledTableRow>
                          </StyledTableHead>
                          <TableBody>
                            {report.divisionDistribution && Object.entries(report.divisionDistribution).map(([division, count]) => (
                              <StyledTableRow key={division}>
                                <TableCell sx={{
                                  fontWeight: 'bold',
                                  color: division === 'I' ? '#4caf50' :
                                         division === 'II' ? '#2196f3' :
                                         division === 'III' ? '#ff9800' :
                                         division === 'IV' ? '#f44336' :
                                         'text.primary'
                                }}>
                                  Division {division}
                                </TableCell>
                                <TableCell align="center">{count}</TableCell>
                                <TableCell align="center">
                                  {report.totalStudents ? ((count / report.totalStudents) * 100).toFixed(1) + '%' : '0%'}
                                </TableCell>
                              </StyledTableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </StyledTableContainer>
                    </CardContent>
                  </StyledCard>
                </Grid>

                {/* Subject Performance */}
                <Grid item xs={12} md={6}>
                  <StyledCard variant="outlined">
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 'bold',
                          color: '#4caf50',
                          display: 'flex',
                          alignItems: 'center',
                          '&::before': {
                            content: '""',
                            display: 'inline-block',
                            width: '4px',
                            height: '24px',
                            backgroundColor: '#4caf50',
                            marginRight: '8px',
                            borderRadius: '4px'
                          }
                        }}
                      >
                        Subject Performance
                      </Typography>
                      <StyledTableContainer>
                        <Table size="small">
                          <StyledTableHead>
                            <StyledTableRow>
                              <TableCell>Subject</TableCell>
                              <TableCell align="center">Average</TableCell>
                              <TableCell align="center">Highest</TableCell>
                              <TableCell align="center">Lowest</TableCell>
                            </StyledTableRow>
                          </StyledTableHead>
                          <TableBody>
                            {allSubjects.map(subject => {
                              // Calculate statistics for this subject
                              let total = 0;
                              let count = 0;
                              let highest = 0;
                              let lowest = 100;

                              report.students.forEach(student => {
                                const result = student.results.find(r => r.code === subject.code);
                                if (result && result.marks !== undefined) {
                                  total += result.marks;
                                  count++;
                                  highest = Math.max(highest, result.marks);
                                  lowest = Math.min(lowest, result.marks);
                                }
                              });

                              const average = count > 0 ? (total / count).toFixed(1) : 'N/A';
                              const avgColor = average !== 'N/A' ?
                                (parseFloat(average) >= 70 ? '#4caf50' :
                                 parseFloat(average) >= 60 ? '#8bc34a' :
                                 parseFloat(average) >= 50 ? '#cddc39' :
                                 parseFloat(average) >= 40 ? '#ffeb3b' :
                                 parseFloat(average) >= 30 ? '#ffc107' :
                                 '#f44336') : 'inherit';

                              return (
                                <StyledTableRow key={subject.code}>
                                  <TableCell sx={{ fontWeight: 'bold' }}>{subject.name}</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 'bold', color: avgColor }}>{average}</TableCell>
                                  <TableCell align="center" sx={{ color: '#4caf50', fontWeight: 'bold' }}>{highest > 0 ? highest : 'N/A'}</TableCell>
                                  <TableCell align="center" sx={{ color: lowest < 40 ? '#f44336' : 'inherit', fontWeight: 'bold' }}>{lowest < 100 ? lowest : 'N/A'}</TableCell>
                                </StyledTableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </StyledTableContainer>
                    </CardContent>
                  </StyledCard>
                </Grid>
              </Grid>
            </Box>
          </SectionContainer>
        </FadeIn>
      </Box>
    </AnimatedContainer>
  );
};

export default OLevelClassReport;
