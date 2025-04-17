import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip
} from '@mui/material';
import GradeChip from '../../common/GradeChip';
import { formatALevelGrade, getALevelGradeRemarks } from '../../../utils/resultDataStructures';

/**
 * A-Level Subject Results Table Component
 * 
 * A reusable component for displaying A-Level subject results in a consistent format
 * 
 * @param {Object} props - Component props
 * @param {Array} props.subjectResults - Array of subject results
 * @param {boolean} props.showType - Whether to show subject type (Principal/Subsidiary)
 * @param {boolean} props.showRemarks - Whether to show remarks column
 * @param {boolean} props.showCode - Whether to show subject code
 * @param {string} props.title - Optional table title
 * @param {Object} props.tableProps - Additional props for the Table component
 */
const ALevelSubjectResultsTable = ({
  subjectResults = [],
  showType = true,
  showRemarks = true,
  showCode = false,
  title = '',
  tableProps = {}
}) => {
  // Ensure we have an array of results
  const results = Array.isArray(subjectResults) ? subjectResults : [];

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
        </Box>
      )}
      <TableContainer>
        <Table size="small" {...tableProps}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              {showCode && <TableCell>Code</TableCell>}
              <TableCell>Subject</TableCell>
              <TableCell align="center">Marks</TableCell>
              <TableCell align="center">Grade</TableCell>
              <TableCell align="center">Points</TableCell>
              {showType && <TableCell>Type</TableCell>}
              {showRemarks && <TableCell>Remarks</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {results.length > 0 ? (
              results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  {showCode && <TableCell>{result.code || '-'}</TableCell>}
                  <TableCell>
                    <Typography variant="body2">
                      {result.subject || result.name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {result.marksObtained || result.marks || '-'}
                  </TableCell>
                  <TableCell align="center">
                    <GradeChip 
                      grade={formatALevelGrade(result.grade)} 
                      educationLevel="A_LEVEL" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    {result.points !== undefined ? result.points : '-'}
                  </TableCell>
                  {showType && (
                    <TableCell>
                      <Chip
                        label={result.isPrincipal ? 'Principal' : 'Subsidiary'}
                        color={result.isPrincipal ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  )}
                  {showRemarks && (
                    <TableCell>
                      {result.remarks || getALevelGradeRemarks(result.grade)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showRemarks ? (showType ? 7 : 6) : (showType ? 6 : 5)} align="center">
                  No subject results available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

ALevelSubjectResultsTable.propTypes = {
  subjectResults: PropTypes.array,
  showType: PropTypes.bool,
  showRemarks: PropTypes.bool,
  showCode: PropTypes.bool,
  title: PropTypes.string,
  tableProps: PropTypes.object
};

export default ALevelSubjectResultsTable;
