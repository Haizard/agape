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
  Chip
} from '@mui/material';
import { formatNumber, getGradeColor } from '../../../utils/reportFormatUtils';

/**
 * SubjectResultsTable Component
 * 
 * Displays the subject results table in the A-Level result report,
 * separated into principal and subsidiary subjects.
 */
const SubjectResultsTable = ({ subjectResults }) => {
  // Memoize the separation of principal and subsidiary subjects
  const { principalSubjects, subsidiarySubjects } = useMemo(() => {
    const principal = subjectResults.filter(result => result.isPrincipal);
    const subsidiary = subjectResults.filter(result => !result.isPrincipal);
    return { principalSubjects: principal, subsidiarySubjects: subsidiary };
  }, [subjectResults]);

  return (
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Subject Results
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Subject</strong></TableCell>
              <TableCell align="center"><strong>Marks</strong></TableCell>
              <TableCell align="center"><strong>Grade</strong></TableCell>
              <TableCell align="center"><strong>Points</strong></TableCell>
              <TableCell><strong>Remarks</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Principal Subjects */}
            <TableRow>
              <TableCell colSpan={5} sx={{ backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle1"><strong>Principal Subjects</strong></Typography>
              </TableCell>
            </TableRow>
            {principalSubjects.map((result) => (
              <TableRow key={`principal-${result.subject}`} sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1">{result.subject}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                      <Chip
                        label="Principal"
                        color="primary"
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                      />
                      {result.isCompulsory && (
                        <Chip
                          label="Compulsory"
                          color="secondary"
                          size="small"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {formatNumber(result.marks)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={result.grade || 'N/A'}
                    color={getGradeColor(result.grade)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {result.points || 0}
                  </Typography>
                </TableCell>
                <TableCell>{result.remarks || 'N/A'}</TableCell>
              </TableRow>
            ))}

            {/* Subsidiary Subjects */}
            <TableRow>
              <TableCell colSpan={5} sx={{ backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle1"><strong>Subsidiary Subjects</strong></Typography>
              </TableCell>
            </TableRow>
            {subsidiarySubjects.map((result) => (
              <TableRow key={`subsidiary-${result.subject}`}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1">{result.subject}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                      <Chip
                        label="Subsidiary"
                        color="default"
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                      />
                      {result.isCompulsory && (
                        <Chip
                          label="Compulsory"
                          color="secondary"
                          size="small"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="center">{formatNumber(result.marks)}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={result.grade || 'N/A'}
                    color={getGradeColor(result.grade)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">{result.points || 0}</TableCell>
                <TableCell>{result.remarks || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

SubjectResultsTable.propTypes = {
  subjectResults: PropTypes.arrayOf(
    PropTypes.shape({
      subject: PropTypes.string.isRequired,
      marks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      grade: PropTypes.string,
      points: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      remarks: PropTypes.string,
      isPrincipal: PropTypes.bool,
      isCompulsory: PropTypes.bool
    })
  ).isRequired
};

export default SubjectResultsTable;
