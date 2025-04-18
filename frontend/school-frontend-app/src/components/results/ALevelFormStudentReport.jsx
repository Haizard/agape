import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
  Chip
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { generateALevelStudentResultPDF } from '../../utils/aLevelPdfGenerator';

const ALevelFormStudentReport = () => {
  const { form, studentId, examId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine the correct endpoint based on form
      const formLevel = form === 'form5' ? 'form5' : 'form6';

      // Fetch the report data from the form-specific A-Level endpoint
      const reportUrl = `/api/a-level-reports/form${formLevel === 'form5' ? '5' : '6'}/student/${studentId}/${examId}`;
      const response = await axios.get(reportUrl);
      const data = response.data;

      // Ensure this is an A-Level report
      if (!data.educationLevel || data.educationLevel !== 'A_LEVEL') {
        setError('This is not an A-Level student report');
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
  }, [studentId, examId, form]);

  // Initial fetch
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Generate PDF
  const handleGeneratePDF = () => {
    if (!report) return;

    try {
      generateALevelStudentResultPDF(report);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  // Download PDF
  const handleDownloadPDF = () => {
    try {
      // Determine the correct endpoint based on form
      const formLevel = form === 'form5' ? 'form5' : 'form6';

      // Use the API endpoint to download the PDF
      const pdfUrl = `/api/a-level-reports/${formLevel}/student/${studentId}/${examId}/pdf`;
      window.open(pdfUrl, '_blank');
    } catch (err) {
      console.error('Error downloading PDF:', err);
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
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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

      {/* Student Details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Student Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Name:</strong> {report.studentDetails.name}
            </Typography>
            <Typography variant="body1">
              <strong>Roll Number:</strong> {report.studentDetails.rollNumber}
            </Typography>
            <Typography variant="body1">
              <strong>Class:</strong> {report.studentDetails.class}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Gender:</strong> {report.studentDetails.gender}
            </Typography>
            <Typography variant="body1">
              <strong>Form:</strong> {report.studentDetails.form}
            </Typography>
            <Typography variant="body1">
              <strong>Combination:</strong> {report.subjectCombination?.name} ({report.subjectCombination?.code})
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Subject Results */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Subject Results
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Marks</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Points</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.subjectResults.map((result, index) => (
                <TableRow key={index} sx={{
                  backgroundColor: result.isPrincipal ? 'rgba(144, 202, 249, 0.1)' : 'inherit'
                }}>
                  <TableCell>
                    {result.subject} ({result.code})
                  </TableCell>
                  <TableCell>
                    {result.isPrincipal ? 'Principal' : 'Subsidiary'}
                  </TableCell>
                  <TableCell>{result.marks}</TableCell>
                  <TableCell>
                    <Chip
                      label={result.grade}
                      color={
                        result.grade === 'A' ? 'success' :
                        result.grade === 'B' ? 'primary' :
                        result.grade === 'C' ? 'secondary' :
                        result.grade === 'D' ? 'warning' :
                        result.grade === 'E' ? 'error' :
                        'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{result.points}</TableCell>
                  <TableCell>{result.remarks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Result Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Results
                </Typography>
                <Typography variant="body1">
                  <strong>Total Marks:</strong> {report.summary.totalMarks}
                </Typography>
                <Typography variant="body1">
                  <strong>Average Marks:</strong> {report.summary.averageMarks}
                </Typography>
                <Typography variant="body1">
                  <strong>Best Three Points:</strong> {report.summary.bestThreePoints}
                </Typography>
                <Typography variant="body1">
                  <strong>Division:</strong> {report.summary.division}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Form 5 Results for Form 6 Students */}
          {form === 'form6' && report.form5Results && (
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Form 5 Results ({report.form5Results.examName})
                  </Typography>
                  <Typography variant="body1">
                    <strong>Average Marks:</strong> {report.form5Results.averageMarks}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Best Three Points:</strong> {report.form5Results.bestThreePoints}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Division:</strong> {report.form5Results.division}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Grade Distribution */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Grade Distribution
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(report.summary.gradeDistribution).map(([grade, count]) => (
              <Grid item key={grade}>
                <Chip
                  label={`${grade}: ${count}`}
                  color={
                    grade === 'A' ? 'success' :
                    grade === 'B' ? 'primary' :
                    grade === 'C' ? 'secondary' :
                    grade === 'D' ? 'warning' :
                    grade === 'E' ? 'error' :
                    'default'
                  }
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      {/* Final Recommendation for Form 6 */}
      {form === 'form6' && report.finalRecommendation && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Final Recommendation
          </Typography>
          <Typography variant="body1">
            {report.finalRecommendation}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ALevelFormStudentReport;
