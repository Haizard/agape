import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { formatOLevelStudentName, debugStudentData } from '../../../utils/o-level-student-utils';
import {
  Container,
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
  Avatar
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { generateOLevelStudentResultPDF } from '../../../utils/oLevelPdfGenerator';
import useOLevelReport from '../../../hooks/useOLevelReport';
import '../aLevel/ALevelResultReport.css'; // Base CSS
import './OLevelReportPrint.css'; // Custom print styles for O-Level reports

/**
 * Enhanced O-Level Student Result Report Component
 *
 * Displays a comprehensive, visually appealing O-Level result report for a student
 * with improved layout, typography, and visual elements.
 */
const EnhancedStudentResultReport = () => {
  const { studentId, examId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch report data using the custom hook
  const {
    report,
    loading,
    error,
    isFromCache,
    refreshReport
  } = useOLevelReport({
    studentId,
    examId,
    autoFetch: true,
    refreshKey
  });

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    refreshReport();
    setRefreshKey(prev => prev + 1);
  }, [refreshReport]);

  // Handle PDF generation
  const handleGeneratePdf = useCallback(() => {
    if (!report) return;

    try {
      // Generate the PDF document
      const doc = generateOLevelStudentResultPDF(report);

      // Extract student name from report for filename
      const rawStudentDetails = report.studentDetails || report.student || {};
      const studentName = formatOLevelStudentName(report)?.replace(/\s+/g, '_') || 'student';

      // Extract exam name from report for filename
      const examName = (report.examName || report.exam?.name || 'exam')?.replace(/\s+/g, '_');

      // Create filename
      const filename = `${studentName}_${examName}_report.pdf`;

      // Save the PDF
      doc.save(filename);

      console.log(`PDF saved as ${filename}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    }
  }, [report]);

  // Handle print function
  const handlePrint = useCallback(() => {
    // Add a class to the body to trigger print-specific styles
    document.body.classList.add('printing-o-level-report');

    // Make sure the print container is visible
    const printContainer = document.getElementById('o-level-report-container');
    if (printContainer) {
      printContainer.style.display = 'block';
      printContainer.style.visibility = 'visible';
    }

    // Print the document
    window.print();

    // Remove the class after printing
    setTimeout(() => {
      document.body.classList.remove('printing-o-level-report');
    }, 1000);

    console.log('Print function executed');
  }, []);

  // Extract exam info for display
  const examInfo = report ? {
    name: report.examName || report.exam?.name || 'Unknown Exam',
    term: report.term || report.exam?.term || 'Unknown Term',
    year: report.academicYear || 'Unknown Year'
  } : null;

  // Log exam info for debugging
  console.log('Exam Info:', examInfo);
  console.log('Raw Report Exam Data:', {
    examName: report?.examName,
    examObj: report?.exam,
    term: report?.term,
    academicYear: report?.academicYear
  });

  // If loading, show loading indicator
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Student Report...
        </Typography>
      </Container>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          Error loading report: {error.message || 'Unknown error'}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  // If no report data, show message
  if (!report) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          No report data available for this student and exam.
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  // Extract student details with fallbacks for different field names
  const rawStudentDetails = report.studentDetails || report.student || {};

  // Debug the student data to help identify issues
  debugStudentData(report);

  // Create a normalized student details object with all possible field names
  const studentDetails = {
    name: formatOLevelStudentName(report), // Use our utility function to get the name
    rollNumber: rawStudentDetails.rollNumber || '',
    gender: rawStudentDetails.gender || rawStudentDetails.sex || '',
    class: rawStudentDetails.class || rawStudentDetails.className ||
           (report.class ? report.class.fullName || report.class.name : '')
  };

  const summary = report.summary || {};
  const subjectResults = report.subjectResults || [];

  // Log the report data for debugging
  console.log('O-Level Student Report Data:', report);
  console.log('Raw Student Details:', rawStudentDetails);
  console.log('Normalized Student Details:', studentDetails);

  // Force update the student name if it's still missing
  if (!studentDetails.name || studentDetails.name === 'Unknown Student') {
    // Try to extract student name from logs
    const logs = report.logs || [];
    for (const log of logs) {
      if (log.includes('Student') && log.includes('name:')) {
        const match = log.match(/Student\s+([^\s]+)\s+name:\s+([^\s].+)/i);
        if (match && match[2]) {
          studentDetails.name = match[2].trim();
          console.log('Extracted student name from logs:', studentDetails.name);
          break;
        }
      }
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }} className="o-level-report-main-container">
      {/* Inline print styles for direct application */}
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 0.5cm; }
          body * { visibility: hidden; }
          #o-level-report-container, #o-level-report-container * { visibility: visible !important; }
          #o-level-report-container { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .school-logo { display: block !important; visibility: visible !important; }
        `}
      </style>

      {/* Cache notification */}
      {isFromCache && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          className="no-print"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Refresh
            </Button>
          }
        >
          This report is loaded from cache. Click refresh to get the latest data.
        </Alert>
      )}

      {/* Main report container */}
      <Paper
        sx={{
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          overflow: 'hidden'
        }}
        id="o-level-report-container"
        className="print-container single-page-report"
      >
        {/* School Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }} className="report-header">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={12} sx={{ position: 'relative' }}>
              <Box sx={{ position: 'absolute', left: '10px', top: '0', width: '80px', height: '80px' }}>
                <img
                  src="/images/logo.JPG"
                  alt="School Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  className="school-logo"
                />
              </Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                Agape Lutheran Junior Seminary
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Evangelical Lutheran Church in Tanzania - Northern Diocese
              </Typography>
              <Typography variant="body2" color="text.secondary">
                P.O.BOX 8882, Moshi, Tanzania • Mobile: 0759767735 • Email: infoagapeseminary@gmail.com
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ mt: 2, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e', mt: 2 }}>
            O-LEVEL STUDENT RESULT REPORT
          </Typography>
          <Typography variant="subtitle1">
            Academic Year: {report.academicYear || 'Unknown'}
          </Typography>
        </Box>

        {/* Student Information Card */}
        <Card sx={{ mb: 2, boxShadow: 2, borderRadius: 2 }} className="student-info-card">
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {studentDetails.name || 'Unknown Student'}
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary" display="inline">
                      Roll Number:
                    </Typography>{' '}
                    <Typography variant="body2" display="inline">
                      {studentDetails.rollNumber || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary" display="inline">
                      Gender:
                    </Typography>{' '}
                    <Typography variant="body2" display="inline">
                      {studentDetails.gender || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary" display="inline">
                      Class:
                    </Typography>{' '}
                    <Typography variant="body2" display="inline">
                      {studentDetails.class || studentDetails.className || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" display="inline">
                    Exam:
                  </Typography>{' '}
                  <Typography variant="body2" display="inline" sx={{ fontWeight: 'medium' }}>
                    {examInfo?.name || 'Unknown Exam'}
                  </Typography>
                  <br />
                  <Typography variant="body2" color="text.secondary" display="inline">
                    Term/Year:
                  </Typography>{' '}
                  <Typography variant="body2" display="inline">
                    {examInfo?.term || 'Unknown Term'}, {examInfo?.year || 'Unknown Year'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Subject Results Table */}
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#1a237e' }} className="section-heading">
          Subject Results
        </Typography>

        <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 1, borderRadius: 2 }} className="subject-results-table">
          <Table size="small">
            <TableHead sx={{ bgcolor: '#1a237e' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 0.5 }}>Subject</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', py: 0.5 }}>Marks (%)</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', py: 0.5 }}>Grade</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', py: 0.5 }}>Points</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 0.5 }}>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjectResults.length > 0 ? (
                subjectResults.map((subject, index) => (
                  <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' }, height: '30px' }}>
                    <TableCell sx={{ fontWeight: 'medium', py: 0.5 }}>{subject.subject}</TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>{subject.marks}</TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Chip
                        label={subject.grade}
                        size="small"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: getGradeColor(subject.grade),
                          color: 'white',
                          height: '20px',
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>{subject.points}</TableCell>
                    <TableCell sx={{ py: 0.5 }}>{subject.remarks || getRemarks(subject.grade)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 0.5 }}>No subjects found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary Card */}
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#1a237e' }} className="section-heading">
          Performance Summary
        </Typography>
        <Card sx={{ mb: 2, boxShadow: 1, borderRadius: 2 }} className="performance-summary-card">
          <CardContent sx={{ p: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, bgcolor: '#f5f5f5', height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Total Marks
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', fontSize: '1rem' }}>
                    {summary.totalMarks || '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                    Out of {subjectResults.length * 100}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, bgcolor: '#f5f5f5', height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Average Marks
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', fontSize: '1rem' }}>
                    {summary.averageMarks || '0.00'}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                    Class Avg: {summary.classAverage || 'N/A'}%
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, bgcolor: '#f5f5f5', height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Class Position
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', fontSize: '1rem' }}>
                    {summary.rank || 'N/A'}/{summary.totalStudents || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                    By average marks
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, bgcolor: '#f5f5f5', height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    GPA
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', fontSize: '1rem' }}>
                    {calculateGPA(subjectResults) || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                    4.0 Scale
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, bgcolor: '#f5f5f5', height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Best 7 Points
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', fontSize: '1rem' }}>
                    {summary.bestSevenPoints || '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                    For division
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, bgcolor: getDivisionColor(summary.division), height: '100%' }}>
                  <Typography variant="subtitle2" color="white" sx={{ fontSize: '0.7rem' }}>
                    Division
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>
                    {summary.division || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="white" sx={{ fontSize: '0.6rem' }}>
                    Best 7 subjects
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#1a237e' }} className="section-heading">
          Grade Distribution
        </Typography>
        <Card sx={{ mb: 2, boxShadow: 1, borderRadius: 2 }} className="grade-distribution-card">
          <CardContent sx={{ p: 1 }}>
            <Grid container spacing={1}>
              {summary.gradeDistribution && Object.entries(summary.gradeDistribution).map(([grade, count]) => (
                <Grid item xs={4} sm={2} md={2} key={grade}>
                  <Paper
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      bgcolor: getGradeColor(grade),
                      color: 'white',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {grade}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {count}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Character Assessment Section */}
        {report.characterAssessment && (
          <>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#1a237e' }} className="section-heading">
              Character Assessment
            </Typography>
            <Card sx={{ mb: 2, boxShadow: 1, borderRadius: 2 }} className="character-assessment-card">
              <CardContent sx={{ p: 1 }}>
                <Grid container spacing={1}>
                  {Object.entries(report.characterAssessment).map(([key, value]) => {
                    if (key === 'comments' || key === '_id' || key === 'studentId' || key === 'examId') return null;
                    return (
                      <Grid item xs={6} sm={4} md={3} key={key}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {formatCharacterTrait(key)}:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {value || 'Not assessed'}
                        </Typography>
                      </Grid>
                    );
                  })}
                </Grid>
                {report.characterAssessment.comments && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Teacher's Comments:
                    </Typography>
                    <Paper sx={{ p: 1, bgcolor: '#f5f5f5' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {report.characterAssessment.comments}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Approval Section */}
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#1a237e' }} className="section-heading">
          Approvals
        </Typography>
        <Card sx={{ mb: 2, boxShadow: 1, borderRadius: 2 }} className="approvals-card">
          <CardContent sx={{ p: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Class Teacher
                  </Typography>
                  <Divider sx={{ mt: 1, mb: 0.5 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.6rem' }}>
                    Name & Signature
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Academic Master
                  </Typography>
                  <Divider sx={{ mt: 1, mb: 0.5 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.6rem' }}>
                    Name & Signature
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Headmaster
                  </Typography>
                  <Divider sx={{ mt: 1, mb: 0.5 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.6rem' }}>
                    Name & Signature
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ mt: 1, textAlign: 'center' }} className="report-footer">
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            This is an official report from Agape Lutheran Junior Seminary. Generated on {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }} className="no-print">
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          size="large"
        >
          Print Report
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleGeneratePdf}
          size="large"
        >
          Download PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          size="large"
        >
          Refresh Data
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          size="large"
        >
          Go Back
        </Button>
      </Box>
    </Container>
  );
};

// Helper functions
const getGradeColor = (grade) => {
  const gradeColors = {
    'A': '#388e3c', // Green
    'B': '#1976d2', // Blue
    'C': '#7b1fa2', // Purple
    'D': '#f57c00', // Orange
    'E': '#fbc02d', // Yellow
    'F': '#d32f2f'  // Red
  };
  return gradeColors[grade] || '#757575'; // Default gray
};

const getDivisionColor = (division) => {
  if (!division) return '#757575'; // Default gray

  const divisionStr = division.toString().replace('Division ', '');
  const divisionColors = {
    'I': '#388e3c',   // Green
    '1': '#388e3c',   // Green
    'II': '#1976d2',  // Blue
    '2': '#1976d2',   // Blue
    'III': '#7b1fa2', // Purple
    '3': '#7b1fa2',   // Purple
    'IV': '#f57c00',  // Orange
    '4': '#f57c00',   // Orange
    '0': '#d32f2f'    // Red
  };
  return divisionColors[divisionStr] || '#757575'; // Default gray
};

const getRemarks = (grade) => {
  const remarks = {
    'A': 'Excellent',
    'B': 'Very Good',
    'C': 'Good',
    'D': 'Satisfactory',
    'E': 'Pass',
    'F': 'Fail'
  };
  return remarks[grade] || '';
};

const formatCharacterTrait = (trait) => {
  return trait
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
};

// Add GPA calculation function
const calculateGPA = (gradeDistribution) => {
  if (!gradeDistribution) return 0;
  
  const totalStudents = Object.values(gradeDistribution).reduce((sum, count) => sum + count, 0);
  if (totalStudents === 0) return 0;
  
  const gradePoints = {
    'A': 1,
    'B': 2,
    'C': 3,
    'D': 4,
    'E': 5,
    'S': 6,
    'F': 7
  };
  
  let weightedSum = 0;
  for (const [grade, count] of Object.entries(gradeDistribution)) {
    weightedSum += (gradePoints[grade] || 7) * count;
  }
  
  return weightedSum / totalStudents;
};

export default EnhancedStudentResultReport;
