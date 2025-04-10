
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  TablePagination,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import SafeDisplay from './common/SafeDisplay';

// Move MobileCard outside of DataTable
const MobileCard = ({ row, columns, onEdit, onDelete }) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      {columns.map((column) => (
        <Box key={column.id} sx={{ mb: 1 }}>
          <Typography variant="caption" color="textSecondary">
            {column.label}:
          </Typography>
          <Typography variant="body2">
            <SafeDisplay value={row[column.id]} />
          </Typography>
        </Box>
      ))}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        {onEdit && (
          <IconButton size="small" onClick={() => onEdit(row)}>
            <EditIcon />
          </IconButton>
        )}
        {onDelete && (
          <IconButton size="small" color="error" onClick={() => onDelete(row)}>
            <DeleteIcon />
          </IconButton>
        )}
      </Box>
    </CardContent>
  </Card>
);

const DataTable = ({ columns, data, onEdit, onDelete }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="table-container">
      <div className="table-toolbar">
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
        />
      </div>

      {isMobile ? (
        <Box sx={{ p: 2 }}>
          {filteredData
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row, index) => (
              <MobileCard
                key={row.id || row._id || index}
                row={row}
                columns={columns}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id}>{column.label}</TableCell>
                ))}
                {(onEdit || onDelete) && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => (
                  <TableRow key={row.id || row._id || index}>
                    {columns.map((column) => (
                      <TableCell key={column.id}><SafeDisplay value={row[column.id]} /></TableCell>
                    ))}
                    {(onEdit || onDelete) && (
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {onEdit && (
                            <IconButton size="small" onClick={() => onEdit(row)}>
                              <EditIcon />
                            </IconButton>
                          )}
                          {onDelete && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete(row)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        component="div"
        count={filteredData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

// Update PropTypes
MobileCard.propTypes = {
  row: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func
};

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

DataTable.defaultProps = {
  onEdit: null,
  onDelete: null,
};

MobileCard.defaultProps = {
  onEdit: null,
  onDelete: null,
};

export default DataTable;
export { MobileCard };

