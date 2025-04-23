import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  TextField,
  Checkbox,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Paper,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Save as SaveIcon,
  History as HistoryIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { validateMarks, calculateGradeAndPoints } from '../../utils/aLevelMarksUtils';

/**
 * A-Level Marks Table Component
 *
 * This component displays the marks entry table for A-Level students.
 */
const ALevelMarksTable = ({
  marks,
  onMarksChange,
  onCommentChange,
  onPrincipalChange,
  onSaveMarks,
  onViewHistory,
  onSelectStudents,
  selectedStudents = [],
  saving = false,
  showDebug = false
}) => {
  // State for the actions menu
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedRows, setSelectedRows] = React.useState(selectedStudents || []);

  // Update selectedRows when selectedStudents changes
  React.useEffect(() => {
    setSelectedRows(selectedStudents || []);
  }, [selectedStudents]);

  // Handle menu open
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle row selection
  const handleRowSelect = (studentId) => {
    const newSelectedRows = [...selectedRows];
    const index = newSelectedRows.indexOf(studentId);

    if (index === -1) {
      newSelectedRows.push(studentId);
    } else {
      newSelectedRows.splice(index, 1);
    }

    setSelectedRows(newSelectedRows);
    if (onSelectStudents) {
      onSelectStudents(newSelectedRows);
    }
  };

  // Handle select all rows
  const handleSelectAll = () => {
    if (selectedRows.length === marks.length) {
      setSelectedRows([]);
      if (onSelectStudents) {
        onSelectStudents([]);
      }
    } else {
      const allStudentIds = marks.map(mark => mark.studentId);
      setSelectedRows(allStudentIds);
      if (onSelectStudents) {
        onSelectStudents(allStudentIds);
      }
    }
    handleMenuClose();
  };

  // Handle select eligible students (those who have the subject in their combination)
  const handleSelectEligible = () => {
    const eligibleStudentIds = marks
      .filter(mark => mark.isInCombination)
      .map(mark => mark.studentId);

    setSelectedRows(eligibleStudentIds);
    if (onSelectStudents) {
      onSelectStudents(eligibleStudentIds);
    }
    handleMenuClose();
  };

  // Validate marks
  const validateMarks = (marks) => {
    if (marks === '') return true;
    const numMarks = Number.parseFloat(marks);
    return !Number.isNaN(numMarks) && numMarks >= 0 && numMarks <= 100;
  };
  // Handle marks change for a student
  const handleMarksChange = (studentId, value) => {
    // Validate marks (0-100)
    if (validateMarks(value)) {
      onMarksChange(studentId, value);
    }
  };

  // Handle comment change for a student
  const handleCommentChange = (studentId, value) => {
    onCommentChange(studentId, value);
  };

  // Handle principal subject change for a student
  const handlePrincipalChange = (studentId, checked) => {
    onPrincipalChange(studentId, checked);
  };

  return (
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">
              Enter Marks for {marks.length} Students
            </Typography>
            <Tooltip title="Students with green background have this subject in their combination">
              <IconButton color="info" size="small" sx={{ ml: 1 }}>
                <InfoIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(76, 175, 80, 0.3)', mr: 0.5, borderRadius: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Has Subject
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon color="warning" fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Eligibility Warning
                </Typography>
              </Box>
            </Box>
            {selectedRows.length > 0 && (
              <Chip
                label={`${selectedRows.length} selected`}
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
          <Box>

            <Button
              variant="outlined"
              color="primary"
              onClick={handleMenuOpen}
              sx={{ mr: 1 }}
              endIcon={<MoreVertIcon />}
            >
              Actions
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleSelectAll}>
                {selectedRows.length === marks.length ? 'Deselect All' : 'Select All'}
              </MenuItem>
              <MenuItem onClick={handleSelectEligible}>
                Select Eligible Students
              </MenuItem>
            </Menu>

            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={onSaveMarks}
              disabled={saving}
              sx={{ mr: 1 }}
            >
              {saving ? 'Saving...' : 'Save Marks'}
            </Button>

            {showDebug && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  console.log('Debug Info:');
                  console.log('Marks:', marks);
                  console.log('Students with subjects:', marks.filter(m => m.isInCombination).length);
                  console.log('Selected students:', selectedRows);
                  alert(`Debug info logged to console. ${marks.length} students loaded.`);
                }}
              >
                Debug
              </Button>
            )}
          </Box>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="3%">
                  <Checkbox
                    checked={selectedRows.length === marks.length && marks.length > 0}
                    indeterminate={selectedRows.length > 0 && selectedRows.length < marks.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell width="5%">#</TableCell>
                <TableCell width="20%">Student Name</TableCell>
                <TableCell width="15%">Marks (0-100)</TableCell>
                <TableCell width="12%">Grade</TableCell>
                <TableCell width="15%">Comment</TableCell>
                <TableCell width="10%">Principal Subject</TableCell>
                <TableCell width="10%">Status</TableCell>
                <TableCell width="5%">History</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {marks.map((mark, index) => (
                <TableRow
                  key={mark.studentId}
                  sx={{
                    backgroundColor: mark.isInCombination
                      ? 'rgba(76, 175, 80, 0.08)'
                      : 'inherit',
                    ...(selectedRows.includes(mark.studentId) ? { backgroundColor: 'rgba(25, 118, 210, 0.12)' } : {})
                  }}
                  onClick={() => handleRowSelect(mark.studentId)}
                  hover
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRows.includes(mark.studentId)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleRowSelect(mark.studentId)}
                    />
                  </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {mark.studentName}
                      {mark.eligibilityWarning && (
                        <Tooltip title={mark.eligibilityWarning}>
                          <WarningIcon color="warning" fontSize="small" sx={{ ml: 1 }} />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={mark.marksObtained}
                      onChange={(e) => handleMarksChange(mark.studentId, e.target.value)}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                      size="small"
                      fullWidth
                      error={mark.marksObtained !== '' && !validateMarks(mark.marksObtained)}
                      helperText={mark.marksObtained !== '' && !validateMarks(mark.marksObtained) ? 'Invalid marks' : ''}
                    />
                  </TableCell>
                  <TableCell>
                    {mark.grade || '-'}
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={mark.comment || ''}
                      onChange={(e) => handleCommentChange(mark.studentId, e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox
                      checked={mark.isPrincipal || false}
                      onChange={(e) => handlePrincipalChange(mark.studentId, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {mark.isInCombination ? (
                      <Chip
                        label="Yes"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Tooltip title="This subject is not in the student's combination">
                        <Chip
                          label="No"
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => onViewHistory(mark.studentId)}
                      disabled={!mark._id}
                    >
                      <HistoryIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Save button at bottom */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={onSaveMarks}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save All Marks'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

ALevelMarksTable.propTypes = {
  marks: PropTypes.array.isRequired,
  onMarksChange: PropTypes.func.isRequired,
  onCommentChange: PropTypes.func.isRequired,
  onPrincipalChange: PropTypes.func.isRequired,
  onSaveMarks: PropTypes.func.isRequired,
  onViewHistory: PropTypes.func.isRequired,
  onSelectStudents: PropTypes.func,
  selectedStudents: PropTypes.array,
  saving: PropTypes.bool,
  showDebug: PropTypes.bool
};



export default ALevelMarksTable;
