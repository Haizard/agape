import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  Check as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

/**
 * A reusable preview dialog component for marks entry
 */
const PreviewDialog = ({ open, onClose, onSubmit, data, loading, type = 'individual' }) => {
  console.log('PreviewDialog rendered with open:', open);

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{ zIndex: 1500 }}
      disablePortal={false}
      container={document.body}
    >
      <DialogTitle>Preview Marks Entry</DialogTitle>
      <DialogContent>
        {data && type === 'individual' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Please review the information below before submitting:</Typography>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell colSpan={2}>
                      <Typography variant="subtitle1" fontWeight="bold">Student Information</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell width="30%"><strong>Student Name:</strong></TableCell>
                    <TableCell>{data.studentName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Class:</strong></TableCell>
                    <TableCell>{data.className}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell colSpan={2}>
                      <Typography variant="subtitle1" fontWeight="bold">Exam Information</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell width="30%"><strong>Exam:</strong></TableCell>
                    <TableCell>{data.examName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Subject:</strong></TableCell>
                    <TableCell>
                      {data.subjectName}
                      {data.isInCombination && (
                        <Chip
                          size="small"
                          label="In Combination"
                          color="success"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Principal Subject:</strong></TableCell>
                    <TableCell>{data.isPrincipal ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell colSpan={2}>
                      <Typography variant="subtitle1" fontWeight="bold">Marks Information</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell width="30%"><strong>Marks:</strong></TableCell>
                    <TableCell>{data.marksObtained}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Grade:</strong></TableCell>
                    <TableCell>{data.grade}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Points:</strong></TableCell>
                    <TableCell>{data.points}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Comment:</strong></TableCell>
                    <TableCell>{data.comment || 'No comment'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {data && type === 'bulk' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Please review the information below before submitting:</Typography>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell colSpan={2}>
                      <Typography variant="subtitle1" fontWeight="bold">Class Information</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell width="30%"><strong>Class:</strong></TableCell>
                    <TableCell>{data.className}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Subject:</strong></TableCell>
                    <TableCell>{data.subjectName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Exam:</strong></TableCell>
                    <TableCell>{data.examName}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell colSpan={2}>
                      <Typography variant="subtitle1" fontWeight="bold">Marks Summary</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell width="30%"><strong>Total Students:</strong></TableCell>
                    <TableCell>{data.totalStudents}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Students with Marks:</strong></TableCell>
                    <TableCell>{data.markedStudents}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Average Mark:</strong></TableCell>
                    <TableCell>{data.summary?.averageMark || 0}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Highest Mark:</strong></TableCell>
                    <TableCell>{data.summary?.highestMark || 0}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Lowest Mark:</strong></TableCell>
                    <TableCell>{data.summary?.lowestMark || 0}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell colSpan={7}>
                      <Typography variant="subtitle1" fontWeight="bold">Grade Distribution</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>A</strong></TableCell>
                    <TableCell><strong>B</strong></TableCell>
                    <TableCell><strong>C</strong></TableCell>
                    <TableCell><strong>D</strong></TableCell>
                    <TableCell><strong>E</strong></TableCell>
                    <TableCell><strong>S</strong></TableCell>
                    <TableCell><strong>F</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{data.summary?.gradeDistribution?.A || 0}</TableCell>
                    <TableCell>{data.summary?.gradeDistribution?.B || 0}</TableCell>
                    <TableCell>{data.summary?.gradeDistribution?.C || 0}</TableCell>
                    <TableCell>{data.summary?.gradeDistribution?.D || 0}</TableCell>
                    <TableCell>{data.summary?.gradeDistribution?.E || 0}</TableCell>
                    <TableCell>{data.summary?.gradeDistribution?.S || 0}</TableCell>
                    <TableCell>{data.summary?.gradeDistribution?.F || 0}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell colSpan={4}>
                      <Typography variant="subtitle1" fontWeight="bold">Student Marks Preview (First 10)</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Student</strong></TableCell>
                    <TableCell><strong>Marks</strong></TableCell>
                    <TableCell><strong>Grade</strong></TableCell>
                    <TableCell><strong>Points</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.marks?.slice(0, 10).map((mark, index) => (
                    <TableRow key={`mark-preview-${mark.studentId || index}`}>
                      <TableCell>{mark.studentName}</TableCell>
                      <TableCell>{mark.marksObtained}</TableCell>
                      <TableCell>{mark.grade}</TableCell>
                      <TableCell>{mark.points}</TableCell>
                    </TableRow>
                  ))}
                  {data.marks?.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="textSecondary">
                          ... and {data.marks?.length - 10} more students
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Confirm & Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PreviewDialog;
