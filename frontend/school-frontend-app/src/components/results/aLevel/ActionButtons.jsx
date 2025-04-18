import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Print as PrintIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import reportService from '../../../services/reportService';

/**
 * ActionButtons Component
 * 
 * Displays action buttons for printing, downloading, and sharing the A-Level result report.
 */
const ActionButtons = ({ 
  report, 
  onGeneratePdf, 
  backUrl = '/results/a-level/enter-marks'
}) => {
  const navigate = useNavigate();
  
  // State for SMS sending
  const [smsSending, setSmsSending] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);
  const [smsError, setSmsError] = useState(null);
  
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
  
  // Handle send SMS
  const handleSendSMS = async () => {
    if (!report || !report.studentId || !report.examId) {
      setSnackbar({
        open: true,
        message: 'No report data available to send',
        severity: 'warning'
      });
      return;
    }
    
    setSmsSending(true);
    setSmsError(null);
    setSmsSuccess(false);
    
    try {
      // Create an AbortController for request cancellation
      const controller = new AbortController();
      
      // Send SMS using the report service
      await reportService.sendALevelReportSMS(
        report.studentId,
        report.examId,
        { signal: controller.signal }
      );
      
      setSmsSuccess(true);
      setSnackbar({
        open: true,
        message: 'SMS sent successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      setSmsError(error.message || 'Failed to send SMS');
      setSnackbar({
        open: true,
        message: error.message || 'Failed to send SMS',
        severity: 'error'
      });
    } finally {
      setSmsSending(false);
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  return (
    <>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }} className="no-print">
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(backUrl)}
        >
          Back
        </Button>
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
        <Button
          variant="contained"
          color="success"
          startIcon={smsSending ? <CircularProgress size={20} color="inherit" /> : <ShareIcon />}
          onClick={handleSendSMS}
          disabled={smsSending || !report}
        >
          {smsSending ? 'Sending...' : 'Send SMS to Parent'}
        </Button>
      </Box>
      
      {/* Success/Error Messages */}
      {smsSuccess && (
        <Alert severity="success" sx={{ mt: 2 }} className="no-print">
          SMS sent successfully to parent(s).
        </Alert>
      )}
      {smsError && (
        <Alert severity="error" sx={{ mt: 2 }} className="no-print">
          {smsError}
        </Alert>
      )}
      
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

ActionButtons.propTypes = {
  report: PropTypes.object,
  onGeneratePdf: PropTypes.func.isRequired,
  backUrl: PropTypes.string
};

export default ActionButtons;
