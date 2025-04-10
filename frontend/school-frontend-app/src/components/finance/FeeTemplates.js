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
  Card,
  CardContent,
  CardActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  ContentCopy,
  Visibility,
  Check,
  Close
} from '@mui/icons-material';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const FeeTemplates = () => {
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    components: []
  });
  const [componentForm, setComponentForm] = useState({
    name: '',
    amount: 0,
    description: '',
    isOptional: false
  });

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/finance/fee-templates');
        setTemplates(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching fee templates:', error);
        setError('Failed to load fee templates. Please try again later.');
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Calculate total amount from components
  const calculateTotal = (components) => {
    if (!components || !Array.isArray(components)) return 0;
    return components.reduce((total, component) => total + (component.amount || 0), 0);
  };

  // Handle form input change
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle component form input change
  const handleComponentInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setComponentForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Add component to form
  const handleAddComponent = () => {
    if (!componentForm.name || componentForm.amount <= 0) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      components: [
        ...prev.components,
        {
          ...componentForm,
          amount: Number(componentForm.amount)
        }
      ]
    }));

    // Reset component form
    setComponentForm({
      name: '',
      amount: 0,
      description: '',
      isOptional: false
    });
  };

  // Remove component from form
  const handleRemoveComponent = (index) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  // Open dialog for creating a new template
  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      description: '',
      components: []
    });
    setOpenDialog(true);
  };

  // Open dialog for editing a template
  const handleOpenEditDialog = (template) => {
    setDialogMode('edit');
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      components: template.components.map(component => ({
        name: component.name,
        amount: component.amount,
        description: component.description || '',
        isOptional: component.isOptional || false
      }))
    });
    setOpenDialog(true);
  };

  // Open dialog for viewing a template
  const handleOpenViewDialog = (template) => {
    setDialogMode('view');
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      components: template.components
    });
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTemplate(null);
  };

  // Save template
  const handleSaveTemplate = async () => {
    if (!formData.name || formData.components.length === 0) {
      setError('Template name and at least one fee component are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (dialogMode === 'create') {
        await api.post('/api/finance/fee-templates', formData);
      } else if (dialogMode === 'edit') {
        await api.put(`/api/finance/fee-templates/${selectedTemplate._id}`, formData);
      }

      // Refresh templates
      const response = await api.get('/api/finance/fee-templates');
      setTemplates(response.data);

      setOpenDialog(false);
      setLoading(false);
    } catch (error) {
      console.error('Error saving fee template:', error);
      setError(error.response?.data?.message || 'Failed to save fee template. Please try again later.');
      setLoading(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.delete(`/api/finance/fee-templates/${templateId}`);

      // Refresh templates
      const response = await api.get('/api/finance/fee-templates');
      setTemplates(response.data);

      setLoading(false);
    } catch (error) {
      console.error('Error deleting fee template:', error);
      setError('Failed to delete fee template. Please try again later.');
      setLoading(false);
    }
  };

  // Use template to create fee structure
  const handleUseTemplate = (template) => {
    // Navigate to fee structure creation page with template data
    window.location.href = `/finance/fee-structures/new?templateId=${template._id}`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  // Calculate total amount is defined above

  // Render dialog content
  const renderDialogContent = () => {
    const isViewMode = dialogMode === 'view';
    const dialogTitle = {
      'create': 'Create Fee Template',
      'edit': 'Edit Fee Template',
      'view': 'View Fee Template'
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
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isViewMode}
                required
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
              />
            </Grid>

            {!isViewMode && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Add Fee Component
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Component Name"
                        name="name"
                        value={componentForm.name}
                        onChange={handleComponentInputChange}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Amount"
                        name="amount"
                        type="number"
                        value={componentForm.amount}
                        onChange={handleComponentInputChange}
                        required
                        inputProps={{ min: 0 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Optional</InputLabel>
                        <Select
                          name="isOptional"
                          value={componentForm.isOptional}
                          onChange={handleComponentInputChange}
                          label="Optional"
                        >
                          <MenuItem value={false}>No</MenuItem>
                          <MenuItem value={true}>Yes</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={componentForm.description}
                        onChange={handleComponentInputChange}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddComponent}
                        disabled={!componentForm.name || componentForm.amount <= 0}
                      >
                        Add Component
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Fee Components
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Optional</TableCell>
                      {!isViewMode && <TableCell>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!formData.components || formData.components.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isViewMode ? 4 : 5} align="center">
                          No fee components added yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      formData.components.map((component, index) => (
                        <TableRow key={`component-${index}-${component.name}`}>
                          <TableCell>{component.name}</TableCell>
                          <TableCell>{formatCurrency(component.amount)}</TableCell>
                          <TableCell>{component.description || 'N/A'}</TableCell>
                          <TableCell>
                            {component.isOptional ? (
                              <Chip label="Yes" color="primary" size="small" />
                            ) : (
                              <Chip label="No" size="small" />
                            )}
                          </TableCell>
                          {!isViewMode && (
                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveComponent(index)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                    {formData.feeComponents.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={isViewMode ? 1 : 2} sx={{ fontWeight: 'bold' }}>
                          Total
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(calculateTotal(formData.feeComponents))}
                        </TableCell>
                        <TableCell colSpan={isViewMode ? 2 : 3} />
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
              onClick={handleSaveTemplate}
              variant="contained"
              color="primary"
              disabled={loading || !formData.name || formData.feeComponents.length === 0}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Template'}
            </Button>
          )}
          {isViewMode && (
            <Button
              onClick={() => handleUseTemplate(selectedTemplate)}
              variant="contained"
              color="primary"
            >
              Use Template
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Fee Templates</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleOpenCreateDialog}
        >
          Create Template
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && templates.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : templates.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Fee Templates
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Create your first fee template to get started.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleOpenCreateDialog}
          >
            Create Template
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {template.name}
                  </Typography>

                  {template.description && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {template.description}
                    </Typography>
                  )}

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Components: {template.components ? template.components.length : 0}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Total Amount: {formatCurrency(calculateTotal(template.components))}
                  </Typography>

                  <List dense>
                    {template.components?.slice(0, 3).map((component, index) => (
                      <ListItem key={`list-component-${index}-${component.name}`} disablePadding>
                        <ListItemText
                          primary={component.name}
                          secondary={formatCurrency(component.amount)}
                        />
                        {component.isOptional && (
                          <ListItemSecondaryAction>
                            <Chip label="Optional" size="small" />
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    ))}
                    {template.components?.length > 3 && (
                      <ListItem disablePadding>
                        <ListItemText
                          primary={`+${template.components?.length - 3} more components`}
                          secondary="Click View to see all"
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleOpenViewDialog(template)}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleOpenEditDialog(template)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDeleteTemplate(template._id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {renderDialogContent()}
    </Box>
  );
};

export default FeeTemplates;
