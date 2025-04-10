import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  ContentCopy,
  CloudUpload,
  CloudDownload,
  CheckCircle,
  Error as ErrorIcon,
  ArrowForward
} from '@mui/icons-material';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const BulkFeeStructures = () => {
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [selectedFeeStructures, setSelectedFeeStructures] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [bulkAction, setBulkAction] = useState('copy');
  const [targetAcademicYear, setTargetAcademicYear] = useState('');
  const [targetClasses, setTargetClasses] = useState([]);
  const [adjustmentFactor, setAdjustmentFactor] = useState(1);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [filters, setFilters] = useState({
    academicYear: '',
    class: '',
    status: ''
  });

  // Steps for the stepper
  const steps = ['Select Fee Structures', 'Choose Action', 'Configure Target', 'Review & Confirm'];

  // Fetch data
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
  };

  // Handle selection of fee structures
  const handleSelectFeeStructure = (feeStructureId) => {
    setSelectedFeeStructures(prev => {
      if (prev.includes(feeStructureId)) {
        return prev.filter(id => id !== feeStructureId);
      } else {
        return [...prev, feeStructureId];
      }
    });
  };

  // Handle select all fee structures
  const handleSelectAll = () => {
    if (selectedFeeStructures.length === feeStructures.length) {
      setSelectedFeeStructures([]);
    } else {
      setSelectedFeeStructures(feeStructures.map(fs => fs._id));
    }
  };

  // Handle next step
  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Handle bulk action change
  const handleBulkActionChange = (event) => {
    setBulkAction(event.target.value);
  };

  // Handle target academic year change
  const handleTargetAcademicYearChange = (event) => {
    setTargetAcademicYear(event.target.value);
  };

  // Handle target classes change
  const handleTargetClassesChange = (event) => {
    setTargetClasses(event.target.value);
  };

  // Handle adjustment factor change
  const handleAdjustmentFactorChange = (event) => {
    setAdjustmentFactor(parseFloat(event.target.value) || 1);
  };

  // Handle confirm dialog open
  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  // Handle confirm dialog close
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  // Handle process bulk action
  const handleProcessBulkAction = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/finance/fee-structures/bulk', {
        feeStructureIds: selectedFeeStructures,
        action: bulkAction,
        targetAcademicYear,
        targetClasses,
        adjustmentFactor
      });
      
      setProcessResult(response.data);
      setActiveStep(4); // Move to result step
      setLoading(false);
      setOpenConfirmDialog(false);
    } catch (error) {
      console.error('Error processing bulk action:', error);
      setError(error.response?.data?.message || 'Failed to process bulk action. Please try again later.');
      setLoading(false);
      setOpenConfirmDialog(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `TZS ${amount.toLocaleString()}`;
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

  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Select Fee Structures
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Fee Structures
            </Typography>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
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
                
                <Grid item xs={12} sm={4}>
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
                
                <Grid item xs={12} sm={4}>
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
              </Grid>
            </Paper>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedFeeStructures.length > 0 && selectedFeeStructures.length < feeStructures.length}
                        checked={feeStructures.length > 0 && selectedFeeStructures.length === feeStructures.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Academic Year</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Components</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : feeStructures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No fee structures found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    feeStructures.map((feeStructure) => (
                      <TableRow 
                        key={feeStructure._id} 
                        hover
                        selected={selectedFeeStructures.includes(feeStructure._id)}
                        onClick={() => handleSelectFeeStructure(feeStructure._id)}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedFeeStructures.includes(feeStructure._id)}
                          />
                        </TableCell>
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography>
                {selectedFeeStructures.length} fee structure(s) selected
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleNext}
                disabled={selectedFeeStructures.length === 0}
              >
                Next
              </Button>
            </Box>
          </Box>
        );
      
      case 1: // Choose Action
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Bulk Action
            </Typography>
            <Paper sx={{ p: 3 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Bulk Action</InputLabel>
                <Select
                  value={bulkAction}
                  onChange={handleBulkActionChange}
                  label="Bulk Action"
                >
                  <MenuItem value="copy">Copy to New Academic Year/Classes</MenuItem>
                  <MenuItem value="update">Update Fee Amounts</MenuItem>
                  <MenuItem value="activate">Activate Fee Structures</MenuItem>
                  <MenuItem value="archive">Archive Fee Structures</MenuItem>
                </Select>
              </FormControl>
              
              <Typography variant="body1" gutterBottom>
                {bulkAction === 'copy' && 'Copy selected fee structures to a new academic year and/or classes with optional amount adjustment.'}
                {bulkAction === 'update' && 'Update fee amounts for selected fee structures by a percentage or fixed amount.'}
                {bulkAction === 'activate' && 'Activate selected fee structures to make them available for assignment to students.'}
                {bulkAction === 'archive' && 'Archive selected fee structures to remove them from active use.'}
              </Typography>
            </Paper>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleNext}
              >
                Next
              </Button>
            </Box>
          </Box>
        );
      
      case 2: // Configure Target
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Target
            </Typography>
            <Paper sx={{ p: 3 }}>
              {bulkAction === 'copy' && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Target Academic Year</InputLabel>
                      <Select
                        value={targetAcademicYear}
                        onChange={handleTargetAcademicYearChange}
                        label="Target Academic Year"
                      >
                        <MenuItem value="">Select Academic Year</MenuItem>
                        {academicYears.map((year) => (
                          <MenuItem key={year._id} value={year._id}>
                            {year.name || year.year}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Target Classes (Optional)</InputLabel>
                      <Select
                        multiple
                        value={targetClasses}
                        onChange={handleTargetClassesChange}
                        label="Target Classes (Optional)"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => {
                              const cls = classes.find(c => c._id === value);
                              return (
                                <Chip 
                                  key={value} 
                                  label={`${cls?.name || ''} ${cls?.section || ''}`} 
                                  size="small" 
                                />
                              );
                            })}
                          </Box>
                        )}
                      >
                        {classes.map((cls) => (
                          <MenuItem key={cls._id} value={cls._id}>
                            {cls.name} {cls.section && `- ${cls.section}`} {cls.stream && `(${cls.stream})`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Fee Adjustment Factor"
                      type="number"
                      value={adjustmentFactor}
                      onChange={handleAdjustmentFactorChange}
                      helperText="Use 1.0 for no change, 1.1 for 10% increase, 0.9 for 10% decrease"
                      inputProps={{ step: 0.01, min: 0.1 }}
                    />
                  </Grid>
                </Grid>
              )}
              
              {bulkAction === 'update' && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Fee Adjustment Factor"
                      type="number"
                      value={adjustmentFactor}
                      onChange={handleAdjustmentFactorChange}
                      helperText="Use 1.0 for no change, 1.1 for 10% increase, 0.9 for 10% decrease"
                      inputProps={{ step: 0.01, min: 0.1 }}
                    />
                  </Grid>
                </Grid>
              )}
              
              {(bulkAction === 'activate' || bulkAction === 'archive') && (
                <Alert severity="info">
                  This action will {bulkAction === 'activate' ? 'activate' : 'archive'} all selected fee structures.
                  No additional configuration is needed.
                </Alert>
              )}
            </Paper>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleNext}
                disabled={bulkAction === 'copy' && !targetAcademicYear}
              >
                Next
              </Button>
            </Box>
          </Box>
        );
      
      case 3: // Review & Confirm
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Confirm
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Action
                  </Typography>
                  <Typography variant="body1">
                    {bulkAction === 'copy' && 'Copy Fee Structures'}
                    {bulkAction === 'update' && 'Update Fee Amounts'}
                    {bulkAction === 'activate' && 'Activate Fee Structures'}
                    {bulkAction === 'archive' && 'Archive Fee Structures'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Selected Fee Structures
                  </Typography>
                  <Typography variant="body1">
                    {selectedFeeStructures.length} fee structure(s)
                  </Typography>
                </Grid>
                
                {bulkAction === 'copy' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Target Academic Year
                      </Typography>
                      <Typography variant="body1">
                        {academicYears.find(y => y._id === targetAcademicYear)?.name || 'None selected'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Target Classes
                      </Typography>
                      <Typography variant="body1">
                        {targetClasses.length > 0 
                          ? targetClasses.map(id => classes.find(c => c._id === id)?.name).join(', ') 
                          : 'Same as source'}
                      </Typography>
                    </Grid>
                  </>
                )}
                
                {(bulkAction === 'copy' || bulkAction === 'update') && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Fee Adjustment
                    </Typography>
                    <Typography variant="body1">
                      {adjustmentFactor === 1 
                        ? 'No adjustment' 
                        : adjustmentFactor > 1 
                          ? `Increase by ${((adjustmentFactor - 1) * 100).toFixed(0)}%` 
                          : `Decrease by ${((1 - adjustmentFactor) * 100).toFixed(0)}%`}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                {bulkAction === 'copy' && 'This action will create new fee structures based on your selection. Existing fee structures will not be modified.'}
                {bulkAction === 'update' && 'This action will update the fee amounts for the selected fee structures. This cannot be undone.'}
                {bulkAction === 'activate' && 'This action will activate the selected fee structures, making them available for assignment to students.'}
                {bulkAction === 'archive' && 'This action will archive the selected fee structures, removing them from active use.'}
              </Alert>
              
              <Typography variant="body2" color="text.secondary">
                Please review the details above and confirm to proceed.
              </Typography>
            </Paper>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleOpenConfirmDialog}
              >
                Confirm
              </Button>
            </Box>
          </Box>
        );
      
      case 4: // Result
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Process Result
            </Typography>
            <Paper sx={{ p: 3 }}>
              {processResult && (
                <>
                  <Alert 
                    severity={processResult.success ? 'success' : 'error'} 
                    sx={{ mb: 2 }}
                  >
                    {processResult.message}
                  </Alert>
                  
                  {processResult.details && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Details:
                      </Typography>
                      <Typography variant="body2">
                        {processResult.details}
                      </Typography>
                    </Box>
                  )}
                  
                  {processResult.createdFeeStructures && processResult.createdFeeStructures.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Created Fee Structures:
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Academic Year</TableCell>
                              <TableCell>Class</TableCell>
                              <TableCell>Total Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {processResult.createdFeeStructures.map((fs, index) => (
                              <TableRow key={index}>
                                <TableCell>{fs.name}</TableCell>
                                <TableCell>{fs.academicYear?.name || 'N/A'}</TableCell>
                                <TableCell>{fs.class?.name || 'N/A'}</TableCell>
                                <TableCell>{formatCurrency(fs.totalAmount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </>
              )}
            </Paper>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => {
                  setActiveStep(0);
                  setSelectedFeeStructures([]);
                  setBulkAction('copy');
                  setTargetAcademicYear('');
                  setTargetClasses([]);
                  setAdjustmentFactor(1);
                  setProcessResult(null);
                }}
              >
                Start New Bulk Operation
              </Button>
            </Box>
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };

  // Render confirm dialog
  const renderConfirmDialog = () => {
    return (
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>Confirm Bulk Action</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {bulkAction} {selectedFeeStructures.length} fee structure(s)?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {bulkAction === 'copy' && 'This will create new fee structures based on your selection.'}
            {bulkAction === 'update' && 'This will update the fee amounts for the selected fee structures.'}
            {bulkAction === 'activate' && 'This will activate the selected fee structures.'}
            {bulkAction === 'archive' && 'This will archive the selected fee structures.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button 
            onClick={handleProcessBulkAction} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Bulk Fee Structures</Typography>
      </Box>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {getStepContent(activeStep)}
      
      {renderConfirmDialog()}
    </Box>
  );
};

export default BulkFeeStructures;
