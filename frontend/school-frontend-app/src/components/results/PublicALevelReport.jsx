import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Pagination
} from '@mui/material';
import { PictureAsPdf, Print, GetApp } from '@mui/icons-material';
import { getPublicALevelReport, getSampleALevelReport } from '../../services/publicReportApi';
import {
  generateALevelReportPDF,
  generateALevelReportExcel,
  downloadPDF,
  downloadExcel,
  printReport
} from '../../utils/exportUtils';

/**
 * Public A-Level Report Component
 * This component doesn't require authentication and always shows data
 */
const PublicALevelReport = () => {
  const { classId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  // Fetch report data on component mount
  useEffect(() => {
    const fetchReport = async () => {
      try {
        // Try to fetch the report from the API
        const data = await getPublicALevelReport(classId, examId);
        setReport(data);
      } catch (err) {
        console.error('Error fetching public report:', err);
        setError('Error fetching report. Using sample data.');

        // Use sample data if the API call fails
        const sampleData = getSampleALevelReport();
        setReport(sampleData);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [classId, examId]);

  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Handle back button click
  const handleBack = () => {
    navigate('/public/reports');
  };

  // Handlers for export buttons
  const handleDownloadPDF = () => {
    try {
      const reportTitle = `${reportData.className} - ${reportData.examName} - ${reportData.year}`;
      const doc = generateALevelReportPDF(reportData, reportTitle);
      const filename = `A-Level_Report_${reportData.className}_${reportData.examName}_${reportData.year}.pdf`;
      downloadPDF(doc, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    try {
      printReport('a-level-report-container');
    } catch (error) {
      console.error('Error printing report:', error);
      alert('Failed to print report. Please try again.');
    }
  };

  const handleDownloadExcel = () => {
    try {
      const reportTitle = `${reportData.className} - ${reportData.examName} - ${reportData.year}`;
      const blob = generateALevelReportExcel(reportData, reportTitle);
      const filename = `A-Level_Report_${reportData.className}_${reportData.examName}_${reportData.year}.xlsx`;
      downloadExcel(blob, filename);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Failed to generate Excel file. Please try again.');
    }
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // If no report data, use sample data
  const reportData = report || getSampleALevelReport();

  // Get all unique subjects from the report data
  const uniqueSubjects = reportData.subjects.map(subject => subject.name);

  // Calculate pagination
  const totalStudents = reportData.students?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalStudents / studentsPerPage));
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = Math.min(startIndex + studentsPerPage, totalStudents);
  const currentStudents = reportData.students?.slice(startIndex, endIndex) || [];

  return (
    <Box id="a-level-report-container" className="public-a-level-report" sx={{ p: 2 }}>
      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="outlined"
            onClick={handleBack}
          >
            Back
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PictureAsPdf />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Print />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="success"
            startIcon={<GetApp />}
            onClick={handleDownloadExcel}
          >
            Download Excel
          </Button>
        </Grid>
      </Grid>

      {/* Report Header */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h5" align="center" gutterBottom>
          Evangelical Lutheran Church in Tanzania - Northern Diocese
        </Typography>
        <Typography variant="h4" align="center" gutterBottom>
          St. John Vianney Secondary School
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          PO Box 8882, Moshi, Tanzania
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          Mobile: 0759767735 | Email: infoagapeseminary@gmail.com
        </Typography>
        <Typography variant="h5" align="center" sx={{ mt: 2 }}>
          A-LEVEL EXAMINATION RESULTS - {reportData.year}
        </Typography>
        <Typography variant="h6" align="center" gutterBottom>
          CLASS: {reportData.className} | EXAM: {reportData.examName}
        </Typography>
      </Paper>

      {/* Division Summary */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Division Summary
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">REGISTERED</TableCell>
                <TableCell align="center">ABSENT</TableCell>
                <TableCell align="center">SAT</TableCell>
                <TableCell align="center">DIV I</TableCell>
                <TableCell align="center">DIV II</TableCell>
                <TableCell align="center">DIV III</TableCell>
                <TableCell align="center">DIV IV</TableCell>
                <TableCell align="center">DIV 0</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell align="center">{totalStudents}</TableCell>
                <TableCell align="center">0</TableCell>
                <TableCell align="center">{totalStudents}</TableCell>
                <TableCell align="center">{reportData.divisionSummary?.['I'] || 0}</TableCell>
                <TableCell align="center">{reportData.divisionSummary?.['II'] || 0}</TableCell>
                <TableCell align="center">{reportData.divisionSummary?.['III'] || 0}</TableCell>
                <TableCell align="center">{reportData.divisionSummary?.['IV'] || 0}</TableCell>
                <TableCell align="center">{reportData.divisionSummary?.['0'] || 0}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Student Results Table */}
      <Paper sx={{ p: 3, mb: 3, overflowX: 'auto' }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Student Results
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>NO.</TableCell>
                <TableCell>STUDENT NAME</TableCell>
                <TableCell>SEX</TableCell>
                <TableCell align="center">POINTS</TableCell>
                <TableCell align="center">DIVISION</TableCell>

                {/* Subject Columns */}
                {uniqueSubjects.map((subject) => (
                  <TableCell key={subject} align="center">
                    {subject}
                  </TableCell>
                ))}

                {/* Summary Columns */}
                <TableCell align="center">TOTAL</TableCell>
                <TableCell align="center">AVERAGE</TableCell>
                <TableCell align="center">RANK</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentStudents.length > 0 ? (
                currentStudents.map((student, index) => (
                  <TableRow key={student.id || index}>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell>{student.studentName || `${student.firstName} ${student.lastName}`}</TableCell>
                    <TableCell>{student.sex || student.gender || '-'}</TableCell>
                    <TableCell align="center">{student.points || '-'}</TableCell>
                    <TableCell align="center">{student.division || '-'}</TableCell>

                    {/* Subject Marks */}
                    {uniqueSubjects.map((subjectName) => {
                      const subjectResult = student.subjectResults?.find(
                        (sr) => sr.subject?.name === subjectName
                      );
                      return (
                        <TableCell key={`${student.id}-${subjectName}`} align="center">
                          {subjectResult?.marks !== undefined && subjectResult?.marks !== null
                            ? subjectResult.marks
                            : '-'}
                        </TableCell>
                      );
                    })}

                    {/* Summary Columns */}
                    <TableCell align="center">{student.totalMarks || '-'}</TableCell>
                    <TableCell align="center">{student.averageMarks || '-'}</TableCell>
                    <TableCell align="center">{student.rank || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5 + uniqueSubjects.length + 3} align="center">
                    No students available for this class and exam
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Subject Performance Summary */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Subject Performance Summary
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>SUBJECT NAME</TableCell>
                <TableCell align="center">REG</TableCell>
                <TableCell align="center">A</TableCell>
                <TableCell align="center">B</TableCell>
                <TableCell align="center">C</TableCell>
                <TableCell align="center">D</TableCell>
                <TableCell align="center">E</TableCell>
                <TableCell align="center">S</TableCell>
                <TableCell align="center">F</TableCell>
                <TableCell align="center">PASS</TableCell>
                <TableCell align="center">GPA</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(reportData.subjectPerformance || {}).map(([key, subject]) => (
                <TableRow key={key}>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell align="center">{subject.registered}</TableCell>
                  <TableCell align="center">{subject.grades?.A || 0}</TableCell>
                  <TableCell align="center">{subject.grades?.B || 0}</TableCell>
                  <TableCell align="center">{subject.grades?.C || 0}</TableCell>
                  <TableCell align="center">{subject.grades?.D || 0}</TableCell>
                  <TableCell align="center">{subject.grades?.E || 0}</TableCell>
                  <TableCell align="center">{subject.grades?.S || 0}</TableCell>
                  <TableCell align="center">{subject.grades?.F || 0}</TableCell>
                  <TableCell align="center">{subject.passed}</TableCell>
                  <TableCell align="center">{subject.gpa}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Overall Performance */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Overall Performance
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">TOTAL STUDENTS</TableCell>
                <TableCell align="center">TOTAL PASSED</TableCell>
                <TableCell align="center">EXAM GPA</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell align="center">{totalStudents}</TableCell>
                <TableCell align="center">{reportData.overallPerformance?.totalPassed || 0}</TableCell>
                <TableCell align="center">{reportData.overallPerformance?.examGpa || 'N/A'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Approvals Section */}
      <Paper sx={{ p: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          APPROVED BY
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Box>
            <Typography variant="subtitle1">ACADEMIC TEACHER NAME: _______________________</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">SIGN: _______________________</Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle1">HEAD OF SCHOOL NAME: _______________________</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">SIGN: _______________________</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PublicALevelReport;
