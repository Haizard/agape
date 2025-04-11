import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
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
  Button,
  CircularProgress,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import './TabularReport.css';

/**
 * TabularReport Component
 * Displays a comprehensive academic report in a tabular format
 * matching the structure shown in the reference image
 */
const TabularReport = () => {
  const { studentId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  // Generate demo data for testing
  const generateDemoData = useCallback(() => {
    // Form 5 subjects (both principal and compulsory)
    const subjects = [
      // Principal subjects
      { code: 'PHY', name: 'Physics', marks: 78, grade: 'B', points: 2, isPrincipal: true },
      { code: 'CHE', name: 'Chemistry', marks: 65, grade: 'C', points: 3, isPrincipal: true },
      { code: 'MAT', name: 'Mathematics', marks: 72, grade: 'B', points: 2, isPrincipal: true },
      // Compulsory subjects
      { code: 'GS', name: 'General Studies', marks: 68, grade: 'C', points: 3, isPrincipal: false },
      { code: 'BAM', name: 'Basic Applied Mathematics', marks: 55, grade: 'D', points: 4, isPrincipal: false },
      { code: 'ENG', name: 'English Language', marks: 62, grade: 'C', points: 3, isPrincipal: false },
      { code: 'HKL', name: 'History, Kiswahili & Literature', marks: 70, grade: 'B', points: 2, isPrincipal: false }
    ];
    
    // Calculate total marks and points
    const totalMarks = subjects.reduce((sum, s) => sum + s.marks, 0);
    const totalPoints = subjects.reduce((sum, s) => sum + s.points, 0);
    const averageMarks = (totalMarks / subjects.length).toFixed(1);
    
    // Calculate best three principal points
    const principalSubjects = subjects.filter(s => s.isPrincipal);
    const bestThreePrincipal = [...principalSubjects].sort((a, b) => a.points - b.points).slice(0, 3);
    const bestThreePoints = bestThreePrincipal.reduce((sum, s) => sum + s.points, 0);
    
    // Determine division
    let division = 'N/A';
    if (bestThreePoints >= 3 && bestThreePoints <= 9) division = 'I';
    else if (bestThreePoints >= 10 && bestThreePoints <= 12) division = 'II';
    else if (bestThreePoints >= 13 && bestThreePoints <= 17) division = 'III';
    else if (bestThreePoints >= 18 && bestThreePoints <= 19) division = 'IV';
    else if (bestThreePoints >= 20 && bestThreePoints <= 21) division = 'V';
    
    return {
      schoolInfo: {
        name: 'AGAPE LUTHERAN JUNIOR SEMINARY',
        address: 'P.O. BOX 8882, MOSHI, KILIMANJARO',
        phone: '+255 27 2755088',
        email: 'agapelutheran@elct.org',
        logo: '/images/school-logo.png'
      },
      examInfo: {
        name: 'MID-TERM EXAMINATION',
        term: 'TERM II',
        academicYear: '2023-2024',
        date: 'MARCH 2024'
      },
      studentInfo: {
        name: 'JOHN DOE',
        admissionNumber: 'F5-001',
        class: 'FORM 5 SCIENCE',
        stream: 'PCM',
        gender: 'MALE'
      },
      subjects: subjects,
      summary: {
        totalMarks,
        averageMarks,
        totalPoints,
        bestThreePoints,
        division,
        rank: '3',
        totalStudents: '25'
      }
    };
  }, []);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For demo purposes, generate demo data
      if (studentId === 'demo' || !studentId) {
        const demoData = generateDemoData();
        setReport(demoData);
        setLoading(false);
        return;
      }

      // In a real implementation, fetch data from API
      const reportUrl = `${process.env.REACT_APP_API_URL || ''}/api/tabular-report/student/${studentId}/${examId}`;
      
      const response = await axios.get(reportUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setReport(response.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(`Failed to load report: ${err.message}`);
      
      // For development, still show demo data on error
      const demoData = generateDemoData();
      setReport(demoData);
    } finally {
      setLoading(false);
    }
  }, [studentId, examId, generateDemoData]);

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
    // In a real implementation, this would generate a PDF
    alert('PDF download functionality would be implemented here');
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

  // If error and no report, show error message
  if (error && !report) {
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
    <Box className="tabular-report-container">
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
      </Box>

      {/* Report Paper */}
      <Paper elevation={0} className="report-paper">
        {/* Header Section */}
        <Box className="report-header">
          <Box className="header-left">
            <Typography variant="h6" className="school-name">
              {report.schoolInfo.name}
            </Typography>
            <Typography variant="body2">
              {report.schoolInfo.address}
            </Typography>
            <Typography variant="body2">
              Tel: {report.schoolInfo.phone}
            </Typography>
          </Box>
          
          <Box className="header-center">
            {report.schoolInfo.logo ? (
              <img 
                src={report.schoolInfo.logo} 
                alt="School Logo" 
                className="school-logo"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/80?text=Logo';
                }}
              />
            ) : (
              <Box className="logo-placeholder">
                LOGO
              </Box>
            )}
          </Box>
          
          <Box className="header-right">
            <Typography variant="h6" className="report-title">
              {report.examInfo.name}
            </Typography>
            <Typography variant="body2">
              {report.examInfo.term}
            </Typography>
            <Typography variant="body2">
              {report.examInfo.academicYear}
            </Typography>
          </Box>
        </Box>

        <Divider className="header-divider" />

        {/* Student Information */}
        <Box className="student-info-section">
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body1" className="student-info-item">
                <span className="info-label">NAME:</span> {report.studentInfo.name}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" className="student-info-item">
                <span className="info-label">CLASS:</span> {report.studentInfo.class}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" className="student-info-item">
                <span className="info-label">ADM NO:</span> {report.studentInfo.admissionNumber}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" className="student-info-item">
                <span className="info-label">STREAM:</span> {report.studentInfo.stream}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Main Report Table */}
        <TableContainer className="report-table-container">
          <Table className="report-table">
            <TableHead>
              <TableRow className="table-header-row">
                <TableCell className="subject-cell">SUBJECT</TableCell>
                <TableCell align="center">MARKS</TableCell>
                <TableCell align="center">GRADE</TableCell>
                <TableCell align="center">POINTS</TableCell>
                <TableCell align="center">REMARKS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Principal Subjects */}
              <TableRow className="subject-category-row">
                <TableCell colSpan={5} className="category-cell">
                  PRINCIPAL SUBJECTS
                </TableCell>
              </TableRow>
              {report.subjects.filter(s => s.isPrincipal).map((subject, index) => (
                <TableRow key={`principal-${subject.code}`} className="subject-row">
                  <TableCell className="subject-cell">{subject.name}</TableCell>
                  <TableCell align="center">{subject.marks}</TableCell>
                  <TableCell align="center">{subject.grade}</TableCell>
                  <TableCell align="center">{subject.points}</TableCell>
                  <TableCell align="center">
                    {subject.grade === 'A' ? 'EXCELLENT' :
                     subject.grade === 'B' ? 'VERY GOOD' :
                     subject.grade === 'C' ? 'GOOD' :
                     subject.grade === 'D' ? 'SATISFACTORY' :
                     subject.grade === 'E' ? 'POOR' : 'FAIL'}
                  </TableCell>
                </TableRow>
              ))}

              {/* Compulsory Subjects */}
              <TableRow className="subject-category-row">
                <TableCell colSpan={5} className="category-cell">
                  COMPULSORY SUBJECTS
                </TableCell>
              </TableRow>
              {report.subjects.filter(s => !s.isPrincipal).map((subject, index) => (
                <TableRow key={`compulsory-${subject.code}`} className="subject-row">
                  <TableCell className="subject-cell">{subject.name}</TableCell>
                  <TableCell align="center">{subject.marks}</TableCell>
                  <TableCell align="center">{subject.grade}</TableCell>
                  <TableCell align="center">{subject.points}</TableCell>
                  <TableCell align="center">
                    {subject.grade === 'A' ? 'EXCELLENT' :
                     subject.grade === 'B' ? 'VERY GOOD' :
                     subject.grade === 'C' ? 'GOOD' :
                     subject.grade === 'D' ? 'SATISFACTORY' :
                     subject.grade === 'E' ? 'POOR' : 'FAIL'}
                  </TableCell>
                </TableRow>
              ))}

              {/* Summary Rows */}
              <TableRow className="summary-row">
                <TableCell className="summary-label">TOTAL</TableCell>
                <TableCell align="center">{report.summary.totalMarks}</TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="center">{report.summary.totalPoints}</TableCell>
                <TableCell align="center">-</TableCell>
              </TableRow>
              <TableRow className="summary-row">
                <TableCell className="summary-label">AVERAGE</TableCell>
                <TableCell align="center">{report.summary.averageMarks}</TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="center">-</TableCell>
              </TableRow>
              <TableRow className="summary-row">
                <TableCell className="summary-label">RANK</TableCell>
                <TableCell align="center">{report.summary.rank} OUT OF {report.summary.totalStudents}</TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="center">-</TableCell>
              </TableRow>
              <TableRow className="summary-row">
                <TableCell className="summary-label">DIVISION</TableCell>
                <TableCell align="center">{report.summary.division}</TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="center">POINTS: {report.summary.bestThreePoints}</TableCell>
                <TableCell align="center">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Signatures Section */}
        <Box className="signatures-section">
          <Box className="signature-box">
            <Box className="signature-line"></Box>
            <Typography variant="body2">Class Teacher's Signature</Typography>
          </Box>
          
          <Box className="signature-box">
            <Box className="signature-line"></Box>
            <Typography variant="body2">Principal's Signature & Stamp</Typography>
          </Box>
        </Box>

        {/* Footer */}
        <Box className="report-footer">
          <Typography variant="body2" align="center">
            "Excellence Through Discipline and Hard Work"
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

TabularReport.propTypes = {
  studentId: PropTypes.string,
  examId: PropTypes.string
};

export default TabularReport;
