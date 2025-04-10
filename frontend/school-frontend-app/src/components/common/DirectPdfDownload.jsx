import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

/**
 * A component that provides a direct download link to a PDF
 * This bypasses any issues with React rendering and API configuration
 */
const DirectPdfDownload = ({
  type, // 'student' or 'class'
  studentId,
  classId,
  examId,
  label,
  fullWidth,
  variant,
  color,
  disabled
}) => {
  const handleDownload = () => {
    // Validate required parameters
    if (type === 'student' && (!studentId || !examId)) {
      alert('Student ID and Exam ID are required for student reports');
      return;
    }

    if (type === 'class' && (!classId || !examId)) {
      alert('Class ID and Exam ID are required for class reports');
      return;
    }

    // Get the authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You need to be logged in to download the PDF');
      return;
    }

    // Determine the correct ID based on type
    const id = type === 'student' ? studentId : classId;

    // Create the URL with the token as a query parameter
    // Use the absolute URL to the backend server
    // Try to determine the backend URL dynamically if possible
    let baseURL = 'http://localhost:5000'; // Default fallback

    // Check if we can determine the backend URL from the current window location
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // For production, use the same hostname but with the backend port
      baseURL = `${window.location.protocol}//${window.location.hostname}:5000`;
    }

    const pdfUrl = `${baseURL}/api/pdf/${type}/${id}/${examId}?token=${token}`;

    console.log(`Downloading ${type} PDF from:`, pdfUrl);

    // Method 1: Use window.open directly
    try {
      const newWindow = window.open(pdfUrl, '_blank');

      // Check if popup was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        console.log('Popup was blocked, trying alternative method');
        // Method 2: Create a temporary link element
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = `${type}_result_${id}_${examId}.pdf`;

        // Append to the document, click it, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      alert(`Error opening PDF: ${error.message}. Please try again or contact support.`);
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      startIcon={<DownloadIcon />}
      onClick={handleDownload}
      fullWidth={fullWidth}
      disabled={disabled}
    >
      {label || `Download ${type === 'student' ? 'Student' : 'Class'} Report`}
    </Button>
  );
};

DirectPdfDownload.propTypes = {
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

DirectPdfDownload.defaultProps = {
  studentId: '',
  classId: '',
  label: '',
  fullWidth: false,
  variant: 'contained',
  color: 'primary',
  disabled: false
};

export default DirectPdfDownload;
