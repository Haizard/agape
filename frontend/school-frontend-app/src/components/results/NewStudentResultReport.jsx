import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
  Snackbar
} from '@mui/material';
import {
  Print as PrintIcon,
  Share as ShareIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { getStudentResultReport } from '../../services/normalizedApi';
import { generateStudentResultPDF } from '../../utils/pdfGenerator';
import { generateOLevelStudentResultPDF } from '../../utils/oLevelPdfGenerator';

/**
 * A completely redesigned student result report component
 * This component uses the normalized data from the API
 */
const NewStudentResultReport = () => {
  const { studentId, examId } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [gradeDistribution, setGradeDistribution] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // Get education level from URL query parameters
  const getEducationLevel = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('level') || 'O_LEVEL';
  }, [location.search]);

  // Fetch the student result report
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const educationLevel = getEducationLevel();
      console.log(`Fetching result report for student ${studentId} and exam ${examId} with education level ${educationLevel}`);
      const data = await getStudentResultReport(studentId, examId, educationLevel);
      console.log('Normalized report data:', data);
      setReport(data);

      // Calculate grade distribution
      if (data?.results) {
        const distribution = {};
        for (const result of data.results) {
          const grade = result.grade || 'N/A';
          distribution[grade] = (distribution[grade] || 0) + 1;
        }
        setGradeDistribution(distribution);
      }

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
  }, [studentId, examId, getEducationLevel]);

  // Fetch the report when the component mounts
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

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
      // Get the education level
      const educationLevel = getEducationLevel();

      // Generate the PDF using the appropriate generator
      let doc;
      if (educationLevel === 'O_LEVEL') {
        doc = generateOLevelStudentResultPDF({ ...report, gradeDistribution });
      } else {
        doc = generateStudentResultPDF({ ...report, gradeDistribution });
      }

      // Save the PDF
      const levelPrefix = educationLevel === 'O_LEVEL' ? 'O_Level' : 'Report';
      const fileName = `${report.student?.fullName || 'Student'}_${report.exam?.name || 'Exam'}_${levelPrefix}.pdf`;
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

  // Get division explanation
  const getDivisionExplanation = (points) => {
    if (!points) return '';

    const numPoints = Number(points);
    if (numPoints >= 7 && numPoints <= 14) return 'Division I (7-14 points)';
    if (numPoints >= 15 && numPoints <= 21) return 'Division II (15-21 points)';
    if (numPoints >= 22 && numPoints <= 25) return 'Division III (22-25 points)';
    if (numPoints >= 26 && numPoints <= 32) return 'Division IV (26-32 points)';
    if (numPoints >= 33 && numPoints <= 36) return 'Division 0 (33-36 points)';
    return '';
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading result report...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchReport}>
          Try Again
        </Button>
      </Box>
    );
  }

  // Show empty state
  if (!report) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No result report found for this student and exam.
        </Alert>
      </Box>
    );
  }

  // Render the report
  return (
    <Box sx={{ p: 3 }}>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
      />
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            {/* Header with church name */}
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <Typography variant="h6" gutterBottom>
                Evangelical Lutheran Church in Tanzania - Northern Diocese
              </Typography>
              <Typography variant="h4" gutterBottom>
                Agape Lutheran Junior Seminary
              </Typography>
            </Box>

            {/* Contact information */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {/* Left side - P.O. Box */}
              <Grid item xs={4} sx={{ textAlign: 'left' }}>
                <Typography variant="body2">
                  P.O.BOX 8882,<br />
                  Moshi, Tanzania
                </Typography>
              </Grid>

              {/* Center - Logo */}
              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={`${process.env.PUBLIC_URL}/images/lutheran_logo.png`}
                    alt="Lutheran Church Logo"
                    style={{ width: '80px', height: '80px' }}
                    onError={(e) => {
                      console.error('Error loading image:', e);
                      e.target.src = `${process.env.PUBLIC_URL}/favicon.ico`; // Fallback image
                    }}
                  />
                </Box>
              </Grid>

              {/* Right side - Contact details */}
              <Grid item xs={4} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">
                  Mobile phone: 0759767735<br />
                  Email: infoagapeseminary@gmail.co
                </Typography>
              </Grid>
            </Grid>

            {/* Report title */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="h5" gutterBottom>
                O-LEVEL STUDENT RESULT REPORT
              </Typography>
              <Typography variant="subtitle1">
                Academic Year: {report?.academicYear || 'Unknown'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ mb: 1 }}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ mb: 1 }}
              onClick={handleDownload}
            >
              Download PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
            >
              Share
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">
              Student Information
            </Typography>
            <Typography variant="body1">
              <strong>Name:</strong> {report?.student?.fullName || '-'}
            </Typography>
            <Typography variant="body1">
              <strong>Class:</strong> {report?.class?.fullName || '-'}
            </Typography>
            <Typography variant="body1">
              <strong>Academic Year:</strong> {report?.academicYear || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">
              Exam Information
            </Typography>
            <Typography variant="body1">
              <strong>Exam:</strong> {report?.exam?.name || '-'}
            </Typography>
            <Typography variant="body1">
              <strong>Term:</strong> {report?.exam?.term || '-'}
            </Typography>
            <Typography variant="body1">
              <strong>Year:</strong> {report?.exam?.year || '-'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="text.secondary">
                Total Marks
              </Typography>
              <Typography variant="h4">
                {report?.totalMarks || '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="text.secondary">
                Average Marks
              </Typography>
              <Typography variant="h4">
                {report?.averageMarks ? `${report.averageMarks}%` : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="text.secondary">
                Division
              </Typography>
              <Typography variant="h4">
                {report?.division || '-'}
              </Typography>
              <Typography variant="caption">
                {report?.points ? getDivisionExplanation(report.points) : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="text.secondary">
                Rank
              </Typography>
              <Typography variant="h4">
                {report?.rank || '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Subject Results Table */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Subject Results
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell align="center">Marks</TableCell>
                <TableCell align="center">Grade</TableCell>
                <TableCell align="center">Points</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report?.results?.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{result.subject?.name}</TableCell>
                  <TableCell align="center">{result.marks}</TableCell>
                  <TableCell align="center">{result.grade}</TableCell>
                  <TableCell align="center">{result.points}</TableCell>
                  <TableCell>{result.remarks}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={1}><strong>Total</strong></TableCell>
                <TableCell align="center"><strong>{report?.totalMarks || '-'}</strong></TableCell>
                <TableCell align="center"><strong>{report?.grade || '-'}</strong></TableCell>
                <TableCell align="center"><strong>{report?.points || '-'}</strong></TableCell>
                <TableCell><strong>{report?.remarks || '-'}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Grade Distribution */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Grade Distribution
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(gradeDistribution).map(([grade, count]) => (
            <Grid item key={grade} xs={6} sm={4} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="h5" align="center">
                    {grade}
                  </Typography>
                  <Typography variant="h4" align="center">
                    {count}
                  </Typography>
                  <Typography variant="caption" align="center" display="block">
                    subjects
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default NewStudentResultReport;
