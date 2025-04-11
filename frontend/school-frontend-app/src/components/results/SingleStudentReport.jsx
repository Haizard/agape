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
  Grid,
  Divider
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

import './SingleStudentReport.css';

/**
 * SingleStudentReport Component
 * Displays a comprehensive academic report for a single student
 * with all subjects (both principal and subsidiary)
 */
const SingleStudentReport = () => {
  const { studentId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [examData, setExamData] = useState(null);
  const [principalSubjects, setPrincipalSubjects] = useState([]);
  const [subsidiarySubjects, setSubsidiarySubjects] = useState([]);
  const [summary, setSummary] = useState(null);

  // Fetch student and exam data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if this is a demo request
      if (studentId === 'demo-form5' || studentId === 'demo-form6') {
        console.log('Generating demo data');
        const isForm5 = studentId === 'demo-form5';
        
        // Generate demo data
        const demoData = generateDemoData(isForm5 ? 5 : 6);
        setStudentData(demoData.studentData);
        setExamData(demoData.examData);
        setPrincipalSubjects(demoData.principalSubjects);
        setSubsidiarySubjects(demoData.subsidiarySubjects);
        setSummary(demoData.summary);
        setLoading(false);
        return;
      }

      // Fetch the student data
      const studentUrl = `${process.env.REACT_APP_API_URL || ''}/api/students/${studentId}`;
      console.log('Fetching student data from:', studentUrl);
      
      const studentResponse = await axios.get(studentUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setStudentData(studentResponse.data);
      
      // Fetch the exam data
      const examUrl = `${process.env.REACT_APP_API_URL || ''}/api/exams/${examId}`;
      console.log('Fetching exam data from:', examUrl);
      
      const examResponse = await axios.get(examUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setExamData(examResponse.data);
      
      // Fetch the student's results for this exam
      const resultsUrl = `${process.env.REACT_APP_API_URL || ''}/api/a-level-comprehensive/student/${studentId}/${examId}`;
      console.log('Fetching results from:', resultsUrl);
      
      const resultsResponse = await axios.get(resultsUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const resultData = resultsResponse.data;
      
      // Set principal and subsidiary subjects
      setPrincipalSubjects(resultData.principalSubjects || []);
      setSubsidiarySubjects(resultData.subsidiarySubjects || []);
      setSummary(resultData.summary || {});
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [studentId, examId]);

  // Generate demo data for testing
  const generateDemoData = (formLevel) => {
    const isForm5 = formLevel === 5;
    
    // Define subject combination
    const combination = 'PCM';
    const combinationName = 'Physics, Chemistry, Mathematics';
    
    // Define principal subjects
    const principalSubjects = [
      {
        subject: 'Physics',
        code: 'PHY',
        marks: isForm5 ? 78 : 82,
        grade: isForm5 ? 'B' : 'A',
        points: isForm5 ? 2 : 1,
        remarks: isForm5 ? 'Very Good' : 'Excellent'
      },
      {
        subject: 'Chemistry',
        code: 'CHE',
        marks: isForm5 ? 65 : 75,
        grade: isForm5 ? 'C' : 'B',
        points: isForm5 ? 3 : 2,
        remarks: isForm5 ? 'Good' : 'Very Good'
      },
      {
        subject: 'Mathematics',
        code: 'MAT',
        marks: isForm5 ? 72 : 80,
        grade: isForm5 ? 'B' : 'A',
        points: isForm5 ? 2 : 1,
        remarks: isForm5 ? 'Very Good' : 'Excellent'
      }
    ];
    
    // Define subsidiary subjects
    const subsidiarySubjects = [
      {
        subject: 'General Studies',
        code: 'GS',
        marks: isForm5 ? 68 : 75,
        grade: isForm5 ? 'C' : 'B',
        points: isForm5 ? 3 : 2,
        remarks: isForm5 ? 'Good' : 'Very Good'
      },
      {
        subject: 'Basic Applied Mathematics',
        code: 'BAM',
        marks: isForm5 ? 55 : 65,
        grade: isForm5 ? 'D' : 'C',
        points: isForm5 ? 4 : 3,
        remarks: isForm5 ? 'Satisfactory' : 'Good'
      },
      {
        subject: 'English Language',
        code: 'ENG',
        marks: isForm5 ? 70 : 75,
        grade: isForm5 ? 'B' : 'B',
        points: isForm5 ? 2 : 2,
        remarks: isForm5 ? 'Very Good' : 'Very Good'
      }
    ];
    
    // Calculate total marks and points
    const allSubjects = [...principalSubjects, ...subsidiarySubjects];
    const totalMarks = allSubjects.reduce((sum, s) => sum + s.marks, 0);
    const totalPoints = allSubjects.reduce((sum, s) => sum + s.points, 0);
    const averageMarks = (totalMarks / allSubjects.length).toFixed(2);
    
    // Calculate best three principal points
    const bestThreePrincipal = [...principalSubjects].sort((a, b) => a.points - b.points).slice(0, 3);
    const bestThreePoints = bestThreePrincipal.reduce((sum, s) => sum + s.points, 0);
    
    // Determine division
    let division = 'N/A';
    if (bestThreePoints >= 3 && bestThreePoints <= 9) division = 'I';
    else if (bestThreePoints >= 10 && bestThreePoints <= 12) division = 'II';
    else if (bestThreePoints >= 13 && bestThreePoints <= 17) division = 'III';
    else if (bestThreePoints >= 18 && bestThreePoints <= 19) division = 'IV';
    else if (bestThreePoints >= 20 && bestThreePoints <= 21) division = 'V';
    
    // Create summary
    const summary = {
      totalMarks,
      averageMarks,
      totalPoints,
      bestThreePoints,
      division,
      rank: isForm5 ? '3' : '2',
      totalStudents: '25',
      gradeDistribution: {
        A: principalSubjects.filter(s => s.grade === 'A').length + subsidiarySubjects.filter(s => s.grade === 'A').length,
        B: principalSubjects.filter(s => s.grade === 'B').length + subsidiarySubjects.filter(s => s.grade === 'B').length,
        C: principalSubjects.filter(s => s.grade === 'C').length + subsidiarySubjects.filter(s => s.grade === 'C').length,
        D: principalSubjects.filter(s => s.grade === 'D').length + subsidiarySubjects.filter(s => s.grade === 'D').length,
        E: principalSubjects.filter(s => s.grade === 'E').length + subsidiarySubjects.filter(s => s.grade === 'E').length,
        S: principalSubjects.filter(s => s.grade === 'S').length + subsidiarySubjects.filter(s => s.grade === 'S').length,
        F: principalSubjects.filter(s => s.grade === 'F').length + subsidiarySubjects.filter(s => s.grade === 'F').length
      }
    };
    
    // Create student data
    const studentData = {
      id: `student-${isForm5 ? '001' : '002'}`,
      name: isForm5 ? 'John Doe' : 'Jane Smith',
      admissionNumber: isForm5 ? 'F5-001' : 'F6-001',
      gender: isForm5 ? 'Male' : 'Female',
      form: isForm5 ? 'Form 5' : 'Form 6',
      class: isForm5 ? 'Form 5 Science' : 'Form 6 Science',
      subjectCombination: combination,
      combinationName: combinationName,
      dateOfBirth: '2005-05-15',
      parentName: isForm5 ? 'Mr. & Mrs. Doe' : 'Mr. & Mrs. Smith',
      parentContact: isForm5 ? '+255 123 456 789' : '+255 987 654 321'
    };
    
    // Create exam data
    const examData = {
      id: 'demo-exam',
      name: 'Mid-Term Examination',
      startDate: '2023-10-15',
      endDate: '2023-10-25',
      term: 'Term 2',
      academicYear: '2023-2024'
    };
    
    return {
      studentData,
      examData,
      principalSubjects,
      subsidiarySubjects,
      summary
    };
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // Download report as PDF
  const handleDownload = () => {
    // Open the PDF version in a new tab (backend will generate PDF)
    const pdfUrl = `${process.env.REACT_APP_API_URL || ''}/api/a-level-comprehensive/student/${studentId}/${examId}/pdf`;
    window.open(pdfUrl, '_blank');
  };

  // Go back to previous page
  const handleBack = () => {
    navigate(-1);
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading student report...
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
        <Button variant="contained" onClick={handleBack}>
          Go Back
        </Button>
      </Box>
    );
  }

  // If no data, show empty state
  if (!studentData || !examData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          No student or exam data available.
        </Alert>
        <Button variant="contained" onClick={handleBack}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box className="single-student-report-container">
      {/* Action Buttons - Hidden when printing */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }} className="no-print">
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back
        </Button>
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
            AGAPE LUTHERAN JUNIOR SEMINARY
          </Typography>
          <Typography variant="body2" className="school-address">
            P.O. BOX 8882, MOSHI, KILIMANJARO
          </Typography>
          <Typography variant="body1" className="exam-info">
            {examData.name} - {examData.academicYear}
          </Typography>
        </Box>
        
        <Box className="header-center">
          <img 
            src="/images/school-logo.png" 
            alt="School Logo" 
            className="school-logo"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/80?text=Logo';
            }}
          />
        </Box>
        
        <Box className="header-right">
          <Typography variant="body1" className="report-title">
            STUDENT ACADEMIC REPORT
          </Typography>
          <Typography variant="body2" className="term-info">
            {examData.term}
          </Typography>
          <Typography variant="body2" className="date-info">
            {examData.startDate} - {examData.endDate}
          </Typography>
        </Box>
      </Box>

      {/* Student Information */}
      <Box className="student-info-section">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box className="info-box">
              <Typography variant="subtitle1" className="info-title">
                Student Information
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography variant="body2" className="info-label">Name:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2" className="info-value">{studentData.name}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" className="info-label">Admission No:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2" className="info-value">{studentData.admissionNumber}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" className="info-label">Class:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2" className="info-value">{studentData.class}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" className="info-label">Gender:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2" className="info-value">{studentData.gender}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" className="info-label">Combination:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2" className="info-value">{studentData.subjectCombination} - {studentData.combinationName}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box className="info-box">
              <Typography variant="subtitle1" className="info-title">
                Performance Summary
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" className="info-label">Total Marks:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" className="info-value">{summary?.totalMarks || '-'}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" className="info-label">Average Marks:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" className="info-value">{summary?.averageMarks || '-'}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" className="info-label">Total Points:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" className="info-value">{summary?.totalPoints || '-'}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" className="info-label">Best 3 Points:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" className="info-value">{summary?.bestThreePoints || '-'}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" className="info-label">Division:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" className="info-value info-highlight">{summary?.division || '-'}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" className="info-label">Rank:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" className="info-value">{summary?.rank || '-'} of {summary?.totalStudents || '-'}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Principal Subjects */}
      <Box className="subjects-section">
        <Typography variant="h6" className="section-title">
          Principal Subjects
        </Typography>
        <TableContainer component={Paper} className="subjects-table-container">
          <Table className="subjects-table" size="small">
            <TableHead>
              <TableRow className="table-header-row">
                <TableCell className="subject-header">SUBJECT</TableCell>
                <TableCell align="center" className="code-header">CODE</TableCell>
                <TableCell align="center" className="marks-header">MARKS</TableCell>
                <TableCell align="center" className="grade-header">GRADE</TableCell>
                <TableCell align="center" className="points-header">POINTS</TableCell>
                <TableCell align="center" className="remarks-header">REMARKS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {principalSubjects.length > 0 ? (
                principalSubjects.map((subject, index) => (
                  <TableRow key={index} className="subject-row">
                    <TableCell className="subject-name">{subject.subject}</TableCell>
                    <TableCell align="center" className="subject-code">{subject.code}</TableCell>
                    <TableCell align="center" className="subject-marks">{subject.marks}</TableCell>
                    <TableCell align="center" className="subject-grade">{subject.grade}</TableCell>
                    <TableCell align="center" className="subject-points">{subject.points}</TableCell>
                    <TableCell align="center" className="subject-remarks">{subject.remarks}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">No principal subjects data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Subsidiary Subjects */}
      <Box className="subjects-section">
        <Typography variant="h6" className="section-title">
          Subsidiary Subjects
        </Typography>
        <TableContainer component={Paper} className="subjects-table-container">
          <Table className="subjects-table" size="small">
            <TableHead>
              <TableRow className="table-header-row">
                <TableCell className="subject-header">SUBJECT</TableCell>
                <TableCell align="center" className="code-header">CODE</TableCell>
                <TableCell align="center" className="marks-header">MARKS</TableCell>
                <TableCell align="center" className="grade-header">GRADE</TableCell>
                <TableCell align="center" className="points-header">POINTS</TableCell>
                <TableCell align="center" className="remarks-header">REMARKS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subsidiarySubjects.length > 0 ? (
                subsidiarySubjects.map((subject, index) => (
                  <TableRow key={index} className="subject-row">
                    <TableCell className="subject-name">{subject.subject}</TableCell>
                    <TableCell align="center" className="subject-code">{subject.code}</TableCell>
                    <TableCell align="center" className="subject-marks">{subject.marks}</TableCell>
                    <TableCell align="center" className="subject-grade">{subject.grade}</TableCell>
                    <TableCell align="center" className="subject-points">{subject.points}</TableCell>
                    <TableCell align="center" className="subject-remarks">{subject.remarks}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">No subsidiary subjects data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Grade Distribution */}
      <Box className="grade-distribution-section">
        <Typography variant="h6" className="section-title">
          Grade Distribution
        </Typography>
        <Grid container spacing={2} className="grade-distribution-grid">
          <Grid item xs={6} sm={3} md={1.7}>
            <Paper className="grade-box">
              <Typography variant="h6" className="grade-label">A</Typography>
              <Typography variant="h5" className="grade-count">{summary?.gradeDistribution?.A || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3} md={1.7}>
            <Paper className="grade-box">
              <Typography variant="h6" className="grade-label">B</Typography>
              <Typography variant="h5" className="grade-count">{summary?.gradeDistribution?.B || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3} md={1.7}>
            <Paper className="grade-box">
              <Typography variant="h6" className="grade-label">C</Typography>
              <Typography variant="h5" className="grade-count">{summary?.gradeDistribution?.C || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3} md={1.7}>
            <Paper className="grade-box">
              <Typography variant="h6" className="grade-label">D</Typography>
              <Typography variant="h5" className="grade-count">{summary?.gradeDistribution?.D || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3} md={1.7}>
            <Paper className="grade-box">
              <Typography variant="h6" className="grade-label">E</Typography>
              <Typography variant="h5" className="grade-count">{summary?.gradeDistribution?.E || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3} md={1.7}>
            <Paper className="grade-box">
              <Typography variant="h6" className="grade-label">S</Typography>
              <Typography variant="h5" className="grade-count">{summary?.gradeDistribution?.S || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3} md={1.7}>
            <Paper className="grade-box">
              <Typography variant="h6" className="grade-label">F</Typography>
              <Typography variant="h5" className="grade-count">{summary?.gradeDistribution?.F || 0}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

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
                  {studentData.name} has performed {
                    summary?.averageMarks > 70 ? 'excellently' : 
                    summary?.averageMarks > 60 ? 'very well' : 
                    summary?.averageMarks > 50 ? 'well' : 'satisfactorily'
                  } this term. {
                    summary?.averageMarks > 70 ? 'Keep up the excellent work!' : 
                    summary?.averageMarks > 60 ? 'Continue with the good effort.' : 
                    summary?.averageMarks > 50 ? 'Work harder to improve further.' : 
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
                    summary?.division === 'I' ? 'Outstanding performance. Keep it up!' : 
                    summary?.division === 'II' ? 'Very good performance. Aim higher next term.' : 
                    summary?.division === 'III' ? 'Good performance. Work harder to improve.' : 
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
SingleStudentReport.propTypes = {
  studentId: PropTypes.string,
  examId: PropTypes.string
};

export default SingleStudentReport;
