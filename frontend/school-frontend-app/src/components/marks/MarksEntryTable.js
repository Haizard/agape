import React from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  TextField, 
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

/**
 * Table component for displaying and editing student marks
 */
const MarksEntryTable = ({ 
  studentsWithMarks,
  validationErrors,
  handleMarksChange,
  handleCommentChange,
  saveMarks,
  savingMarks
}) => {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Students ({studentsWithMarks.length})
        </Typography>
        <Box>
          <Chip 
            label={`${studentsWithMarks.filter(s => s.hasMarks).length} with marks`} 
            color="primary" 
            size="small" 
            sx={{ mr: 1 }}
          />
          <Chip 
            label={`${studentsWithMarks.filter(s => !s.hasMarks).length} without marks`} 
            color="warning" 
            size="small" 
          />
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Admission #</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Marks (0-100)</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell>Points</TableCell>
              <TableCell>Comment</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {studentsWithMarks.map((item) => (
              <TableRow key={item.student.id}>
                <TableCell>{item.student.admissionNumber}</TableCell>
                <TableCell>
                  {item.student.firstName} {item.student.lastName}
                  {item.eligibilityWarning && (
                    <Tooltip title={item.eligibilityWarning}>
                      <IconButton size="small" color="warning">
                        <WarningIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    inputProps={{ min: 0, max: 100 }}
                    value={item.marksObtained !== undefined ? item.marksObtained : (item.result ? item.result.marksObtained : '')}
                    onChange={(e) => handleMarksChange(item.student.id, e.target.value)}
                    error={validationErrors[item.student.id] !== undefined}
                    helperText={validationErrors[item.student.id]}
                    sx={{ width: '100px' }}
                  />
                </TableCell>
                <TableCell>
                  {item.result ? item.result.grade : '-'}
                </TableCell>
                <TableCell>
                  {item.result ? item.result.points : '-'}
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="Comment"
                    value={item.comment !== undefined ? item.comment : (item.result ? item.result.comment || '' : '')}
                    onChange={(e) => handleCommentChange(item.student.id, e.target.value)}
                    sx={{ width: '200px' }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={saveMarks}
          disabled={savingMarks || Object.values(validationErrors).some(error => error !== null)}
          startIcon={savingMarks && <CircularProgress size={20} color="inherit" />}
        >
          {savingMarks ? 'Saving...' : 'Save Marks'}
        </Button>
      </Box>
    </>
  );
};

export default MarksEntryTable;
