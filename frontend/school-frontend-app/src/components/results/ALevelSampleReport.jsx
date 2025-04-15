import React, { useState } from 'react';
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
  Pagination
} from '@mui/material';
import { PictureAsPdf, Print, GetApp } from '@mui/icons-material';
import {
  generateALevelReportPDF,
  generateALevelReportExcel,
  downloadPDF,
  downloadExcel,
  printReport
} from '../../utils/exportUtils';

/**
 * A-Level Sample Report Component
 * This component always displays sample data, regardless of API errors
 */
const ALevelSampleReport = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  // Sample data for the report
  const sampleData = {
    className: 'FORM V',
    examName: 'MIDTERM EXAMINATION',
    educationLevel: 'A_LEVEL',
    year: new Date().getFullYear(),
    students: [
      {
        id: '1',
        studentName: 'Jane Daniel',
        sex: 'F',
        points: 18,
        division: 'II',
        subjectResults: [
          { subject: { name: 'General Studies' }, marks: 67.8 },
          { subject: { name: 'History' }, marks: 36.0 },
          { subject: { name: 'Physics' }, marks: 34.1 },
          { subject: { name: 'Chemistry' }, marks: null },
          { subject: { name: 'Kiswahili' }, marks: null },
          { subject: { name: 'Advanced Mathematics' }, marks: null },
          { subject: { name: 'Biology' }, marks: null },
          { subject: { name: 'Geography' }, marks: 41.7 },
          { subject: { name: 'English' }, marks: 60.0 },
          { subject: { name: 'BAM' }, marks: null },
          { subject: { name: 'Economics' }, marks: 55.3 }
        ],
        totalMarks: 224.9,
        averageMarks: 44.9,
        rank: 3
      },
      {
        id: '2',
        studentName: 'John Michael',
        sex: 'M',
        points: 12,
        division: 'I',
        subjectResults: [
          { subject: { name: 'General Studies' }, marks: 74.2 },
          { subject: { name: 'History' }, marks: null },
          { subject: { name: 'Physics' }, marks: 78.1 },
          { subject: { name: 'Chemistry' }, marks: 67.0 },
          { subject: { name: 'Kiswahili' }, marks: null },
          { subject: { name: 'Advanced Mathematics' }, marks: 85.5 },
          { subject: { name: 'Biology' }, marks: null },
          { subject: { name: 'Geography' }, marks: null },
          { subject: { name: 'English' }, marks: 71.4 },
          { subject: { name: 'BAM' }, marks: null },
          { subject: { name: 'Economics' }, marks: null }
        ],
        totalMarks: 376.2,
        averageMarks: 62.7,
        rank: 1
      },
      {
        id: '3',
        studentName: 'Sarah Paul',
        sex: 'F',
        points: 21,
        division: 'III',
        subjectResults: [
          { subject: { name: 'General Studies' }, marks: 58.9 },
          { subject: { name: 'History' }, marks: null },
          { subject: { name: 'Physics' }, marks: null },
          { subject: { name: 'Chemistry' }, marks: 41.1 },
          { subject: { name: 'Kiswahili' }, marks: 47.6 },
          { subject: { name: 'Advanced Mathematics' }, marks: null },
          { subject: { name: 'Biology' }, marks: 55.3 },
          { subject: { name: 'Geography' }, marks: 33.2 },
          { subject: { name: 'English' }, marks: null },
          { subject: { name: 'BAM' }, marks: null },
          { subject: { name: 'Economics' }, marks: null }
        ],
        totalMarks: 236.1,
        averageMarks: 47.2,
        rank: 2
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
    divisionSummary: {
      'I': 1,
      'II': 1,
      'III': 1,
      'IV': 0,
      '0': 0
    },
    subjectPerformance: {
      'gs': {
        name: 'General Studies',
        registered: 3,
        grades: { A: 0, B: 2, C: 1, D: 0, E: 0, S: 0, F: 0 },
        passed: 3,
        gpa: '2.33'
      },
      'hist': {
        name: 'History',
        registered: 1,
        grades: { A: 0, B: 0, C: 0, D: 1, E: 0, S: 0, F: 0 },
        passed: 1,
        gpa: '4.00'
      },
      'phys': {
        name: 'Physics',
        registered: 2,
        grades: { A: 0, B: 1, C: 0, D: 1, E: 0, S: 0, F: 0 },
        passed: 2,
        gpa: '3.00'
      },
      'chem': {
        name: 'Chemistry',
        registered: 2,
        grades: { A: 0, B: 0, C: 1, D: 1, E: 0, S: 0, F: 0 },
        passed: 2,
        gpa: '3.50'
      },
      'kisw': {
        name: 'Kiswahili',
        registered: 1,
        grades: { A: 0, B: 0, C: 1, D: 0, E: 0, S: 0, F: 0 },
        passed: 1,
        gpa: '3.00'
      },
      'math': {
        name: 'Advanced Mathematics',
        registered: 1,
        grades: { A: 1, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 },
        passed: 1,
        gpa: '1.00'
      },
      'bio': {
        name: 'Biology',
        registered: 1,
        grades: { A: 0, B: 0, C: 1, D: 0, E: 0, S: 0, F: 0 },
        passed: 1,
        gpa: '3.00'
      },
      'geo': {
        name: 'Geography',
        registered: 2,
        grades: { A: 0, B: 0, C: 0, D: 2, E: 0, S: 0, F: 0 },
        passed: 2,
        gpa: '4.00'
      },
      'eng': {
        name: 'English',
        registered: 2,
        grades: { A: 0, B: 1, C: 1, D: 0, E: 0, S: 0, F: 0 },
        passed: 2,
        gpa: '2.50'
      },
      'econ': {
        name: 'Economics',
        registered: 1,
        grades: { A: 0, B: 0, C: 1, D: 0, E: 0, S: 0, F: 0 },
        passed: 1,
        gpa: '3.00'
      }
    },
    overallPerformance: {
      totalPassed: 3,
      examGpa: '2.67'
    }
  };

  // Get all unique subjects from the sample data
  const uniqueSubjects = sampleData.subjects.map(subject => subject.name);

  // Calculate pagination
  const totalStudents = sampleData.students.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / studentsPerPage));
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = Math.min(startIndex + studentsPerPage, totalStudents);
  const currentStudents = sampleData.students.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Handlers for export buttons
  const handleDownloadPDF = () => {
    try {
      const reportTitle = `${sampleData.className} - ${sampleData.examName} - ${sampleData.year}`;
      const doc = generateALevelReportPDF(sampleData, reportTitle);
      const filename = `A-Level_Sample_Report_${sampleData.className}_${sampleData.examName}_${sampleData.year}.pdf`;
      downloadPDF(doc, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    try {
      printReport('a-level-sample-report-container');
    } catch (error) {
      console.error('Error printing report:', error);
      alert('Failed to print report. Please try again.');
    }
  };

  const handleDownloadExcel = () => {
    try {
      const reportTitle = `${sampleData.className} - ${sampleData.examName} - ${sampleData.year}`;
      const blob = generateALevelReportExcel(sampleData, reportTitle);
      const filename = `A-Level_Sample_Report_${sampleData.className}_${sampleData.examName}_${sampleData.year}.xlsx`;
      downloadExcel(blob, filename);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Failed to generate Excel file. Please try again.');
    }
  };

  return (
    <Box id="a-level-sample-report-container" className="a-level-sample-report" sx={{ p: 2 }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        This is a sample A-Level report with demonstration data. No API calls are being made.
      </Alert>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
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
          A-LEVEL EXAMINATION RESULTS - {sampleData.year}
        </Typography>
        <Typography variant="h6" align="center" gutterBottom>
          CLASS: {sampleData.className} | EXAM: {sampleData.examName}
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
                <TableCell align="center">{sampleData.divisionSummary['I']}</TableCell>
                <TableCell align="center">{sampleData.divisionSummary['II']}</TableCell>
                <TableCell align="center">{sampleData.divisionSummary['III']}</TableCell>
                <TableCell align="center">{sampleData.divisionSummary['IV']}</TableCell>
                <TableCell align="center">{sampleData.divisionSummary['0']}</TableCell>
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
              {currentStudents.map((student, index) => (
                <TableRow key={student.id}>
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell>{student.studentName}</TableCell>
                  <TableCell>{student.sex}</TableCell>
                  <TableCell align="center">{student.points}</TableCell>
                  <TableCell align="center">{student.division}</TableCell>

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
                  <TableCell align="center">{student.totalMarks}</TableCell>
                  <TableCell align="center">{student.averageMarks}</TableCell>
                  <TableCell align="center">{student.rank}</TableCell>
                </TableRow>
              ))}
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
              {Object.entries(sampleData.subjectPerformance).map(([key, subject]) => (
                <TableRow key={key}>
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
                <TableCell align="center">{sampleData.overallPerformance.totalPassed}</TableCell>
                <TableCell align="center">{sampleData.overallPerformance.examGpa}</TableCell>
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

export default ALevelSampleReport;
