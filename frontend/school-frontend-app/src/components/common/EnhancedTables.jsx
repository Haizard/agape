import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Typography,
  Checkbox,
  IconButton,
  Chip,
  Tooltip,
  alpha,
  styled,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import { EnhancedTextField } from './EnhancedForms';

/**
 * Enhanced Table Components
 * 
 * A collection of table components with modern styling, animations, and consistent design.
 */

/**
 * StyledTableContainer - A styled table container with consistent styling
 */
export const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05)',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  '&:hover': {
    boxShadow: '0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.08)',
  },
}));

/**
 * StyledTableHead - A styled table head with consistent styling
 */
export const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  '& .MuiTableCell-head': {
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
}));

/**
 * StyledTableRow - A styled table row with hover effect
 */
export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  },
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

/**
 * TableTitle - A title for tables with consistent styling
 */
export const TableTitle = ({ title, subtitle, actions, ...props }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
      }}
      {...props}
    >
      <Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #3f51b5 30%, #4caf50 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {actions}
        </Box>
      )}
    </Box>
  );
};

TableTitle.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
};

/**
 * TableToolbar - A toolbar for tables with search and filter options
 */
export const TableToolbar = ({
  title,
  onSearch,
  onFilter,
  onRefresh,
  searchPlaceholder = 'Search...',
  filterTooltip = 'Filter',
  refreshTooltip = 'Refresh',
  ...props
}) => {
  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
      }}
      {...props}
    >
      {title && (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, justifyContent: 'flex-end' }}>
        {onSearch && (
          <EnhancedTextField
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
            sx={{ maxWidth: 300 }}
          />
        )}
        {onFilter && (
          <Tooltip title={filterTooltip}>
            <IconButton onClick={onFilter}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )}
        {onRefresh && (
          <Tooltip title={refreshTooltip}>
            <IconButton onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

TableToolbar.propTypes = {
  title: PropTypes.string,
  onSearch: PropTypes.func,
  onFilter: PropTypes.func,
  onRefresh: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  filterTooltip: PropTypes.string,
  refreshTooltip: PropTypes.string,
};

/**
 * EnhancedTable - A complete table component with sorting, pagination, and selection
 */
export const EnhancedTable = ({
  columns,
  data,
  initialOrderBy = '',
  initialOrder = 'asc',
  rowsPerPageOptions = [5, 10, 25],
  defaultRowsPerPage = 10,
  onRowClick,
  selectable = false,
  onSelectionChange,
  toolbarTitle,
  onSearch,
  onFilter,
  onRefresh,
  searchPlaceholder,
  emptyMessage = 'No data available',
  ...props
}) => {
  // State for sorting
  const [order, setOrder] = useState(initialOrder);
  const [orderBy, setOrderBy] = useState(initialOrderBy);
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  
  // State for selection
  const [selected, setSelected] = useState([]);
  
  // Handle sort request
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Handle select all click
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = data.map((row) => row.id);
      setSelected(newSelected);
      if (onSelectionChange) {
        onSelectionChange(newSelected);
      }
      return;
    }
    setSelected([]);
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };
  
  // Handle row click
  const handleRowClick = (event, id) => {
    if (selectable) {
      const selectedIndex = selected.indexOf(id);
      let newSelected = [];
      
      if (selectedIndex === -1) {
        newSelected = [...selected, id];
      } else {
        newSelected = selected.filter((item) => item !== id);
      }
      
      setSelected(newSelected);
      if (onSelectionChange) {
        onSelectionChange(newSelected);
      }
    }
    
    if (onRowClick) {
      onRowClick(event, id);
    }
  };
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Check if row is selected
  const isSelected = (id) => selected.indexOf(id) !== -1;
  
  // Sort function
  const sortData = (array, comparator) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };
  
  // Get comparator
  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };
  
  // Descending comparator
  const descendingComparator = (a, b, orderBy) => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };
  
  // Paginate and sort data
  const sortedData = orderBy ? sortData(data, getComparator(order, orderBy)) : data;
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  return (
    <Paper
      sx={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: 2,
        boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05)',
      }}
      {...props}
    >
      {/* Toolbar */}
      {(toolbarTitle || onSearch || onFilter || onRefresh) && (
        <TableToolbar
          title={toolbarTitle}
          onSearch={onSearch}
          onFilter={onFilter}
          onRefresh={onRefresh}
          searchPlaceholder={searchPlaceholder}
        />
      )}
      
      {/* Table */}
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="enhanced table">
          {/* Table Head */}
          <StyledTableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < data.length}
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={handleSelectAllClick}
                    inputProps={{ 'aria-label': 'select all' }}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  padding={column.disablePadding ? 'none' : 'normal'}
                  sortDirection={orderBy === column.id ? order : false}
                  sx={{ minWidth: column.minWidth }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                      {orderBy === column.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </StyledTableHead>
          
          {/* Table Body */}
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => {
                const isItemSelected = selectable && isSelected(row.id);
                const labelId = `enhanced-table-checkbox-${index}`;
                
                return (
                  <StyledTableRow
                    hover
                    onClick={(event) => handleRowClick(event, row.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                    sx={{ cursor: onRowClick || selectable ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          inputProps={{ 'aria-labelledby': labelId }}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = row[column.id];
                      
                      return (
                        <TableCell key={column.id} align={column.align || 'left'}>
                          {column.format ? column.format(value, row) : value}
                        </TableCell>
                      );
                    })}
                  </StyledTableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={selectable ? columns.length + 1 : columns.length}
                  align="center"
                  sx={{ py: 3 }}
                >
                  <Typography variant="body1" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

EnhancedTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      minWidth: PropTypes.number,
      align: PropTypes.oneOf(['left', 'right', 'center']),
      format: PropTypes.func,
      sortable: PropTypes.bool,
      disablePadding: PropTypes.bool,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  initialOrderBy: PropTypes.string,
  initialOrder: PropTypes.oneOf(['asc', 'desc']),
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  defaultRowsPerPage: PropTypes.number,
  onRowClick: PropTypes.func,
  selectable: PropTypes.bool,
  onSelectionChange: PropTypes.func,
  toolbarTitle: PropTypes.string,
  onSearch: PropTypes.func,
  onFilter: PropTypes.func,
  onRefresh: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  emptyMessage: PropTypes.string,
};

/**
 * StatusChip - A chip for displaying status in tables
 */
export const StatusChip = ({ label, status, ...props }) => {
  // Define color based on status
  const getColor = () => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'approved':
      case 'success':
        return 'success';
      case 'pending':
      case 'in progress':
      case 'waiting':
        return 'warning';
      case 'inactive':
      case 'failed':
      case 'rejected':
      case 'error':
        return 'error';
      case 'draft':
      case 'new':
        return 'info';
      default:
        return 'default';
    }
  };
  
  return (
    <Chip
      label={label || status}
      color={getColor()}
      size="small"
      sx={{
        fontWeight: 500,
        borderRadius: 1,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        },
      }}
      {...props}
    />
  );
};

StatusChip.propTypes = {
  label: PropTypes.string,
  status: PropTypes.string.isRequired,
};

// Export all table components
export default {
  StyledTableContainer,
  StyledTableHead,
  StyledTableRow,
  TableTitle,
  TableToolbar,
  EnhancedTable,
  StatusChip,
};
