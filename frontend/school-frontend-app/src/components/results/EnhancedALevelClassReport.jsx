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
  FormControl,
  Card,
  CardContent
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { generateEnhancedALevelReportPDF } from '../../utils/enhancedALevelReportGenerator';
import { generateALevelExcelReport } from '../../utils/aLevelExcelGenerator';

/**
 * Enhanced A-Level Class Report Component
 *
 * A comprehensive A-Level class result report component that follows the format
 * from Agape Lutheran Junior Seminary. This component is specifically designed for A-Level results.
 *
 * @param {Object} props
 * @param {Object} props.data - The report data
 * @param {boolean} props.loading - Whether the data is loading
 * @param {string} props.error - Error message if any
 * @param {Function} props.onDownload - Function to call when downloading the report
 * @param {Function} props.onPrint - Function to call when printing the report
 */
const EnhancedALevelClassReport = ({
  data,
  loading = false,
  error = null,
  onDownload = null,
  onPrint = null
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [studentsPerPage, setStudentsPerPage] = useState(10);
  const [processedData, setProcessedData] = useState(null);
  const [showApprovals, setShowApprovals] = useState(true);
  const [reportError, setReportError] = useState(error);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'summary'

  // Process and prepare data for display
  useEffect(() => {
    if (!data) return;

    // Validate that this is A-Level data
    if (data.educationLevel && data.educationLevel !== 'A_LEVEL') {
      setReportError('This report is only for A-Level results. Please use the O-Level report for O-Level results.');
      return;
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

    // Calculate division summary
    const divisionSummary = {
      'I': 0,
      'II': 0,
      'III': 0,
      'IV': 0,
      '0': 0
    };

    if (processedData.students) {
      for (const student of processedData.students) {
        const division = student.division || 'IV';
        if (division === 'Division I' || division === 'I') divisionSummary['I']++;
        else if (division === 'Division II' || division === 'II') divisionSummary['II']++;
        else if (division === 'Division III' || division === 'III') divisionSummary['III']++;
        else if (division === 'Division IV' || division === 'IV') divisionSummary['IV']++;
        else divisionSummary['0']++;
      }
    }

    processedData.divisionSummary = divisionSummary;

    // Calculate subject-wise performance
    const subjectPerformance = {};
    const subjects = processedData.subjects || [];

    if (processedData.students) {
      for (const subject of subjects) {
        const subjectId = subject.id || subject._id;
        const subjectName = subject.name;

        if (!subjectId || !subjectName) continue;

        subjectPerformance[subjectId] = {
          name: subjectName,
          registered: 0,
          grades: { A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 },
          passed: 0,
          gpa: 0,
          totalPoints: 0
        };

        for (const student of processedData.students) {
          const subjectResult = student.subjects?.[subjectId] ||
                               student.subjectResults?.find(r => r.subjectId === subjectId) ||
                               student.results?.find(r => r.subject?.name === subjectName);

          if (subjectResult?.grade) {
            subjectPerformance[subjectId].registered++;
            subjectPerformance[subjectId].grades[subjectResult.grade]++;

            // Calculate passed (anything not F)
            if (subjectResult.grade !== 'F') {
              subjectPerformance[subjectId].passed++;
            }

            // Calculate GPA points
            let points = 0;
            switch (subjectResult.grade) {
              case 'A': points = 1; break;
              case 'B': points = 2; break;
              case 'C': points = 3; break;
              case 'D': points = 4; break;
              case 'E': points = 5; break;
              case 'S': points = 6; break;
              case 'F': points = 7; break;
              default: points = 0;
            }

            subjectPerformance[subjectId].totalPoints += points;
          }
        }

        // Calculate GPA
        if (subjectPerformance[subjectId].registered > 0) {
          subjectPerformance[subjectId].gpa = (
            subjectPerformance[subjectId].totalPoints / subjectPerformance[subjectId].registered
          ).toFixed(2);
        }
      }
    }

    processedData.subjectPerformance = subjectPerformance;

    // Calculate overall performance
    let totalPassed = 0;
    let totalGpaPoints = 0;
    let totalStudents = processedData.students?.length || 0;

    if (processedData.students) {
      for (const student of processedData.students) {
        if (student.division && (student.division === 'I' || student.division === 'II' ||
            student.division === 'III' || student.division === 'Division I' ||
            student.division === 'Division II' || student.division === 'Division III')) {
          totalPassed++;
        }

        // Add to GPA calculation if student has points
        if (student.points || student.totalPoints) {
          totalGpaPoints += Number(student.points || student.totalPoints || 0);
        }
      }
    }

    processedData.overallPerformance = {
      totalPassed,
      examGpa: totalStudents > 0 ? (totalGpaPoints / totalStudents).toFixed(2) : '0.00'
    };

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

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Handle download as PDF
  const handleDownloadPDF = () => {
    try {
      const doc = generateEnhancedALevelReportPDF(reportData);
      const fileName = `${reportData.className || 'Class'}_${reportData.examName || 'Exam'}_A_Level_Result.pdf`;
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
      const buffer = await generateALevelExcelReport(reportData, reportData.className);

      // Create a Blob from the buffer
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportData.className || 'Class'}_${reportData.examName || 'Exam'}_A_Level_Result.xlsx`;
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
      const doc = generateEnhancedALevelReportPDF(reportData);
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
    className: 'Not Available',
    examName: 'Not Available',
    year: new Date().getFullYear(),
    educationLevel: 'A_LEVEL',
    students: [
      // Add placeholder student to show structure
      {
        id: 'placeholder-1',
        studentName: 'No Data Available',
        sex: '-',
        points: '-',
        division: '-',
        subjectResults: [],
        totalMarks: '-',
        averageMarks: '-',
        rank: '-'
      }
    ],
    subjects: [
      { id: 'gs', name: 'General Studies' },
      { id: 'hist', name: 'History' },
      { id: 'phys', name: 'Physics' },
      { id: 'chem', name: 'Chemistry' },
      { id: 'kisw', name: 'Kiswahili' },
      { id: 'math', name: 'Advanced Mathematics' },
      { id: 'bio', name: 'Biology' },
      { id: 'geo', name: 'Geography' },
      { id: 'eng', name: 'English' },
      { id: 'bam', name: 'BAM' },
      { id: 'econ', name: 'Economics' }
    ],
    divisionSummary: { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 },
    subjectPerformance: {},
    overallPerformance: { totalPassed: 0, examGpa: 'N/A' }
  };

  // Calculate pagination
  const totalStudents = reportData.students?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalStudents / studentsPerPage)); // At least 1 page
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = Math.min(startIndex + studentsPerPage, totalStudents);
  const currentStudents = reportData.students?.slice(startIndex, endIndex) || [];

  // Get all subjects
  const subjects = reportData.subjects || [];

  // Get all unique subjects from student combinations
  const allSubjects = new Set();
  if (reportData.students && reportData.students.length > 0) {
    for (const student of reportData.students) {
      const studentSubjects = student.subjectResults || [];
      for (const subject of studentSubjects) {
        if (subject.subject?.name) {
          allSubjects.add(subject.subject.name);
        }
      }
    }
  }

  // If no subjects found, add placeholder subjects for A-Level
  if (allSubjects.size === 0) {
    // Add common A-Level subjects as placeholders
    ['General Studies', 'History', 'Physics', 'Chemistry', 'Kiswahili', 'Advanced Mathematics',
     'Biology', 'Geography', 'English', 'BAM', 'Economics'].forEach(subj => allSubjects.add(subj));
  }

  // Convert to array and sort alphabetically
  const uniqueSubjects = Array.from(allSubjects).sort();

  return (
    <Box className="enhanced-a-level-class-report" sx={{ p: 2 }}>
      {errorAlert}
      {/* Report Header */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h5" align="center" gutterBottom>
          Evangelical Lutheran Church in Tanzania - Northern Diocese
        </Typography>
        <Typography variant="h4" align="center" gutterBottom>
          Agape Lutheran Junior Seminary
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          PO Box 8882, Moshi, Tanzania
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          Mobile: 0759767735 | Email: infoagapeseminary@gmail.com
        </Typography>
        <Typography variant="h5" align="center" sx={{ mt: 2, fontWeight: 'bold' }}>
          {reportData.year} FORM FIVE EXAMINATION RESULTS
        </Typography>
      </Paper>

      {/* Division Summary */}
      <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
        <Typography variant="body1" align="center" sx={{ fontWeight: 'bold' }}>
          DIV-I: {reportData.divisionSummary?.I || 0} |
          DIV-II: {reportData.divisionSummary?.II || 0} |
          DIV-III: {reportData.divisionSummary?.III || 0} |
          DIV-IV: {reportData.divisionSummary?.IV || 0} |
          DIV-0: {reportData.divisionSummary?.['0'] || 0}
        </Typography>
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
          <Button
            variant={viewMode === 'individual' ? 'contained' : 'outlined'}
            onClick={() => handleViewModeChange('individual')}
            sx={{ mr: 1 }}
          >
            Individual Results
          </Button>
          <Button
            variant={viewMode === 'summary' ? 'contained' : 'outlined'}
            onClick={() => handleViewModeChange('summary')}
          >
            School Summary
          </Button>
        </Grid>
        <Grid item>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Students Per Page</InputLabel>
            <Select
              value={studentsPerPage}
              onChange={(e) => setStudentsPerPage(e.target.value)}
              label="Students Per Page"
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={15}>15</MenuItem>
              <MenuItem value={20}>20</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {viewMode === 'individual' ? (
        <>
          {/* Student Results Table */}
          <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 600, overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    #
                  </TableCell>
                  <TableCell
                    onClick={() => handleSortChange('studentName')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    STUDENT NAME {sortField === 'studentName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>SEX</TableCell>
                  <TableCell
                    align="center"
                    onClick={() => handleSortChange('points')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    POINT {sortField === 'points' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell
                    align="center"
                    onClick={() => handleSortChange('division')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    DIVISION {sortField === 'division' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableCell>

                  {/* Subject Columns - All possible subjects */}
                  {uniqueSubjects.map((subjectName) => (
                    <TableCell
                      key={subjectName}
                      align="center"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {subjectName}
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
                    onClick={() => handleSortChange('rank')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    RANK {sortField === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentStudents.length > 0 ? (
                  currentStudents.map((student, index) => {
                    // Check if this is a placeholder student (no real data)
                    const isPlaceholder = student.id?.startsWith('placeholder');

                    return (
                    <TableRow key={student.id || student.studentId || index} sx={isPlaceholder ? { opacity: 0.7, fontStyle: 'italic' } : {}}>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell>{student.studentName || `${student.firstName} ${student.lastName}`}</TableCell>
                      <TableCell>{student.sex || student.gender || '-'}</TableCell>
                      <TableCell align="center">{student.points || student.totalPoints || '-'}</TableCell>
                      <TableCell align="center">{student.division || '-'}</TableCell>

                      {/* Subject Marks - All possible subjects */}
                      {uniqueSubjects.map((subjectName) => {
                        // Find the subject result for this student
                        const subjectResult = student.subjectResults?.find(r => r.subject?.name === subjectName);

                        // Get the marks, handling missing values
                        const marks = subjectResult?.marks ||
                                    subjectResult?.marksObtained ||
                                    (subjectResult?.present ? subjectResult.marks : '-');

                        return (
                          <TableCell
                            key={`${student.id}-${subjectName}`}
                            align="center"
                          >
                            {marks === null || marks === undefined ? '-' : marks}
                          </TableCell>
                        );
                      })}

                      {/* Summary Columns */}
                      <TableCell align="center">{student.totalMarks || '-'}</TableCell>
                      <TableCell align="center">{student.averageMarks || '-'}</TableCell>
                      <TableCell align="center">{student.rank || '-'}</TableCell>
                    </TableRow>
                    );
                  })
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

          {/* Pagination Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Typography variant="body2">
              Page {currentPage} of {totalPages}
            </Typography>
          </Box>
        </>
      ) : (
        <>
          {/* School Summary Report */}
          <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Overall Performance
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  Total Passed Candidates: {reportData.overallPerformance?.totalPassed || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  Examination GPA: {reportData.overallPerformance?.examGpa || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Division Summary Table */}
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
                    <TableCell align="center">{reportData.divisionSummary?.I || 0}</TableCell>
                    <TableCell align="center">{reportData.divisionSummary?.II || 0}</TableCell>
                    <TableCell align="center">{reportData.divisionSummary?.III || 0}</TableCell>
                    <TableCell align="center">{reportData.divisionSummary?.IV || 0}</TableCell>
                    <TableCell align="center">{reportData.divisionSummary?.['0'] || 0}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Subject-Wise Performance Summary */}
          <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Subject-Wise Performance Summary
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
                  {Object.keys(reportData.subjectPerformance || {}).length > 0 ? (
                    Object.values(reportData.subjectPerformance).map((subject) => (
                      <TableRow key={subject.name}>
                        <TableCell>{subject.name}</TableCell>
                        <TableCell align="center">{subject.registered}</TableCell>
                        <TableCell align="center">{subject.grades.A}</TableCell>
                        <TableCell align="center">{subject.grades.B}</TableCell>
                        <TableCell align="center">{subject.grades.C}</TableCell>
                        <TableCell align="center">{subject.grades.D}</TableCell>
                        <TableCell align="center">{subject.grades.E}</TableCell>
                        <TableCell align="center">{subject.grades.S}</TableCell>
                        <TableCell align="center">{subject.grades.F}</TableCell>
                        <TableCell align="center">{subject.passed}</TableCell>
                        <TableCell align="center">{subject.gpa}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // If no subject performance data, show placeholder rows for common subjects
                    ['General Studies', 'Chemistry', 'Physics', 'Biology', 'Geography', 'Advanced Mathematics', 'History', 'English Language', 'Economics', 'Kiswahili', 'BAM'].map((subjectName) => (
                      <TableRow key={subjectName}>
                        <TableCell>{subjectName}</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">N/A</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

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

EnhancedALevelClassReport.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onDownload: PropTypes.func,
  onPrint: PropTypes.func
};

export default EnhancedALevelClassReport;
