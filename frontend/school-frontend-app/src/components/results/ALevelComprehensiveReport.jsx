import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  CircularProgress,
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

/**
 * A-Level Comprehensive Report Component
 * Displays a comprehensive report for Form 5 and Form 6 students
 * showing both Principal and Subsidiary subjects with all performance metrics
 */
const ALevelComprehensiveReport = () => {
  const { studentId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Generate demo data for Form 5 or Form 6
  const generateDemoData = (formLevel) => {
    const isForm5 = formLevel === 5 || studentId === 'demo-form5';

    // Create demo principal subjects
    const principalSubjects = [
      {
        subject: 'Physics',
        code: 'PHY',
        marks: isForm5 ? 78 : 82,
        grade: isForm5 ? 'B' : 'A',
        points: isForm5 ? 2 : 1,
        isPrincipal: true,
        remarks: isForm5 ? 'Very Good' : 'Excellent'
      },
      {
        subject: 'Chemistry',
        code: 'CHE',
        marks: isForm5 ? 65 : 75,
        grade: isForm5 ? 'C' : 'B',
        points: isForm5 ? 3 : 2,
        isPrincipal: true,
        remarks: isForm5 ? 'Good' : 'Very Good'
      },
      {
        subject: 'Mathematics',
        code: 'MAT',
        marks: isForm5 ? 72 : 80,
        grade: isForm5 ? 'B' : 'A',
        points: isForm5 ? 2 : 1,
        isPrincipal: true,
        remarks: isForm5 ? 'Very Good' : 'Excellent'
      }
    ];

    // Create demo subsidiary subjects
    const subsidiarySubjects = [
      {
        subject: 'General Studies',
        code: 'GS',
        marks: isForm5 ? 68 : 75,
        grade: isForm5 ? 'C' : 'B',
        points: isForm5 ? 3 : 2,
        isPrincipal: false,
        remarks: isForm5 ? 'Good' : 'Very Good'
      },
      {
        subject: 'Basic Applied Mathematics',
        code: 'BAM',
        marks: isForm5 ? 55 : 65,
        grade: isForm5 ? 'D' : 'C',
        points: isForm5 ? 4 : 3,
        isPrincipal: false,
        remarks: isForm5 ? 'Satisfactory' : 'Good'
      },
      {
        subject: 'English Language',
        code: 'ENG',
        marks: null,
        grade: 'N/A',
        points: null,
        isPrincipal: false,
        remarks: 'No result available'
      }
    ];

    // Calculate grade distribution
    const gradeDistribution = {
      A: principalSubjects.filter(s => s.grade === 'A').length + subsidiarySubjects.filter(s => s.grade === 'A').length,
      B: principalSubjects.filter(s => s.grade === 'B').length + subsidiarySubjects.filter(s => s.grade === 'B').length,
      C: principalSubjects.filter(s => s.grade === 'C').length + subsidiarySubjects.filter(s => s.grade === 'C').length,
      D: principalSubjects.filter(s => s.grade === 'D').length + subsidiarySubjects.filter(s => s.grade === 'D').length,
      E: principalSubjects.filter(s => s.grade === 'E').length + subsidiarySubjects.filter(s => s.grade === 'E').length,
      S: principalSubjects.filter(s => s.grade === 'S').length + subsidiarySubjects.filter(s => s.grade === 'S').length,
      F: principalSubjects.filter(s => s.grade === 'F').length + subsidiarySubjects.filter(s => s.grade === 'F').length
    };

    // Calculate total marks and points
    const subjectsWithMarks = [...principalSubjects, ...subsidiarySubjects].filter(s => s.marks !== null);
    const totalMarks = subjectsWithMarks.reduce((sum, s) => sum + s.marks, 0);
    const totalPoints = subjectsWithMarks.reduce((sum, s) => sum + s.points, 0);
    const averageMarks = subjectsWithMarks.length > 0 ? totalMarks / subjectsWithMarks.length : 0;

    // Calculate best three principal points
    const bestThreePrincipal = [...principalSubjects].sort((a, b) => a.points - b.points).slice(0, 3);
    const bestThreePoints = bestThreePrincipal.reduce((sum, s) => sum + s.points, 0);

    // Determine division
    let division = 'N/A';
    if (bestThreePoints >= 3 && bestThreePoints <= 9) division = 'I';
    else if (bestThreePoints >= 10 && bestThreePoints <= 12) division = 'II';
    else if (bestThreePoints >= 13 && bestThreePoints <= 17) division = 'III';
    else if (bestThreePoints >= 18 && bestThreePoints <= 19) division = 'IV';
    else if (bestThreePoints >= 20 && bestThreePoints <= 21) division = 'V';

    // Create demo report
    return {
      reportTitle: `Mid-Term Examination Result Report`,
      schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
      academicYear: '2023-2024',
      examName: 'Mid-Term Examination',
      examDate: '2023-10-15 - 2023-10-25',
      studentDetails: {
        name: isForm5 ? 'John Doe' : 'Jane Smith',
        rollNumber: isForm5 ? 'F5-001' : 'F6-001',
        class: isForm5 ? 'Form 5 Science' : 'Form 6 Science',
        gender: isForm5 ? 'Male' : 'Female',
        form: isForm5 ? 'Form 5' : 'Form 6',
        subjectCombination: 'PCM (Physics, Chemistry, Mathematics)'
      },
      principalSubjects,
      subsidiarySubjects,
      allSubjects: [...principalSubjects, ...subsidiarySubjects],
      summary: {
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints,
        bestThreePoints,
        division,
        rank: isForm5 ? '3' : '2',
        totalStudents: '25',
        gradeDistribution
      },
      characterAssessment: {
        discipline: isForm5 ? 'Good' : 'Excellent',
        attendance: isForm5 ? 'Regular' : 'Excellent',
        attitude: isForm5 ? 'Positive' : 'Very Positive',
        comments: isForm5 ?
          'John is a dedicated student who shows great potential. He needs to improve his consistency in assignments.' :
          'Jane is an exceptional student who consistently demonstrates leadership qualities and academic excellence.'
      },
      educationLevel: 'A_LEVEL',
      formLevel: isForm5 ? 5 : 6
    };
  };

  // Fetch report data
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if this is a demo request
      if (studentId === 'demo-form5' || studentId === 'demo-form6') {
        const formLevel = studentId === 'demo-form5' ? 5 : 6;
        console.log(`Generating demo data for Form ${formLevel}`);
        const demoData = generateDemoData(formLevel);
        setReport(demoData);
        setLoading(false);
        return;
      }

      // Fetch the report data from the comprehensive A-Level endpoint
      const reportUrl = `${process.env.REACT_APP_API_URL || ''}/api/a-level-comprehensive/student/${studentId}/${examId}`;
      console.log('Fetching comprehensive A-Level report from:', reportUrl);

      const response = await axios.get(reportUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Comprehensive A-Level report response:', response.data);
      const data = response.data;

      // Ensure this is an A-Level report
      if (!data.educationLevel || data.educationLevel !== 'A_LEVEL') {
        throw new Error('This is not an A-Level report. Please use the O-Level report component.');
      }

      // If data is empty or doesn't have expected structure, show error message
      if (!data || (!data.principalSubjects && !data.subsidiarySubjects)) {
        console.log('No data from A-Level comprehensive endpoint');
        // Set error message
        setError('No results found for this student. Please check if marks have been entered for this exam.');
        setLoading(false);
        return;
      }

      // We have valid data, set it
      setReport(data);
    } catch (err) {
      console.error('Error fetching comprehensive A-Level report:', err);
      setError(`Failed to load report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [studentId, examId]);

  // Load report on component mount
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // Download report as PDF
  const handleDownload = () => {
    // Open the PDF version in a new tab (backend will generate PDF)
    const pdfUrl = `${process.env.REACT_APP_API_URL || ''}/api/a-level-comprehensive/student/${studentId}/${examId}`;
    window.open(pdfUrl, '_blank');
  };

  // Share report
  const handleShare = () => {
    // Create a shareable link
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
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading report...
        </Typography>
      </Box>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  // If no report data, show empty state
  if (!report) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          No report data available. Please check if the student has results for this exam.
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }} className="print-container">
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

      {/* Action Buttons - Hidden when printing */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }} className="no-print">
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
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={handleShare}
        >
          Share Report
        </Button>
      </Box>

      {/* Student Information */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Student Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Name:</strong> {report.studentDetails.name}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Roll Number:</strong> {report.studentDetails.rollNumber}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Class:</strong> {report.studentDetails.class}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Gender:</strong> {report.studentDetails.gender}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Subject Combination:</strong> {report.studentDetails.subjectCombination}
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
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Exam Name:</strong> {report.examName}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Academic Year:</strong> {report.academicYear}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Exam Date:</strong> {report.examDate}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Subject Results Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<SchoolIcon />} label="Principal Subjects" />
          <Tab icon={<PersonIcon />} label="Subsidiary Subjects" />
        </Tabs>

        {/* Principal Subjects Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Principal Subjects
            </Typography>
            <Divider sx={{ mb: 2 }} />

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
                          {subject.marks !== null ? subject.marks : '-'}
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
                        <TableCell align="center">
                          {subject.points !== null ? subject.points : '-'}
                        </TableCell>
                        <TableCell>{subject.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No principal subjects found or no results available.
              </Alert>
            )}
          </Box>
        )}

        {/* Subsidiary Subjects Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Subsidiary Subjects
            </Typography>
            <Divider sx={{ mb: 2 }} />

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
                          {subject.marks !== null ? subject.marks : '-'}
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
                        <TableCell align="center">
                          {subject.points !== null ? subject.points : '-'}
                        </TableCell>
                        <TableCell>{subject.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No subsidiary subjects found or no results available.
              </Alert>
            )}
          </Box>
        )}
      </Paper>

      {/* Performance Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Total Marks:</strong> {report.summary.totalMarks}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Average Marks:</strong> {report.summary.averageMarks}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Total Points:</strong> {report.summary.totalPoints !== null ? report.summary.totalPoints : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Best 3 Principal Points:</strong> {report.summary.bestThreePoints !== null ? report.summary.bestThreePoints : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Division:</strong> {report.summary.division}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Rank:</strong> {report.summary.rank} of {report.summary.totalStudents}
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
                    <TableCell>Grade</TableCell>
                    <TableCell align="center">Count</TableCell>
                    <TableCell align="center">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.summary.gradeDistribution && Object.entries(report.summary.gradeDistribution).map(([grade, count]) => (
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
                        {report.allSubjects?.length
                          ? `${Math.round((count / report.allSubjects.length) * 100)}%`
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
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Character Assessment
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body1">
              <strong>Discipline:</strong> {report.characterAssessment?.discipline || 'Not assessed'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body1">
              <strong>Attendance:</strong> {report.characterAssessment?.attendance || 'Not assessed'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body1">
              <strong>Attitude:</strong> {report.characterAssessment?.attitude || 'Not assessed'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Comments:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              {report.characterAssessment?.comments || 'No comments provided.'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

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
                <Typography variant="h6" align="center">Division V</Typography>
                <Typography variant="body2" align="center">20-21 points</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Signature Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <Box sx={{ borderTop: '1px solid #ccc', pt: 1, mt: 4, width: '80%' }}>
              <Typography variant="body2">Class Teacher's Signature</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ borderTop: '1px solid #ccc', pt: 1, mt: 4, width: '80%' }}>
              <Typography variant="body2">Principal's Signature</Typography>
            </Box>
          </Grid>
        </Grid>
        <Typography variant="body2" sx={{ mt: 4 }}>
          Date: {new Date().toLocaleDateString()}
        </Typography>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Box>
  );
};

export default ALevelComprehensiveReport;
