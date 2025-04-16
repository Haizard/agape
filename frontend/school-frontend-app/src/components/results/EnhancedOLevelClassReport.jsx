import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
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
  Button,
  CircularProgress,
  Alert,
  Pagination,
  Divider,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { generateEnhancedClassReportPDF } from '../../utils/enhancedReportGenerator';
import { generateExcelReport } from '../../utils/excelGenerator';

/**
 * Enhanced O-Level Class Report Component
 *
 * A comprehensive O-Level class result report component that follows the "Open Test Result - 2025" format
 * from St. John Vianney Secondary School. This component is specifically designed for O-Level results.
 *
 * @param {Object} props
 * @param {Object} props.data - The report data
 * @param {boolean} props.loading - Whether the data is loading
 * @param {string} props.error - Error message if any
 * @param {Function} props.onDownload - Function to call when downloading the report
 * @param {Function} props.onPrint - Function to call when printing the report
 */
const EnhancedOLevelClassReport = ({
  data,
  loading = false,
  error = null,
  onDownload = null,
  onPrint = null
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [studentsPerPage, setStudentsPerPage] = useState(25);
  const [processedData, setProcessedData] = useState(null);
  const [showApprovals, setShowApprovals] = useState(true);
  const [reportError, setReportError] = useState(error);

  // Process and prepare data for display
  useEffect(() => {
    if (!data) return;

    // Validate that this is O-Level data
    if (data.educationLevel && data.educationLevel !== 'O_LEVEL') {
      setReportError('This report is only for O-Level results. Please use the A-Level report for A-Level results.');
      return;
    }

    // Additional validation for class name
    if (data.className) {
      const isALevelClass = data.className.includes('Form 5') ||
                          data.className.includes('Form 6') ||
                          data.className.includes('Form V') ||
                          data.className.includes('Form VI');

      if (isALevelClass) {
        setReportError('This appears to be an A-Level class based on the class name. Please use the A-Level report component.');
        return;
      }
    }

    // Deep clone to avoid modifying original data
    const processedData = JSON.parse(JSON.stringify(data));

    // Get current year for the title if not provided
    if (!processedData.year) {
      processedData.year = new Date().getFullYear();
    }

    // Sort students based on current sort settings
    if (processedData.students) {
      processedData.students.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        // Handle numeric values
        if (typeof aValue === 'string' && !Number.isNaN(Number(aValue))) {
          aValue = Number.parseFloat(aValue);
        }
        if (typeof bValue === 'string' && !Number.isNaN(Number(bValue))) {
          bValue = Number.parseFloat(bValue);
        }

        // Handle missing values
        if (aValue === undefined || aValue === null) aValue = sortDirection === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        if (bValue === undefined || bValue === null) bValue = sortDirection === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

        // Compare values
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
      });
    }

    setProcessedData(processedData);
  }, [data, sortField, sortDirection]);

  // Update error from props
  useEffect(() => {
    setReportError(error);
  }, [error]);

  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and reset direction to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle download as PDF
  const handleDownloadPDF = () => {
    try {
      const doc = generateEnhancedClassReportPDF(reportData, 'O_LEVEL');
      const fileName = `${reportData.className || 'Class'}_${reportData.examName || 'Exam'}_O_Level_Result.pdf`;
      doc.save(fileName);

      if (onDownload) onDownload('pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setReportError(`Failed to generate PDF: ${err.message}`);
    }
  };

  // Handle download as Excel
  const handleDownloadExcel = async () => {
    try {
      const buffer = await generateExcelReport(reportData, reportData.className, 'O_LEVEL');

      // Create a Blob from the buffer
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportData.className || 'Class'}_${reportData.examName || 'Exam'}_O_Level_Result.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (onDownload) onDownload('excel');
    } catch (err) {
      console.error('Error generating Excel:', err);
      setReportError(`Failed to generate Excel: ${err.message}`);
    }
  };

  // Handle print
  const handlePrint = () => {
    try {
      const doc = generateEnhancedClassReportPDF(reportData, 'O_LEVEL');
      doc.autoPrint();
      doc.output('dataurlnewwindow');

      if (onPrint) onPrint();
    } catch (err) {
      console.error('Error printing report:', err);
      setReportError(`Failed to print report: ${err.message}`);
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

  // If error, show error message but continue to display the report structure
  const errorAlert = reportError ? (
    <Alert severity="error" sx={{ mb: 3 }}>
      {reportError}
    </Alert>
  ) : null;

  // If no data, create empty structure with placeholders
  const reportData = processedData || {
    className: 'Sample Class',
    examName: 'Sample Examination',
    year: new Date().getFullYear(),
    educationLevel: 'O_LEVEL',
    students: [
      // Add placeholder students to show structure
      {
        id: 'placeholder-1',
        studentName: 'John Doe',
        sex: 'M',
        totalMarks: 450,
        averageMarks: '75.00',
        division: 'I',
        points: 12,
        rank: 1,
        subjects: {}
      },
      {
        id: 'placeholder-2',
        studentName: 'Jane Smith',
        sex: 'F',
        totalMarks: 420,
        averageMarks: '70.00',
        division: 'II',
        points: 15,
        rank: 2,
        subjects: {}
      },
      {
        id: 'placeholder-3',
        studentName: 'Sample Student',
        sex: 'M',
        totalMarks: 360,
        averageMarks: '60.00',
        division: 'III',
        points: 22,
        rank: 3,
        subjects: {}
      }
    ],
    subjects: [],
    divisionSummary: { 'I': 1, 'II': 1, 'III': 1, 'IV': 0, '0': 0 },
    subjectPerformance: {},
    overallPerformance: { totalPassed: 3, examGpa: '2.50' }
  };

  // If no subjects found, add placeholder subjects for O-Level
  if (!reportData.subjects || reportData.subjects.length === 0) {
    reportData.subjects = [
      { id: 'math', name: 'Mathematics', code: 'MATH' },
      { id: 'eng', name: 'English', code: 'ENG' },
      { id: 'kis', name: 'Kiswahili', code: 'KIS' },
      { id: 'bio', name: 'Biology', code: 'BIO' },
      { id: 'chem', name: 'Chemistry', code: 'CHEM' },
      { id: 'phy', name: 'Physics', code: 'PHY' },
      { id: 'geo', name: 'Geography', code: 'GEO' },
      { id: 'hist', name: 'History', code: 'HIST' },
      { id: 'civics', name: 'Civics', code: 'CIV' }
    ];

    // Add sample subject data for placeholder students
    if (reportData.students && reportData.students.length > 0) {
      // For each student
      for (let i = 0; i < reportData.students.length; i++) {
        const student = reportData.students[i];
        student.subjects = {};

        // For each subject
        for (const subject of reportData.subjects) {
          // Generate sample marks based on student rank
          let baseMarks = 0;
          if (i === 0) baseMarks = 75; // First student (high performer)
          else if (i === 1) baseMarks = 65; // Second student (medium performer)
          else baseMarks = 55; // Other students (average performer)

          // Add some variation per subject
          const variation = Math.floor(Math.random() * 15) - 5; // -5 to +10 variation
          const marks = Math.min(100, Math.max(30, baseMarks + variation));

          // Calculate grade
          let grade = 'F';
          let points = 5;
          if (marks >= 75) { grade = 'A'; points = 1; }
          else if (marks >= 65) { grade = 'B'; points = 2; }
          else if (marks >= 45) { grade = 'C'; points = 3; }
          else if (marks >= 30) { grade = 'D'; points = 4; }

          // Add to student's subjects
          student.subjects[subject.id] = {
            marks: marks,
            grade: grade,
            points: points
          };
        }
      }
    }
  }

  // Calculate pagination
  const totalStudents = reportData.students?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalStudents / studentsPerPage)); // At least 1 page
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = Math.min(startIndex + studentsPerPage, totalStudents);
  const currentStudents = reportData.students?.slice(startIndex, endIndex) || [];

  // Get all subjects
  const subjects = reportData.subjects || [];

  return (
    <Box className="enhanced-class-report" sx={{ p: 2 }}>
      {errorAlert}
      {/* Report Header */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h4" align="center" gutterBottom>
          {processedData ? 'OPEN TEST RESULT' : 'SAMPLE REPORT'} - {reportData.year}
        </Typography>
        <Typography variant="h6" gutterBottom>
          Class Name: {reportData.className}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          O-Level Results {!processedData && '(Sample Data)'}
        </Typography>
        {!processedData && (
          <Alert severity="info" sx={{ mt: 2 }}>
            This is a sample report with placeholder data. Connect to a real data source to see actual results.
          </Alert>
        )}
      </Paper>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadExcel}
          >
            Download Excel
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Grid>
        <Grid item xs />
        <Grid item>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Students Per Page</InputLabel>
            <Select
              value={studentsPerPage}
              onChange={(e) => setStudentsPerPage(e.target.value)}
              label="Students Per Page"
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={30}>30</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item>
          <FormControlLabel
            control={
              <Switch
                checked={showApprovals}
                onChange={(e) => setShowApprovals(e.target.checked)}
              />
            }
            label="Show Approvals"
          />
        </Grid>
      </Grid>

      {/* Student Results Table */}
      <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 600, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                onClick={() => handleSortChange('rank')}
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
              >
                # {sortField === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell
                onClick={() => handleSortChange('studentName')}
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
              >
                STUDENT NAME {sortField === 'studentName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>SEX</TableCell>

              {/* Subject Columns */}
              {subjects.map((subject) => (
                <TableCell
                  key={subject.id || subject.code || subject.name}
                  align="center"
                  sx={{ fontWeight: 'bold' }}
                >
                  {subject.code || subject.name}
                </TableCell>
              ))}

              {/* Summary Columns */}
              <TableCell
                align="center"
                onClick={() => handleSortChange('totalMarks')}
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
              >
                TOTAL {sortField === 'totalMarks' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell
                align="center"
                onClick={() => handleSortChange('averageMarks')}
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
              >
                AVERAGE {sortField === 'averageMarks' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell
                align="center"
                onClick={() => handleSortChange('division')}
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
              >
                DIVISION {sortField === 'division' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell
                align="center"
                onClick={() => handleSortChange('points')}
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
              >
                POINTS {sortField === 'points' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell
                align="center"
                onClick={() => handleSortChange('rank')}
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
              >
                RANK {sortField === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentStudents.length > 0 ? (
              currentStudents.map((student, index) => (
                <TableRow key={student.id || student.studentId || index}>
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell>{student.studentName || `${student.firstName} ${student.lastName}`}</TableCell>
                  <TableCell>{student.sex || student.gender || '-'}</TableCell>

                  {/* Subject Marks */}
                  {subjects.map((subject) => {
                    // Find the subject result for this student
                    const subjectResult = student.subjects?.[subject.id] ||
                                         student.subjectResults?.find(r => r.subjectId === subject.id) ||
                                         student.results?.find(r => r.subject?.name === subject.name);

                    // Get the marks, handling missing values
                    const marks = subjectResult?.marks ||
                                 subjectResult?.marksObtained ||
                                 (subjectResult?.present ? subjectResult.marks : '-');

                    return (
                      <TableCell
                        key={`${student.id}-${subject.id}`}
                        align="center"
                      >
                        {marks === null || marks === undefined ? '-' : marks}
                      </TableCell>
                    );
                  })}

                  {/* Summary Columns */}
                  <TableCell align="center">{student.totalMarks || '-'}</TableCell>
                  <TableCell align="center">{student.averageMarks || '-'}</TableCell>
                  <TableCell align="center">{student.division || '-'}</TableCell>
                  <TableCell align="center">{student.points || student.totalPoints || '-'}</TableCell>
                  <TableCell align="center">{student.rank || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5 + subjects.length + 3} align="center">
                  <Typography variant="subtitle1" sx={{ fontStyle: 'italic', my: 2 }}>
                    No real data available. Showing sample structure with placeholder data.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Subject Summary Table */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Subject Summary
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>SUBJECT</TableCell>
                <TableCell align="center">NO OF STUDENTS</TableCell>
                <TableCell align="center">A</TableCell>
                <TableCell align="center">B</TableCell>
                <TableCell align="center">C</TableCell>
                <TableCell align="center">D</TableCell>
                <TableCell align="center">F</TableCell>
                <TableCell align="center">GPA</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((subject) => {
                // Calculate grade distribution for this subject
                const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
                let totalPoints = 0;
                let studentCount = 0;

                // Process each student's result for this subject
                if (reportData.students && reportData.students.length > 0) {
                  for (const student of reportData.students) {
                    const subjectResult = student.subjects?.[subject.id] ||
                                         student.subjectResults?.find(r => r.subjectId === subject.id) ||
                                         student.results?.find(r => r.subject?.name === subject.name);

                    if (subjectResult?.grade) {
                      gradeDistribution[subjectResult.grade] = (gradeDistribution[subjectResult.grade] || 0) + 1;
                      totalPoints += subjectResult.points || 0;
                      studentCount++;
                    }
                  }
                }

                // If no data and this is a placeholder report, generate sample data
                if (studentCount === 0 && !processedData) {
                  // Generate sample grade distribution
                  studentCount = 3; // Match our placeholder students
                  gradeDistribution.A = 1;
                  gradeDistribution.B = 1;
                  gradeDistribution.C = 1;
                  gradeDistribution.D = 0;
                  gradeDistribution.F = 0;

                  // Calculate total points
                  totalPoints = gradeDistribution.A * 1 +
                               gradeDistribution.B * 2 +
                               gradeDistribution.C * 3 +
                               gradeDistribution.D * 4 +
                               gradeDistribution.F * 5;
                }

                // Calculate GPA (1-5 scale, A=1, F=5)
                const gpa = studentCount > 0 ?
                  ((gradeDistribution.A * 1 + gradeDistribution.B * 2 + gradeDistribution.C * 3 +
                    gradeDistribution.D * 4 + gradeDistribution.F * 5) / studentCount).toFixed(2) :
                  '-';

                return (
                  <TableRow key={subject.id || subject.code || subject.name}>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell align="center">{studentCount}</TableCell>
                    <TableCell align="center">{gradeDistribution.A || 0}</TableCell>
                    <TableCell align="center">{gradeDistribution.B || 0}</TableCell>
                    <TableCell align="center">{gradeDistribution.C || 0}</TableCell>
                    <TableCell align="center">{gradeDistribution.D || 0}</TableCell>
                    <TableCell align="center">{gradeDistribution.F || 0}</TableCell>
                    <TableCell align="center">{gpa}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Approvals Section */}
      {showApprovals && (
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h6" gutterBottom>
            APPROVED BY
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">ACADEMIC TEACHER NAME: _______________________</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">SIGN: _______________________</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">HEAD OF SCHOOL NAME: _______________________</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">SIGN: _______________________</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

EnhancedOLevelClassReport.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onDownload: PropTypes.func,
  onPrint: PropTypes.func
};

export default EnhancedOLevelClassReport;
