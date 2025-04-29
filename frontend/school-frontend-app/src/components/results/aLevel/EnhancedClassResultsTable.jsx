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
import a4Renderer from '../../../utils/a4Renderer';
import '../PrintableTableStyles.css';
import '../StudentReportPrintStyles.css';

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
    a4Renderer.printTableOnA4('.report-table', true); // true = print full report
  };

  return (
    <div className="report-container a-level-report" style={{
      width: '100%',
      margin: 0,
      padding: 0,
      '@media print': {
        transform: 'scale(0.45)',  // Much more aggressive scaling
        transformOrigin: 'top left',
        maxWidth: '100%',
        pageBreakAfter: 'avoid',
        pageBreakInside: 'avoid',
        margin: 0,
        padding: 0
      }
    }}>
      <Paper className="report-section" sx={{ 
        m: 0,
        p: 0,
        '@media print': {
          boxShadow: 'none',
          margin: 0,
          padding: 0,
          width: '210%'  // Increase width to compensate for scaling
        }
      }}>
        <Box className="section-header" sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 0,
          '@media print': {
            display: 'none'  // Hide header in print to save space
          }
        }}>
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
        <TableContainer className="table-container" sx={{ 
          overflow: 'visible', 
          width: '100%', 
          m: 0,
          p: 0,
          border: 'none',
          '@media print': {
            transform: 'scale(0.45)',  // Additional scaling at table level
            transformOrigin: 'top left',
            margin: 0,
            padding: 0,
            border: 'none',
            boxShadow: 'none',
            pageBreakInside: 'avoid',
            pageBreakAfter: 'avoid',
            width: '210%'  // Match paper width
          }
        }}>
          <Table ref={tableRef} stickyHeader={false} className="report-table compact-table printable-table" size="small" sx={{ 
            tableLayout: 'fixed',
            width: '100%',
            borderCollapse: 'collapse',
            '@media print': {
              fontSize: '3.5pt',  // Even smaller font
              border: 'none',
              '& td, & th': {
                border: '0.25pt solid #000',
                padding: '0.25pt',
                height: 'auto',
                lineHeight: 1
              }
            },
            '& .MuiTableCell-root': {
              padding: '0.25pt',
              fontSize: '3.5pt',
              lineHeight: 1,
              height: 'auto'
            }
          }}>
            <TableHead>
              <TableRow sx={{ height: 'auto' }}>
                <TableCell sx={{ 
                  minWidth: 8, 
                  maxWidth: 8, 
                  width: 8, 
                  fontSize: '3.5pt', 
                  padding: '0.25pt', 
                  height: '20px'  // Reduced from 30px
                }}>
                  <div style={{ 
                    transform: 'rotate(-90deg)', 
                    whiteSpace: 'nowrap', 
                    width: '8px', 
                    fontWeight: 700, 
                    fontSize: '3.5pt',
                    marginTop: '8px'  // Reduced from 10px
                  }}>Rank</div>
                </TableCell>
                <TableCell sx={{ 
                  minWidth: 30, 
                  maxWidth: 30, 
                  width: 30, 
                  fontSize: '3.5pt', 
                  padding: '0.25pt', 
                  fontWeight: 700 
                }}>Name</TableCell>
                <TableCell sx={{ 
                  minWidth: 8, 
                  maxWidth: 8, 
                  width: 8, 
                  fontSize: '3.5pt', 
                  padding: '0.25pt', 
                  height: '20px'  // Reduced from 30px
                }}>
                  <div style={{ 
                    transform: 'rotate(-90deg)', 
                    whiteSpace: 'nowrap', 
                    width: '8px', 
                    fontWeight: 700, 
                    fontSize: '3.5pt',
                    marginTop: '8px'  // Reduced from 10px
                  }}>Sex</div>
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 20, maxWidth: 20, width: 20, fontSize: '3.5pt', padding: '0.25pt', height: '30px', '@media print': { height: '20px' } }}>
                  <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '20px', fontWeight: 700, fontSize: '3.5pt' }}>Pts</div>
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 20, maxWidth: 20, width: 20, fontSize: '3.5pt', padding: '0.25pt', height: '30px', '@media print': { height: '20px' } }}>
                  <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '20px', fontWeight: 700, fontSize: '3.5pt' }}>Div</div>
                </TableCell>
                {subjects.map(subject => (
                  <TableCell key={subject} align="center" className="subject-column" sx={{ 
                    minWidth: 10, 
                    maxWidth: 10, 
                    width: 10, 
                    fontSize: '3.5pt', 
                    padding: '0.25pt', 
                    height: '30px'
                  }}>
                    <div style={{ 
                      transform: 'rotate(-90deg)', 
                      whiteSpace: 'nowrap', 
                      width: '8px', 
                      fontWeight: 700, 
                      fontSize: '3.5pt',
                      marginTop: '10px',
                      letterSpacing: '-0.1px' 
                    }} title={subject}>
                      {subject.length > 3 ? `${subject.substring(0, 2)}..` : subject}
                    </div>
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ minWidth: 25, maxWidth: 25, width: 25, fontSize: '3.5pt', padding: '0.25pt', height: '30px', '@media print': { height: '20px' } }}>
                  <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '20px', fontWeight: 700, fontSize: '3.5pt' }}>Total</div>
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 25, maxWidth: 25, width: 25, fontSize: '3.5pt', padding: '0.25pt', height: '30px', '@media print': { height: '20px' } }}>
                  <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '20px', fontWeight: 700, fontSize: '3.5pt' }}>Avg</div>
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 20, maxWidth: 20, width: 20, fontSize: '3.5pt', padding: '0.25pt', height: '30px', '@media print': { height: '20px' } }}>
                  <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', width: '20px', fontWeight: 700, fontSize: '3.5pt' }}>Rank</div>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map((student, index) => (
                <TableRow key={student.id} sx={{
                  height: 'auto',
                  '&:nth-of-type(even)': {
                    backgroundColor: '#f5f5f5'
                  }
                }}>
                  <TableCell sx={{ 
                    fontSize: '3.5pt', 
                    padding: '0.25pt', 
                    height: 'auto',
                    width: 8
                  }}>{student.rank}</TableCell>
                  <TableCell sx={{ 
                    fontSize: '3.5pt', 
                    padding: '0.25pt', 
                    height: 'auto',
                    width: 30,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>{student.name}</TableCell>
                  <TableCell sx={{ 
                    padding: '0.25pt', 
                    fontSize: '3.5pt', 
                    minWidth: 8, 
                    maxWidth: 8, 
                    width: 8,
                    height: 'auto'
                  }}>{student.sex === 'Female' ? 'F' : student.sex === 'Male' ? 'M' : student.sex}</TableCell>
                  <TableCell align="center" sx={{ 
                    padding: '0.25pt', 
                    fontSize: '3.5pt', 
                    minWidth: 20, 
                    maxWidth: 20, 
                    width: 20,
                    height: 'auto'
                  }}>{student.bestThreePoints || '-'}</TableCell>
                  <TableCell align="center" sx={{ 
                    padding: '0.25pt', 
                    fontSize: '3.5pt', 
                    minWidth: 20, 
                    maxWidth: 20, 
                    width: 20,
                    height: 'auto'
                  }}>
                    {student.bestThreePoints ? (
                      <span className={`division-chip ${getDivisionClass(student.division)}`} style={{ 
                        fontSize: '3.5pt', 
                        padding: '0 0.1pt', 
                        letterSpacing: '-0.1px', 
                        fontWeight: 700, 
                        maxWidth: '8px', 
                        overflow: 'hidden', 
                        display: 'inline-block' 
                      }}>
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
                      <TableCell key={`${student.id}-${subject}`} align="center" className="subject-column" sx={{ 
                        padding: '0.25pt', 
                        minWidth: 10, 
                        maxWidth: 10, 
                        width: 10,
                        height: 'auto'
                      }}>
                        {result ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0, margin: 0 }}>
                            <Typography variant="body2" sx={{ fontSize: '3.5pt', lineHeight: 1.1, margin: 0, padding: 0, fontWeight: 700, letterSpacing: '-0.1px' }}>
                              {result.marks !== undefined && result.marks !== null ? formatNumber(result.marks) : '-'}
                            </Typography>
                          </Box>
                        ) : studentTakesSubject ? '-' : 'N/L'}
                      </TableCell>
                    );
                  })}
                  <TableCell align="center" sx={{ 
                    padding: '0.25pt', 
                    fontWeight: 700, 
                    fontSize: '3.5pt', 
                    minWidth: 25, 
                    maxWidth: 25, 
                    width: 25,
                    height: 'auto'
                  }}>{formatNumber(student.totalMarks)}</TableCell>
                  <TableCell align="center" sx={{ 
                    padding: '0.25pt', 
                    fontWeight: 700, 
                    fontSize: '3.5pt', 
                    minWidth: 25, 
                    maxWidth: 25, 
                    width: 25,
                    height: 'auto'
                  }}>{formatNumber(student.averageMarks)}</TableCell>
                  <TableCell align="center" sx={{ 
                    padding: '0.25pt', 
                    fontWeight: 700, 
                    fontSize: '3.5pt', 
                    minWidth: 20, 
                    maxWidth: 20, 
                    width: 20,
                    height: 'auto'
                  }}>{student.rank}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          sx={{ display: 'none' }}  // Hide pagination completely
          rowsPerPageOptions={[{ label: 'All', value: -1 }]}
          component="div"
          count={processedStudents.length}
          rowsPerPage={-1}
          page={0}
          onPageChange={() => {}}
          onRowsPerPageChange={() => {}}
        />
      </Paper>
    </div>
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
