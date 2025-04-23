import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { printTableInNewWindow } from '../../utils/printRenderer';
import './PrintableTableStyles.css'; // Already contains print-specific styles

/**
 * PrintableTable Component
 *
 * A wrapper component that ensures tables print correctly with all columns visible.
 * This component adds print controls and handles the printing process.
 */
const PrintableTable = ({ children, className = '', id = 'printable-table' }) => {
  // Reference to the table container
  const tableContainerRef = useRef(null);

  // Handle print button click
  const handlePrint = () => {
    // Use the printRenderer utility to print the table
    printTableInNewWindow(`#${id}`);
  };

  return (
    <Box className="printable-table-wrapper">
      {/* Print controls */}
      <Box className="print-controls" sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ fontWeight: 'bold' }}
        >
          Print All Columns
        </Button>
      </Box>

      {/* Table container */}
      <Box
        ref={tableContainerRef}
        className={`printable-table-container ${className}`}
        id={id}
      >
        {children}
      </Box>
    </Box>
  );
};

PrintableTable.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  id: PropTypes.string
};

export default PrintableTable;
