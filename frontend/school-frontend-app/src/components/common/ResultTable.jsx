import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box
} from '@mui/material';

/**
 * Reusable Result Table Component
 * Displays tabular data with customizable columns and rendering
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of data objects to display
 * @param {Array} props.columns - Array of column configuration objects
 * @param {Function} props.getRowKey - Function to get unique key for each row
 * @param {string} props.title - Optional table title
 * @param {string} props.emptyMessage - Message to display when data is empty
 * @param {Object} props.tableProps - Additional props for the Table component
 * @param {Object} props.containerProps - Additional props for the TableContainer component
 */
const ResultTable = ({
  data = [],
  columns = [],
  getRowKey = (row, index) => index,
  title,
  emptyMessage = 'No data available',
  tableProps = {},
  containerProps = {}
}) => {
  // Check if data is empty
  const isEmpty = !data || data.length === 0;

  return (
    <TableContainer component={Paper} {...containerProps}>
      {title && (
        <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      
      <Table size="small" {...tableProps}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                width={column.width}
                sx={column.headerSx || {}}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {isEmpty ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow key={getRowKey(row, index)}>
                {columns.map((column) => (
                  <TableCell
                    key={`${getRowKey(row, index)}-${column.id}`}
                    align={column.align || 'left'}
                    sx={column.cellSx || {}}
                  >
                    {column.render ? column.render(row, index) : row[column.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

ResultTable.propTypes = {
  data: PropTypes.array,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      align: PropTypes.oneOf(['left', 'center', 'right']),
      width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      render: PropTypes.func,
      headerSx: PropTypes.object,
      cellSx: PropTypes.object
    })
  ).isRequired,
  getRowKey: PropTypes.func,
  title: PropTypes.string,
  emptyMessage: PropTypes.string,
  tableProps: PropTypes.object,
  containerProps: PropTypes.object
};

export default ResultTable;
