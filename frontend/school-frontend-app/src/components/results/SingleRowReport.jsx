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
  Download as DownloadIcon
} from '@mui/icons-material';

import './SingleRowReport.css';

/**
 * SingleRowReport Component
 * Displays a comprehensive academic report in a tabular format
 * with all subjects, points, division, and student information in a single view
 */
const SingleRowReport = () => {
  const { studentId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  // Generate demo data for testing
  const generateDemoData = useCallback((formLevel) => {
    const isForm5 = formLevel === 5 || studentId === 'demo-form5';

    // Create all subjects (both principal and subsidiary/compulsory)
    const allSubjects = [
      // Principal subjects
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
      },
      // Subsidiary/Compulsory subjects
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
        subject: 'History and Political Studies',
        code: 'HKL',
        marks: isForm5 ? 62 : 70,
        grade: isForm5 ? 'C' : 'B',
        points: isForm5 ? 3 : 2,
        isPrincipal: false,
        remarks: isForm5 ? 'Good' : 'Very Good'
      },
      {
        subject: 'English Language',
        code: 'ENG',
        marks: isForm5 ? 70 : 75,
        grade: isForm5 ? 'B' : 'B',
        points: isForm5 ? 2 : 2,
        isPrincipal: false,
        remarks: isForm5 ? 'Very Good' : 'Very Good'
      }
    ];

    // Calculate grade distribution
    const gradeDistribution = {
      A: allSubjects.filter(s => s.grade === 'A').length,
      B: allSubjects.filter(s => s.grade === 'B').length,
      C: allSubjects.filter(s => s.grade === 'C').length,
      D: allSubjects.filter(s => s.grade === 'D').length,
      E: allSubjects.filter(s => s.grade === 'E').length,
      S: allSubjects.filter(s => s.grade === 'S').length,
      F: allSubjects.filter(s => s.grade === 'F').length
    };

    // Calculate total marks and points
    const subjectsWithMarks = allSubjects.filter(s => s.marks !== null);
    const totalMarks = subjectsWithMarks.reduce((sum, s) => sum + s.marks, 0);
    const totalPoints = subjectsWithMarks.reduce((sum, s) => sum + s.points, 0);
    const averageMarks = subjectsWithMarks.length > 0 ? totalMarks / subjectsWithMarks.length : 0;

    // Calculate best three principal points
    const principalSubjects = allSubjects.filter(s => s.isPrincipal);
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
      reportTitle: 'Academic Report',
      schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
      schoolAddress: 'P.O. BOX 8882, MOSHI, KILIMANJARO',
      schoolLogo: '/images/school-logo.png',
      academicYear: '2023-2024',
      term: 'Term 2',
      examName: 'Mid-Term Examination',
      examDate: '2023-10-15 - 2023-10-25',
      studentDetails: {
        name: isForm5 ? 'John Doe' : 'Jane Smith',
        rollNumber: isForm5 ? 'F5-001' : 'F6-001',
        class: isForm5 ? 'Form 5 Science' : 'Form 6 Science',
        gender: isForm5 ? 'Male' : 'Female',
        form: isForm5 ? 'Form 5' : 'Form 6',
        subjectCombination: 'PCM (Physics, Chemistry, Mathematics)',
        dateOfBirth: '2005-05-15',
        admissionNumber: isForm5 ? 'ADM-2022-001' : 'ADM-2021-002',
        parentName: isForm5 ? 'Mr. & Mrs. Doe' : 'Mr. & Mrs. Smith',
        parentContact: isForm5 ? '+255 123 456 789' : '+255 987 654 321'
      },
      allSubjects,
      principalSubjects: allSubjects.filter(s => s.isPrincipal),
      subsidiarySubjects: allSubjects.filter(s => !s.isPrincipal),
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
      educationLevel: 'A_LEVEL',
      formLevel: isForm5 ? 5 : 6
    };
  }, [studentId]);

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

      // Fetch the report data from the API
      const reportUrl = `${process.env.REACT_APP_API_URL || ''}/api/results/comprehensive/student/${studentId}/${examId}`;
      console.log('Fetching report data from unified endpoint:', reportUrl);

      const response = await axios.get(reportUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Report response:', response.data);
      const data = response.data;

      // Ensure this is an A-Level report
      if (!data.educationLevel || data.educationLevel !== 'A_LEVEL') {
        throw new Error('This is not an A-Level report. Please use the O-Level report component.');
      }

      // If data is empty or doesn't have expected structure, show error message
      if (!data || (!data.principalSubjects && !data.subsidiarySubjects)) {
        console.log('No data from API endpoint');
        // Set error message
        setError('No results found for this student. Please check if marks have been entered for this exam.');
        setLoading(false);
        return;
      }

      // We have valid data, set it
      setReport(data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(`Failed to load report: ${err.message}`);
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
    // Open the PDF version in a new tab (backend will generate PDF)
    const pdfUrl = `${process.env.REACT_APP_API_URL || ''}/api/results/comprehensive/student/${studentId}/${examId}`;
    window.open(pdfUrl, '_blank');
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
    <Box className="single-row-report-container">
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

      {/* Report Header */}
      <Box className="report-header">
        <Box className="header-left">
          <Typography variant="h6" className="school-name">
            {report.schoolName}
          </Typography>
          <Typography variant="body2" className="school-address">
            {report.schoolAddress}
          </Typography>
          <Typography variant="body1" className="exam-info">
            {report.examName} - {report.academicYear}
          </Typography>
        </Box>

        <Box className="header-center">
          {report.schoolLogo ? (
            <img
              src={report.schoolLogo}
              alt="School Logo"
              className="school-logo"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/80?text=Logo';
              }}
            />
          ) : (
            <Box className="logo-placeholder">
              <Typography variant="h4">
                {report.schoolName?.charAt(0) || 'A'}
              </Typography>
            </Box>
          )}
        </Box>

        <Box className="header-right">
          <Typography variant="body1" className="report-title">
            STUDENT ACADEMIC REPORT
          </Typography>
          <Typography variant="body2" className="term-info">
            {report.term}
          </Typography>
          <Typography variant="body2" className="date-info">
            {report.examDate}
          </Typography>
        </Box>
      </Box>

      {/* Student Info, Points, Division Row */}
      <Box className="student-info-row">
        <Grid container spacing={0} className="info-grid">
          <Grid item xs={4} className="student-details">
            <Typography variant="body1" className="student-name">
              <strong>Name:</strong> {report.studentDetails?.name}
            </Typography>
            <Typography variant="body1" className="student-class">
              <strong>Class:</strong> {report.studentDetails?.class}
            </Typography>
            <Typography variant="body1" className="student-number">
              <strong>Adm No:</strong> {report.studentDetails?.admissionNumber}
            </Typography>
          </Grid>

          <Grid item xs={4} className="points-details">
            <Typography variant="body1" className="points-info">
              <strong>Total Points:</strong> {report.summary?.totalPoints}
            </Typography>
            <Typography variant="body1" className="points-info">
              <strong>Best 3 Points:</strong> {report.summary?.bestThreePoints}
            </Typography>
            <Typography variant="body1" className="points-info">
              <strong>Average:</strong> {report.summary?.averageMarks}
            </Typography>
          </Grid>

          <Grid item xs={4} className="division-details">
            <Typography variant="body1" className="division-info">
              <strong>Division:</strong> {report.summary?.division}
            </Typography>
            <Typography variant="body1" className="rank-info">
              <strong>Rank:</strong> {report.summary?.rank} of {report.summary?.totalStudents}
            </Typography>
            <Typography variant="body1" className="combination-info">
              <strong>Combination:</strong> {report.studentDetails?.subjectCombination}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Main Report Table */}
      <TableContainer component={Paper} className="report-table-container">
        <Table className="report-table">
          <TableHead>
            <TableRow className="table-header-row">
              <TableCell className="subject-header">SUBJECT</TableCell>
              {report.allSubjects.map((subject) => (
                <TableCell
                  key={subject.code}
                  align="center"
                  className={subject.isPrincipal ? "principal-subject" : "subsidiary-subject"}
                >
                  {subject.code}
                </TableCell>
              ))}
              <TableCell align="center" className="total-header">TOTAL</TableCell>
              <TableCell align="center" className="average-header">AVG</TableCell>
              <TableCell align="center" className="grade-header">GRADE</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Marks Row */}
            <TableRow className="marks-row">
              <TableCell className="row-label">MARKS</TableCell>
              {report.allSubjects.map((subject) => (
                <TableCell key={`marks-${subject.code}`} align="center">
                  {subject.marks !== null ? subject.marks : '-'}
                </TableCell>
              ))}
              <TableCell align="center">{report.summary?.totalMarks}</TableCell>
              <TableCell align="center">{report.summary?.averageMarks}</TableCell>
              <TableCell align="center">-</TableCell>
            </TableRow>

            {/* Grade Row */}
            <TableRow className="grade-row">
              <TableCell className="row-label">GRADE</TableCell>
              {report.allSubjects.map((subject) => (
                <TableCell key={`grade-${subject.code}`} align="center">
                  {subject.grade}
                </TableCell>
              ))}
              <TableCell align="center">-</TableCell>
              <TableCell align="center">-</TableCell>
              <TableCell align="center">-</TableCell>
            </TableRow>

            {/* Points Row */}
            <TableRow className="points-row">
              <TableCell className="row-label">POINTS</TableCell>
              {report.allSubjects.map((subject) => (
                <TableCell key={`points-${subject.code}`} align="center">
                  {subject.points !== null ? subject.points : '-'}
                </TableCell>
              ))}
              <TableCell align="center">{report.summary?.totalPoints}</TableCell>
              <TableCell align="center">-</TableCell>
              <TableCell align="center">-</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Comments Section */}
      <Box className="comments-section">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box className="comment-box teacher-comment">
              <Typography variant="subtitle1" className="comment-header">
                CLASS TEACHER'S COMMENTS
              </Typography>
              <Box className="comment-content">
                <Typography variant="body2">
                  {report.studentDetails?.name} has performed {
                    report.summary?.averageMarks > 70 ? 'excellently' :
                    report.summary?.averageMarks > 60 ? 'very well' :
                    report.summary?.averageMarks > 50 ? 'well' : 'satisfactorily'
                  } this term. {
                    report.summary?.averageMarks > 70 ? 'Keep up the excellent work!' :
                    report.summary?.averageMarks > 60 ? 'Continue with the good effort.' :
                    report.summary?.averageMarks > 50 ? 'Work harder to improve further.' :
                    'More effort is needed to improve performance.'
                  }
                </Typography>
              </Box>
              <Box className="signature-line">
                <Typography variant="body2">Signature: ___________________</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box className="comment-box principal-comment">
              <Typography variant="subtitle1" className="comment-header">
                PRINCIPAL'S COMMENTS
              </Typography>
              <Box className="comment-content">
                <Typography variant="body2">
                  {
                    report.summary?.division === 'I' ? 'Outstanding performance. Keep it up!' :
                    report.summary?.division === 'II' ? 'Very good performance. Aim higher next term.' :
                    report.summary?.division === 'III' ? 'Good performance. Work harder to improve.' :
                    'More effort is needed to improve your academic performance.'
                  }
                </Typography>
              </Box>
              <Box className="signature-line">
                <Typography variant="body2">Signature: ___________________</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Footer */}
      <Box className="report-footer">
        <Typography variant="body2" className="footer-text">
          This report was issued without any erasure or alteration whatsoever.
        </Typography>
        <Typography variant="body2" className="school-motto">
          "Excellence Through Discipline and Hard Work"
        </Typography>
      </Box>
    </Box>
  );
};

// Define PropTypes for the component
SingleRowReport.propTypes = {
  studentId: PropTypes.string,
  examId: PropTypes.string
};

export default SingleRowReport;
