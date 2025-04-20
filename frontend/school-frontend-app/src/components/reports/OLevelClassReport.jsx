import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const OLevelClassReport = () => {
  const { classId, examId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchReport();
  }, [classId, examId]);

  const fetchReport = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cacheKey = `o-level-class-report-${classId}-${examId}`;
      const cachedData = sessionStorage.getItem(cacheKey);

      if (!forceRefresh && cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;

          // Use cache if it's less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            setReport(parsed.data);
            setIsFromCache(true);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing cached report data:', e);
        }
      }

      // Fetch from API
      // Use the new standardized API endpoint
      const response = await axios.get(`${API_URL}api/o-level/reports/class/${classId}/${examId}`);
      const reportData = response.data.data;

      // Update state
      setReport(reportData);
      setIsFromCache(false);

      // Cache the data
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: reportData,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error('Error caching report data:', e);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.message || 'Error fetching report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Use the new standardized API endpoint for PDF download
    window.open(`${API_URL}api/o-level/reports/class/${classId}/${examId}?format=pdf`, '_blank');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
        {error}
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => fetchReport(true)}
          sx={{ ml: 2 }}
        >
          Retry
        </Button>
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

  // Get all subjects from the first student (assuming all students have the same subjects)
  const subjects = report.subjects || [];

  return (
    <Box sx={{ p: 2 }}>
      {/* Action buttons */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }} className="no-print">
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchReport(true)}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ mr: 1 }}
          >
            Download PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Cache indicator */}
      {isFromCache && (
        <Alert severity="info" sx={{ mb: 2 }} className="no-print">
          Showing cached report data. <Button size="small" onClick={() => fetchReport(true)}>Refresh</Button>
        </Alert>
      )}

      {/* Main report */}
      <Paper sx={{ p: 3 }} className="print-container">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5">AGAPE LUTHERAN JUNIOR SEMINARY</Typography>
          <Typography variant="h6">O-LEVEL CLASS RESULT REPORT</Typography>
          <Typography variant="body1">Academic Year: {report.academicYear}</Typography>
          <Typography variant="body1">Class: {report.className} {report.section} {report.stream}</Typography>
          <Typography variant="body1">Exam: {report.examName}</Typography>
          <Typography variant="body1">Date: {report.examDate}</Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Class Results Table */}
        <Typography variant="h6" gutterBottom>Class Results</Typography>
        <TableContainer component={Paper} sx={{ mb: 3, maxWidth: '100%', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>No.</TableCell>
                <TableCell>Student Name (3 NAMES)</TableCell>
                <TableCell>SEX</TableCell>
                <TableCell>Roll No.</TableCell>
                {subjects.map((subject) => (
                  <TableCell key={subject.id} align="center">{subject.code}</TableCell>
                ))}
                <TableCell align="center">Total</TableCell>
                <TableCell align="center">Average</TableCell>
                <TableCell align="center">Division</TableCell>
                <TableCell align="center">POINTS</TableCell>
                <TableCell align="center">Rank</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? report.students.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : report.students
              ).map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.rank}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.gender || student.sex || '-'}</TableCell>
                  <TableCell>{student.rollNumber}</TableCell>
                  {subjects.map((subject) => {
                    const result = student.results.find(r => r.subject === subject.name);
                    return (
                      <TableCell key={`${student.id}-${subject.id}`} align="center">
                        {result ? `${result.marks} (${result.grade})` : '-'}
                      </TableCell>
                    );
                  })}
                  <TableCell align="center">{student.totalMarks}</TableCell>
                  <TableCell align="center">{student.averageMarks}</TableCell>
                  <TableCell align="center">{student.division}</TableCell>
                  <TableCell align="center">{student.bestSevenPoints || student.totalPoints || student.points || '-'}</TableCell>
                  <TableCell align="center">{student.rank}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination - only show in non-print view */}
        <Box sx={{ mb: 3 }} className="no-print">
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100, { label: 'All', value: -1 }]}
            component="div"
            count={report.students.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>

        {/* Class Summary */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Class Summary</Typography>
              <Typography variant="body1"><strong>Total Students:</strong> {report.totalStudents}</Typography>
              <Typography variant="body1"><strong>Class Average:</strong> {report.classAverage}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Division Distribution</Typography>
              <Grid container spacing={1}>
                {Object.entries(report.divisionSummary || {}).map(([division, count]) => (
                  <Grid item xs={4} key={division}>
                    <Typography variant="body1">
                      <strong>Division {division}:</strong> {count} ({report.totalStudents ? ((count / report.totalStudents) * 100).toFixed(1) : 0}%)
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Result Summary */}
        <Typography variant="h6" gutterBottom>Result Summary</Typography>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
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
              {report.subjectAnalysis?.map((subject) => {
                // Calculate GPA (1-5 scale, A=1, F=5)
                const totalStudents = Object.values(subject.grades).reduce((sum, count) => sum + count, 0);
                const totalPoints = subject.grades.A * 1 + subject.grades.B * 2 + subject.grades.C * 3 +
                                    subject.grades.D * 4 + subject.grades.F * 5;
                const gpa = totalStudents > 0 ? (totalPoints / totalStudents).toFixed(2) : '0.00';

                return (
                  <TableRow key={subject.code}>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell align="center">{totalStudents}</TableCell>
                    <TableCell align="center" sx={{ color: '#4caf50', fontWeight: 'bold' }}>{subject.grades.A}</TableCell>
                    <TableCell align="center" sx={{ color: '#2196f3', fontWeight: 'bold' }}>{subject.grades.B}</TableCell>
                    <TableCell align="center" sx={{ color: '#ff9800', fontWeight: 'bold' }}>{subject.grades.C}</TableCell>
                    <TableCell align="center" sx={{ color: '#ff5722', fontWeight: 'bold' }}>{subject.grades.D}</TableCell>
                    <TableCell align="center" sx={{ color: '#f44336', fontWeight: 'bold' }}>{subject.grades.F}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{gpa}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Subject Analysis */}
        <Typography variant="h6" gutterBottom>Subject Analysis</Typography>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell align="center">Average</TableCell>
                <TableCell align="center">Highest</TableCell>
                <TableCell align="center">Lowest</TableCell>
                <TableCell align="center">A</TableCell>
                <TableCell align="center">B</TableCell>
                <TableCell align="center">C</TableCell>
                <TableCell align="center">D</TableCell>
                <TableCell align="center">F</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.subjectAnalysis?.map((subject) => (
                <TableRow key={subject.code}>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell align="center">{subject.averageMarks.toFixed(2)}</TableCell>
                  <TableCell align="center">{subject.highestMarks}</TableCell>
                  <TableCell align="center">{subject.lowestMarks}</TableCell>
                  <TableCell align="center">{subject.grades.A}</TableCell>
                  <TableCell align="center">{subject.grades.B}</TableCell>
                  <TableCell align="center">{subject.grades.C}</TableCell>
                  <TableCell align="center">{subject.grades.D}</TableCell>
                  <TableCell align="center">{subject.grades.F}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Approval Section */}
        <Paper sx={{ p: 3, mb: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
            APPROVED BY
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={4}>
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

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption">
            O-LEVEL Division Guide: Division I: 7-17 points, Division II: 18-21 points, Division III: 22-25 points, Division IV: 26-33 points, Division 0: 34+ points
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default OLevelClassReport;
