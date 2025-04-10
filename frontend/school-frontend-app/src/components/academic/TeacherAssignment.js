import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Snackbar,
  TextField // Added TextField import
} from '@mui/material';
import api from '../../services/api';
import { handleApiError } from '../../utils/errorHandler';

const TeacherAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]); // Added state for academic years
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null); // New state for editing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    teacherId: '',
    subjectId: '',
    classId: '',
    academicYear: '', // Changed initial state to empty string
    startDate: '', // Initialize as empty string
    endDate: ''   // Initialize as empty string
  });
  const [teacherQualifications, setTeacherQualifications] = useState([]);
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add error handling utility
  const handleError = (error, customMessage) => {
    const errorMessage = error.response?.data?.message || error.message;
    setError(`${customMessage}: ${errorMessage}`);
    setLoading(false);
    setIsSubmitting(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch academic years as well
      console.log('Fetching teacher assignments and related data...');

      // Fetch each resource separately to better handle errors
      let assignmentsRes;
      let teachersRes;
      let subjectsRes;
      let classesRes;
      let academicYearsRes;

      try {
        teachersRes = await api.get('/api/teachers?status=active');
        console.log('Found', teachersRes.data.length, 'teachers');
        setTeachers(teachersRes.data);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setTeachers([]);
      }

      try {
        subjectsRes = await api.get('/api/subjects');
        console.log('Found', subjectsRes.data.length, 'subjects');
        setSubjects(subjectsRes.data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setSubjects([]);
      }

      try {
        classesRes = await api.get('/api/classes?active=true');
        console.log('Found', classesRes.data.length, 'classes');
        setClasses(classesRes.data);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setClasses([]);
      }

      try {
        academicYearsRes = await api.get('/api/academic-years');
        console.log('Found', academicYearsRes.data.length, 'academic years');
        setAcademicYears(academicYearsRes.data);
      } catch (error) {
        console.error('Error fetching academic years:', error);
        setAcademicYears([]);
      }

      // Fetch assignments last
      try {
        assignmentsRes = await api.get('/api/teachers/assignments');
        console.log('Found', assignmentsRes.data.length, 'assignments');
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setError(`Failed to fetch assignments: ${error.message}`);
        setAssignments([]);
        setLoading(false);
        return;
      }

      // Check if we have valid data
      if (!assignmentsRes || !assignmentsRes.data) {
        console.error('No assignments data received');
        setError('Failed to fetch assignments: No data received');
        setAssignments([]);
        setLoading(false);
        return;
      }

      console.log('Processing assignments data...');
      console.log('Assignments count:', assignmentsRes.data.length);

      // Backend sends transformed data, use fields directly
      const formattedAssignments = assignmentsRes.data
        .filter(assignment => {
          // Filter out invalid assignments
          if (!assignment || !assignment._id) {
            console.log('Skipping invalid assignment:', assignment);
            return false;
          }
          return true;
        })
        .map(assignment => ({
          ...assignment, // Keep original fields like _id, startDate, endDate
          // Use the names provided directly by the backend response
          teacherName: assignment.teacherName || 'N/A',
          subjectName: assignment.subjectName || 'N/A',
          className: assignment.className || 'N/A',
          academicYearName: assignment.academicYear || 'N/A', // Backend sends the year string as 'academicYear'
          // Format dates for display
          startDate: assignment.startDate ? new Date(assignment.startDate).toLocaleDateString() : 'N/A',
          endDate: assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : 'N/A',
          // Add a flag to indicate if this is a real TeacherAssignment or derived from Class model
          isEditable: assignment.source === 'TeacherAssignment'
        }));
      setAssignments(formattedAssignments);
      setTeachers(teachersRes.data);
      setSubjects(subjectsRes.data);
      setClasses(classesRes.data);
      setAcademicYears(academicYearsRes.data); // Set academic years state
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTeacherQualifications = async () => {
      if (formData.teacherId) {
        try {
          // Ensure the endpoint exists and returns subject IDs or objects
          const response = await api.get(`/api/teachers/${formData.teacherId}/qualifications`);
          // Assuming response.data is an array of subject objects { _id, name }
          setTeacherQualifications(response.data);
        } catch (error) {
          console.error('Failed to fetch teacher qualifications:', error);
          setError('Failed to fetch teacher qualifications. Check API endpoint.');
          setTeacherQualifications([]); // Reset on error
        }
      } else {
        setTeacherQualifications([]);
      }
    };

    fetchTeacherQualifications();
  }, [formData.teacherId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Updated validation to include startDate and endDate
    if (!formData.teacherId || !formData.subjectId || !formData.classId || !formData.academicYear || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields, including start and end dates.');
      return;
    }

    // Validate date range
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        setError('End date must be after start date.');
        return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Send dates in ISO format
      const payload = {
        teacher: formData.teacherId, // Match backend model field names
        subject: formData.subjectId,
        class: formData.classId,
        academicYear: formData.academicYear, // Assuming academicYear ID is needed
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      console.log('Submitting assignment with payload:', payload);

      // First, create or update the TeacherAssignment record
      try {
        if (editingAssignment) {
          await api.put(`/api/teachers/assignments/${editingAssignment._id}`, payload);
          setSuccess('Assignment updated successfully');
        } else {
          await api.post('/api/teachers/assignments', payload); // Updated endpoint and payload
          setSuccess('Assignment created successfully');
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        setError(`Failed to save assignment: ${apiError.response?.data?.message || apiError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Now, also update the Class model to ensure consistency
      try {
        // Get the current class data
        const classResponse = await api.get(`/api/classes/${formData.classId}`);
        const classData = classResponse.data;

        // Check if this subject is already in the class
        const subjects = classData.subjects || [];
        let subjectExists = false;

        // Update or add the subject-teacher assignment
        for (let i = 0; i < subjects.length; i++) {
          if (subjects[i].subject &&
              (subjects[i].subject._id === formData.subjectId ||
               subjects[i].subject === formData.subjectId)) {
            // Update existing subject
            subjects[i].teacher = formData.teacherId;
            subjectExists = true;
            break;
          }
        }

        // If subject doesn't exist in this class, add it
        if (!subjectExists) {
          subjects.push({
            subject: formData.subjectId,
            teacher: formData.teacherId
          });
        }

        // Update the class with the new subjects array
        await api.put(`/api/classes/${formData.classId}/subjects`, {
          subjects: subjects
        });

        console.log('Class model updated successfully');
      } catch (classError) {
        console.error('Error updating class model:', classError);
        // Don't fail the whole operation if this part fails
      }

      setOpenDialog(false);
      await fetchData(); // Refresh data
      // Reset form including dates
      setFormData({
        teacherId: '',
        subjectId: '',
        classId: '',
        academicYear: '', // Reset academic year to empty string
        startDate: '',
        endDate: ''
      });
      setEditingAssignment(null);
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    // Find the assignment to check if it's editable
    const assignment = assignments.find(a => a._id === assignmentId);
    if (!assignment || !assignment.isEditable) {
      console.log('Cannot delete assignment from Class model');
      setError('This assignment cannot be deleted because it comes from the Class model');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Get the assignment details before deleting
      const assignmentToDelete = assignments.find(a => a._id === assignmentId);

      // Delete from TeacherAssignment collection
      await api.delete(`/api/teachers/assignments/${assignmentId}`);

      // Also update the Class model to remove this teacher from the subject
      if (assignmentToDelete) {
        try {
          // Get the current class data
          const classResponse = await api.get(`/api/classes/${assignmentToDelete.classId}`);
          const classData = classResponse.data;

          // Find and update the subject-teacher assignment
          if (classData.subjects && Array.isArray(classData.subjects)) {
            const updatedSubjects = classData.subjects.map(subjectItem => {
              if (subjectItem.subject &&
                  (subjectItem.subject._id === assignmentToDelete.subjectId ||
                   subjectItem.subject === assignmentToDelete.subjectId) &&
                  subjectItem.teacher === assignmentToDelete.teacherId) {
                // Remove teacher assignment but keep the subject
                return { ...subjectItem, teacher: null };
              }
              return subjectItem;
            });

            // Update the class with the modified subjects array
            await api.put(`/api/classes/${assignmentToDelete.classId}/subjects`, {
              subjects: updatedSubjects
            });

            console.log('Class model updated successfully');
          }
        } catch (classError) {
          console.error('Error updating class model:', classError);
          // Don't fail the whole operation if this part fails
        }
      }

      setSuccess('Assignment deleted successfully');
      await fetchData(); // Refresh data
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assignment) => {
    // Only allow editing of assignments from TeacherAssignment model
    if (!assignment.isEditable) {
      console.log('Cannot edit assignment from Class model');
      return;
    }

    setEditingAssignment(assignment);
    setFormData({
      teacherId: assignment.teacherId,
      subjectId: assignment.subjectId,
      classId: assignment.classId,
      academicYear: assignment.academicYear,
      startDate: new Date(assignment.startDate).toISOString().split('T')[0],
      endDate: new Date(assignment.endDate).toISOString().split('T')[0]
    });
    setOpenDialog(true);
  };

  // Helper function to format date string
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Teacher Subject Assignment
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={() => setOpenDialog(true)}
        sx={{ mb: 3 }}
      >
        New Assignment
      </Button>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        message={success}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Teacher</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Academic Year</TableCell>
              <TableCell>Start Date</TableCell> {/* Added Start Date column */}
              <TableCell>End Date</TableCell>   {/* Added End Date column */}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No assignments found.</TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment._id}>
                  <TableCell>{assignment.teacherName}</TableCell>
                  <TableCell>{assignment.subjectName}</TableCell>
                  <TableCell>{assignment.className}</TableCell>
                  <TableCell>{assignment.academicYearName}</TableCell> {/* Display Academic Year */}
                  <TableCell>{formatDate(assignment.startDate)}</TableCell> {/* Display Formatted Start Date */}
                  <TableCell>{formatDate(assignment.endDate)}</TableCell>   {/* Display Formatted End Date */}
                  <TableCell>
                    {assignment.isEditable ? (
                      <>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDelete(assignment._id)}
                          disabled={loading} // Disable delete while loading
                        >
                          Remove
                        </Button>
                        <Button
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(assignment)}
                          disabled={loading} // Disable edit while loading
                        >
                          Edit
                        </Button>
                      </>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        (From Class Assignment)
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Teacher Assignment</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }} onSubmit={handleSubmit}> {/* Added onSubmit */}
            {/* Teacher Select */}
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <InputLabel>Teacher</InputLabel>
              <Select
                name="teacherId" // Added name attribute
                value={formData.teacherId}
                onChange={(e) => {
                  console.log('Teacher selected:', e.target.value); // Log selected teacher ID
                  setFormData({...formData, teacherId: e.target.value, subjectId: ''}); // Reset subject on teacher change
                }}
                label="Teacher" // Added label for accessibility
              >
                {teachers.length === 0 ? (
                  <MenuItem disabled>Loading teachers...</MenuItem>
                 ) : (
                   teachers.map((teacher) => (
                     <MenuItem key={teacher._id} value={teacher._id}>
                       {`${teacher.firstName} ${teacher.lastName}`} {/* Combine first and last name */}
                     </MenuItem>
                   ))
                )}
              </Select>
            </FormControl>

            {teacherQualifications.length > 0 && (
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', ml: 1, mb: 2 }}>
                Qualified Subjects: {teacherQualifications.map(subject => subject.name).join(', ')}
              </Typography>
            )}

            {/* Subject Select */}
            {console.log('Rendering Subject Select, teacherId:', formData.teacherId, 'Disabled:', !formData.teacherId)} {/* Log before render */}
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <InputLabel>Subject</InputLabel>
              <Select
                name="subjectId" // Added name attribute
                value={formData.subjectId}
                onChange={handleInputChange} // Use generic handler
                disabled={!formData.teacherId}
                label="Subject" // Added label for accessibility
              >
                {subjects.length === 0 ? (
                  <MenuItem disabled>Loading subjects...</MenuItem>
                ) : (
                  subjects
                    // Optionally filter subjects based on teacher qualifications if API provides IDs
                    // .filter(subject => teacherQualifications.some(q => q._id === subject._id))
                    .map((subject) => (
                      <MenuItem key={subject._id} value={subject._id}>
                        {subject.name}
                      </MenuItem>
                    ))
                )}
                 {formData.teacherId && subjects.length === 0 && <MenuItem disabled>No subjects available for this teacher</MenuItem>}
              </Select>
            </FormControl>

            {/* Class Select */}
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <InputLabel>Class</InputLabel>
              <Select
                name="classId" // Added name attribute
                value={formData.classId}
                onChange={handleInputChange} // Use generic handler
                label="Class" // Added label for accessibility
              >
                {classes.length === 0 ? (
                  <MenuItem disabled>Loading classes...</MenuItem>
                ) : (
                  classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Academic Year Select */}
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <InputLabel>Academic Year</InputLabel>
              <Select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleInputChange}
                label="Academic Year"
              >
                {academicYears.length === 0 ? (
                  <MenuItem disabled>Loading academic years...</MenuItem>
                ) : (
                  academicYears.map((year) => (
                    <MenuItem key={year._id} value={year._id}>
                      {year.year} {/* Display the year */}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Start Date Input */}
            <TextField
              name="startDate"
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange}
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mb: 2 }}
            />

            {/* End Date Input */}
            <TextField
              name="endDate"
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={handleInputChange}
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit" // Changed to type submit to trigger form's onSubmit
            onClick={handleSubmit} // Keep onClick for direct button click handling
            variant="contained"
            // Ensure academicYear is included in disabled check
            disabled={isSubmitting || !formData.teacherId || !formData.subjectId || !formData.classId || !formData.academicYear || !formData.startDate || !formData.endDate}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherAssignment;
