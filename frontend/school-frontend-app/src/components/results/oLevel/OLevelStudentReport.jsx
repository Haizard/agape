import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import '../common/ReportStyles.css';

const OLevelStudentReport = ({ student, subjects }) => {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="report-container">
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e' }}>
          AGAPE LUTHERAN JUNIOR SEMINARY
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          P.O. BOX 8882, MOSHI, TANZANIA
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Mobile: 0759767735 | Email: infoagapeseminary@gmail.com
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e', mt: 2 }}>
          O-LEVEL CLASS EXAMINATION RESULTS
        </Typography>
      </Box>
      <div className="student-info-header">
        <div className="student-info-item">
          <span className="student-info-label">Name:</span>
          <span className="student-info-value">{student?.name || 'N/A'}</span>
        </div>
        <div className="student-info-item">
          <span className="student-info-label">Class:</span>
          <span className="student-info-value">{student?.class || 'N/A'}</span>
        </div>
        <div className="student-info-item">
          <span className="student-info-label">Stream:</span>
          <span className="student-info-value">{student?.stream || 'N/A'}</span>
        </div>
        <div className="student-info-item">
          <span className="student-info-label">Term:</span>
          <span className="student-info-value">{term || 'N/A'}</span>
        </div>
        <div className="student-info-item">
          <span className="student-info-label">Year:</span>
          <span className="student-info-value">{year || 'N/A'}</span>
        </div>
        <div className="student-info-item">
          <span className="student-info-label">Roll No:</span>
          <span className="student-info-value">{student?.rollNumber || 'N/A'}</span>
        </div>
        <div className="student-info-item">
          <span className="student-info-label">Rank:</span>
          <span className="student-info-value">{student?.rank || 'N/A'}</span>
        </div>
        <div className="student-info-item">
          <span className="student-info-label">Gender:</span>
          <span className="student-info-value">{student?.gender || 'N/A'}</span>
        </div>
        <div className="student-info-item">
          <span className="student-info-label">Exam:</span>
          <span className="student-info-value">{student?.examType || 'N/A'}</span>
        </div>
        <div className="student-info-item">
          <span className="student-info-label">Date:</span>
          <span className="student-info-value">{formatDate(student?.examDate)}</span>
        </div>
      </div>

      <Typography className="subject-header">Subjects</Typography>
      <TableContainer component={Paper} className="subjects-table">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell className="table-header">Subject</TableCell>
              <TableCell className="table-header">Paper</TableCell>
              <TableCell className="table-header">Marks</TableCell>
              <TableCell className="table-header">Grade</TableCell>
              <TableCell className="table-header">Comments</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjects && subjects.length > 0 ? (
              subjects.map((subject, index) => (
                <TableRow key={subject._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                  <TableCell className="table-cell">{subject.name}</TableCell>
                  <TableCell className="table-cell">{subject.paper}</TableCell>
                  <TableCell className="table-cell">{subject.marks}</TableCell>
                  <TableCell className="table-cell">{subject.grade}</TableCell>
                  <TableCell className="table-cell">{subject.comments}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="no-subjects-message">
                  No subjects found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default OLevelStudentReport; 