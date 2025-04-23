import React, { useMemo, useEffect, useRef } from 'react';
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
  TablePagination,
  Button
} from '@mui/material';
import {
  formatNumber,
  formatDivision,
  getDivisionColor
} from '../../../utils/reportFormatUtils';
import { calculateDivision } from '../../../utils/aLevelCalculationUtils';
import './ALevelClassReportStyles.css';
import './PrintForcedStyles.css';
import { forcePrint } from '../../../utils/printForcer';
import { fitTableToPage } from '../../../utils/tableFitter';
import { printTableInNewWindow } from '../../../utils/printRenderer';
import { printTableOnA4 } from '../../../utils/a4Renderer';
import '../PrintableTableStyles.css';

/**
 * EnhancedClassResultsTable Component
 *
 * Displays an enhanced student results table in the A-Level class result report.
 */
const EnhancedClassResultsTable = ({ students, subjectCombination }) => {
  // State for pagination
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(-1); // -1 means 'All'
  const [processedStudents, setProcessedStudents] = React.useState([]);

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
    // First try to find the result by exact subject name match
    const result = (student.results || []).find(result => result.subject === subjectName);

    if (result) return result;

    // If no exact match, try to find by subject ID or partial name match
    return (student.results || []).find(result => {
      // Check if subject property is an object with a name property
      if (result.subject && typeof result.subject === 'object' && result.subject.name) {
        return result.subject.name === subjectName;
      }

      // Check for partial matches (useful when subject names might vary slightly)
      if (typeof result.subject === 'string' && typeof subjectName === 'string') {
        return result.subject.includes(subjectName) || subjectName.includes(result.subject);
      }

      return false;
    });
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

  // Process students to ensure divisions are calculated correctly
  useEffect(() => {
    // Process each student to ensure division is calculated correctly
    const processed = students.map(student => {
      // If student already has bestThreePoints and division, use them
      if (student.bestThreePoints && student.division) {
        return student;
      }

      // Calculate bestThreePoints if not already present
      let bestThreePoints = student.bestThreePoints;
      if (!bestThreePoints && student.results) {
        // Get principal subjects (or all subjects if not specified)
        const principalResults = student.results.filter(result =>
          result.isPrincipal || !student.results.some(r => r.isPrincipal)
        );

        // Sort by points (ascending, as lower is better in A-Level)
        const sortedResults = [...principalResults].sort((a, b) =>
          (a.points || 7) - (b.points || 7)
        );

        // Take best three (or fewer if not enough)
        const bestThree = sortedResults.slice(0, 3);
        bestThreePoints = bestThree.reduce((sum, result) => sum + (result.points || 0), 0);
      }

      // Calculate division based on bestThreePoints
      const division = bestThreePoints ? calculateDivision(bestThreePoints) : '0';

      // Return updated student object
      return {
        ...student,
        bestThreePoints,
        division
      };
    });

    setProcessedStudents(processed);
  }, [students]);

  // Calculate visible rows based on pagination
  const visibleRows = useMemo(() => {
    return processedStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [processedStudents, page, rowsPerPage]);

  // Reference to the table element
  const tableRef = useRef(null);

  // Function to handle force print
  const handleForcePrint = () => {
    forcePrint('.report-table');
  };

  // Function to handle fit table to page
  const handleFitTable = () => {
    fitTableToPage('.report-table');
  };

  // Function to handle guaranteed print with all columns
  const handleGuaranteedPrint = () => {
    printTableInNewWindow('.report-table');
  };

  // Function to handle A4 paper print
  const handleA4Print = () => {
    printTableOnA4('.report-table', true); // true = print full report
  };

  return (
    <Paper className="report-section" sx={{ mb: 3 }}>
      <Box className="section-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" className="section-title" gutterBottom>
          Class Results
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleForcePrint}
            className="no-print"
            sx={{
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#1b5e20' },
              fontWeight: 'bold'
            }}
          >
            Force Print (No Cut-off)
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleFitTable}
            className="no-print"
            sx={{
              backgroundColor: '#d32f2f',
              '&:hover': { backgroundColor: '#b71c1c' },
              fontWeight: 'bold'
            }}
          >
            Auto-Fit to Page
          </Button>

          <Button
            variant="contained"
            color="info"
            onClick={handleGuaranteedPrint}
            className="no-print"
            sx={{
              backgroundColor: '#0288d1',
              '&:hover': { backgroundColor: '#01579b' },
              fontWeight: 'bold'
            }}
          >
            Print All Columns
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={handleA4Print}
            className="no-print"
            sx={{
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#1b5e20' },
              fontWeight: 'bold'
            }}
          >
            Fill A4 Paper
          </Button>
        </Box>
      </Box>
      <TableContainer className="table-container" sx={{ maxHeight: 'none', overflow: 'visible', width: '100%', overflowX: 'visible', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <Table ref={tableRef} stickyHeader className="report-table compact-table printable-table" size="small" sx={{ tableLayout: 'auto', minWidth: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 20, maxWidth: 20, width: 20, fontSize: '16px', padding: '8px 2px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '20px', fontWeight: 700, fontSize: '14px' }}>Rank</div>
              </TableCell>
              <TableCell sx={{ minWidth: 80, maxWidth: 80, width: 80, fontSize: '16px', padding: '8px 6px', fontWeight: 700 }}>Student Name</TableCell>
              <TableCell sx={{ minWidth: 15, maxWidth: 15, width: 15, fontSize: '16px', padding: '8px 2px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '15px', fontWeight: 700, fontSize: '14px' }}>Sex</div>
              </TableCell>
              <TableCell align="center" sx={{ minWidth: 20, maxWidth: 20, width: 20, fontSize: '16px', padding: '8px 2px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '20px', fontWeight: 700, fontSize: '14px' }}>Pts</div>
              </TableCell>
              <TableCell align="center" sx={{ minWidth: 20, maxWidth: 20, width: 20, fontSize: '16px', padding: '8px 6px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '20px', fontWeight: 700 }}>Div</div>
              </TableCell>
              {subjects.map(subject => (
                <TableCell key={subject} align="center" className="subject-column" sx={{ minWidth: 25, maxWidth: 25, width: 25, fontSize: '16px', padding: '8px 2px', height: '100px' }}>
                  <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '20px', fontWeight: 700, fontSize: '14px', letterSpacing: '-0.5px' }} title={subject}>
                    {subject.length > 8 ? `${subject.substring(0, 6)}..` : subject}
                  </div>
                </TableCell>
              ))}
              <TableCell align="center" sx={{ minWidth: 25, maxWidth: 25, width: 25, fontSize: '16px', padding: '8px 2px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '20px', fontWeight: 700, fontSize: '14px' }}>Total</div>
              </TableCell>
              <TableCell align="center" sx={{ minWidth: 25, maxWidth: 25, width: 25, fontSize: '16px', padding: '8px 2px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '20px', fontWeight: 700, fontSize: '14px' }}>Avg</div>
              </TableCell>
              <TableCell align="center" sx={{ minWidth: 20, maxWidth: 20, width: 20, fontSize: '16px', padding: '8px 2px', height: '100px' }}>
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '20px', fontWeight: 700, fontSize: '14px' }}>Rank</div>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((student, index) => (
              <TableRow key={student.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                <TableCell sx={{ fontSize: '14px', padding: '2px', fontWeight: 700, minWidth: 20, maxWidth: 20, width: 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.rank}</TableCell>
                <TableCell className="student-name" sx={{ fontSize: '16px', padding: '6px 8px', fontWeight: 700, letterSpacing: '-1px', wordSpacing: '-2px', maxWidth: '80px', width: '80px', minWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</TableCell>
                <TableCell sx={{ fontSize: '14px', padding: '2px', fontWeight: 700, minWidth: 15, maxWidth: 15, width: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.sex}</TableCell>
                <TableCell align="center" sx={{ fontSize: '14px', padding: '2px', fontWeight: 700, minWidth: 20, maxWidth: 20, width: 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.bestThreePoints || '-'}</TableCell>
                <TableCell align="center" sx={{ padding: '6px 2px', fontSize: '16px', minWidth: 20, maxWidth: 20, width: 20 }}>
                  {student.bestThreePoints ? (
                    <span className={`division-chip ${getDivisionClass(student.division)}`} style={{ fontSize: '14px', padding: '1px 2px', letterSpacing: '-1px', fontWeight: 700, maxWidth: '20px', overflow: 'hidden', display: 'inline-block' }}>
                      {formatDivision(student.division)}
                    </span>
                  ) : '-'}
                </TableCell>
                {subjects.map(subject => {
                  const result = getStudentResult(student, subject);
                  // Check if student takes this subject
                  const studentTakesSubject = student.subjects?.some(s => s.subject === subject) ||
                                             student.results?.some(r => r.subject === subject) ||
                                             (student.subjectCombination?.subjects?.some(s => s.subject?.name === subject || s.subject === subject));

                  return (
                    <TableCell key={`${student.id}-${subject}`} align="center" className="subject-column" sx={{ padding: '2px', minWidth: 25, maxWidth: 25, width: 25 }}>
                      {result ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0, margin: 0 }}>
                          <Typography variant="body2" sx={{ fontSize: '14px', lineHeight: 1.1, margin: 0, padding: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
                            {result.marks !== undefined && result.marks !== null ? formatNumber(result.marks) : '-'}
                          </Typography>
                          {result.grade && (
                            <Typography variant="body2" className={getGradeClass(result.grade)} sx={{ fontSize: '14px', lineHeight: 1.1, margin: 0, padding: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
                              {result.grade}
                            </Typography>
                          )}
                        </Box>
                      ) : studentTakesSubject ? '-' : 'N/L'}
                    </TableCell>
                  );
                })}
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '14px', padding: '2px', minWidth: 25, maxWidth: 25, width: 25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatNumber(student.totalMarks)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '14px', padding: '2px', minWidth: 25, maxWidth: 25, width: 25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatNumber(student.averageMarks)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '14px', padding: '2px', minWidth: 20, maxWidth: 20, width: 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.rank}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[25, 50, 100, { label: 'All', value: -1 }]}
        component="div"
        count={processedStudents.length}
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
