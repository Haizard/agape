import React, { useMemo } from 'react';
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
  Divider,
  TablePagination
} from '@mui/material';
import {
  formatNumber,
  formatDivision,
  getDivisionColor
} from '../../../utils/reportFormatUtils';
import './ALevelClassReportStyles.css';

/**
 * EnhancedClassResultsTable Component
 *
 * Displays an enhanced student results table in the A-Level class result report.
 */
const EnhancedClassResultsTable = ({ students, subjectCombination }) => {
  // State for pagination
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Get unique subjects from all students
  const subjects = useMemo(() => {
    const subjectSet = new Set();

    students.forEach(student => {
      (student.results || []).forEach(result => {
        if (result.subject) {
          subjectSet.add(result.subject);
        }
      });
    });

    return Array.from(subjectSet);
  }, [students]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get student result for a specific subject
  const getStudentResult = (student, subjectName) => {
    return (student.results || []).find(result => result.subject === subjectName);
  };

  // Get CSS class for grade
  const getGradeClass = (grade) => {
    if (!grade) return '';

    const gradeMap = {
      'A': 'grade-a',
      'B': 'grade-b',
      'C': 'grade-c',
      'D': 'grade-d',
      'E': 'grade-e',
      'S': 'grade-s',
      'F': 'grade-f'
    };

    return gradeMap[grade] || '';
  };

  // Get CSS class for division
  const getDivisionClass = (division) => {
    if (!division) return '';

    const divStr = division.toString().replace('Division ', '');
    return `division-${divStr}`;
  };

  // Calculate visible rows based on pagination
  const visibleRows = useMemo(() => {
    return students.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [students, page, rowsPerPage]);

  return (
    <Paper className="report-section" sx={{ mb: 3 }}>
      <Box className="section-header">
        <Typography variant="h6" className="section-title" gutterBottom>
          Class Results
        </Typography>
      </Box>
      <TableContainer sx={{ maxHeight: 600, overflow: 'auto' }}>
        <Table stickyHeader className="report-table compact-table" size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 40, maxWidth: 40, width: 40 }}><strong>Rank</strong></TableCell>
              <TableCell sx={{ minWidth: 150, maxWidth: 180, width: 150 }}><strong>Student Name</strong></TableCell>
              <TableCell sx={{ minWidth: 40, maxWidth: 40, width: 40 }}><strong>Sex</strong></TableCell>
              <TableCell align="center" sx={{ minWidth: 60, maxWidth: 60, width: 60 }}><strong>Points</strong></TableCell>
              <TableCell align="center" sx={{ minWidth: 70, maxWidth: 70, width: 70 }}><strong>Division</strong></TableCell>
              {subjects.map(subject => (
                <TableCell key={subject} align="center" className="subject-column">
                  <strong title={subject}>{subject.length > 10 ? `${subject.substring(0, 8)}...` : subject}</strong>
                </TableCell>
              ))}
              <TableCell align="center" sx={{ minWidth: 60, maxWidth: 60, width: 60 }}><strong>Total</strong></TableCell>
              <TableCell align="center" sx={{ minWidth: 60, maxWidth: 60, width: 60 }}><strong>Average</strong></TableCell>
              <TableCell align="center" sx={{ minWidth: 40, maxWidth: 40, width: 40 }}><strong>Rank</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((student, index) => (
              <TableRow key={student.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                <TableCell sx={{ fontSize: '0.75rem', padding: '2px 4px' }}>{student.rank}</TableCell>
                <TableCell className="student-name" sx={{ fontSize: '0.75rem', padding: '2px 4px' }}>{student.name}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '2px 4px' }}>{student.sex}</TableCell>
                <TableCell align="center" sx={{ fontSize: '0.75rem', padding: '2px 4px' }}>{student.bestThreePoints || '-'}</TableCell>
                <TableCell align="center" sx={{ padding: '2px 4px' }}>
                  {student.division && (
                    <span className={`division-chip ${getDivisionClass(student.division)}`}>
                      {formatDivision(student.division)}
                    </span>
                  )}
                </TableCell>
                {subjects.map(subject => {
                  const result = getStudentResult(student, subject);
                  return (
                    <TableCell key={`${student.id}-${subject}`} align="center" className="subject-column">
                      {result ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.2, margin: 0 }}>
                            {formatNumber(result.marks)}
                          </Typography>
                          {result.grade && (
                            <Typography variant="body2" className={getGradeClass(result.grade)} sx={{ fontSize: '0.7rem', lineHeight: 1, margin: 0 }}>
                              {result.grade}
                            </Typography>
                          )}
                        </Box>
                      ) : '-'}
                    </TableCell>
                  );
                })}
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{formatNumber(student.totalMarks)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{formatNumber(student.averageMarks)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{student.rank}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={students.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        className="no-print"
      />
    </Paper>
  );
};

EnhancedClassResultsTable.propTypes = {
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      sex: PropTypes.string,
      rank: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      averageMarks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      totalMarks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      totalPoints: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      bestThreePoints: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      division: PropTypes.string,
      results: PropTypes.arrayOf(
        PropTypes.shape({
          subject: PropTypes.string.isRequired,
          marks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
          grade: PropTypes.string,
          points: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
        })
      )
    })
  ).isRequired,
  subjectCombination: PropTypes.object
};

export default EnhancedClassResultsTable;
