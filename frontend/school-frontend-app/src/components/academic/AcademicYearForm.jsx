import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
  Divider,
  FormControlLabel,
  Switch,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAcademic } from '../../contexts/AcademicContext';

const AcademicYearForm = ({ open, onClose, onSuccess, academicYear }) => {
  const { academicYears } = useAcademic();
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    startDate: null,
    endDate: null,
    isActive: false,
    terms: []
  });
  const [errors, setErrors] = useState({});

  // Reset form when dialog opens/closes or academicYear changes
  useEffect(() => {
    if (academicYear) {
      setFormData({
        name: academicYear.name || '',
        year: academicYear.year || '',
        startDate: academicYear.startDate ? new Date(academicYear.startDate) : null,
        endDate: academicYear.endDate ? new Date(academicYear.endDate) : null,
        isActive: academicYear.isActive || false,
        terms: academicYear.terms ? [...academicYear.terms].map(term => ({
          ...term,
          startDate: term.startDate ? new Date(term.startDate) : null,
          endDate: term.endDate ? new Date(term.endDate) : null
        })) : []
      });
    } else {
      // For new academic year, initialize with empty form
      setFormData({
        name: '',
        year: new Date().getFullYear(),
        startDate: null,
        endDate: null,
        isActive: false,
        terms: []
      });
    }
    setErrors({});
  }, [academicYear]); // Only depend on academicYear changes

  const validateForm = () => {
    const newErrors = {};

    // Validate required fields
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';

    // Validate year format
    const yearNum = Number(formData.year);
    if (formData.year && (Number.isNaN(yearNum) || yearNum < 2000 || yearNum > 2100)) {
      newErrors.year = 'Year must be a valid number between 2000 and 2100';
    }

    // Validate date range
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    // Validate terms
    const termErrors = [];
    formData.terms.forEach((term, index) => {
      const termError = {};
      if (!term.name) termError.name = 'Term name is required';
      if (!term.startDate) termError.startDate = 'Term start date is required';
      if (!term.endDate) termError.endDate = 'Term end date is required';

      // Validate term date range
      if (term.startDate && term.endDate && term.startDate > term.endDate) {
        termError.endDate = 'Term end date must be after start date';
      }

      // Validate term dates are within academic year
      if (formData.startDate && term.startDate && term.startDate < formData.startDate) {
        termError.startDate = 'Term start date must be within academic year';
      }
      if (formData.endDate && term.endDate && term.endDate > formData.endDate) {
        termError.endDate = 'Term end date must be within academic year';
      }

      if (Object.keys(termError).length > 0) {
        termErrors[index] = termError;
      }
    });

    if (termErrors.length > 0) {
      newErrors.terms = termErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Convert year to number before submitting
      const submissionData = {
        ...formData,
        year: Number(formData.year)
      };
      onSuccess(submissionData);
    }
  };

  const addTerm = () => {
    setFormData({
      ...formData,
      terms: [
        ...formData.terms,
        {
          name: '',
          startDate: null,
          endDate: null
        }
      ]
    });
  };

  const updateTerm = (index, field, value) => {
    const updatedTerms = [...formData.terms];
    updatedTerms[index] = {
      ...updatedTerms[index],
      [field]: value
    };
    setFormData({
      ...formData,
      terms: updatedTerms
    });
  };

  const removeTerm = (index) => {
    const updatedTerms = [...formData.terms];
    updatedTerms.splice(index, 1);
    setFormData({
      ...formData,
      terms: updatedTerms
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {academicYear ? 'Edit Academic Year' : 'Create New Academic Year'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Academic Year Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
                error={!!errors.year}
                helperText={errors.year}
                inputProps={{ min: 2000, max: 2100 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(newValue) => setFormData({ ...formData, startDate: newValue })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.startDate,
                      helperText: errors.startDate
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(newValue) => setFormData({ ...formData, endDate: newValue })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.endDate,
                      helperText: errors.endDate
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    color="primary"
                  />
                }
                label="Set as Active Academic Year"
              />
              {formData.isActive && academicYears.some(year => year.isActive && (!academicYear || year._id !== academicYear._id)) && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Setting this as active will deactivate the current active academic year.
                </Alert>
              )}
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Terms</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addTerm}
                variant="outlined"
                size="small"
              >
                Add Term
              </Button>
            </Box>
            <Divider sx={{ my: 1 }} />

            {formData.terms.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No terms added yet. Click "Add Term" to add a term to this academic year.
              </Alert>
            )}

            {formData.terms.map((term, index) => (
              <Box key={`term-${index}-${term.name || 'new'}`} sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">Term {index + 1}</Typography>
                    <IconButton onClick={() => removeTerm(index)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Term Name"
                      value={term.name}
                      onChange={(e) => updateTerm(index, 'name', e.target.value)}
                      required
                      error={!!errors.terms?.[index]?.name}
                      helperText={errors.terms?.[index]?.name}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Start Date"
                        value={term.startDate}
                        onChange={(newValue) => updateTerm(index, 'startDate', newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: !!errors.terms?.[index]?.startDate,
                            helperText: errors.terms?.[index]?.startDate
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="End Date"
                        value={term.endDate}
                        onChange={(newValue) => updateTerm(index, 'endDate', newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: !!errors.terms?.[index]?.endDate,
                            helperText: errors.terms?.[index]?.endDate
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {academicYear ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

AcademicYearForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  academicYear: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    isActive: PropTypes.bool,
    terms: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
    }))
  })
};

AcademicYearForm.defaultProps = {
  academicYear: null
};

export default AcademicYearForm;
