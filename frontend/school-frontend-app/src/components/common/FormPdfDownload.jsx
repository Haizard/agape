import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

/**
 * A component that provides a reliable PDF download using form submission
 * This approach works in all browsers and environments
 */
const FormPdfDownload = ({ 
  type, // 'student' or 'class'
  studentId,
  classId,
  examId,
  label,
  fullWidth = false,
  variant = 'contained',
  color = 'primary',
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Determine the correct ID based on type
  const id = type === 'student' ? studentId : classId;
  
  // Get the authentication token
  const token = localStorage.getItem('token');
  
  // Create the URL with the token as a query parameter
  const baseURL = 'http://localhost:5000'; // Change this to your production backend URL in production
  const pdfUrl = `${baseURL}/api/pdf/${type}/${id}/${examId}?token=${token}`;
  
  const handleOpen = () => {
    setOpen(true);
    setError(null);
  };
  
  const handleClose = () => {
    setOpen(false);
  };
  
  const handleDownload = () => {
    setLoading(true);
    setError(null);
    
    // Create an iframe to download the PDF
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Set up event listeners to detect success or failure
    iframe.onload = function() {
      setLoading(false);
      
      // Check if the iframe loaded a PDF
      try {
        const contentType = iframe.contentDocument.contentType;
        if (contentType && contentType.includes('application/pdf')) {
          // Success - PDF loaded
          handleClose();
        } else {
          // Try to get error message from the response
          try {
            const errorText = iframe.contentDocument.body.textContent;
            let errorMessage = 'Failed to download PDF';
            
            try {
              // Try to parse as JSON
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorMessage;
            } catch (e) {
              // If not JSON, use the text as is
              errorMessage = errorText || errorMessage;
            }
            
            setError(errorMessage);
          } catch (e) {
            setError('Failed to download PDF');
          }
        }
      } catch (e) {
        // If we can't access the iframe content, assume it's a PDF download
        handleClose();
      }
      
      // Clean up the iframe
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
    
    iframe.onerror = function() {
      setLoading(false);
      setError('Failed to download PDF');
      
      // Clean up the iframe
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
    
    // Set the iframe source to the PDF URL
    iframe.src = pdfUrl;
  };
  
  // Validate required parameters
  const isValid = token && id && examId;
  
  return (
    <>
      <Button
        variant={variant}
        color={color}
        startIcon={<DownloadIcon />}
        onClick={handleOpen}
        fullWidth={fullWidth}
        disabled={disabled || !isValid}
      >
        {label || `Download ${type === 'student' ? 'Student' : 'Class'} Report`}
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Download PDF Report</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            You are about to download a PDF report for:
          </Typography>
          <Typography variant="body2">
            <strong>Type:</strong> {type === 'student' ? 'Student Report' : 'Class Report'}
          </Typography>
          <Typography variant="body2">
            <strong>ID:</strong> {id}
          </Typography>
          <Typography variant="body2">
            <strong>Exam ID:</strong> {examId}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <CircularProgress />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDownload} 
            color="primary" 
            disabled={loading || !isValid}
            startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {loading ? 'Downloading...' : 'Download'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

FormPdfDownload.propTypes = {
  type: PropTypes.oneOf(['student', 'class']).isRequired,
  studentId: PropTypes.string,
  classId: PropTypes.string,
  examId: PropTypes.string.isRequired,
  label: PropTypes.string,
  fullWidth: PropTypes.bool,
  variant: PropTypes.string,
  color: PropTypes.string,
  disabled: PropTypes.bool
};

FormPdfDownload.defaultProps = {
  studentId: '',
  classId: '',
  label: '',
  fullWidth: false,
  variant: 'contained',
  color: 'primary',
  disabled: false
};

export default FormPdfDownload;
