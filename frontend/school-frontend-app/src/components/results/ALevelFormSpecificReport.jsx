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
  Tabs,
  Tab,
  Snackbar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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

const ALevelFormSpecificReport = () => {
  const { classId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedForm, setSelectedForm] = useState('form5');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle form selection change
  const handleFormChange = (event) => {
    const form = event.target.value;
    setSelectedForm(form);
    fetchReport(form);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fetch report data
  const fetchReport = useCallback(async (formLevel = 'form5') => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the report data from the form-specific A-Level endpoint
      const reportUrl = `/api/a-level-results/${formLevel}/class/${classId}/${examId}`;
      const response = await axios.get(reportUrl);
      const data = response.data;

      // Ensure this is an A-Level class
      if (!data.educationLevel || data.educationLevel !== 'A_LEVEL') {
        setError('This is not an A-Level class report');
        setLoading(false);
        return;
      }

      setReport(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.message || 'Error fetching report');
      setLoading(false);
    }
  }, [classId, examId]);

  // Initial fetch
  useEffect(() => {
    fetchReport(selectedForm);
  }, [fetchReport, selectedForm]);

  // Generate PDF
  const handleGeneratePDF = () => {
    if (!report) return;

    try {
      generateALevelClassResultPDF(report);
      setSnackbar({
        open: true,
        message: 'PDF generated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setSnackbar({
        open: true,
        message: 'Error generating PDF',
        severity: 'error'
      });
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      setSnackbar({
        open: true,
        message: 'Downloading PDF...',
        severity: 'info'
      });

      // Use the API endpoint to download the PDF
      const pdfUrl = `/api/a-level-results/${selectedForm}/class/${classId}/${examId}/pdf`;
      window.open(pdfUrl, '_blank');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setSnackbar({
        open: true,
        message: 'Error downloading PDF',
        severity: 'error'
      });
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  // Render no data state
  if (!report) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No report data available
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {report.reportTitle}
            </Typography>
            <Typography variant="h6" color="textSecondary">
              {report.schoolName}
            </Typography>
            <Typography variant="body1">
              Academic Year: {report.academicYear}
            </Typography>
            <Typography variant="body1">
              Exam: {report.examName}
            </Typography>
            <Typography variant="body1">
              Class: {report.className} {report.section} {report.stream}
            </Typography>
            <Typography variant="body1">
              Total Students: {report.totalStudents}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControl fullWidth>
                <InputLabel id="form-select-label">Form Level</InputLabel>
                <Select
                  labelId="form-select-label"
                  id="form-select"
                  value={selectedForm}
                  label="Form Level"
                  onChange={handleFormChange}
                >
                  <MenuItem value="form5">Form 5</MenuItem>
                  <MenuItem value="form6">Form 6</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handleGeneratePDF}
                fullWidth
              >
                Print Report
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadPDF}
                fullWidth
              >
                Download PDF
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Subject Combinations */}
      {report.subjectCombinations && report.subjectCombinations.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Subject Combinations
          </Typography>
          <Grid container spacing={2}>
            {report.subjectCombinations.map((combination, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {combination.name} ({combination.code})
                    </Typography>
                    <SubjectCombinationDisplay combination={combination} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Student Results" />
          <Tab label="Division Distribution" />
        </Tabs>

        {/* Student Results Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Combination</TableCell>
                  <TableCell>Average</TableCell>
                  <TableCell>Best Three</TableCell>
                  <TableCell>Division</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.rank}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.rollNumber}</TableCell>
                    <TableCell>{student.combination}</TableCell>
                    <TableCell>{student.averageMarks}</TableCell>
                    <TableCell>{student.bestThreePoints}</TableCell>
                    <TableCell>
                      <Chip
                        label={`Division ${student.division}`}
                        color={
                          student.division === 'I' ? 'success' :
                          student.division === 'II' ? 'primary' :
                          student.division === 'III' ? 'secondary' :
                          student.division === 'IV' ? 'warning' :
                          'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => navigate(`/results/a-level/${selectedForm}/student/${student.id}/${examId}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Division Distribution Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Division Distribution
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Division</TableCell>
                          <TableCell>Count</TableCell>
                          <TableCell>Percentage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(report.divisionDistribution).map(([division, count]) => (
                          <TableRow key={division}>
                            <TableCell>Division {division}</TableCell>
                            <TableCell>{count}</TableCell>
                            <TableCell>
                              {report.totalStudents > 0
                                ? `${((count / report.totalStudents) * 100).toFixed(2)}%`
                                : '0%'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ALevelFormSpecificReport;
