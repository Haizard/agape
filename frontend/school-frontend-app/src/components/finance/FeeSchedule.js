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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  Chip,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControlLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Add,
  Delete,
  Edit,
  Save,
  ToggleOn,
  ToggleOff,
  Visibility
} from '@mui/icons-material';
import api from '../../services/api';
import { format } from 'date-fns';

const FeeSchedule = () => {
  // State for data
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  
  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    academicYear: '',
    class: '',
    installments: [],
    enableReminders: true,
    reminderDays: 7,
    isActive: true
  });
  
  // State for installment form
  const [installmentForm, setInstallmentForm] = useState({
    name: '',
    dueDate: null,
    percentage: 0
  });
  
  // State for filters
  const [filters, setFilters] = useState({
    academicYear: '',
    class: '',
    active: true
  });

  // Fetch initial data (academic years, classes, and schedules)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch academic years and classes in parallel
        const [academicYearsResponse, classesResponse] = await Promise.all([
          api.get('/api/academic-years'),
          api.get('/api/classes')
        ]);
        
        const years = academicYearsResponse.data || [];
        const classList = classesResponse.data || [];
        
        setAcademicYears(years);
        setClasses(classList);
        
        // Set default academic year to active year
        const activeYear = years.find(year => year.isActive);
        if (activeYear) {
          const updatedFilters = {
            ...filters,
            academicYear: activeYear._id
          };
          setFilters(updatedFilters);
          
          // Fetch schedules with the active year filter
          const schedulesResponse = await api.get('/api/finance/fee-schedules', {
            params: updatedFilters
          });
          
          setSchedules(schedulesResponse.data || []);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load initial data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []); // Empty dependency array means this runs once on mount

  // Fetch schedules when filters change
  useEffect(() => {
    const fetchSchedules = async () => {
      // Skip if we're already loading
      if (loading) return;
      
      setLoading(true);
      setError('');
      
      try {
        const response = await api.get('/api/finance/fee-schedules', {
          params: filters
        });
        
        setSchedules(response.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching schedules:', error);
        setError('Failed to load schedules. Please try again later.');
        setLoading(false);
      }
    };
    
    // Use a timeout to debounce the API call
    const timeoutId = setTimeout(() => {
      fetchSchedules();
    }, 300);
    
    // Cleanup timeout on filter change
    return () => clearTimeout(timeoutId);
  }, [filters, loading]);

  // Handle filter changes
  const handleFilterChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form input change
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle date change for installment
  const handleDateChange = (date) => {
    setInstallmentForm(prev => ({
      ...prev,
      dueDate: date
    }));
  };

  // Handle installment form input change
  const handleInstallmentInputChange = (event) => {
    const { name, value } = event.target;
    setInstallmentForm(prev => ({
      ...prev,
      [name]: name === 'percentage' ? Number(value) : value
    }));
  };

  // Add installment to form
  const handleAddInstallment = () => {
    if (!installmentForm.name || !installmentForm.dueDate || installmentForm.percentage <= 0) {
      setError('Installment name, due date, and percentage are required.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      installments: [
        ...(prev.installments || []),
        {
          ...installmentForm
        }
      ]
    }));

    // Reset installment form
    setInstallmentForm({
      name: '',
      dueDate: null,
      percentage: 0
    });
  };

  // Remove installment from form
  const handleRemoveInstallment = (index) => {
    setFormData(prev => ({
      ...prev,
      installments: prev.installments.filter((_, i) => i !== index)
    }));
  };

  // Open dialog for creating a new schedule
  const handleOpenCreateDialog = () => {
    // Find active academic year
    const activeYear = academicYears.find(year => year.isActive);
    
    setDialogMode('create');
    setFormData({
      name: '',
      description: '',
      academicYear: activeYear ? activeYear._id : '',
      class: '',
      installments: [],
      enableReminders: true,
      reminderDays: 7,
      isActive: true
    });
    setOpenDialog(true);
  };

  // Open dialog for editing a schedule
  const handleOpenEditDialog = (schedule) => {
    setDialogMode('edit');
    setSelectedSchedule(schedule);
    
    setFormData({
      name: schedule.name,
      description: schedule.description || '',
      academicYear: schedule.academicYear._id,
      class: schedule.class ? schedule.class._id : '',
      installments: schedule.installments.map(installment => ({
        name: installment.name,
        dueDate: new Date(installment.dueDate),
        percentage: installment.percentage
      })),
      enableReminders: schedule.enableReminders,
      reminderDays: schedule.reminderDays,
      isActive: schedule.isActive
    });
    setOpenDialog(true);
  };

  // Open dialog for viewing a schedule
  const handleOpenViewDialog = (schedule) => {
    setDialogMode('view');
    setSelectedSchedule(schedule);
    
    setFormData({
      name: schedule.name,
      description: schedule.description || '',
      academicYear: schedule.academicYear._id,
      class: schedule.class ? schedule.class._id : '',
      installments: schedule.installments.map(installment => ({
        name: installment.name,
        dueDate: new Date(installment.dueDate),
        percentage: installment.percentage
      })),
      enableReminders: schedule.enableReminders,
      reminderDays: schedule.reminderDays,
      isActive: schedule.isActive
    });
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setSelectedSchedule(null);
  };

  // Save schedule
  const handleSaveSchedule = async () => {
    if (!formData.name || !formData.academicYear) {
      setError('Name and academic year are required.');
      return;
    }

    if (!formData.installments || formData.installments.length === 0) {
      setError('At least one installment is required.');
      return;
    }

    // Check if installments add up to 100%
    const totalPercentage = formData.installments.reduce((sum, installment) => sum + installment.percentage, 0);
    if (totalPercentage !== 100) {
      setError(`Installment percentages must add up to 100%. Current total: ${totalPercentage}%`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (dialogMode === 'create') {
        await api.post('/api/finance/fee-schedules', formData);
      } else if (dialogMode === 'edit') {
        await api.put(`/api/finance/fee-schedules/${selectedSchedule._id}`, formData);
      }

      // Refresh schedules
      const schedulesResponse = await api.get('/api/finance/fee-schedules', {
        params: filters
      });
      setSchedules(schedulesResponse.data);
      
      setOpenDialog(false);
      setLoading(false);
    } catch (error) {
      console.error('Error saving fee schedule:', error);
      setError(error.response?.data?.message || 'Failed to save fee schedule. Please try again later.');
      setLoading(false);
    }
  };

  // Delete schedule
  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.delete(`/api/finance/fee-schedules/${scheduleId}`);
      
      // Refresh schedules
      const schedulesResponse = await api.get('/api/finance/fee-schedules', {
        params: filters
      });
      setSchedules(schedulesResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error deleting fee schedule:', error);
      setError(error.response?.data?.message || 'Failed to delete fee schedule. Please try again later.');
      setLoading(false);
    }
  };

  // Toggle schedule active status
  const handleToggleStatus = async (scheduleId) => {
    setLoading(true);
    setError('');
    try {
      await api.patch(`/api/finance/fee-schedules/${scheduleId}/toggle-status`);
      
      // Refresh schedules
      const schedulesResponse = await api.get('/api/finance/fee-schedules', {
        params: filters
      });
      setSchedules(schedulesResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error toggling fee schedule status:', error);
      setError(error.response?.data?.message || 'Failed to toggle fee schedule status. Please try again later.');
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM dd, yyyy');
  };

  // Render dialog content
  const renderDialogContent = () => {
    const isViewMode = dialogMode === 'view';
    const dialogTitle = {
      'create': 'Create Fee Schedule',
      'edit': 'Edit Fee Schedule',
      'view': 'View Fee Schedule'
    }[dialogMode];

    return (
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Schedule Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isViewMode}
                required
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={isViewMode}
                multiline
                rows={2}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  label="Academic Year"
                  disabled={isViewMode}
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

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Class (Optional)</InputLabel>
                <Select
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  label="Class (Optional)"
                  disabled={isViewMode}
                >
                  <MenuItem value="">All Classes</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableReminders}
                    onChange={handleInputChange}
                    name="enableReminders"
                    disabled={isViewMode}
                  />
                }
                label="Enable Payment Reminders"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reminder Days Before Due Date"
                name="reminderDays"
                type="number"
                value={formData.reminderDays}
                onChange={handleInputChange}
                disabled={isViewMode || !formData.enableReminders}
                InputProps={{
                  inputProps: { min: 1, max: 30 }
                }}
              />
            </Grid>

            {!isViewMode && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Add Installment
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Installment Name"
                        name="name"
                        value={installmentForm.name}
                        onChange={handleInstallmentInputChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Due Date"
                          value={installmentForm.dueDate}
                          onChange={handleDateChange}
                          slotProps={{ textField: { fullWidth: true, required: true } }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Percentage (%)"
                        name="percentage"
                        type="number"
                        value={installmentForm.percentage}
                        onChange={handleInstallmentInputChange}
                        required
                        InputProps={{
                          inputProps: { min: 1, max: 100 }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddInstallment}
                        startIcon={<Add />}
                      >
                        Add Installment
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Installments
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Percentage</TableCell>
                      {!isViewMode && <TableCell>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!formData.installments || formData.installments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isViewMode ? 3 : 4} align="center">
                          No installments added yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      formData.installments.map((installment, index) => (
                        <TableRow key={`installment-${index}-${installment.name}`}>
                          <TableCell>{installment.name}</TableCell>
                          <TableCell>{formatDate(installment.dueDate)}</TableCell>
                          <TableCell>{installment.percentage}%</TableCell>
                          {!isViewMode && (
                            <TableCell>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleRemoveInstallment(index)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                    {formData.installments && formData.installments.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={2} align="right">
                          <strong>Total:</strong>
                        </TableCell>
                        <TableCell colSpan={isViewMode ? 1 : 2}>
                          <strong>
                            {formData.installments.reduce((sum, installment) => sum + installment.percentage, 0)}%
                          </strong>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button
              onClick={handleSaveSchedule}
              variant="contained"
              color="primary"
              startIcon={<Save />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Schedule'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  // Render schedule cards
  const renderScheduleCards = () => {
    if (schedules.length === 0) {
      return (
        <Alert severity="info">
          No Fee Schedules
          <br />
          Create your first fee payment schedule to get started.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {schedules.map((schedule) => (
          <Grid item xs={12} sm={6} md={4} key={schedule._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    {schedule.name}
                  </Typography>
                  <Chip
                    label={schedule.isActive ? 'Active' : 'Inactive'}
                    color={schedule.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                {schedule.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {schedule.description}
                  </Typography>
                )}

                <Typography variant="body2" gutterBottom>
                  <strong>Academic Year:</strong> {schedule.academicYear.name || schedule.academicYear.year}
                </Typography>

                <Typography variant="body2" gutterBottom>
                  <strong>Class:</strong> {schedule.class ? schedule.class.name : 'All Classes'}
                </Typography>

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Installments:
                </Typography>
                <List dense>
                  {schedule.installments.slice(0, 3).map((installment, index) => (
                    <ListItem key={`list-installment-${index}-${installment.name}`} disablePadding>
                      <ListItemText
                        primary={`${installment.name} (${installment.percentage}%)`}
                        secondary={`Due: ${formatDate(installment.dueDate)}`}
                      />
                    </ListItem>
                  ))}
                  {schedule.installments.length > 3 && (
                    <ListItem disablePadding>
                      <ListItemText
                        primary={`+${schedule.installments.length - 3} more installments`}
                        secondary="Click View to see all"
                      />
                    </ListItem>
                  )}
                </List>

                <Divider sx={{ my: 1 }} />

                <Typography variant="body2" gutterBottom>
                  <strong>Reminders:</strong> {schedule.enableReminders ? `${schedule.reminderDays} days before due date` : 'Disabled'}
                </Typography>
              </CardContent>
              <CardActions>
                <Tooltip title="View Schedule">
                  <IconButton onClick={() => handleOpenViewDialog(schedule)}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Schedule">
                  <IconButton onClick={() => handleOpenEditDialog(schedule)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title={schedule.isActive ? 'Deactivate' : 'Activate'}>
                  <IconButton onClick={() => handleToggleStatus(schedule._id)}>
                    {schedule.isActive ? <ToggleOn color="primary" /> : <ToggleOff />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Schedule">
                  <IconButton onClick={() => handleDeleteSchedule(schedule._id)}>
                    <Delete />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Finance Management
      </Typography>
      <Typography variant="h5" gutterBottom>
        Fee Payment Schedules
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
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.active}
                  onChange={handleFilterChange}
                  name="active"
                />
              }
              label="Show Active Only"
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleOpenCreateDialog}
        >
          Create Schedule
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderScheduleCards()
      )}

      {renderDialogContent()}
    </Box>
  );
};

export default FeeSchedule;
