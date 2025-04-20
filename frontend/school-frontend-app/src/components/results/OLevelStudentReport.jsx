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
  Grid,
  Tooltip
} from '@mui/material';
import {
  Print as PrintIcon,
  ArrowBack as ArrowBackIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';

import './SingleStudentReport.css';

/**
 * OLevelStudentReport Component
 * Displays an academic report for an O-Level student
 * with all subjects in a single list (no principal/subsidiary distinction)
 */
const OLevelStudentReport = ({ reportData }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reportRef = useRef(null);

  // Destructure the report data
  const { studentData, examData, subjects, summary } = reportData || {};

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // Download report as PDF
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
        [''],
      ];

      // Format subjects for Excel
      const subjectsData = [
        ['Subjects'],
        ['Subject', 'Code', 'Marks', 'Grade', 'Points', 'Remarks']
      ];

      for (const subject of subjects) {
        subjectsData.push([
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
        ['Best Seven Points', summary.bestSevenPoints],
        ['Division', summary.division],
        ['Rank', `${summary.rank} out of ${summary.totalStudents}`]
      ];

      // Combine all data
      const allData = [
        ...studentInfo,
        ...subjectsData,
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
                  <Typography variant="body2" className="info-label">Best Seven Points:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" className="info-value">{summary?.bestSevenPoints || '-'}</Typography>
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

      {/* Subjects */}
      <Box className="subjects-section">
        <Typography variant="h6" className="section-title">
          Subjects
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
              {subjects && subjects.length > 0 ? (
                subjects.map((subject, index) => {
                  // Check if student takes this subject
                  const studentTakesSubject = subject.studentTakesSubject !== false;

                  return (
                    <TableRow
                      key={`subject-${index}`}
                      className="subject-row"
                      sx={{
                        // Gray out subjects the student doesn't take
                        backgroundColor: !studentTakesSubject ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                      }}
                    >
                      <TableCell className="subject-name">
                        {subject.subject}
                        {!studentTakesSubject && (
                          <Tooltip title="Student doesn't take this subject" placement="top">
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#bdbdbd',
                                borderRadius: '50%',
                                ml: 1,
                                verticalAlign: 'middle'
                              }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="center" className="subject-code">{subject.code}</TableCell>
                      <TableCell align="center" className="subject-marks">
                        {studentTakesSubject ? subject.marks : 'N/A'}
                      </TableCell>
                      <TableCell align="center" className="subject-grade">
                        {studentTakesSubject ? subject.grade : 'N/A'}
                      </TableCell>
                      <TableCell align="center" className="subject-points">
                        {studentTakesSubject ? subject.points : 'N/A'}
                      </TableCell>
                      <TableCell align="center" className="subject-remarks">
                        {studentTakesSubject ? subject.remarks : 'Not enrolled'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">No subjects data available</TableCell>
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
OLevelStudentReport.propTypes = {
  reportData: PropTypes.shape({
    studentData: PropTypes.object,
    examData: PropTypes.object,
    subjects: PropTypes.array,
    summary: PropTypes.object
  })
};

export default OLevelStudentReport;
