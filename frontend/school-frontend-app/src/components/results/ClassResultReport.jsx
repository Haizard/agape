import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import SafeDisplay from '../common/SafeDisplay';
import { useParams } from 'react-router-dom';
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
  Chip
} from '@mui/material';
import {
  Print as PrintIcon,
  Email as EmailIcon,
  BarChart as BarChartIcon,
  TableChart as TableChartIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import api from '../../services/api';
import DirectPdfLink from '../common/DirectPdfLink';

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

// Add prop type validation for TabPanel
TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const ClassResultReport = () => {
  const { classId, examId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      console.log(`Fetching result report for class ${classId} and exam ${examId}`);
      const response = await api.get(`/api/results/report/class/${classId}/${examId}`);
      console.log('Report data:', response.data);

      setReport(response.data);

      setError(null);
    } catch (err) {
      console.error('Error fetching result report:', err);
      let errorMessage = 'Failed to fetch result report';
      if (err.response) {
        errorMessage = err.response.data?.message || err.response.statusText || errorMessage;
      } else if (err.request) {
        errorMessage = 'No response received from server. Please check your network connection.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [classId, examId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  const handlePrint = () => {
    window.print();
  };

  // Download functionality is now handled by the DirectPdfDownload component

  const handleSendEmails = () => {
    // This would be implemented with an email service
    alert('Email functionality will be implemented with an email service');
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
        {typeof error === 'object' ? JSON.stringify(error) : error}
      </Alert>
    );
  }

  if (!report) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No result report found for this class and exam.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }} className="result-report-container">
      {/* Report Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            <SafeDisplay value={report.schoolName} />
          </Typography>
          <Typography variant="h5" gutterBottom>
            <SafeDisplay value={report.reportTitle} />
          </Typography>
          <Typography variant="subtitle1">
            Academic Year: <SafeDisplay value={report.academicYear} />
          </Typography>
          <Typography variant="subtitle2">
            Exam Date: <SafeDisplay value={report.examDate} />
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Class Details */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              <strong>Class:</strong> <SafeDisplay value={report.classDetails.name} />
            </Typography>
            <Typography variant="subtitle1">
              <strong>Total Students:</strong> <SafeDisplay value={report.classDetails.totalStudents} />
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              <strong>Class Teacher:</strong> <SafeDisplay value={report.classDetails.classTeacher} />
            </Typography>
            <Typography variant="subtitle1">
              <strong>Class Average:</strong> <SafeDisplay value={report.summary.classAverage} />
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs for different views */}
      <Paper elevation={3} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<TableChartIcon />} label="Student Rankings" />
          <Tab icon={<BarChartIcon />} label="Subject Statistics" />
          <Tab icon={<PersonIcon />} label="Division Summary" />
        </Tabs>

        {/* Student Rankings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Student Rankings
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Rank</strong></TableCell>
                  <TableCell><strong>Student Name</strong></TableCell>
                  <TableCell><strong>Roll Number</strong></TableCell>
                  <TableCell align="center"><strong>Total Marks</strong></TableCell>
                  <TableCell align="center"><strong>Average</strong></TableCell>
                  <TableCell align="center"><strong>Division</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.studentResults.map((student) => (
                  <TableRow key={typeof student.rollNumber === 'object' ? student.rollNumber._id : student.rollNumber}>
                    <TableCell><SafeDisplay value={student.rank} /></TableCell>
                    <TableCell><SafeDisplay value={student.name} /></TableCell>
                    <TableCell><SafeDisplay value={student.rollNumber} /></TableCell>
                    <TableCell align="center"><SafeDisplay value={student.totalMarks} /></TableCell>
                    <TableCell align="center"><SafeDisplay value={student.averageMarks} /></TableCell>
                    <TableCell align="center">
                      <Chip
                        label={<SafeDisplay value={`Division ${student.division}`} />}
                        color={
                          student.division === "I" ? 'success' :
                          student.division === "II" ? 'primary' :
                          student.division === "III" ? 'info' :
                          student.division === "IV" ? 'warning' :
                          'error'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Subject Statistics Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Subject Statistics
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Subject</strong></TableCell>
                  <TableCell><strong>Teacher</strong></TableCell>
                  <TableCell align="center"><strong>Average</strong></TableCell>
                  <TableCell align="center"><strong>Highest</strong></TableCell>
                  <TableCell align="center"><strong>Lowest</strong></TableCell>
                  <TableCell align="center"><strong>Grade Distribution</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(report.subjectStatistics) ? report.subjectStatistics.map((subject) => (
                  <TableRow key={typeof subject.name === 'object' ? subject.name._id : subject.name}>
                    <TableCell><SafeDisplay value={subject.name} /></TableCell>
                    <TableCell><SafeDisplay value={subject.teacher} /></TableCell>
                    <TableCell align="center"><SafeDisplay value={subject.averageMarks} /></TableCell>
                    <TableCell align="center"><SafeDisplay value={subject.highestMarks} /></TableCell>
                    <TableCell align="center"><SafeDisplay value={subject.lowestMarks} /></TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {Object.entries(subject.grades).map(([grade, count]) => (
                          count > 0 && (
                            <Chip
                              key={grade}
                              label={<SafeDisplay value={`${grade}: ${count}`} />}
                              size="small"
                              color={
                                grade === "A" ? 'success' :
                                grade === "B" ? 'primary' :
                                grade === "C" ? 'info' :
                                grade === "D" ? 'warning' :
                                'error'
                              }
                            />
                          )
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                )) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Division Summary Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Division Summary
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {report.summary?.divisions ? Object.entries(report.summary.divisions).map(([division, count]) => (
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
                    <Typography variant="h6">Division <SafeDisplay value={division} /></Typography>
                    <Typography variant="h3"><SafeDisplay value={count} /></Typography>
                    <Typography variant="body2" color="text.secondary">
                      <SafeDisplay value={Math.round((count / report.classDetails.totalStudents) * 100)} />%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )) : null}
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Class Performance Summary
            </Typography>
            <Typography variant="body1">
              <strong>Class Average:</strong> <SafeDisplay value={report.summary.classAverage} />
            </Typography>
            <Typography variant="body1">
              <strong>Total Students:</strong> <SafeDisplay value={report.classDetails.totalStudents} />
            </Typography>
            <Typography variant="body1">
              <strong>Pass Rate:</strong> <SafeDisplay value={
                Math.round(
                  ((report.summary.divisions.I +
                    report.summary.divisions.II +
                    report.summary.divisions.III +
                    report.summary.divisions.IV) /
                    report.classDetails.totalStudents) * 100
                )} />%
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print Report
        </Button>
        <DirectPdfLink
          type="class"
          classId={classId}
          examId={examId}
          label="Download PDF"
          variant="contained"
          color="secondary"
        />
        <Button
          variant="contained"
          color="success"
          startIcon={<EmailIcon />}
          onClick={handleSendEmails}
        >
          Email to Teachers
        </Button>
      </Box>
    </Box>
  );
};

export default ClassResultReport;
