import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';

// Import enhanced components
import {
  GradientButton,
  EnhancedSelect,
  AnimatedContainer
} from '../../common';

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
    <AnimatedContainer animation="fadeIn" duration={0.5}>
      <Box
        sx={{
          mt: 3,
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          flexWrap: 'wrap',
          p: 2,
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.02)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
        className="no-print"
      >
        <GradientButton
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(backUrl)}
        >
          Back to Reports
        </GradientButton>

        <EnhancedSelect
          label="Form Level"
          value={currentFormLevel || ''}
          onChange={handleFormLevelChange}
          color="primary"
          options={[
            { value: "", label: "All Forms" },
            { value: "1", label: "Form 5 (Database Form 1)" },
            { value: "2", label: "Form 6 (Database Form 2)" },
            { value: "5", label: "Form 5 (Legacy)" },
            { value: "6", label: "Form 6 (Legacy)" }
          ]}
          sx={{ minWidth: 200 }}
        />

        <GradientButton
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print Report
        </GradientButton>

        <GradientButton
          variant="contained"
          color="secondary"
          startIcon={pdfGenerating ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          onClick={handleDownload}
          disabled={pdfGenerating || !report}
        >
          {pdfGenerating ? 'Generating...' : 'Download PDF'}
        </GradientButton>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        className="no-print"
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AnimatedContainer>
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
