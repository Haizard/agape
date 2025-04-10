import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormGroup,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Book as BookIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import unifiedApi from '../../../services/unifiedApi';

/**
 * SubjectCombinationSetup Component
 * 
 * A comprehensive component for creating and managing subject combinations for A-Level.
 * This component replaces separate subject combination management forms with a unified approach.
 * 
 * @param {Object} props
 * @param {Function} props.onComplete - Function to call when setup is complete
 * @param {boolean} props.standalone - Whether the component is used standalone or as part of a workflow
 */
const SubjectCombinationSetup = ({ onComplete, standalone = false }) => {
  // State for subject combination form
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    principalSubjects: [],
    subsidiarySubjects: []
  });
  
  // State for subject combinations list
  const [combinations, setCombinations] = useState([]);
  const [subjects, setSubjects] = useState({
    principal: [],
    subsidiary: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [subjectSelectionOpen, setSubjectSelectionOpen] = useState(false);
  const [selectionType, setSelectionType] = useState('principal');
  
  // Fetch subject combinations and subjects on component mount
  useEffect(() => {
    fetchSubjectCombinations();
    fetchSubjects();
  }, []);
  
  // Fetch subject combinations
  const fetchSubjectCombinations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await unifiedApi.get('/subject-combinations');
      setCombinations(response);
      
      // Check if there's at least one subject combination
      if (response.length > 0 && !standalone) {
        // Mark step as complete if at least one subject combination exists
        onComplete && onComplete();
      }
    } catch (err) {
      console.error('Error fetching subject combinations:', err);
      setError('Failed to load subject combinations. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      
      // Fetch A-Level subjects
      const response = await unifiedApi.get('/subjects?educationLevel=A_LEVEL');
      
      // Separate principal and subsidiary subjects
      const principalSubjects = response.filter(subject => subject.isPrincipal);
      const subsidiarySubjects = response.filter(subject => !subject.isPrincipal);
      
      setSubjects({
        principal: principalSubjects,
        subsidiary: subsidiarySubjects
      });
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle subject selection
  const handleSubjectSelection = (subjectId) => {
    if (selectionType === 'principal') {
      // Toggle principal subject selection
      setFormData(prev => {
        const isSelected = prev.principalSubjects.includes(subjectId);
        
        if (isSelected) {
          // Remove subject
          return {
            ...prev,
            principalSubjects: prev.principalSubjects.filter(id => id !== subjectId)
          };
        } else {
          // Add subject
          return {
            ...prev,
            principalSubjects: [...prev.principalSubjects, subjectId]
          };
        }
      });
    } else {
      // Toggle subsidiary subject selection
      setFormData(prev => {
        const isSelected = prev.subsidiarySubjects.includes(subjectId);
        
        if (isSelected) {
          // Remove subject
          return {
            ...prev,
            subsidiarySubjects: prev.subsidiarySubjects.filter(id => id !== subjectId)
          };
        } else {
          // Add subject
          return {
            ...prev,
            subsidiarySubjects: [...prev.subsidiarySubjects, subjectId]
          };
        }
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate form data
      if (!formData.name) {
        setError('Combination name is required.');
        setLoading(false);
        return;
      }
      
      if (!formData.code) {
        setError('Combination code is required.');
        setLoading(false);
        return;
      }
      
      if (formData.principalSubjects.length < 3) {
        setError('At least 3 principal subjects are required.');
        setLoading(false);
        return;
      }
      
      if (formData.subsidiarySubjects.length < 1) {
        setError('At least 1 subsidiary subject is required.');
        setLoading(false);
        return;
      }
      
      if (editMode) {
        // Update existing subject combination
        await unifiedApi.put(`/subject-combinations/${editId}`, formData);
        setSuccess('Subject combination updated successfully.');
      } else {
        // Create new subject combination
        await unifiedApi.post('/subject-combinations', formData);
        setSuccess('Subject combination created successfully.');
      }
      
      // Reset form
      setFormData({
        name: '',
        code: '',
        description: '',
        principalSubjects: [],
        subsidiarySubjects: []
      });
      
      // Reset edit mode
      setEditMode(false);
      setEditId(null);
      
      // Refresh subject combinations
      await fetchSubjectCombinations();
      
      // Mark step as complete if not standalone
      if (!standalone) {
        onComplete && onComplete();
      }
    } catch (err) {
      console.error('Error saving subject combination:', err);
      setError(`Failed to save subject combination: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle edit subject combination
  const handleEdit = (combination) => {
    // Set form data
    setFormData({
      name: combination.name,
      code: combination.code,
      description: combination.description || '',
      principalSubjects: combination.principalSubjects.map(subject => 
        typeof subject === 'object' ? subject._id : subject
      ),
      subsidiarySubjects: combination.subsidiarySubjects.map(subject => 
        typeof subject === 'object' ? subject._id : subject
      )
    });
    
    // Set edit mode
    setEditMode(true);
    setEditId(combination._id);
  };
  
  // Handle delete subject combination
  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Delete subject combination
      await unifiedApi.delete(`/subject-combinations/${deleteId}`);
      
      // Close dialog
      setDeleteDialogOpen(false);
      setDeleteId(null);
      
      // Refresh subject combinations
      await fetchSubjectCombinations();
      
      setSuccess('Subject combination deleted successfully.');
    } catch (err) {
      console.error('Error deleting subject combination:', err);
      setError(`Failed to delete subject combination: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    // Reset form
    setFormData({
      name: '',
      code: '',
      description: '',
      principalSubjects: [],
      subsidiarySubjects: []
    });
    
    // Reset edit mode
    setEditMode(false);
    setEditId(null);
  };
  
  // Handle open subject selection dialog
  const handleOpenSubjectSelection = (type) => {
    setSelectionType(type);
    setSubjectSelectionOpen(true);
  };
  
  // Handle close subject selection dialog
  const handleCloseSubjectSelection = () => {
    setSubjectSelectionOpen(false);
  };
  
  // Handle bulk combination creation
  const handleBulkCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get principal subjects
      const principalSubjects = subjects.principal;
      const subsidiarySubjects = subjects.subsidiary;
      
      // Check if we have enough subjects
      if (principalSubjects.length < 3) {
        setError('Not enough principal subjects. Please create at least 3 principal subjects first.');
        setLoading(false);
        return;
      }
      
      if (subsidiarySubjects.length < 1) {
        setError('Not enough subsidiary subjects. Please create at least 1 subsidiary subject first.');
        setLoading(false);
        return;
      }
      
      // Find specific subjects by name
      const findSubjectByName = (name) => {
        const subject = [...principalSubjects, ...subsidiarySubjects].find(
          s => s.name.toLowerCase().includes(name.toLowerCase())
        );
        return subject ? subject._id : null;
      };
      
      // Create common combinations
      const combinations = [
        {
          name: 'Physics, Chemistry, Mathematics',
          code: 'PCM',
          description: 'Science combination with Physics, Chemistry, and Mathematics',
          principalSubjects: [
            findSubjectByName('physics'),
            findSubjectByName('chemistry'),
            findSubjectByName('mathematics')
          ].filter(Boolean),
          subsidiarySubjects: [
            findSubjectByName('english'),
            findSubjectByName('general studies')
          ].filter(Boolean)
        },
        {
          name: 'Physics, Geography, Mathematics',
          code: 'PGM',
          description: 'Science combination with Physics, Geography, and Mathematics',
          principalSubjects: [
            findSubjectByName('physics'),
            findSubjectByName('geography'),
            findSubjectByName('mathematics')
          ].filter(Boolean),
          subsidiarySubjects: [
            findSubjectByName('english'),
            findSubjectByName('general studies')
          ].filter(Boolean)
        },
        {
          name: 'History, Geography, Kiswahili',
          code: 'HGK',
          description: 'Arts combination with History, Geography, and Kiswahili',
          principalSubjects: [
            findSubjectByName('history'),
            findSubjectByName('geography'),
            findSubjectByName('kiswahili')
          ].filter(Boolean),
          subsidiarySubjects: [
            findSubjectByName('english'),
            findSubjectByName('general studies')
          ].filter(Boolean)
        },
        {
          name: 'Chemistry, Biology, Mathematics',
          code: 'CBM',
          description: 'Science combination with Chemistry, Biology, and Mathematics',
          principalSubjects: [
            findSubjectByName('chemistry'),
            findSubjectByName('biology'),
            findSubjectByName('mathematics')
          ].filter(Boolean),
          subsidiarySubjects: [
            findSubjectByName('english'),
            findSubjectByName('general studies')
          ].filter(Boolean)
        }
      ];
      
      // Validate combinations
      const validCombinations = combinations.filter(
        combo => combo.principalSubjects.length === 3 && combo.subsidiarySubjects.length > 0
      );
      
      if (validCombinations.length === 0) {
        setError('Could not create valid combinations. Please check that you have created all necessary subjects.');
        setLoading(false);
        return;
      }
      
      // Create combinations
      await unifiedApi.post('/subject-combinations/bulk', validCombinations);
      
      setSuccess(`Created ${validCombinations.length} subject combinations successfully.`);
      
      // Refresh subject combinations
      await fetchSubjectCombinations();
      
      // Mark step as complete if not standalone
      if (!standalone) {
        onComplete && onComplete();
      }
    } catch (err) {
      console.error('Error creating bulk combinations:', err);
      setError(`Failed to create bulk combinations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    const allSubjects = [...subjects.principal, ...subjects.subsidiary];
    const subject = allSubjects.find(s => s._id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };
  
  return (
    <Box>
      {standalone && (
        <Typography variant="h5" gutterBottom>
          Subject Combination Management
        </Typography>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      {/* Quick Setup */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Setup
        </Typography>
        
        <Typography variant="body2" paragraph>
          Create common A-Level subject combinations (PCM, PGM, HGK, CBM) with one click.
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleBulkCreate}
          disabled={loading}
          startIcon={<AddIcon />}
        >
          Create Common Combinations
        </Button>
      </Paper>
      
      {/* Subject Combination Form */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editMode ? 'Edit Subject Combination' : 'Create New Subject Combination'}
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Combination Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                helperText="e.g., Physics, Chemistry, Mathematics"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Combination Code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                fullWidth
                required
                helperText="e.g., PCM, HGK"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Principal Subjects ({formData.principalSubjects.length} selected)
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, minHeight: 100 }}>
                {formData.principalSubjects.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No principal subjects selected
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {formData.principalSubjects.map(subjectId => (
                      <Chip
                        key={subjectId}
                        label={getSubjectName(subjectId)}
                        onDelete={() => handleSubjectSelection(subjectId)}
                        color="primary"
                      />
                    ))}
                  </Box>
                )}
              </Paper>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handleOpenSubjectSelection('principal')}
                sx={{ mt: 1 }}
                fullWidth
              >
                Select Principal Subjects
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Subsidiary Subjects ({formData.subsidiarySubjects.length} selected)
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, minHeight: 100 }}>
                {formData.subsidiarySubjects.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No subsidiary subjects selected
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {formData.subsidiarySubjects.map(subjectId => (
                      <Chip
                        key={subjectId}
                        label={getSubjectName(subjectId)}
                        onDelete={() => handleSubjectSelection(subjectId)}
                        color="secondary"
                      />
                    ))}
                  </Box>
                )}
              </Paper>
              
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => handleOpenSubjectSelection('subsidiary')}
                sx={{ mt: 1 }}
                fullWidth
              >
                Select Subsidiary Subjects
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {editMode && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                )}
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editMode ? 'Update Combination' : 'Create Combination'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Subject Combinations List */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Subject Combinations
        </Typography>
        
        {loading && !editMode ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        ) : combinations.length === 0 ? (
          <Alert severity="info">
            No subject combinations found. Please create a combination.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Principal Subjects</TableCell>
                  <TableCell>Subsidiary Subjects</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {combinations.map((combination) => (
                  <TableRow key={combination._id}>
                    <TableCell>{combination.name}</TableCell>
                    <TableCell>{combination.code}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {combination.principalSubjects.map((subject, index) => (
                          <Chip
                            key={index}
                            label={typeof subject === 'object' ? subject.name : getSubjectName(subject)}
                            color="primary"
                            size="small"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {combination.subsidiarySubjects.map((subject, index) => (
                          <Chip
                            key={index}
                            label={typeof subject === 'object' ? subject.name : getSubjectName(subject)}
                            color="secondary"
                            size="small"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(combination)}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      
                      <IconButton
                        color="error"
                        onClick={() => {
                          setDeleteId(combination._id);
                          setDeleteDialogOpen(true);
                        }}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this subject combination? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Subject Selection Dialog */}
      <Dialog
        open={subjectSelectionOpen}
        onClose={handleCloseSubjectSelection}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectionType === 'principal' ? 'Select Principal Subjects' : 'Select Subsidiary Subjects'}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {selectionType === 'principal' ? (
                subjects.principal.length === 0 ? (
                  <Alert severity="warning">
                    No principal subjects found. Please create principal subjects first.
                  </Alert>
                ) : (
                  subjects.principal.map(subject => (
                    <ListItem key={subject._id} button onClick={() => handleSubjectSelection(subject._id)}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={formData.principalSubjects.includes(subject._id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={subject.name}
                        secondary={subject.code}
                      />
                    </ListItem>
                  ))
                )
              ) : (
                subjects.subsidiary.length === 0 ? (
                  <Alert severity="warning">
                    No subsidiary subjects found. Please create subsidiary subjects first.
                  </Alert>
                ) : (
                  subjects.subsidiary.map(subject => (
                    <ListItem key={subject._id} button onClick={() => handleSubjectSelection(subject._id)}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={formData.subsidiarySubjects.includes(subject._id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={subject.name}
                        secondary={subject.code}
                      />
                    </ListItem>
                  ))
                )
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubjectSelection} color="primary">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

SubjectCombinationSetup.propTypes = {
  onComplete: PropTypes.func,
  standalone: PropTypes.bool
};

export default SubjectCombinationSetup;
