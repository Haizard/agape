import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Pagination } from '@mui/material';

/**
 * Pagination Controls Component
 * Provides pagination for student results
 */
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <>
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={onPageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Pagination Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Typography variant="body2">
          Page {currentPage} of {totalPages}
        </Typography>
      </Box>
    </>
  );
};

PaginationControls.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired
};

export default PaginationControls;
