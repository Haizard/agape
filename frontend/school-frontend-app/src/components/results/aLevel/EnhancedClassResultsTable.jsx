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
  const [rowsPerPage, setRowsPerPage] = React.useState(-1); // -1 means 'All'

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
      <TableContainer className="table-container" sx={{ maxHeight: 'none', overflow: 'visible', width: '100%', overflowX: 'visible', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <Table stickyHeader className="report-table compact-table" size="small" sx={{ tableLayout: 'auto', minWidth: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 40, maxWidth: 40, width: 40, fontSize: '16px', padding: '8px 6px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '30px' }}><strong>Rank</strong></div>
              </TableCell>
              <TableCell sx={{ minWidth: 200, maxWidth: 200, width: 200, fontSize: '16px', padding: '8px 6px' }}><strong>Student Name</strong></TableCell>
              <TableCell sx={{ minWidth: 40, maxWidth: 40, width: 40, fontSize: '16px', padding: '8px 6px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '30px' }}><strong>Sex</strong></div>
              </TableCell>
              <TableCell align="center" sx={{ minWidth: 40, maxWidth: 40, width: 40, fontSize: '16px', padding: '8px 6px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '30px' }}><strong>Points</strong></div>
              </TableCell>
              <TableCell align="center" sx={{ minWidth: 40, maxWidth: 40, width: 40, fontSize: '16px', padding: '8px 6px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '30px' }}><strong>Division</strong></div>
              </TableCell>
              {subjects.map(subject => (
                <TableCell key={subject} align="center" className="subject-column" sx={{ minWidth: 40, maxWidth: 40, width: 40, fontSize: '16px', padding: '8px 6px', height: '100px' }}>
                  <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '30px' }} title={subject}>
                    <strong>{subject.length > 12 ? `${subject.substring(0, 10)}...` : subject}</strong>
                  </div>
                </TableCell>
              ))}
              <TableCell align="center" sx={{ minWidth: 40, maxWidth: 40, width: 40, fontSize: '16px', padding: '8px 6px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '30px' }}><strong>Total</strong></div>
              </TableCell>
              <TableCell align="center" sx={{ minWidth: 40, maxWidth: 40, width: 40, fontSize: '16px', padding: '8px 6px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '30px' }}><strong>Average</strong></div>
              </TableCell>
              <TableCell align="center" sx={{ minWidth: 40, maxWidth: 40, width: 40, fontSize: '16px', padding: '8px 6px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '30px' }}><strong>Rank</strong></div>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((student, index) => (
              <TableRow key={student.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                <TableCell sx={{ fontSize: '16px', padding: '6px 8px' }}>{student.rank}</TableCell>
                <TableCell className="student-name" sx={{ fontSize: '16px', padding: '6px 8px', fontWeight: 'bold' }}>{student.name}</TableCell>
                <TableCell sx={{ fontSize: '16px', padding: '6px 8px' }}>{student.sex}</TableCell>
                <TableCell align="center" sx={{ fontSize: '16px', padding: '6px 8px' }}>{student.bestThreePoints || '-'}</TableCell>
                <TableCell align="center" sx={{ padding: '6px 8px', fontSize: '16px' }}>
                  {student.division && (
                    <span className={`division-chip ${getDivisionClass(student.division)}`} style={{ fontSize: '16px', padding: '4px 6px' }}>
                      {formatDivision(student.division)}
                    </span>
                  )}
                </TableCell>
                {subjects.map(subject => {
                  const result = getStudentResult(student, subject);
                  return (
                    <TableCell key={`${student.id}-${subject}`} align="center" className="subject-column" sx={{ padding: '6px 8px' }}>
                      {result ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0 }}>
                          <Typography variant="body2" sx={{ fontSize: '16px', lineHeight: 1.3, margin: 0 }}>
                            {formatNumber(result.marks)}
                          </Typography>
                          {result.grade && (
                            <Typography variant="body2" className={getGradeClass(result.grade)} sx={{ fontSize: '16px', lineHeight: 1.2, margin: 0, fontWeight: 'bold' }}>
                              {result.grade}
                            </Typography>
                          )}
                        </Box>
                      ) : '-'}
                    </TableCell>
                  );
                })}
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', padding: '6px 8px' }}>{formatNumber(student.totalMarks)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', padding: '6px 8px' }}>{formatNumber(student.averageMarks)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', padding: '6px 8px' }}>{student.rank}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[25, 50, 100, { label: 'All', value: -1 }]}
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
