import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';

/**
 * Action Buttons Component
 * Provides buttons for downloading, printing, and changing view mode
 */
const ActionButtons = ({
  onDownloadPDF,
  onDownloadExcel,
  onPrint,
  viewMode,
  onViewModeChange,
  studentsPerPage,
  onStudentsPerPageChange
}) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={onDownloadPDF}
        >
          Download PDF
        </Button>
      </Grid>
      <Grid item>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={onDownloadExcel}
        >
          Download Excel
        </Button>
      </Grid>
      <Grid item>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={onPrint}
        >
          Print
        </Button>
      </Grid>
      <Grid item xs />
      <Grid item>
        <Button
          variant={viewMode === 'individual' ? 'contained' : 'outlined'}
          onClick={() => onViewModeChange('individual')}
          sx={{ mr: 1 }}
        >
          Individual Results
        </Button>
        <Button
          variant={viewMode === 'summary' ? 'contained' : 'outlined'}
          onClick={() => onViewModeChange('summary')}
        >
          School Summary
        </Button>
      </Grid>
      <Grid item>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Students Per Page</InputLabel>
          <Select
            value={studentsPerPage}
            onChange={(e) => onStudentsPerPageChange(e.target.value)}
            label="Students Per Page"
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={15}>15</MenuItem>
            <MenuItem value={20}>20</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

ActionButtons.propTypes = {
  onDownloadPDF: PropTypes.func.isRequired,
  onDownloadExcel: PropTypes.func.isRequired,
  onPrint: PropTypes.func.isRequired,
  viewMode: PropTypes.oneOf(['individual', 'summary']).isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  studentsPerPage: PropTypes.number.isRequired,
  onStudentsPerPageChange: PropTypes.func.isRequired
};

export default ActionButtons;
