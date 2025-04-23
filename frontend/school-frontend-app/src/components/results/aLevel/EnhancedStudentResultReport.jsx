import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { generateALevelStudentResultPDF } from '../../../utils/aLevelPdfGenerator';
import useALevelReport from '../../../hooks/useALevelReport';
import { formatALevelStudentName, debugStudentData } from '../../../utils/a-level-student-utils';
import './ALevelResultReport.css';

/**
 * Enhanced A-Level Student Result Report Component
 *
 * Displays a comprehensive, visually appealing A-Level result report for a student
 * with improved layout, typography, and visual elements.
 */
const EnhancedStudentResultReport = () => {
  const { studentId, examId } = useParams();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch report data using the custom hook
  const {
    report,
    loading,
    error,
    isFromCache,
    refreshReport
  } = useALevelReport({
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
      const doc = generateALevelStudentResultPDF(report);

      // Extract student name from report for filename
      const studentName = formatALevelStudentName(report)?.replace(/\s+/g, '_') || 'student';

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

  // Extract exam info for display
  const examInfo = report ? {
    name: report.examName || 'Unknown Exam',
    term: report.term || 'Unknown Term',
    year: report.academicYear || 'Unknown Year'
  } : null;

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

  // Extract student details
  const studentDetails = report.studentDetails || {};
  const summary = report.summary || {};
  const subjectResults = report.subjectResults || [];

  // Debug the student data to help identify issues
  debugStudentData(report);

  // Log the raw subject results to see the actual structure
  console.log('Raw subject results:', subjectResults);

  // Log each subject result individually to see all properties
  subjectResults.forEach((subject, index) => {
    console.log(`Subject ${index + 1} (${subject.subject}) raw data:`, subject);
    console.log(`Subject ${index + 1} marks properties:`, {
      marks: subject.marks,
      marksObtained: subject.marksObtained,
      score: subject.score,
      rawScore: subject.rawScore,
      totalScore: subject.totalScore,
      totalMarks: subject.totalMarks,
      obtainedMarks: subject.obtainedMarks
    });
  });

  // Separate principal and subsidiary subjects
  const principalSubjects = subjectResults.filter(subject => subject.isPrincipal);
  const subsidiarySubjects = subjectResults.filter(subject => !subject.isPrincipal);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Cache notification */}
      {isFromCache && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
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
        id="a-level-report-container"
        className="print-container"
      >
        {/* School Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Agape Lutheran Junior Seminary
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Evangelical Lutheran Church in Tanzania - Northern Diocese
          </Typography>
          <Typography variant="body2" color="text.secondary">
            P.O.BOX 8882, Moshi, Tanzania • Mobile: 0759767735 • Email: infoagapeseminary@gmail.com
          </Typography>
          <Divider sx={{ mt: 2, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e', mt: 2 }}>
            A-LEVEL STUDENT RESULT REPORT
          </Typography>
          <Typography variant="subtitle1">
            Academic Year: {report.academicYear || 'Unknown'}
          </Typography>
        </Box>

        {/* Student Information Card */}
        <Card sx={{ mb: 4, boxShadow: 2, borderRadius: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={1}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: '#1a237e',
                    boxShadow: 1
                  }}
                >
                  <PersonIcon fontSize="large" />
                </Avatar>
              </Grid>
              <Grid item xs={12} md={7}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {formatALevelStudentName(report)}
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Roll Number:
                    </Typography>
                    <Typography variant="body1">
                      {studentDetails.rollNumber || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Gender:
                    </Typography>
                    <Typography variant="body1">
                      {studentDetails.gender || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Class:
                    </Typography>
                    <Typography variant="body1">
                      {studentDetails.className || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: '#f5f5f5', boxShadow: 'none' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Exam Information:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {examInfo?.name || 'Unknown Exam'}
                    </Typography>
                    <Typography variant="body2">
                      {examInfo?.term || 'Unknown Term'}, {examInfo?.year || 'Unknown Year'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Subject Results Table */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1a237e' }}>
          Subject Results
        </Typography>

        {/* Principal Subjects */}
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Principal Subjects
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 2, borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#1a237e' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Subject</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Marks (%)</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Grade</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Points</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {principalSubjects.length > 0 ? (
                principalSubjects.map((subject, index) => (
                  <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' } }}>
                    <TableCell sx={{ fontWeight: 'medium' }}>{subject.subject}</TableCell>
                    <TableCell align="center">{subject.marks}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={subject.grade}
                        size="small"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: getGradeColor(subject.grade),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">{subject.points}</TableCell>
                    <TableCell>{subject.remarks || getRemarks(subject.grade)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No principal subjects found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Subsidiary Subjects */}
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Subsidiary Subjects
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 2, borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#1a237e' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Subject</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Marks (%)</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Grade</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Points</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subsidiarySubjects.length > 0 ? (
                subsidiarySubjects.map((subject, index) => (
                  <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' } }}>
                    <TableCell sx={{ fontWeight: 'medium' }}>{subject.subject}</TableCell>
                    <TableCell align="center">{subject.marks}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={subject.grade}
                        size="small"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: getGradeColor(subject.grade),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">{subject.points}</TableCell>
                    <TableCell>{subject.remarks || getRemarks(subject.grade)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No subsidiary subjects found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary Card */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1a237e' }}>
          Performance Summary
        </Typography>
        <Card sx={{ mb: 4, boxShadow: 2, borderRadius: 2 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Marks
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    {summary.totalMarks || '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Out of {subjectResults.length * 100}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Average Marks
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    {summary.averageMarks || '0.00'}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Class Average: {summary.classAverage || 'N/A'}%
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Class Position
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    {summary.rank || 'N/A'} / {summary.totalStudents || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Based on average marks
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Points
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    {summary.totalPoints || '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sum of all subject points
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Best 3 Principal Points
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    {summary.bestThreePoints || '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Used for division calculation
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: summary.missingPrincipalSubjects > 0 ? '#757575' : getDivisionColor(summary.division), height: '100%' }}>
                  <Typography variant="subtitle2" color="white" gutterBottom>
                    Division
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {summary.missingPrincipalSubjects > 0 ? 'N/A' : (summary.division || 'N/A')}
                  </Typography>
                  <Typography variant="body2" color="white">
                    {summary.missingPrincipalSubjects > 0 ?
                      `Need ${summary.missingPrincipalSubjects} more principal subject(s)` :
                      'Based on best 3 principal subjects'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Character Assessment Section */}
        {report.characterAssessment && (
          <>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1a237e' }}>
              Character Assessment
            </Typography>
            <Card sx={{ mb: 4, boxShadow: 2, borderRadius: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  {Object.entries(report.characterAssessment).map(([key, value]) => {
                    if (key === 'comments' || key === '_id' || key === 'studentId' || key === 'examId') return null;
                    return (
                      <Grid item xs={12} sm={6} md={4} key={key}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {formatCharacterTrait(key)}
                        </Typography>
                        <Typography variant="body1">
                          {value || 'Not assessed'}
                        </Typography>
                      </Grid>
                    );
                  })}
                </Grid>
                {report.characterAssessment.comments && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Teacher's Comments
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="body1">
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
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1a237e' }}>
          Approvals
        </Typography>
        <Card sx={{ mb: 4, boxShadow: 2, borderRadius: 2 }}>
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Class Teacher
                  </Typography>
                  <Divider sx={{ mt: 4, mb: 1 }} />
                  <Typography variant="body2">
                    Name & Signature
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Academic Master
                  </Typography>
                  <Divider sx={{ mt: 4, mb: 1 }} />
                  <Typography variant="body2">
                    Name & Signature
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Headmaster
                  </Typography>
                  <Divider sx={{ mt: 4, mb: 1 }} />
                  <Typography variant="body2">
                    Name & Signature
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

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
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
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
    'S': '#fbc02d', // Yellow
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
    'S': 'Subsidiary Pass',
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

export default EnhancedStudentResultReport;
