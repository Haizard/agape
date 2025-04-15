import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';

/**
 * Division Summary Table Component
 * Displays a detailed table of division statistics
 */
const DivisionSummaryTable = ({ divisionSummary, totalStudents }) => {
  return (
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
              <TableCell align="center">{divisionSummary?.I || 0}</TableCell>
              <TableCell align="center">{divisionSummary?.II || 0}</TableCell>
              <TableCell align="center">{divisionSummary?.III || 0}</TableCell>
              <TableCell align="center">{divisionSummary?.IV || 0}</TableCell>
              <TableCell align="center">{divisionSummary?.['0'] || 0}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

DivisionSummaryTable.propTypes = {
  divisionSummary: PropTypes.shape({
    I: PropTypes.number,
    II: PropTypes.number,
    III: PropTypes.number,
    IV: PropTypes.number,
    0: PropTypes.number
  }),
  totalStudents: PropTypes.number.isRequired
};

DivisionSummaryTable.defaultProps = {
  divisionSummary: { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 }
};

export default DivisionSummaryTable;
