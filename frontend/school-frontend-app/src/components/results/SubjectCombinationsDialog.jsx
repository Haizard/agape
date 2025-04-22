import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Divider
} from '@mui/material';

/**
 * Dialog to display student subject combinations
 */
const SubjectCombinationsDialog = ({ open, onClose, students, subjectName }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="subject-combinations-dialog-title"
    >
      <DialogTitle id="subject-combinations-dialog-title">
        Student Subject Combinations
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          Showing subject combinations for {students.length} students
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Current subject: <strong>{subjectName}</strong>
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="5%">#</TableCell>
                <TableCell width="25%">Student Name</TableCell>
                <TableCell width="15%">Takes {subjectName}</TableCell>
                <TableCell width="55%">Subject Combination</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={student.studentId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{student.studentName}</TableCell>
                  <TableCell>
                    {student.isInCombination ? (
                      <Chip
                        label="Yes"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="No"
                        color="error"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {student.subjects.length > 0 ? (
                        student.subjects.map((subject, idx) => (
                          <Chip
                            key={idx}
                            label={`${subject.name} ${subject.isPrincipal ? '(P)' : '(S)'}`}
                            color={subject.isCurrentSubject ? 'primary' : 'default'}
                            size="small"
                            variant={subject.isCurrentSubject ? 'filled' : 'outlined'}
                            sx={{ 
                              fontWeight: subject.isCurrentSubject ? 'bold' : 'normal',
                              borderWidth: subject.isCurrentSubject ? 2 : 1
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No subjects found
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Legend: (P) = Principal Subject, (S) = Subsidiary Subject
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubjectCombinationsDialog;
