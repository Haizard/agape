import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
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
  Tabs,
  Tab,
  Snackbar,
  Chip
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import resultApi from '../../services/resultApi';
import { generateOLevelClassResultPDF } from '../../utils/oLevelPdfGenerator';

// TabPanel component for tabs
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
 * O-Level Class Result Report Component
 * Displays a class's O-Level result report with options to print, download, and share
 */
const OLevelClassResultReport = () => {
  const { classId, examId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [updatingEducationLevel, setUpdatingEducationLevel] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Fetch report data
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the report data from the dedicated O-Level API endpoint
      const reportUrl = resultApi.getOLevelClassReportUrl(classId, examId);
      console.log('Fetching O-Level class report from dedicated API endpoint:', reportUrl);

      // Make the API request
      const response = await axios.get(reportUrl);
      console.log('O-Level class report response:', response.data);
      const data = response.data;

      // Ensure this is an O-Level report
      if (data.educationLevel && data.educationLevel === 'A_LEVEL') {
        console.error('This is not an O-Level class. Please use the A-Level report component.');
        throw new Error('This is not an O-Level class. Please use the A-Level report component.');
      }

      // Check for A-Level indicators in class name
      if (data.className) {
        const isALevelClass = data.className.includes('Form 5') ||
                            data.className.includes('Form 6') ||
                            data.className.includes('Form V') ||
                            data.className.includes('Form VI');

        if (isALevelClass) {
          console.error('This appears to be an A-Level class based on the class name. Please use the A-Level report component.');
          throw new Error('This appears to be an A-Level class. Please use the A-Level report component.');
        }
      }

      // Force the education level to be O_LEVEL
      if (!data.educationLevel || data.educationLevel !== 'O_LEVEL') {
        console.log('Setting education level to O_LEVEL for this report');
        data.educationLevel = 'O_LEVEL';
      }

      // If data is empty or doesn't have expected structure, show error message
      if (!data || !data.students || data.students.length === 0) {
        console.log('No data from O-Level endpoint');
        // Set error message
        setError('No results found for this class. Please check if marks have been entered for this exam.');
        setLoading(false);
        return;
      }

      // We have valid data, set it
      setReport(data);
    } catch (err) {
      console.error('Error fetching O-Level class report:', err);
      setError(`Failed to load report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [classId, examId]);

  // Load report on component mount
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // Download report as PDF
  const handleDownload = () => {
    if (!report) return;

    try {
      const doc = generateOLevelClassResultPDF(report);
      doc.save(`${report.className || 'Class'}_O_Level_Report.pdf`);

      setSnackbar({
        open: true,
        message: 'Report downloaded successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setSnackbar({
        open: true,
        message: `Failed to download report: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  // Show empty state
  if (!report) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No result report found for this class and exam.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }} className="print-container">
      {/* Report Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }} className="print-header">
        <Typography variant="h4" gutterBottom>
          AGAPE LUTHERAN JUNIOR SEMINARY
        </Typography>
        <Typography variant="h5" gutterBottom>
          O-LEVEL CLASS RESULT REPORT
        </Typography>
        <Typography variant="subtitle1">
          Class: {report.className} {report.section}
        </Typography>
        <Typography variant="subtitle1">
          Academic Year: {report.academicYear || 'Unknown'}
        </Typography>
        <Typography variant="subtitle1">
          Exam: {report.examName || 'Unknown'}
        </Typography>
      </Box>

      {/* Class Summary */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Class Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Students
                  </Typography>
                  <Typography variant="h4">
                    {report.totalStudents || report.students?.length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Class Average
                  </Typography>
                  <Typography variant="h4">
                    {report.classAverage ? (typeof report.classAverage === 'number' ? report.classAverage.toFixed(2) : report.classAverage) : '0.00'}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Pass Rate
                  </Typography>
                  <Typography variant="h4">
                    {report.passRate ? report.passRate.toFixed(2) : '0.00'}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Student Results" />
          <Tab label="Subject Analysis" />
          <Tab label="Division Analysis" />
        </Tabs>

        {/* Student Results Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Student Results
          </Typography>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No.</TableCell>
                  <TableCell>Student Name (3 NAMES)</TableCell>
                  <TableCell>SEX</TableCell>
                  <TableCell>Roll Number</TableCell>

                  {/* Subject columns - dynamically generated */}
                  {report.subjects?.map((subject, index) => (
                    <TableCell key={index} align="center">{subject.name || subject}</TableCell>
                  ))}

                  <TableCell align="center">Total</TableCell>
                  <TableCell align="center">Average</TableCell>
                  <TableCell align="center">Division</TableCell>
                  <TableCell align="center">POINTS</TableCell>
                  <TableCell align="center">Rank</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.students?.map((student, index) => (
                  <TableRow key={student.id || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.gender || student.sex || '-'}</TableCell>
                    <TableCell>{student.rollNumber}</TableCell>

                    {/* Display results for each subject */}
                    {student.results?.map((result, resultIndex) => (
                      <TableCell key={resultIndex} align="center">
                        {result.marks} ({result.grade})
                      </TableCell>
                    ))}

                    {/* Summary columns */}
                    <TableCell align="center">{student.totalMarks}</TableCell>
                    <TableCell align="center">{student.averageMarks ? (typeof student.averageMarks === 'number' ? student.averageMarks.toFixed(2) : student.averageMarks) : '0.00'}</TableCell>
                    <TableCell align="center">{student.division}</TableCell>
                    <TableCell align="center">{student.bestSevenPoints || student.totalPoints || student.points || '-'}</TableCell>
                    <TableCell align="center">{student.rank}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Result Summary Card */}
          <Paper sx={{ mt: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#4caf50' }}>
              RESULT SUMMARY
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>SUBJECT NAME</TableCell>
                    <TableCell align="center">NO OF STUDENTS</TableCell>
                    <TableCell colSpan={6} align="center">PERFORMANCE</TableCell>
                    <TableCell align="center">GPA</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell align="center">A</TableCell>
                    <TableCell align="center">B</TableCell>
                    <TableCell align="center">C</TableCell>
                    <TableCell align="center">D</TableCell>
                    <TableCell align="center">F</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.subjectAnalysis?.map((subject, index) => {
                    // Calculate GPA (1-5 scale, A=1, F=5)
                    const grades = subject.grades || {};
                    const totalStudents = Object.values(grades).reduce((sum, count) => sum + (count || 0), 0);
                    const totalPoints = (grades.A || 0) * 1 + (grades.B || 0) * 2 + (grades.C || 0) * 3 +
                                        (grades.D || 0) * 4 + (grades.F || 0) * 5;
                    const gpa = totalStudents > 0 ? (totalPoints / totalStudents).toFixed(2) : '0.00';

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {subject.name?.replace('PHYISCS', 'PHYSICS').toUpperCase()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{totalStudents}</TableCell>
                        <TableCell align="center" sx={{ color: '#4caf50', fontWeight: 'bold' }}>{grades.A || 0}</TableCell>
                        <TableCell align="center" sx={{ color: '#2196f3', fontWeight: 'bold' }}>{grades.B || 0}</TableCell>
                        <TableCell align="center" sx={{ color: '#ff9800', fontWeight: 'bold' }}>{grades.C || 0}</TableCell>
                        <TableCell align="center" sx={{ color: '#ff5722', fontWeight: 'bold' }}>{grades.D || 0}</TableCell>
                        <TableCell align="center" sx={{ color: '#f44336', fontWeight: 'bold' }}>{grades.F || 0}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>{gpa}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Approval Section */}
          <Paper sx={{ mt: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
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
          </Paper>
        </TabPanel>

        {/* Subject Analysis Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Subject Analysis
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell align="center">Average</TableCell>
                  <TableCell align="center">Highest</TableCell>
                  <TableCell align="center">Lowest</TableCell>
                  <TableCell align="center">Grade Distribution</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.subjectAnalysis?.map((subject, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {subject.name.replace('PHYISCS', 'PHYSICS').toUpperCase()}
                        </Typography>
                        {subject.code && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            ({subject.code})
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {subject.teacher && subject.teacher !== 'N/A' ? subject.teacher : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {subject.averageMarks ? (typeof subject.averageMarks === 'number' ? subject.averageMarks.toFixed(2) : subject.averageMarks) : '0.00'}
                    </TableCell>
                    <TableCell align="center">{subject.highestMarks || '0'}</TableCell>
                    <TableCell align="center">{subject.lowestMarks || '0'}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                        {subject.grades && Object.entries(subject.grades)
                          .filter(([_, count]) => count > 0)
                          .sort(([gradeA], [gradeB]) => {
                            // Sort grades in order: A, B, C, D, F
                            const gradeOrder = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'F': 4 };
                            return gradeOrder[gradeA] - gradeOrder[gradeB];
                          })
                          .map(([grade, count]) => (
                            <Chip
                              key={grade}
                              label={`${grade}: ${count}`}
                              size="small"
                              sx={{ minWidth: '60px' }}
                              color={
                                grade === "A" ? 'success' :
                                grade === "B" ? 'primary' :
                                grade === "C" ? 'info' :
                                grade === "D" ? 'warning' :
                                'error'
                              }
                            />
                          ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Division Analysis Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Division Summary
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {report.divisionSummary && Object.entries(report.divisionSummary).map(([division, count]) => (
              <Grid item xs={6} sm={4} md={2.4} key={division}>
                <Card sx={{
                  textAlign: 'center',
                  bgcolor:
                    division === "I" ? '#e8f5e9' :
                    division === "II" ? '#e3f2fd' :
                    division === "III" ? '#e0f7fa' :
                    division === "IV" ? '#fff8e1' :
                    '#ffebee'
                }}>
                  <CardContent>
                    <Typography variant="h6">Division {division}</Typography>
                    <Typography variant="h3">{count}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {report.totalStudents ? `${Math.round((count / report.totalStudents) * 100)}%` : '0%'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Class Performance Summary
            </Typography>
            <Typography variant="body1">
              <strong>Class Average:</strong> {report.classAverage ? (typeof report.classAverage === 'number' ? report.classAverage.toFixed(2) : report.classAverage) : '0.00'}%
            </Typography>
            <Typography variant="body1">
              <strong>Total Students:</strong> {report.totalStudents || 0}
            </Typography>
            <Typography variant="body1">
              <strong>Pass Rate:</strong> {report.passRate ? (typeof report.passRate === 'number' ? report.passRate.toFixed(2) : report.passRate) : '0.00'}%
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {/* O-Level Division Guide */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            O-Level Division Guide
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
                <TableCell>7-14 points</TableCell>
                <TableCell rowSpan={5}>
                  A (75-100%) = 1 point<br />
                  B (65-74%) = 2 points<br />
                  C (50-64%) = 3 points<br />
                  D (30-49%) = 4 points<br />
                  F (0-29%) = 5 points
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Division II</TableCell>
                <TableCell>15-21 points</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Division III</TableCell>
                <TableCell>22-25 points</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Division IV</TableCell>
                <TableCell>26-32 points</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Division 0</TableCell>
                <TableCell>33+ points</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
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
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download PDF
        </Button>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
          }
          .print-header {
            margin-bottom: 10px !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default OLevelClassResultReport;
