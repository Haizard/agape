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
 * Enhanced Class Report Component
 * 
 * A comprehensive class result report component that follows the "Open Test Result - 2025" format
 * from St. John Vianney Secondary School.
 * 
 * @param {Object} props
 * @param {Object} props.data - The report data
 * @param {boolean} props.loading - Whether the data is loading
 * @param {string} props.error - Error message if any
 * @param {Function} props.onDownload - Function to call when downloading the report
 * @param {Function} props.onPrint - Function to call when printing the report
 */
const EnhancedClassReport = ({ 
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
  
  // Process and prepare data for display
  useEffect(() => {
    if (!data) return;
    
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
        if (typeof aValue === 'string' && !isNaN(aValue)) {
          aValue = parseFloat(aValue);
        }
        if (typeof bValue === 'string' && !isNaN(bValue)) {
          bValue = parseFloat(bValue);
        }
        
        // Handle missing values
        if (aValue === undefined || aValue === null) aValue = sortDirection === 'asc' ? Infinity : -Infinity;
        if (bValue === undefined || bValue === null) bValue = sortDirection === 'asc' ? Infinity : -Infinity;
        
        // Compare values
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }
    
    setProcessedData(processedData);
  }, [data, sortField, sortDirection]);
  
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
    if (!processedData) return;
    
    try {
      const doc = generateEnhancedClassReportPDF(processedData);
      const fileName = `${processedData.className || 'Class'}_${processedData.examName || 'Exam'}_Result.pdf`;
      doc.save(fileName);
      
      if (onDownload) onDownload('pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };
  
  // Handle download as Excel
  const handleDownloadExcel = async () => {
    if (!processedData) return;
    
    try {
      const buffer = await generateExcelReport(processedData, processedData.className);
      
      // Create a Blob from the buffer
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${processedData.className || 'Class'}_${processedData.examName || 'Exam'}_Result.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      if (onDownload) onDownload('excel');
    } catch (err) {
      console.error('Error generating Excel:', err);
    }
  };
  
  // Handle print
  const handlePrint = () => {
    if (!processedData) return;
    
    try {
      const doc = generateEnhancedClassReportPDF(processedData);
      doc.autoPrint();
      doc.output('dataurlnewwindow');
      
      if (onPrint) onPrint();
    } catch (err) {
      console.error('Error printing report:', err);
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
  
  // If error, show error message
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }
  
  // If no data, show message
  if (!processedData) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        No data available. Please select a class and exam to generate a report.
      </Alert>
    );
  }
  
  // Calculate pagination
  const totalStudents = processedData.students?.length || 0;
  const totalPages = Math.ceil(totalStudents / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = Math.min(startIndex + studentsPerPage, totalStudents);
  const currentStudents = processedData.students?.slice(startIndex, endIndex) || [];
  
  // Get all subjects
  const subjects = processedData.subjects || [];
  
  return (
    <Box className="enhanced-class-report" sx={{ p: 2 }}>
      {/* Report Header */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h4" align="center" gutterBottom>
          OPEN TEST RESULT - {processedData.year}
        </Typography>
        <Typography variant="h6" gutterBottom>
          Class Name: {processedData.className}
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
            {currentStudents.map((student, index) => (
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
            ))}
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
                processedData.students?.forEach(student => {
                  const subjectResult = student.subjects?.[subject.id] || 
                                       student.subjectResults?.find(r => r.subjectId === subject.id) ||
                                       student.results?.find(r => r.subject?.name === subject.name);
                  
                  if (subjectResult && subjectResult.grade) {
                    gradeDistribution[subjectResult.grade] = (gradeDistribution[subjectResult.grade] || 0) + 1;
                    totalPoints += subjectResult.points || 0;
                    studentCount++;
                  }
                });
                
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

EnhancedClassReport.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onDownload: PropTypes.func,
  onPrint: PropTypes.func
};

export default EnhancedClassReport;
