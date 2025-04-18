import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';

/**
 * ClassActionButtons Component
 * 
 * Displays action buttons for printing, downloading, and filtering the A-Level class result report.
 */
const ClassActionButtons = ({ 
  report, 
  onGeneratePdf,
  onFormLevelChange,
  currentFormLevel,
  backUrl = '/results/a-level/enter-marks'
}) => {
  const navigate = useNavigate();
  
  // State for PDF generation
  const [pdfGenerating, setPdfGenerating] = useState(false);
  
  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  // Handle download PDF
  const handleDownload = async () => {
    if (!report) {
      setSnackbar({
        open: true,
        message: 'No report data available to download',
        severity: 'warning'
      });
      return;
    }
    
    try {
      setPdfGenerating(true);
      
      // Call the provided PDF generation function
      await onGeneratePdf(report);
      
      setSnackbar({
        open: true,
        message: 'Report downloaded successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setSnackbar({
        open: true,
        message: 'Failed to download report',
        severity: 'error'
      });
    } finally {
      setPdfGenerating(false);
    }
  };
  
  // Handle form level change
  const handleFormLevelChange = (event) => {
    const formLevel = event.target.value;
    if (onFormLevelChange) {
      onFormLevelChange(formLevel);
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  return (
    <>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }} className="no-print">
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(backUrl)}
        >
          Back
        </Button>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="form-level-select-label">Form Level</InputLabel>
          <Select
            labelId="form-level-select-label"
            id="form-level-select"
            value={currentFormLevel || ''}
            label="Form Level"
            onChange={handleFormLevelChange}
            startIcon={<FilterIcon />}
          >
            <MenuItem value="">All Forms</MenuItem>
            <MenuItem value="5">Form 5</MenuItem>
            <MenuItem value="6">Form 6</MenuItem>
          </Select>
        </FormControl>
        
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print Report
        </Button>
        
        <Button
          variant="contained"
          color="secondary"
          startIcon={pdfGenerating ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          onClick={handleDownload}
          disabled={pdfGenerating || !report}
        >
          {pdfGenerating ? 'Generating...' : 'Download PDF'}
        </Button>
      </Box>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        className="no-print"
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

ClassActionButtons.propTypes = {
  report: PropTypes.object,
  onGeneratePdf: PropTypes.func.isRequired,
  onFormLevelChange: PropTypes.func,
  currentFormLevel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  backUrl: PropTypes.string
};

export default ClassActionButtons;
