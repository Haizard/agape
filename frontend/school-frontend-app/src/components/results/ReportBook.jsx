import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Snackbar
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon
} from '@mui/icons-material';

// Import sub-components
import ReportBookCover from './reportbook/ReportBookCover';
import StudentInfoSection from './reportbook/StudentInfoSection';
import AcademicResultsSection from './reportbook/AcademicResultsSection';
import CharacterAssessmentSection from './reportbook/CharacterAssessmentSection';
import AttendanceSection from './reportbook/AttendanceSection';
import TeacherCommentsSection from './reportbook/TeacherCommentsSection';
import ParentSignatureSection from './reportbook/ParentSignatureSection';

// Import styles
import './reportbook/ReportBook.css';

/**
 * ReportBook Component
 * Displays a comprehensive academic report in a book-like format
 * with multiple sections for student information, academic results,
 * character assessment, attendance, and comments
 */
const ReportBook = () => {
  const { studentId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Generate demo data for testing
  const generateDemoData = useCallback((formLevel) => {
    const isForm5 = formLevel === 5 || studentId === 'demo-form5';

    // Create demo principal subjects
    const principalSubjects = [
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
      }
    ];

    // Create demo subsidiary subjects
    const subsidiarySubjects = [
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
        subject: 'English Language',
        code: 'ENG',
        marks: null,
        grade: 'N/A',
        points: null,
        isPrincipal: false,
        remarks: 'No result available'
      }
    ];

    // Calculate grade distribution
    const gradeDistribution = {
      A: principalSubjects.filter(s => s.grade === 'A').length + subsidiarySubjects.filter(s => s.grade === 'A').length,
      B: principalSubjects.filter(s => s.grade === 'B').length + subsidiarySubjects.filter(s => s.grade === 'B').length,
      C: principalSubjects.filter(s => s.grade === 'C').length + subsidiarySubjects.filter(s => s.grade === 'C').length,
      D: principalSubjects.filter(s => s.grade === 'D').length + subsidiarySubjects.filter(s => s.grade === 'D').length,
      E: principalSubjects.filter(s => s.grade === 'E').length + subsidiarySubjects.filter(s => s.grade === 'E').length,
      S: principalSubjects.filter(s => s.grade === 'S').length + subsidiarySubjects.filter(s => s.grade === 'S').length,
      F: principalSubjects.filter(s => s.grade === 'F').length + subsidiarySubjects.filter(s => s.grade === 'F').length
    };

    // Calculate total marks and points
    const subjectsWithMarks = [...principalSubjects, ...subsidiarySubjects].filter(s => s.marks !== null);
    const totalMarks = subjectsWithMarks.reduce((sum, s) => sum + s.marks, 0);
    const totalPoints = subjectsWithMarks.reduce((sum, s) => sum + s.points, 0);
    const averageMarks = subjectsWithMarks.length > 0 ? totalMarks / subjectsWithMarks.length : 0;

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

    // Create attendance data
    const attendanceData = {
      totalDays: 120,
      present: isForm5 ? 112 : 118,
      absent: isForm5 ? 8 : 2,
      late: isForm5 ? 5 : 1,
      excused: isForm5 ? 3 : 1,
      attendancePercentage: isForm5 ? 93.3 : 98.3
    };

    // Create demo report
    return {
      reportTitle: 'Academic Report Book',
      schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
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
      principalSubjects,
      subsidiarySubjects,
      allSubjects: [...principalSubjects, ...subsidiarySubjects],
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
      characterAssessment: {
        discipline: isForm5 ? 'Good' : 'Excellent',
        attendance: isForm5 ? 'Regular' : 'Excellent',
        attitude: isForm5 ? 'Positive' : 'Very Positive',
        punctuality: isForm5 ? 'Good' : 'Excellent',
        cleanliness: isForm5 ? 'Good' : 'Excellent',
        leadership: isForm5 ? 'Satisfactory' : 'Excellent',
        participation: isForm5 ? 'Good' : 'Excellent',
        comments: isForm5 ?
          'John is a dedicated student who shows great potential. He needs to improve his consistency in assignments.' :
          'Jane is an exceptional student who consistently demonstrates leadership qualities and academic excellence.'
      },
      attendance: attendanceData,
      teacherComments: {
        classTeacher: isForm5 ?
          'John has shown improvement this term. He should focus more on his subsidiary subjects and participate more in class discussions.' :
          'Jane continues to excel in all areas. She is a role model to other students and demonstrates exceptional academic abilities.',
        principalComments: isForm5 ?
          'A promising student who needs to work on consistency. With more focus, John can achieve better results next term.' :
          'An outstanding student with excellent academic and character qualities. Keep up the good work, Jane.'
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

  // Handle page navigation
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, 6)); // 6 is the max number of pages
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

  const handleGoToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // Download report as PDF
  const handleDownload = () => {
    // Open the PDF version in a new tab (backend will generate PDF)
    const pdfUrl = `${process.env.REACT_APP_API_URL || ''}/api/a-level-comprehensive/student/${studentId}/${examId}`;
    window.open(pdfUrl, '_blank');
  };

  // Share report
  const handleShare = () => {
    // Create a shareable link
    const shareUrl = `${window.location.origin}/results/report-book/${studentId}/${examId}`;

    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Report link copied to clipboard',
          severity: 'success'
        });
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        setSnackbar({
          open: true,
          message: 'Failed to copy link to clipboard',
          severity: 'error'
        });
      });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading report book...
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

  // Define the pages of the report book
  const pages = [
    { title: 'Cover', component: <ReportBookCover report={report} /> },
    { title: 'Student Info', component: <StudentInfoSection report={report} /> },
    { title: 'Academic Results', component: <AcademicResultsSection report={report} /> },
    { title: 'Character Assessment', component: <CharacterAssessmentSection report={report} /> },
    { title: 'Attendance', component: <AttendanceSection report={report} /> },
    { title: 'Teacher Comments', component: <TeacherCommentsSection report={report} /> },
    { title: 'Parent Signature', component: <ParentSignatureSection report={report} /> }
  ];

  return (
    <Box className="report-book-container">
      {/* Action Buttons - Hidden when printing */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }} className="no-print">
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print Report Book
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
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={handleShare}
        >
          Share Report
        </Button>
      </Box>

      {/* Page Navigation - Hidden when printing */}
      <Box sx={{ mb: 3 }} className="no-print">
        <Stepper activeStep={currentPage} alternativeLabel>
          {pages.map((page, index) => (
            <Step key={page.title} onClick={() => handleGoToPage(index)} sx={{ cursor: 'pointer' }}>
              <StepLabel>{page.title}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Report Book */}
      <Box className="report-book">
        <Box className="report-page current-page">
          {pages[currentPage].component}
        </Box>
      </Box>

      {/* Page Navigation Buttons - Hidden when printing */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }} className="no-print">
        <Button
          variant="contained"
          disabled={currentPage === 0}
          onClick={handlePrevPage}
        >
          Previous Page
        </Button>
        <Typography variant="body1">
          Page {currentPage + 1} of {pages.length}
        </Typography>
        <Button
          variant="contained"
          disabled={currentPage === pages.length - 1}
          onClick={handleNextPage}
        >
          Next Page
        </Button>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Box>
  );
};

// Define PropTypes for the component
ReportBook.propTypes = {
  studentId: PropTypes.string,
  examId: PropTypes.string
};

export default ReportBook;
