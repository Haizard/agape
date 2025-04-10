import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const ResultMonitoringDashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [consistencyData, setConsistencyData] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Duplicate check state
  const [duplicateParams, setDuplicateParams] = useState({
    studentId: '',
    examId: '',
    subjectId: ''
  });
  const [duplicateResults, setDuplicateResults] = useState(null);

  // Grade check state
  const [gradeParams, setGradeParams] = useState({
    resultId: '',
    educationLevel: 'O_LEVEL'
  });
  const [gradeResults, setGradeResults] = useState(null);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  // Handle input changes for duplicate check
  const handleDuplicateChange = (e) => {
    const { name, value } = e.target;
    setDuplicateParams({
      ...duplicateParams,
      [name]: value
    });
  };

  // Handle input changes for grade check
  const handleGradeChange = (e) => {
    const { name, value } = e.target;
    setGradeParams({
      ...gradeParams,
      [name]: value
    });
  };

  // Check for duplicates
  const checkDuplicates = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/v2/results/monitor/check-duplicates', duplicateParams);
      setDuplicateResults(response.data);

      if (response.data.success) {
        if (response.data.duplicates && response.data.duplicates.length > 0) {
          toast.warning(response.data.message);
        } else {
          toast.success(response.data.message);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
      toast.error(`Error checking duplicates: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fix duplicates
  const fixDuplicates = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/v2/results/monitor/fix-duplicates', duplicateParams);

      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh the duplicate check
        await checkDuplicates();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error fixing duplicates:', error);
      toast.error(`Error fixing duplicates: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Check grade and points
  const checkGrade = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/v2/results/monitor/check-grade', gradeParams);
      setGradeResults(response.data);

      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error checking grade:', error);
      toast.error(`Error checking grade: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fix grade and points
  const fixGrade = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/v2/results/monitor/fix-grade', gradeParams);

      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh the grade check
        await checkGrade();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error fixing grade:', error);
      toast.error(`Error fixing grade: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Check data consistency
  const checkConsistency = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.get('/api/data-consistency/check');
      setConsistencyData(response.data.results);
      setSuccess('Data consistency check completed successfully');
      toast.success('Data consistency check completed successfully');
    } catch (error) {
      console.error('Error checking data consistency:', error);
      setError(error.response?.data?.message || 'Error checking data consistency');
      toast.error(error.response?.data?.message || 'Error checking data consistency');
    } finally {
      setLoading(false);
    }
  };

  // Fix data consistency issues
  const fixIssues = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/data-consistency/fix');
      setSuccess(`Fixed ${response.data.results.totalFixed} data consistency issues`);
      toast.success(`Fixed ${response.data.results.totalFixed} data consistency issues`);
      // Refresh the consistency data
      checkConsistency();
    } catch (error) {
      console.error('Error fixing data consistency issues:', error);
      setError(error.response?.data?.message || 'Error fixing data consistency issues');
      toast.error(error.response?.data?.message || 'Error fixing data consistency issues');
    } finally {
      setLoading(false);
    }
  };

  // Load consistency data on component mount
  useEffect(() => {
    if (activeTab === 'dashboard') {
      checkConsistency();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const returnValue = (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Result Monitoring Dashboard
      </Typography>
      <Typography variant="body1" paragraph>
        Use this dashboard to monitor and fix inconsistencies in the result data.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button
          variant={activeTab === 'dashboard' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('dashboard')}
          sx={{ mr: 2 }}
        >
          Dashboard
        </Button>
        <Button
          variant={activeTab === 'duplicates' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('duplicates')}
          sx={{ mr: 2 }}
        >
          Check Duplicates
        </Button>
        <Button
          variant={activeTab === 'grades' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('grades')}
        >
          Check Grades
        </Button>
      </Box>

      {activeTab === 'dashboard' && (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Data Consistency Monitor
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This dashboard helps you monitor and fix data consistency issues in the result system.
              Regular checks help ensure that student results are accurate and reliable.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={checkConsistency}
                startIcon={<RefreshIcon />}
                disabled={loading}
              >
                {loading ? 'Checking...' : 'Check Consistency'}
                {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
              </Button>

              <Button
                variant="contained"
                color="secondary"
                onClick={fixIssues}
                startIcon={<BuildIcon />}
                disabled={loading || !consistencyData || consistencyData.totalIssues === 0}
              >
                {loading ? 'Fixing...' : 'Fix Issues'}
                {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
              </Button>
            </Box>
          </Paper>

          {consistencyData && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Summary
                    </Typography>
                    <Typography variant="h3" color={consistencyData.totalIssues > 0 ? 'error' : 'success'}>
                      {consistencyData.totalIssues}
                    </Typography>
                    <Typography variant="body1">
                      Total Issues Found
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={`${consistencyData.duplicateResults.totalDuplicates} Duplicate Results`}
                          secondary="Results that exist more than once for the same student, exam, and subject"
                        />
                        <Chip
                          label={consistencyData.duplicateResults.totalDuplicates > 0 ? 'Issues' : 'OK'}
                          color={consistencyData.duplicateResults.totalDuplicates > 0 ? 'error' : 'success'}
                          size="small"
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary={`${consistencyData.incorrectGradesAndPoints.totalIncorrect} Incorrect Grades/Points`}
                          secondary="Results with grades or points that don't match the marks obtained"
                        />
                        <Chip
                          label={consistencyData.incorrectGradesAndPoints.totalIncorrect > 0 ? 'Issues' : 'OK'}
                          color={consistencyData.incorrectGradesAndPoints.totalIncorrect > 0 ? 'error' : 'success'}
                          size="small"
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary={`${consistencyData.missingRequiredFields.totalMissing} Missing Required Fields`}
                          secondary="Results missing essential data like student ID, exam ID, or marks"
                        />
                        <Chip
                          label={consistencyData.missingRequiredFields.totalMissing > 0 ? 'Issues' : 'OK'}
                          color={consistencyData.missingRequiredFields.totalMissing > 0 ? 'error' : 'success'}
                          size="small"
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary={`${consistencyData.orphanedResults.totalOrphaned} Orphaned Results`}
                          secondary="Results that reference students, exams, or subjects that no longer exist"
                        />
                        <Chip
                          label={consistencyData.orphanedResults.totalOrphaned > 0 ? 'Issues' : 'OK'}
                          color={consistencyData.orphanedResults.totalOrphaned > 0 ? 'error' : 'success'}
                          size="small"
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="primary"
                      onClick={checkConsistency}
                      disabled={loading}
                    >
                      Refresh
                    </Button>
                    <Button
                      size="small"
                      color="secondary"
                      onClick={fixIssues}
                      disabled={loading || consistencyData.totalIssues === 0}
                    >
                      Fix All Issues
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Details
                    </Typography>

                    {consistencyData.totalIssues === 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', py: 4 }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h6" color="success.main">
                          No issues found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          All data is consistent and valid
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Accordion
                          expanded={expanded === 'duplicates'}
                          onChange={handleChange('duplicates')}
                          disabled={consistencyData.duplicateResults.totalDuplicates === 0}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>
                              Duplicate Results ({consistencyData.duplicateResults.totalDuplicates})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {consistencyData.duplicateResults.oLevelDuplicates.length > 0 && (
                              <Typography variant="body2" gutterBottom>
                                {consistencyData.duplicateResults.oLevelDuplicates.length} duplicate O-Level results found
                              </Typography>
                            )}

                            {consistencyData.duplicateResults.aLevelDuplicates.length > 0 && (
                              <Typography variant="body2" gutterBottom>
                                {consistencyData.duplicateResults.aLevelDuplicates.length} duplicate A-Level results found
                              </Typography>
                            )}
                          </AccordionDetails>
                        </Accordion>

                        <Accordion
                          expanded={expanded === 'grades'}
                          onChange={handleChange('grades')}
                          disabled={consistencyData.incorrectGradesAndPoints.totalIncorrect === 0}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>
                              Incorrect Grades/Points ({consistencyData.incorrectGradesAndPoints.totalIncorrect})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {consistencyData.incorrectGradesAndPoints.incorrectOLevelResults.length > 0 && (
                              <Typography variant="body2" gutterBottom>
                                {consistencyData.incorrectGradesAndPoints.incorrectOLevelResults.length} O-Level results with incorrect grades/points
                              </Typography>
                            )}

                            {consistencyData.incorrectGradesAndPoints.incorrectALevelResults.length > 0 && (
                              <Typography variant="body2" gutterBottom>
                                {consistencyData.incorrectGradesAndPoints.incorrectALevelResults.length} A-Level results with incorrect grades/points
                              </Typography>
                            )}
                          </AccordionDetails>
                        </Accordion>

                        <Accordion
                          expanded={expanded === 'missing'}
                          onChange={handleChange('missing')}
                          disabled={consistencyData.missingRequiredFields.totalMissing === 0}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>
                              Missing Required Fields ({consistencyData.missingRequiredFields.totalMissing})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {consistencyData.missingRequiredFields.oLevelMissing.length > 0 && (
                              <Typography variant="body2" gutterBottom>
                                {consistencyData.missingRequiredFields.oLevelMissing.length} O-Level results with missing fields
                              </Typography>
                            )}

                            {consistencyData.missingRequiredFields.aLevelMissing.length > 0 && (
                              <Typography variant="body2" gutterBottom>
                                {consistencyData.missingRequiredFields.aLevelMissing.length} A-Level results with missing fields
                              </Typography>
                            )}
                          </AccordionDetails>
                        </Accordion>

                        <Accordion
                          expanded={expanded === 'orphaned'}
                          onChange={handleChange('orphaned')}
                          disabled={consistencyData.orphanedResults.totalOrphaned === 0}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>
                              Orphaned Results ({consistencyData.orphanedResults.totalOrphaned})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {consistencyData.orphanedResults.oLevelOrphaned.length > 0 && (
                              <Typography variant="body2" gutterBottom>
                                {consistencyData.orphanedResults.oLevelOrphaned.length} orphaned O-Level results
                              </Typography>
                            )}

                            {consistencyData.orphanedResults.aLevelOrphaned.length > 0 && (
                              <Typography variant="body2" gutterBottom>
                                {consistencyData.orphanedResults.aLevelOrphaned.length} orphaned A-Level results
                              </Typography>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {activeTab === 'duplicates' && (
        <Card>
          <CardHeader title="Check for Duplicate Results" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Student ID"
                  name="studentId"
                  value={duplicateParams.studentId}
                  onChange={handleDuplicateChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Exam ID"
                  name="examId"
                  value={duplicateParams.examId}
                  onChange={handleDuplicateChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Subject ID"
                  name="subjectId"
                  value={duplicateParams.subjectId}
                  onChange={handleDuplicateChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={checkDuplicates}
                    disabled={loading || !duplicateParams.studentId || !duplicateParams.examId || !duplicateParams.subjectId}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Check Duplicates'}
                  </Button>
                  {duplicateResults?.duplicates?.length > 1 && (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={fixDuplicates}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Fix Duplicates'}
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>

            {duplicateResults && (
              <Box sx={{ mt: 3 }}>
                <Alert severity={duplicateResults.success ? 'success' : 'error'}>
                  <AlertTitle>{duplicateResults.success ? 'Success' : 'Error'}</AlertTitle>
                  {duplicateResults.message}
                </Alert>

                {duplicateResults.duplicates && duplicateResults.duplicates.length > 0 && (
                  <Paper sx={{ mt: 2, p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Duplicate Results
                    </Typography>
                    <List>
                      {duplicateResults.duplicates.map((duplicate) => (
                        <ListItem key={duplicate.id} divider>
                          <ListItemText
                            primary={`Result ID: ${duplicate.id}`}
                            secondary={`Marks: ${duplicate.marks}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'grades' && (
        <Card>
          <CardHeader title="Check Grade and Points" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Result ID"
                  name="resultId"
                  value={gradeParams.resultId}
                  onChange={handleGradeChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Education Level</InputLabel>
                  <Select
                    name="educationLevel"
                    value={gradeParams.educationLevel}
                    onChange={handleGradeChange}
                    label="Education Level"
                  >
                    <MenuItem value="O_LEVEL">O-LEVEL</MenuItem>
                    <MenuItem value="A_LEVEL">A-LEVEL</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={checkGrade}
                    disabled={loading || !gradeParams.resultId}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Check Grade'}
                  </Button>
                  {gradeResults && !gradeResults.success && (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={fixGrade}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Fix Grade'}
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>

            {gradeResults && (
              <Box sx={{ mt: 3 }}>
                <Alert severity={gradeResults.success ? 'success' : 'error'}>
                  <AlertTitle>{gradeResults.success ? 'Success' : 'Error'}</AlertTitle>
                  {gradeResults.message}
                </Alert>

                {gradeResults.expected && (
                  <Paper sx={{ mt: 2, p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Grade Comparison
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1">Actual</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip label={`Grade: ${gradeResults.actual.grade}`} color="primary" />
                          <Chip label={`Points: ${gradeResults.actual.points}`} color="primary" />
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1">Expected</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip label={`Grade: ${gradeResults.expected.grade}`} color="secondary" />
                          <Chip label={`Points: ${gradeResults.expected.points}`} color="secondary" />
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );

  // Return the component with snackbars
  return (
    <>
      {returnValue}

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ResultMonitoringDashboard;
