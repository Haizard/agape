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
  Chip,
  TablePagination
} from '@mui/material';
import {
  formatNumber,
  formatDivision,
  getDivisionColor
} from '../../../utils/reportFormatUtils';

/**
 * ClassResultsTable Component
 *
 * Displays the student results table in the A-Level class result report.
 */
const ClassResultsTable = ({ students, subjectCombination }) => {
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

  // Calculate visible rows based on pagination
  const visibleRows = useMemo(() => {
    return students.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [students, page, rowsPerPage]);

  return (
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Class Results
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Box>
      <TableContainer sx={{ maxHeight: 'none', overflow: 'visible' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 50 }}><strong>Rank</strong></TableCell>
              <TableCell sx={{ minWidth: 200 }}><strong>Student Name</strong></TableCell>
              <TableCell sx={{ minWidth: 80 }}><strong>Sex</strong></TableCell>
              <TableCell align="center" sx={{ minWidth: 100 }}><strong>Points</strong></TableCell>
              <TableCell align="center" sx={{ minWidth: 100 }}><strong>Division</strong></TableCell>
              {subjects.map(subject => (
                <TableCell key={subject} align="center" sx={{ minWidth: 100 }}>
                  <strong>{subject}</strong>
                </TableCell>
              ))}
              <TableCell align="center" sx={{ minWidth: 100 }}><strong>Total</strong></TableCell>
              <TableCell align="center" sx={{ minWidth: 100 }}><strong>Average</strong></TableCell>
              <TableCell align="center" sx={{ minWidth: 100 }}><strong>Rank</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.rank}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.sex}</TableCell>
                <TableCell align="center">{student.bestThreePoints || '-'}</TableCell>
                <TableCell align="center">
                  {student.division && (
                    <Chip
                      label={formatDivision(student.division)}
                      color={getDivisionColor(student.division)}
                      size="small"
                    />
                  )}
                </TableCell>
                {subjects.map(subject => {
                  const result = getStudentResult(student, subject);
                  return (
                    <TableCell key={`${student.id}-${subject}`} align="center">
                      {result ? formatNumber(result.marks) : '-'}
                    </TableCell>
                  );
                })}
                <TableCell align="center">{formatNumber(student.totalMarks)}</TableCell>
                <TableCell align="center">{formatNumber(student.averageMarks)}</TableCell>
                <TableCell align="center">{student.rank}</TableCell>
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
      />
    </Paper>
  );
};

ClassResultsTable.propTypes = {
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      sex: PropTypes.string,
      rank: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      averageMarks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
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

export default ClassResultsTable;
