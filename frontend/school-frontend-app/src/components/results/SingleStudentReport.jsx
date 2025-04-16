import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
  Grid
} from '@mui/material';
import {
  Print as PrintIcon,
  ArrowBack as ArrowBackIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';

import './SingleStudentReport.css';

// Import the O-Level report component
import OLevelStudentReport from './OLevelStudentReport';

/**
 * SingleStudentReport Component (v3.0)
 * Acts as a router to display the appropriate report template based on education level
 *
 * @param {string} educationLevel - Optional education level override ('O_LEVEL' or 'A_LEVEL')
 */
const SingleStudentReport = ({ educationLevel: educationLevelProp }) => {
  const { studentId, examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract query parameters
  const queryParams = new URLSearchParams(location.search);
  const academicYear = queryParams.get('academicYear') || '';
  const term = queryParams.get('term') || 'Term 1';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [examData, setExamData] = useState(null);
  const [principalSubjects, setPrincipalSubjects] = useState([]);
  const [subsidiarySubjects, setSubsidiarySubjects] = useState([]);
  const [summary, setSummary] = useState(null);

  // State to track the detected education level
  const [detectedEducationLevel, setDetectedEducationLevel] = useState(educationLevelProp || null);

  // Fetch student and exam data
  const fetchData = useCallback(async () => {
    // Check cache for report data
    const getCachedReport = (studentId, examId) => {
      try {
        const cacheKey = `report_${studentId}_${examId}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);

          // Check if cache is still valid (24 hours)
          const cacheAge = Date.now() - timestamp;
          const cacheValidityPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

          if (cacheAge < cacheValidityPeriod) {
            console.log('Using cached report data');
            return data;
          }

          console.log('Cache expired, fetching fresh data');
          localStorage.removeItem(cacheKey);
        }
      } catch (error) {
        console.error('Error reading from cache:', error);
        // Clear potentially corrupted cache
        try {
          localStorage.removeItem(`report_${studentId}_${examId}`);
        } catch (e) {
          console.error('Error clearing cache:', e);
        }
      }
      return null;
    };

    // Save report data to cache
    const cacheReport = (studentId, examId, data) => {
      try {
        const cacheKey = `report_${studentId}_${examId}`;
        const cacheData = {
          data,
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log('Report data cached successfully');
      } catch (error) {
        console.error('Error caching report data:', error);
      }
    };

    // Process report data and update state
    const processReportData = (reportData) => {
      // Helper function to get remarks based on grade
      const getRemarks = (grade) => {
        switch (grade) {
          case 'A': return 'Excellent';
          case 'B': return 'Very Good';
          case 'C': return 'Good';
          case 'D': return 'Satisfactory';
          case 'E': return 'Pass';
          case 'S': return 'Subsidiary Pass';
          case 'F': return 'Fail';
          default: return 'N/A';
        }
      };

      // Check if this is an O-Level report and adapt the data structure
      // Use the prop if provided, otherwise detect from the data
      const isOLevel = educationLevelProp === 'O_LEVEL' ||
                      reportData.educationLevel === 'O_LEVEL' ||
                      (reportData.subjectResults && !reportData.principalSubjects);

      // Set the detected education level
      setDetectedEducationLevel(isOLevel ? 'O_LEVEL' : 'A_LEVEL');

      if (isOLevel) {
        console.log('Processing O-Level report data');
        // Convert O-Level data structure to our format
        const formattedReportData = {
          ...reportData,
          principalSubjects: reportData.subjectResults?.map(subject => ({
            subject: subject.subject?.name || subject.subjectName,
            code: subject.subject?.code || subject.subjectCode || '',
            marks: subject.marks,
            grade: subject.grade,
            points: subject.points,
            remarks: subject.remarks || getRemarks(subject.grade)
          })) || [],
          subsidiarySubjects: []
        };

        // For O-Level, we'll also set a subjects array that contains all subjects
        formattedReportData.subjects = formattedReportData.principalSubjects;

        return processFormattedData(formattedReportData);
      }

      // If not O-Level, process as A-Level or generic format
      if (!reportData.educationLevel || reportData.educationLevel !== 'A_LEVEL') {
        console.warn('Report is not marked as A-Level, but will try to process it anyway');
      }

      return processFormattedData(reportData);
    };

    // Process formatted data and update state
    const processFormattedData = (data) => {
      // Format student data
      const formattedStudentData = {
        id: studentId,
        name: data.studentDetails?.name || data.studentName || 'Unknown Student',
        admissionNumber: data.studentDetails?.rollNumber || data.studentAdmissionNumber || data.admissionNumber || 'N/A',
        gender: data.studentDetails?.gender || data.studentGender || data.gender || 'N/A',
        form: data.studentDetails?.form || data.studentForm || data.form || 'N/A',
        class: data.studentDetails?.class || data.className || data.class || 'N/A',
        subjectCombination: data.studentDetails?.subjectCombination || data.combinationName || 'N/A',
        combinationName: data.studentDetails?.subjectCombination || data.combinationName || 'N/A'
      };

      // Format exam data
      const formattedExamData = {
        id: examId,
        name: data.examName || data.exam?.name || 'Unknown Exam',
        startDate: data.examDate?.split(' - ')?.[0] || data.exam?.startDate || '',
        endDate: data.examDate?.split(' - ')?.[1] || data.exam?.endDate || '',
        term: data.exam?.term || data.term || term || 'Term 1',
        academicYear: data.academicYear || data.exam?.academicYear?.name || academicYear || 'Unknown Year'
      };

      // Set the state with the formatted data
      setStudentData(formattedStudentData);
      setExamData(formattedExamData);
      setPrincipalSubjects(data.principalSubjects || []);
      setSubsidiarySubjects(data.subsidiarySubjects || []);

      // If this is an O-Level report, ensure we have a subjects array
      if (detectedEducationLevel === 'O_LEVEL' && !data.subjects) {
        data.subjects = data.principalSubjects || [];
      }

      // Format summary data
      const formattedSummary = {
        totalMarks: data.summary?.totalMarks || data.totalMarks || 0,
        averageMarks: data.summary?.averageMarks || data.averageMarks || 0,
        totalPoints: data.summary?.totalPoints || data.totalPoints || data.points || 0,
        bestThreePoints: data.summary?.bestThreePoints || 0,
        bestSevenPoints: data.summary?.bestSevenPoints || data.bestSevenPoints || 0,
        division: data.summary?.division || data.division || 'N/A',
        rank: data.summary?.rank || data.rank || 'N/A',
        totalStudents: data.summary?.totalStudents || data.totalStudents || 0
      };

      setSummary(formattedSummary);
    };

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

      // Check cache first
      const cachedReport = getCachedReport(studentId, examId);
      if (cachedReport) {
        // Use cached data
        processReportData(cachedReport);
        setLoading(false);
        return;
      }

      console.log(`Fetching real data for student ${studentId} and exam ${examId} with academicYear=${academicYear} and term=${term}`);

      // Try the unified comprehensive endpoint first
      let apiUrl = `${process.env.REACT_APP_API_URL || ''}/api/results/comprehensive/student/${studentId}/${examId}?academicYear=${academicYear}&term=${term}`;
      console.log('Trying unified comprehensive endpoint:', apiUrl);

      try {
        const response = await axios.get(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        console.log('Unified comprehensive endpoint successful');
        const reportData = response.data;

        // Cache the report data
        cacheReport(studentId, examId, reportData);

        // Process the data and update state
        processReportData(reportData);
      } catch (primaryError) {
        console.error('Error with unified endpoint:', primaryError);
        console.log('Trying A-Level fallback endpoint...');

        // Try the A-Level fallback endpoint
        apiUrl = `${process.env.REACT_APP_API_URL || ''}/api/a-level-comprehensive/student/${studentId}/${examId}?academicYear=${academicYear}&term=${term}`;
        console.log('Trying A-Level fallback endpoint:', apiUrl);

        try {
          const response = await axios.get(apiUrl, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          console.log('A-Level fallback endpoint successful');
          const reportData = response.data;

          // Cache the report data
          cacheReport(studentId, examId, reportData);

          // Process the data and update state
          processReportData(reportData);
        } catch (aLevelError) {
          console.error('Error with A-Level fallback endpoint:', aLevelError);

          // Try the O-Level fallback endpoint
          apiUrl = `${process.env.REACT_APP_API_URL || ''}/api/o-level-results/student/${studentId}/${examId}?academicYear=${academicYear}&term=${term}`;
          console.log('Trying O-Level fallback endpoint:', apiUrl);

          try {
            const response = await axios.get(apiUrl, {
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });

            console.log('O-Level fallback endpoint successful');
            const reportData = response.data;

            // Cache the report data
            cacheReport(studentId, examId, reportData);

            // Process the data and update state
            processReportData(reportData);
          } catch (oLevelError) {
            console.error('Error with O-Level fallback endpoint:', oLevelError);
            throw new Error(`Failed to fetch report data: ${oLevelError.message}`);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to load data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [studentId, examId, academicYear, term, educationLevelProp, detectedEducationLevel]);

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
  const reportRef = useRef(null);

  const handlePdfDownload = async () => {
    try {
      setError(null);

      // Create a temporary div with only the report content (no buttons)
      const reportContent = reportRef.current;
      if (!reportContent) {
        setError('Could not find report content');
        return;
      }

      // Show loading message
      const tempMessage = document.createElement('div');
      tempMessage.style.position = 'fixed';
      tempMessage.style.top = '50%';
      tempMessage.style.left = '50%';
      tempMessage.style.transform = 'translate(-50%, -50%)';
      tempMessage.style.padding = '20px';
      tempMessage.style.background = 'rgba(0,0,0,0.7)';
      tempMessage.style.color = 'white';
      tempMessage.style.borderRadius = '5px';
      tempMessage.style.zIndex = '9999';
      tempMessage.textContent = 'Generating PDF...';
      document.body.appendChild(tempMessage);

      try {
        // Use html2canvas to capture the report as an image
        const canvas = await html2canvas(reportContent, {
          scale: 2, // Higher scale for better quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        // Calculate dimensions to fit on A4
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add new pages if the report is longer than one page
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Generate filename
        const fileName = `${studentData.name.replace(/\s+/g, '_')}_${examData.name.replace(/\s+/g, '_')}.pdf`;

        // Save the PDF
        pdf.save(fileName);
      } finally {
        // Remove the loading message
        document.body.removeChild(tempMessage);
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(`Failed to generate PDF: ${err.message}`);
    }
  };

  // Download report as Excel
  const handleExcelDownload = () => {
    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();

      // Format student info for Excel
      const studentInfo = [
        ['Student Report'],
        ['School', 'ST. JOHN VIANNEY SCHOOL MANAGEMENT SYSTEM'],
        ['Exam', examData.name],
        ['Academic Year', examData.academicYear],
        ['Student Name', studentData.name],
        ['Admission Number', studentData.admissionNumber],
        ['Class', studentData.class],
        ['Form', studentData.form],
        ['Subject Combination', studentData.subjectCombination],
        [''],
      ];

      // Format principal subjects for Excel
      const principalSubjectsData = [
        ['Principal Subjects'],
        ['Subject', 'Code', 'Marks', 'Grade', 'Points', 'Remarks']
      ];

      for (const subject of principalSubjects) {
        principalSubjectsData.push([
          subject.subject,
          subject.code,
          subject.marks,
          subject.grade,
          subject.points,
          subject.remarks
        ]);
      }

      // Format subsidiary subjects for Excel
      const subsidiarySubjectsData = [
        [''],
        ['Subsidiary Subjects'],
        ['Subject', 'Code', 'Marks', 'Grade', 'Points', 'Remarks']
      ];

      for (const subject of subsidiarySubjects) {
        subsidiarySubjectsData.push([
          subject.subject,
          subject.code,
          subject.marks,
          subject.grade,
          subject.points,
          subject.remarks
        ]);
      }

      // Format summary for Excel
      const summaryData = [
        [''],
        ['Performance Summary'],
        ['Total Marks', summary.totalMarks],
        ['Average Marks', summary.averageMarks],
        ['Total Points', summary.totalPoints],
        ['Best Three Points', summary.bestThreePoints],
        ['Division', summary.division],
        ['Rank', `${summary.rank} out of ${summary.totalStudents}`]
      ];

      // Combine all data
      const allData = [
        ...studentInfo,
        ...principalSubjectsData,
        ...subsidiarySubjectsData,
        ...summaryData
      ];

      // Create worksheet and add to workbook
      const ws = XLSX.utils.aoa_to_sheet(allData);
      XLSX.utils.book_append_sheet(wb, ws, 'Student Report');

      // Generate Excel file name
      const fileName = `${studentData.name.replace(/\s+/g, '_')}_${examData.name.replace(/\s+/g, '_')}.xlsx`;

      // Save Excel file
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error generating Excel file:', error);
      setError('Failed to generate Excel file. Please try again.');
    }
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

  // Prepare the report data for child components
  const reportData = {
    studentData,
    examData,
    principalSubjects,
    subsidiarySubjects,
    subjects: principalSubjects, // For O-Level, we'll use principalSubjects as the main subjects array
    summary
  };

  // Render the appropriate template based on education level
  if (detectedEducationLevel === 'O_LEVEL') {
    return <OLevelStudentReport reportData={reportData} />;
  }

  // Default to A-Level template
  return (
    <Box className="single-student-report-container" ref={reportRef}>
      {/* Action Buttons - Hidden when printing */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }} className="action-buttons print-hide">
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
          startIcon={<PdfIcon />}
          onClick={handlePdfDownload}
        >
          Download PDF
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<ExcelIcon />}
          onClick={handleExcelDownload}
        >
          Download Excel
        </Button>
      </Box>

      {/* Report Header */}
      <Box className="report-header">
        <Box className="header-left">
          <Typography variant="h6" className="school-name">
            ST. JOHN VIANNEY SCHOOL MANAGEMENT SYSTEM
          </Typography>
          <Typography variant="body2" className="school-address">
            P.O. BOX 123, DAR ES SALAAM, TANZANIA
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
                principalSubjects.map((subject) => (
                  <TableRow key={`principal-${subject.code}`} className="subject-row">
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
                subsidiarySubjects.map((subject) => (
                  <TableRow key={`subsidiary-${subject.code}`} className="subject-row">
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
  examId: PropTypes.string,
  educationLevel: PropTypes.oneOf(['O_LEVEL', 'A_LEVEL'])
};

// Default props
SingleStudentReport.defaultProps = {
  educationLevel: null
};

export default SingleStudentReport;
