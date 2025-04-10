import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Archive,
  CheckCircle,
  Warning,
  MoreVert,
  AddCircleOutline,
  RemoveCircleOutline
} from '@mui/icons-material';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const FeeStructures = () => {
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feeStructures, setFeeStructures] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({
    academicYear: '',
    class: '',
    status: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'
  const [currentFeeStructure, setCurrentFeeStructure] = useState({
    name: '',
    academicYear: '',
    class: '',
    feeComponents: [{ name: '', amount: 0, description: '', isOptional: false }],
    status: 'draft'
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch fee structures, academic years, and classes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch fee structures
        const feeStructuresResponse = await api.get('/api/finance/fee-structures', {
          params: filters
        });
        setFeeStructures(feeStructuresResponse.data);

        // Fetch academic years
        const academicYearsResponse = await api.get('/api/academic-years');
        setAcademicYears(academicYearsResponse.data);

        // Fetch classes
        const classesResponse = await api.get('/api/classes');
        setClasses(classesResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle dialog open/close
  const handleOpenDialog = (mode, feeStructure = null) => {
    setDialogMode(mode);
    if (feeStructure) {
      setCurrentFeeStructure(feeStructure);
    } else {
      setCurrentFeeStructure({
        name: '',
        academicYear: '',
        class: '',
        feeComponents: [{ name: '', amount: 0, description: '', isOptional: false }],
        status: 'draft'
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Handle form input changes
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setCurrentFeeStructure(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle fee component changes
  const handleComponentChange = (index, field, value) => {
    const updatedComponents = [...currentFeeStructure.feeComponents];
    updatedComponents[index] = {
      ...updatedComponents[index],
      [field]: field === 'amount' ? parseFloat(value) || 0 : value
    };

    setCurrentFeeStructure(prev => ({
      ...prev,
      feeComponents: updatedComponents
    }));
  };

  // Add new fee component
  const handleAddComponent = () => {
    setCurrentFeeStructure(prev => ({
      ...prev,
      feeComponents: [
        ...prev.feeComponents,
        { name: '', amount: 0, description: '', isOptional: false }
      ]
    }));
  };

  // Remove fee component
  const handleRemoveComponent = (index) => {
    const updatedComponents = [...currentFeeStructure.feeComponents];
    updatedComponents.splice(index, 1);

    setCurrentFeeStructure(prev => ({
      ...prev,
      feeComponents: updatedComponents
    }));
  };

  // Calculate total amount
  const calculateTotal = () => {
    return currentFeeStructure.feeComponents.reduce(
      (sum, component) => sum + (parseFloat(component.amount) || 0),
      0
    );
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!currentFeeStructure.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!currentFeeStructure.academicYear) {
      errors.academicYear = 'Academic year is required';
    }

    if (!currentFeeStructure.class) {
      errors.class = 'Class is required';
    }

    if (currentFeeStructure.feeComponents.length === 0) {
      errors.feeComponents = 'At least one fee component is required';
    } else {
      const componentErrors = [];
      currentFeeStructure.feeComponents.forEach((component, index) => {
        const error = {};
        if (!component.name.trim()) {
          error.name = 'Name is required';
        }
        if (!component.amount || component.amount <= 0) {
          error.amount = 'Amount must be greater than 0';
        }
        if (Object.keys(error).length > 0) {
          componentErrors[index] = error;
        }
      });

      if (componentErrors.length > 0) {
        errors.components = componentErrors;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (dialogMode === 'create') {
        await api.post('/api/finance/fee-structures', currentFeeStructure);
      } else if (dialogMode === 'edit') {
        await api.put(`/api/finance/fee-structures/${currentFeeStructure._id}`, currentFeeStructure);
      }

      // Refresh fee structures
      const response = await api.get('/api/finance/fee-structures', {
        params: filters
      });
      setFeeStructures(response.data);

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving fee structure:', error);
      setFormErrors({
        submit: error.response?.data?.message || 'Failed to save fee structure. Please try again.'
      });
    }
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  // Render fee structure dialog
  const renderFeeStructureDialog = () => {
    const isViewOnly = dialogMode === 'view';
    const dialogTitle = dialogMode === 'create'
      ? 'Create Fee Structure'
      : dialogMode === 'edit'
        ? 'Edit Fee Structure'
        : 'View Fee Structure';

    return (
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          {formErrors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>{formErrors.submit}</Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={currentFeeStructure.name}
                onChange={handleInputChange}
                disabled={isViewOnly}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.academicYear} required>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  name="academicYear"
                  value={currentFeeStructure.academicYear}
                  onChange={handleInputChange}
                  disabled={isViewOnly || dialogMode === 'edit'}
                  label="Academic Year"
                >
                  {academicYears.map((year) => (
                    <MenuItem key={year._id} value={year._id}>
                      {year.name || year.year}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.academicYear && (
                  <Typography variant="caption" color="error">
                    {formErrors.academicYear}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.class} required>
                <InputLabel>Class</InputLabel>
                <Select
                  name="class"
                  value={currentFeeStructure.class}
                  onChange={handleInputChange}
                  disabled={isViewOnly || dialogMode === 'edit'}
                  label="Class"
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name} {cls.section && `- ${cls.section}`} {cls.stream && `(${cls.stream})`}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.class && (
                  <Typography variant="caption" color="error">
                    {formErrors.class}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={currentFeeStructure.status}
                  onChange={handleInputChange}
                  disabled={isViewOnly}
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Fee Components
              </Typography>
              {formErrors.feeComponents && (
                <Typography variant="caption" color="error">
                  {formErrors.feeComponents}
                </Typography>
              )}

              {currentFeeStructure.feeComponents.map((component, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Component Name"
                      value={component.name}
                      onChange={(e) => handleComponentChange(index, 'name', e.target.value)}
                      disabled={isViewOnly}
                      error={formErrors.components && formErrors.components[index]?.name}
                      helperText={formErrors.components && formErrors.components[index]?.name}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      value={component.amount}
                      onChange={(e) => handleComponentChange(index, 'amount', e.target.value)}
                      disabled={isViewOnly}
                      InputProps={{
                        startAdornment: <Typography variant="body2">TZS</Typography>
                      }}
                      error={formErrors.components && formErrors.components[index]?.amount}
                      helperText={formErrors.components && formErrors.components[index]?.amount}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={component.description || ''}
                      onChange={(e) => handleComponentChange(index, 'description', e.target.value)}
                      disabled={isViewOnly}
                    />
                  </Grid>

                  <Grid item xs={12} sm={1}>
                    <FormControl fullWidth>
                      <InputLabel>Optional</InputLabel>
                      <Select
                        value={component.isOptional ? 'yes' : 'no'}
                        onChange={(e) => handleComponentChange(index, 'isOptional', e.target.value === 'yes')}
                        disabled={isViewOnly}
                        label="Optional"
                      >
                        <MenuItem value="no">No</MenuItem>
                        <MenuItem value="yes">Yes</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {!isViewOnly && (
                    <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveComponent(index)}
                        disabled={currentFeeStructure.feeComponents.length <= 1}
                      >
                        <RemoveCircleOutline />
                      </IconButton>
                    </Grid>
                  )}
                </Grid>
              ))}

              {!isViewOnly && (
                <Button
                  startIcon={<AddCircleOutline />}
                  onClick={handleAddComponent}
                  sx={{ mt: 1 }}
                >
                  Add Component
                </Button>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" align="right">
                Total: {formatCurrency(calculateTotal())}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {isViewOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isViewOnly && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
            >
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Fee Structures</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('create')}
        >
          Add Fee Structure
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Academic Year</InputLabel>
              <Select
                name="academicYear"
                value={filters.academicYear}
                onChange={handleFilterChange}
                label="Academic Year"
              >
                <MenuItem value="">All</MenuItem>
                {academicYears.map((year) => (
                  <MenuItem key={year._id} value={year._id}>
                    {year.name || year.year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Class</InputLabel>
              <Select
                name="class"
                value={filters.class}
                onChange={handleFilterChange}
                label="Class"
              >
                <MenuItem value="">All</MenuItem>
                {classes.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name} {cls.section && `- ${cls.section}`} {cls.stream && `(${cls.stream})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Button
              variant="outlined"
              onClick={() => setFilters({ academicYear: '', class: '', status: '' })}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Fee Structures Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : feeStructures.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>No fee structures found. Create a new one to get started.</Alert>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Academic Year</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Components</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feeStructures
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((feeStructure) => (
                      <TableRow key={feeStructure._id} hover>
                        <TableCell>{feeStructure.name}</TableCell>
                        <TableCell>
                          {feeStructure.academicYear?.name || feeStructure.academicYear?.year || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {feeStructure.class?.name}
                          {feeStructure.class?.section && ` - ${feeStructure.class.section}`}
                          {feeStructure.class?.stream && ` (${feeStructure.class.stream})`}
                        </TableCell>
                        <TableCell>{formatCurrency(feeStructure.totalAmount)}</TableCell>
                        <TableCell>{feeStructure.feeComponents.length}</TableCell>
                        <TableCell>
                          <Chip
                            label={feeStructure.status.charAt(0).toUpperCase() + feeStructure.status.slice(1)}
                            color={getStatusColor(feeStructure.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('view', feeStructure)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('edit', feeStructure)}
                              disabled={feeStructure.status === 'archived'}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {feeStructure.status === 'draft' && (
                            <Tooltip title="Activate">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => {
                                  const updatedFeeStructure = { ...feeStructure, status: 'active' };
                                  handleOpenDialog('edit', updatedFeeStructure);
                                }}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {feeStructure.status !== 'archived' && (
                            <Tooltip title="Archive">
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                  const updatedFeeStructure = { ...feeStructure, status: 'archived' };
                                  handleOpenDialog('edit', updatedFeeStructure);
                                }}
                              >
                                <Archive fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={feeStructures.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Fee Structure Dialog */}
      {renderFeeStructureDialog()}
    </Box>
  );
};

export default FeeStructures;
