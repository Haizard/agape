import React, { useEffect } from 'react';
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
  CircularProgress,
  Box
} from '@mui/material';

/**
 * PreviewDialog component for previewing marks before saving
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when dialog is closed
 * @param {Function} props.onSubmit - Function to call when submit button is clicked
 * @param {Object} props.data - Data to display in the dialog
 * @param {boolean} props.loading - Whether the dialog is in loading state
 */
const PreviewDialog = ({ open, onClose, onSubmit, data, loading }) => {
  useEffect(() => {
    console.log('PreviewDialog rendered with open:', open);
  }, [open]);

  if (!data) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Preview Marks Before Saving
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          You are about to save marks for:
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Class:</strong> {data.class}<br />
          <strong>Subject:</strong> {data.subject}<br />
          <strong>Exam:</strong> {data.exam}<br />
          <strong>Total Marks:</strong> {data.marks?.length || 0}
        </Typography>

        {data.marks && data.marks.length > 0 ? (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Marks</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Points</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.marks.map((mark, index) => (
                  <TableRow key={index}>
                    <TableCell>{mark.studentName}</TableCell>
                    <TableCell>{mark.marksObtained}</TableCell>
                    <TableCell>{mark.grade}</TableCell>
                    <TableCell>{mark.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" color="error">
            No marks to save
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !data.marks || data.marks.length === 0}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Saving...
            </Box>
          ) : (
            'Save Marks'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PreviewDialog;
