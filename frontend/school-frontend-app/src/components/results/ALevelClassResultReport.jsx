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
import { generateALevelClassResultPDF } from '../../utils/aLevelPdfGenerator';
import SubjectCombinationDisplay from '../common/SubjectCombinationDisplay';

// Tab Panel component
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
 * A-Level Class Result Report Component
 * Displays a class's A-Level result report with options to print, download, and share
 */
const ALevelClassResultReport = () => {
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

  // Fetch report data
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the report data from the A-Level endpoint
      const reportUrl = resultApi.getALevelClassReportUrl(classId, examId);
      const response = await axios.get(reportUrl);
      const data = response.data;

      // Ensure this is an A-Level class
      if (!data.educationLevel || data.educationLevel !== 'A_LEVEL') {
        throw new Error('This is not an A-Level class. Please use the O-Level report component.');
      }

      setReport(data);
    } catch (err) {
      console.error('Error fetching report:', err);

      // Check if this is a 400 error with detailed information
      if (err.response && err.response.status === 400 && err.response.data) {
        const errorData = err.response.data;

        // If we have detailed error information, display it
        if (errorData.message) {
          let errorMessage = errorData.message;

          // Add education level information if available
          if (errorData.educationLevel) {
            errorMessage += ` (Current education level: ${errorData.educationLevel})`;
          }

          // Add suggestion if available
          if (errorData.suggestion) {
            errorMessage += `\n\n${errorData.suggestion}`;
          }

          setError(errorMessage);
        } else {
          setError('This class cannot be processed as an A-Level class. Please use the O-Level report component.');
        }
      } else {
        // Generic error
        setError(err.message || 'Failed to load report');
      }
    } finally {
      setLoading(false);
    }
  }, [classId, examId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle tab change
  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle download
  const handleDownload = () => {
    if (!report) {
      setSnackbar({ open: true, message: 'No report data available to download' });
      return;
    }

    try {
      // Generate the PDF
      const doc = generateALevelClassResultPDF(report);

      // Save the PDF
      const fileName = `${report.className || 'Class'}_${report.section || ''}_${report.examName || 'Exam'}_A_Level_Report.pdf`;
      doc.save(fileName);

      setSnackbar({ open: true, message: 'Report downloaded successfully' });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setSnackbar({ open: true, message: 'Failed to download report' });
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
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
      <Alert
        severity="error"
        sx={{ m: 2 }}
        action={
          error.includes('not marked as an A-Level class') && (
            <Button
              color="inherit"
              size="small"
              onClick={updateClassToALevel}
              disabled={updatingEducationLevel}
            >
              {updatingEducationLevel ? 'Updating...' : 'Update to A-Level'}
            </Button>
          )
        }
      >
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
      <Box sx={{ mb: 3, textAlign: 'center' }} className="print-header">
        <Typography variant="h4" gutterBottom>
          AGAPE LUTHERAN JUNIOR SEMINARY
        </Typography>
        <Typography variant="h5" gutterBottom>
          A-LEVEL CLASS RESULT REPORT
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

            {report.subjectCombination && (
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Subject Combination
                    </Typography>
                    <SubjectCombinationDisplay
                      combination={report.subjectCombination}
                      showCompulsory={true}
                      variant="compact"
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}
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
                    {report.passRate ? (typeof report.passRate === 'number' ? report.passRate.toFixed(2) : report.passRate) : '0.00'}%
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
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Roll No.</TableCell>

                  {/* Get all unique subjects from the first student */}
                  {report.students && report.students[0]?.results?.map((result, index) => (
                    <TableCell key={index} align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="body2">{result.subject}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          {result.isPrincipal && (
                            <Chip
                              label="Principal"
                              color="primary"
                              size="small"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                          {result.isCompulsory && (
                            <Chip
                              label="Compulsory"
                              color="secondary"
                              size="small"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                  ))}

                  <TableCell align="center">Total</TableCell>
                  <TableCell align="center">Average</TableCell>
                  <TableCell align="center">Points</TableCell>
                  <TableCell align="center">Best 3</TableCell>
                  <TableCell align="center">Division</TableCell>
                  <TableCell align="center">Rank</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.students?.map((student, index) => (
                  <TableRow key={student.id || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.rollNumber}</TableCell>

                    {/* Display results for each subject */}
                    {student.results?.map((result, resultIndex) => (
                      <TableCell key={resultIndex} align="center">
                        {result.marks} ({result.grade})
                      </TableCell>
                    ))}

                    <TableCell align="center">{student.totalMarks}</TableCell>
                    <TableCell align="center">{student.averageMarks}</TableCell>
                    <TableCell align="center">{student.totalPoints}</TableCell>
                    <TableCell align="center">{student.bestThreePoints}</TableCell>
                    <TableCell align="center">{student.division}</TableCell>
                    <TableCell align="center">{student.rank}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Subject Analysis Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell align="center">Type</TableCell>
                  <TableCell align="center">Students</TableCell>
                  <TableCell align="center">Average</TableCell>
                  <TableCell align="center">A</TableCell>
                  <TableCell align="center">B</TableCell>
                  <TableCell align="center">C</TableCell>
                  <TableCell align="center">D</TableCell>
                  <TableCell align="center">E</TableCell>
                  <TableCell align="center">S</TableCell>
                  <TableCell align="center">F</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Get all unique subjects */}
                {report.students && report.students[0]?.results?.map((subjectTemplate, index) => {
                  // Count students taking this subject
                  const studentsCount = report.students.filter(student =>
                    student.results.some(result => result.subject === subjectTemplate.subject)
                  ).length;

                  // Calculate average for this subject
                  let totalMarks = 0;
                  report.students.forEach(student => {
                    const result = student.results.find(r => r.subject === subjectTemplate.subject);
                    if (result) {
                      totalMarks += result.marks;
                    }
                  });
                  const average = studentsCount > 0 ? (totalMarks / studentsCount).toFixed(2) : '0.00';

                  // Count grades for this subject
                  const grades = { A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 };
                  report.students.forEach(student => {
                    const result = student.results.find(r => r.subject === subjectTemplate.subject);
                    if (result && grades[result.grade] !== undefined) {
                      grades[result.grade]++;
                    }
                  });

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {subjectTemplate.subject.toUpperCase()}
                          </Typography>
                          {subjectTemplate.code && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              ({subjectTemplate.code})
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={subjectTemplate.isPrincipal ? 'Principal' : 'Subsidiary'}
                          color={subjectTemplate.isPrincipal ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{studentsCount}</TableCell>
                      <TableCell align="center">{average}%</TableCell>
                      <TableCell align="center">
                        {grades.A > 0 && <Chip label={grades.A} size="small" color="success" />}
                      </TableCell>
                      <TableCell align="center">
                        {grades.B > 0 && <Chip label={grades.B} size="small" color="success" />}
                      </TableCell>
                      <TableCell align="center">
                        {grades.C > 0 && <Chip label={grades.C} size="small" color="primary" />}
                      </TableCell>
                      <TableCell align="center">
                        {grades.D > 0 && <Chip label={grades.D} size="small" color="primary" />}
                      </TableCell>
                      <TableCell align="center">
                        {grades.E > 0 && <Chip label={grades.E} size="small" color="warning" />}
                      </TableCell>
                      <TableCell align="center">
                        {grades.S > 0 && <Chip label={grades.S} size="small" color="warning" />}
                      </TableCell>
                      <TableCell align="center">
                        {grades.F > 0 && <Chip label={grades.F} size="small" color="error" />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Division Analysis Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Division</TableCell>
                      <TableCell align="center">Count</TableCell>
                      <TableCell align="center">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Display division distribution */}
                    {(() => {
                      const divisions = report.divisionDistribution || { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, 'V': 0, '0': 0 };
                      const totalStudents = report.totalStudents || report.students?.length || 0;

                      return Object.entries(divisions)
                        .sort(([a], [b]) => {
                          // Sort divisions in order: I, II, III, IV, V, 0
                          const order = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, '0': 6 };
                          return order[a] - order[b];
                        })
                        .map(([division, count]) => (
                          <TableRow key={division}>
                            <TableCell>
                              {division === '0' ? 'No Division' : `Division ${division}`}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={count}
                                color={
                                  division === 'I' ? 'success' :
                                  division === 'II' ? 'primary' :
                                  division === 'III' ? 'info' :
                                  division === 'IV' ? 'warning' :
                                  division === 'V' ? 'warning' : 'error'
                                }
                              />
                            </TableCell>
                            <TableCell align="center">
                              {totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(2) : '0.00'}%
                            </TableCell>
                          </TableRow>
                        ));
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  A-Level Division Guide
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Division</TableCell>
                        <TableCell>Points Range</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Division I</TableCell>
                        <TableCell>3-9 points</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Division II</TableCell>
                        <TableCell>10-12 points</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Division III</TableCell>
                        <TableCell>13-17 points</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Division IV</TableCell>
                        <TableCell>18-19 points</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Division V</TableCell>
                        <TableCell>20-21 points</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Grade Points:
                </Typography>
                <Typography variant="body2">
                  A (80-100%) = 1 point<br />
                  B (70-79%) = 2 points<br />
                  C (60-69%) = 3 points<br />
                  D (50-59%) = 4 points<br />
                  E (40-49%) = 5 points<br />
                  S (35-39%) = 6 points<br />
                  F (0-34%) = 7 points
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
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
        <Button
          variant="contained"
          color="success"
          startIcon={<ShareIcon />}
          onClick={() => setSnackbar({ open: true, message: 'Email functionality will be implemented soon' })}
        >
          Email to Teachers
        </Button>
      </Box>

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

export default ALevelClassResultReport;
