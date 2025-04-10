import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { useSelector } from 'react-redux';
import unifiedApi from '../../services/unifiedApi';

/**
 * TeacherSubjectSelector Component
 * 
 * A component that only shows subjects assigned to the current teacher,
 * implementing proper role-based access control.
 * 
 * @param {Object} props
 * @param {string} props.classId - ID of the selected class
 * @param {string} props.value - Currently selected subject ID
 * @param {Function} props.onChange - Function to call when selection changes
 * @param {boolean} props.showAll - Whether to show all subjects (admin only)
 * @param {string} props.label - Label for the select input
 */
const TeacherSubjectSelector = ({ 
  classId, 
  value, 
  onChange, 
  showAll = false,
  label = 'Subject'
}) => {
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);

  // Determine if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  
  // Fetch subjects for the class
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!classId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get all subjects for this class
        const classSubjects = await unifiedApi.getSubjectsByClass(classId);
        setSubjects(classSubjects);
        
        // If user is not admin and showAll is false, filter to only show assigned subjects
        if (!isAdmin && !showAll) {
          // Get subjects assigned to this teacher
          const teacherSubjects = await unifiedApi.get(`/teachers/${user.teacherId}/subjects`);
          
          // Filter class subjects to only include those assigned to the teacher
          const teacherSubjectIds = teacherSubjects.map(subject => subject._id);
          const filteredSubjects = classSubjects.filter(subject => 
            teacherSubjectIds.includes(subject._id)
          );
          
          setAssignedSubjects(filteredSubjects);
        } else {
          // Admin or showAll is true, show all subjects
          setAssignedSubjects(classSubjects);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubjects();
  }, [classId, isAdmin, showAll, user?.teacherId]);

  // Handle subject change
  const handleSubjectChange = (event) => {
    const subjectId = event.target.value;
    
    // If not admin and not showAll, verify this subject is assigned to the teacher
    if (!isAdmin && !showAll) {
      const isAssigned = assignedSubjects.some(subject => subject._id === subjectId);
      if (!isAssigned) {
        setError('You are not assigned to teach this subject.');
        return;
      }
    }
    
    // Call the onChange handler
    onChange(subjectId);
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography variant="body2">Loading subjects...</Typography>
      </Box>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  // If no subjects found, show message
  if (assignedSubjects.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        {!isAdmin && !showAll 
          ? 'You are not assigned to teach any subjects in this class.' 
          : 'No subjects found for this class.'}
      </Alert>
    );
  }

  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={handleSubjectChange}
        label={label}
        disabled={assignedSubjects.length === 0}
      >
        {assignedSubjects.map((subject) => (
          <MenuItem key={subject._id} value={subject._id}>
            {subject.name}
            {subject.isPrincipal && (
              <Chip 
                label="Principal" 
                size="small" 
                color="primary" 
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
              />
            )}
            {subject.isCompulsory && (
              <Chip 
                label="Compulsory" 
                size="small" 
                color="secondary" 
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
              />
            )}
          </MenuItem>
        ))}
      </Select>
      {!isAdmin && !showAll && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          Note: You can only see subjects assigned to you.
        </Typography>
      )}
    </FormControl>
  );
};

TeacherSubjectSelector.propTypes = {
  classId: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  showAll: PropTypes.bool,
  label: PropTypes.string
};

export default TeacherSubjectSelector;
