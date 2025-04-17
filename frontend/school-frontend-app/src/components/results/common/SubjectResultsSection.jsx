import React from 'react';
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

/**
 * Subject Results Section Component
 * Displays subject results in a formatted table with principal and subsidiary subjects
 */
const SubjectResultsSection = ({ subjectResults }) => {
  // Debug the incoming data
  console.log('SubjectResultsSection received data:', subjectResults);

  // Separate principal and subsidiary subjects
  const principalSubjects = subjectResults.filter(result => result.isPrincipal);
  const subsidiarySubjects = subjectResults.filter(result => !result.isPrincipal);

  console.log('Principal subjects:', principalSubjects);
  console.log('Subsidiary subjects:', subsidiarySubjects);

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
                    {result.marksObtained !== undefined && result.marksObtained !== null ?
                      Number(result.marksObtained).toFixed(1) :
                      result.marks !== undefined && result.marks !== null ?
                      Number(result.marks).toFixed(1) : '-'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={result.grade || 'N/A'}
                    color={
                      result.grade === 'A' ? 'success' :
                      result.grade === 'B' ? 'success' :
                      result.grade === 'C' ? 'primary' :
                      result.grade === 'D' ? 'warning' :
                      result.grade === 'E' ? 'warning' :
                      result.grade === 'S' ? 'warning' : 'error'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {result.points !== undefined ? result.points : '-'}
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
                <TableCell align="center">
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {result.marksObtained !== undefined && result.marksObtained !== null ?
                      Number(result.marksObtained).toFixed(1) :
                      result.marks !== undefined && result.marks !== null ?
                      Number(result.marks).toFixed(1) : '-'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={result.grade || 'N/A'}
                    color={
                      result.grade === 'A' ? 'success' :
                      result.grade === 'B' ? 'success' :
                      result.grade === 'C' ? 'primary' :
                      result.grade === 'D' ? 'warning' :
                      result.grade === 'E' ? 'warning' :
                      result.grade === 'S' ? 'warning' : 'error'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">{result.points !== undefined ? result.points : '-'}</TableCell>
                <TableCell>{result.remarks || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

SubjectResultsSection.propTypes = {
  subjectResults: PropTypes.array.isRequired
};

export default SubjectResultsSection;
