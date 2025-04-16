import React, { useState } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PropTypes from 'prop-types';

/**
 * A component that provides a reliable PDF download by using multiple methods
 * and providing detailed feedback to the user
 */
const ReliablePdfDownload = ({
  type, // 'a-level' or 'o-level'
  classId,
  examId,
  label,
  fullWidth = false,
  variant = 'contained',
  color = 'secondary',
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDownload = async () => {
    // Get the authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      setSnackbar({
        open: true,
        message: 'You need to be logged in to download the PDF',
        severity: 'error'
      });
      return;
    }

    // Set loading state
    setLoading(true);
    setSnackbar({
      open: true,
      message: 'Preparing PDF for download...',
      severity: 'info'
    });

    try {
      // Determine the correct endpoint based on education level
      let pdfUrl;
      if (type === 'a-level') {
        pdfUrl = `${process.env.REACT_APP_API_URL || ''}/api/a-level-results/class/${classId}/${examId}`;
      } else {
        pdfUrl = `${process.env.REACT_APP_API_URL || ''}/api/o-level-results/class/${classId}/${examId}`;
      }

      console.log(`Attempting to download PDF from: ${pdfUrl}`);

      // Method 1: Try using fetch API with proper error handling
      try {
        // First check if the endpoint is accessible
        const checkResponse = await fetch(pdfUrl, {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!checkResponse.ok) {
          throw new Error(`Server returned ${checkResponse.status}: ${checkResponse.statusText}`);
        }

        // Now fetch the actual PDF
        const response = await fetch(pdfUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf'
          }
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        // Check content type to ensure we're getting a PDF
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
          console.warn(`Expected PDF but got ${contentType}`);
          // Continue anyway, as some servers might set incorrect content type
        }

        // Get the blob from the response
        const blob = await response.blob();

        // Verify the blob is not empty and is likely a PDF
        if (blob.size < 100) { // A valid PDF should be larger than 100 bytes
          // Try to read the blob as text to see if it contains an error message
          const text = await blob.text();
          console.error('Received invalid PDF data:', text);
          throw new Error('Received invalid PDF data from server');
        }

        // Create a blob URL and download
        const url = window.URL.createObjectURL(blob);

        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `class_report_${classId}_${examId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 5000);

        console.log('PDF download initiated successfully');
        setSnackbar({
          open: true,
          message: 'PDF downloaded successfully',
          severity: 'success'
        });
      } catch (fetchError) {
        console.error('Error downloading PDF with fetch:', fetchError);

        // Method 2: Try using a direct link with token in URL
        setSnackbar({
          open: true,
          message: 'First download method failed. Trying alternative method...',
          severity: 'warning'
        });

        // Try the direct PDF endpoint
        const directPdfUrl = `${process.env.REACT_APP_API_URL || ''}/api/pdf/class/${classId}/${examId}`;

        try {
          const directResponse = await fetch(directPdfUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/pdf'
            }
          });

          if (!directResponse.ok) {
            throw new Error(`Server returned ${directResponse.status}: ${directResponse.statusText}`);
          }

          const directBlob = await directResponse.blob();
          const directUrl = window.URL.createObjectURL(directBlob);

          // Create a temporary link and trigger download
          const link = document.createElement('a');
          link.href = directUrl;
          link.setAttribute('download', `class_report_${classId}_${examId}.pdf`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up
          setTimeout(() => {
            window.URL.revokeObjectURL(directUrl);
          }, 5000);

          setSnackbar({
            open: true,
            message: 'Alternative download method succeeded.',
            severity: 'success'
          });
        } catch (directError) {
          console.error('Error with direct PDF endpoint:', directError);

          // Method 3: Last resort - use window.open with token as query parameter
          setSnackbar({
            open: true,
            message: 'Trying final download method...',
            severity: 'warning'
          });

          const tokenParam = encodeURIComponent(token);
          const pdfUrlWithToken = `${pdfUrl}?token=${tokenParam}`;

          console.log('Trying final download method with token in URL');
          window.open(pdfUrlWithToken, '_blank');

          // Offer a manual download option
          setTimeout(() => {
            const tryManual = window.confirm(
              'If the PDF still doesn\'t download or open correctly, would you like to try generating it in a different format?'
            );

            if (tryManual) {
              // Offer a printable HTML version instead
              const printableUrl = `/printable-report/${classId}/${examId}`;
              console.log(`Opening printable HTML report: ${printableUrl}`);
              // Open in a new tab
              const newTab = window.open(printableUrl, '_blank');

              // If popup was blocked, show a message
              if (!newTab) {
                alert('Please allow popups to open the printable report');
              }

              setSnackbar({
                open: true,
                message: 'Opening printable HTML report. You can print this directly from your browser.',
                severity: 'info'
              });
            }
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error in PDF download process:', error);
      setSnackbar({
        open: true,
        message: `PDF download failed: ${error.message}. Please try again later.`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        color={color}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
        onClick={handleDownload}
        fullWidth={fullWidth}
        disabled={disabled || loading}
      >
        {loading ? 'Downloading...' : (label || 'Download PDF')}
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity || 'info'} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

ReliablePdfDownload.propTypes = {
  type: PropTypes.oneOf(['a-level', 'o-level']).isRequired,
  classId: PropTypes.string.isRequired,
  examId: PropTypes.string.isRequired,
  label: PropTypes.string,
  fullWidth: PropTypes.bool,
  variant: PropTypes.string,
  color: PropTypes.string,
  disabled: PropTypes.bool
};

export default ReliablePdfDownload;
