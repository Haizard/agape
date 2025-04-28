import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Button,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import newALevelResultService from '../../services/newALevelResultService';
import aLevelStudentService from '../../services/aLevelStudentService';
import PreviewDialog from '../common/PreviewDialog';
import { calculateGradeAndPoints } from '../../utils/aLevelMarksUtils';

// Import child components
import ALevelMarksEntryForm from './ALevelMarksEntryForm';
import ALevelMarksTable from './ALevelMarksTable';
import ALevelGradesView from './ALevelGradesView';

/**
 * New A-Level Bulk Marks Entry Component (Version 2)
 *
 * This component allows teachers to enter marks for multiple A-Level students at once
 * with improved validation and error handling.
 */
const NewALevelBulkMarksEntryV2 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  // State for data
  const [marks, setMarks] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [className, setClassName] = useState('');
  const [subjectDetails, setSubjectDetails] = useState(null);
  const [examDetails, setExamDetails] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  // We no longer need the showAllStudents state
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    setSelectedClass(formData.classId);
    setSelectedSubject(formData.subjectId);
    setSelectedExam(formData.examId);
    setMarks([]);
    setError('');
    setSuccess('');

    try {
      await fetchStudents(formData.classId, formData.subjectId, formData.examId);
    } catch (error) {
      console.error('Error in form submission:', error);
      setError(`Failed to load students: ${error.message}`);
      setLoading(false);
    }
  };

  // Fetch students for the selected class, subject, and exam
  const fetchStudents = async (classId, subjectId, examId) => {
    if (!classId || !subjectId || !examId) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      console.log('Fetching students for class:', classId);
      console.log('Selected subject:', subjectId);
      console.log('Selected exam:', examId);

      // Get exam details
      const examResponse = await api.get(`/api/exams/${examId}`);
      setExamDetails(examResponse.data);

      // Use the new Prisma service to get students filtered by subject
      const studentsResponse = await aLevelStudentService.getStudentsFilteredBySubject(
        classId,
        subjectId,
        true // Always fetch all students, we'll filter them in the UI
      );

      if (!studentsResponse.success) {
        console.error('Error fetching students:', studentsResponse.message);
        setError(`Failed to load students: ${studentsResponse.message}`);
        setLoading(false);
        return;
      }

      // Set class and subject details from the response
      setClassName(studentsResponse.data.class && studentsResponse.data.class.name ? studentsResponse.data.class.name : 'Unknown Class');
      setSubjectDetails(studentsResponse.data.subject ? studentsResponse.data.subject : { name: 'Unknown Subject' });

      console.log('Prisma filtered students response:', studentsResponse);

      // Defensive check for students array (handle both shapes)
      let studentsArray = [];
      if (Array.isArray(studentsResponse.data?.students)) {
        studentsArray = studentsResponse.data.students;
      } else if (Array.isArray(studentsResponse.data)) {
        studentsArray = studentsResponse.data;
      } else {
        console.error('API did not return students array:', studentsResponse);
        setError('Failed to load students. Please try again.');
        setLoading(false);
        return;
      }

      console.log(`Found ${studentsArray.length} students in class ${classId}`);
      console.log(`${studentsResponse.data?.eligibleCount || 0} students take subject ${subjectId}`);

      // Check if students array exists and is not empty
      if (!studentsArray || !Array.isArray(studentsArray) || studentsArray.length === 0) {
        setError('No students found in this class. Please select a different class.');
        setLoading(false);
        return;
      }

      // Format students for marks entry
      const marksData = await aLevelStudentService.formatStudentsForMarksEntry(
        studentsArray,
        subjectId,
        examId,
        classId,
        examResponse.data
      );

      // Check if we got any marks data back
      if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
        setError('Failed to process student data. Please try again.');
        setLoading(false);
        return;
      }

      // Sort marks data by student name (with safety checks)
      marksData.sort((a, b) => {
        const nameA = a?.studentName || '';
        const nameB = b?.studentName || '';
        return nameA.localeCompare(nameB);
      });

      console.log('Number of students:', marksData.length);

      // Filter students who take this subject (with safety checks)
      const eligibleStudents = marksData.filter(m => m && m.isInCombination === true);
      const ineligibleStudents = marksData.filter(m => m && m.isInCombination !== true);

      console.log('Eligible students:', eligibleStudents.length);
      console.log('Ineligible students:', ineligibleStudents.length);

      // Log some debug info
      if (eligibleStudents.length === 0) {
        console.log('No eligible students found. First few students:', marksData.slice(0, 3));
        console.log('Subject ID being checked:', subjectId);

        // Log the first student's data structure to understand what we're working with
        if (marksData.length > 0) {
          console.log('First student data structure:', JSON.stringify(marksData[0], null, 2));
          // If we have the original student data, log that too
          if (studentsArray.length > 0) {
            console.log('Original first student data:', JSON.stringify(studentsArray[0], null, 2));
          }
        }
      }

      // Store all students in state
      setAllStudents(marksData);

      // By default, only show eligible students
      // If no eligible students are found, show a message but don't show all students
      setMarks(eligibleStudents);

      // If there are no eligible students, show a clear message
      if (eligibleStudents.length === 0) {
        setError('No students in this class take this subject. Please select a different subject or class.');
      }

      // Show a message if no students are found
      if (marksData.length === 0) {
        setError('No students found in this class. Please select a different class.');
      } else if (eligibleStudents.length === 0) {
        // If no students are eligible, show a clear message
        setError('No students in this class take this subject. Please select a different subject or class.');
      } else {
        // Set success message
        setSuccess(
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              Showing {eligibleStudents.length} students who take this subject.
            </span>
          </Box>
        );
      }

      console.log('studentsArray:', studentsArray);
      console.log('subjectId being checked:', subjectId);
      studentsArray.forEach(student => {
        console.log('Student:', student._id, 'Subjects:', student.subjects || student.subjectCombinations || student.combination);
      });
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (selectedClass && selectedSubject && selectedExam) {
      fetchStudents(selectedClass, selectedSubject, selectedExam);
    }
  };

  // Effect to update marks when allStudents changes
  useEffect(() => {
    if (allStudents.length > 0) {
      // Filter eligible students
      const eligibleStudents = allStudents.filter(m => m.isInCombination);

      // Only show eligible students
      setMarks(eligibleStudents);

      // Update success message
      if (eligibleStudents.length === 0) {
        // If no students are eligible, show a clear message
        setError('No students in this class take this subject. Please select a different subject or class.');
      } else {
        setSuccess(
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              Showing {eligibleStudents.length} students who take this subject.
            </span>
          </Box>
        );
      }
    }
  }, [allStudents]);

  // We no longer need the toggle functionality

  // Handle marks change for a student
  const handleMarksChange = (studentId, value) => {
    const updatedMarks = marks.map(mark => {
      if (mark.studentId === studentId) {
        const { grade, points } = calculateGradeAndPoints(value);

        return {
          ...mark,
          marksObtained: value,
          grade,
          points
        };
      }
      return mark;
    });

    setMarks(updatedMarks);
  };

  // Handle comment change for a student
  const handleCommentChange = (studentId, value) => {
    const updatedMarks = marks.map(mark => {
      if (mark.studentId === studentId) {
        return {
          ...mark,
          comment: value
        };
      }
      return mark;
    });

    setMarks(updatedMarks);
  };

  // Handle principal subject change for a student
  const handlePrincipalChange = (studentId, checked) => {
    const updatedMarks = marks.map(mark => {
      if (mark.studentId === studentId) {
        return {
          ...mark,
          isPrincipal: checked
        };
      }
      return mark;
    });

    setMarks(updatedMarks);
  };

  // Handle save marks button click
  const handleSaveMarks = () => {
    // Validate marks
    if (marks.length === 0) {
      setError('No students found for this class and subject');
      return;
    }

    // Filter out marks that haven't been entered
    const marksToSave = marks.filter(mark => mark.marksObtained !== '');

    if (marksToSave.length === 0) {
      setError('Please enter marks for at least one student');
      return;
    }

    // Set preview data
    setPreviewData({
      marks: marksToSave,
      className,
      subjectName: subjectDetails ? subjectDetails.name : 'Unknown Subject',
      examName: examDetails ? examDetails.name : 'Unknown Exam'
    });

    // Open preview dialog
    setPreviewOpen(true);
  };

  // Handle preview dialog close
  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  // Handle final submission after preview
  const handleFinalSubmit = async () => {
    if (!previewData) return;

    setSaving(true);
    try {
      // Patch marks to ensure correct types for backend and strip out MongoDB Extended JSON and extra fields
      const patchedMarks = previewData.marks.map(mark => {
        // Helper to extract string from { $oid: ... } or just return the string
        const extractId = (id) => {
          if (!id) return '';
          if (typeof id === 'string') return id;
          if (typeof id === 'object' && id.$oid) return id.$oid;
          return '';
        };
        return {
          studentId: extractId(mark.studentId),
          examId: extractId(mark.examId),
          academicYearId: extractId(mark.academicYearId),
          examTypeId: extractId(mark.examTypeId),
          subjectId: extractId(selectedSubject),
          classId: extractId(mark.classId),
          marksObtained: mark.marksObtained === '' ? '' : Number(mark.marksObtained),
          comment: mark.comment || '',
          isPrincipal: !!mark.isPrincipal,
          isInCombination: mark.isInCombination !== undefined ? !!mark.isInCombination : true
        };
      });

      // Log the data being sent
      console.log('Sending marks data (patched):', patchedMarks);

      // Log the subjectIds being sent
      console.log('Payload subjectIds:', patchedMarks.map(m => m.subjectId));

      // Submit to the new A-Level API endpoint
      const response = await newALevelResultService.batchCreateResults(patchedMarks);
      console.log('Response from batch create:', response);

      const savedCount = response?.savedCount || previewData.marks.length;

      // Show success message
      setSnackbar({
        open: true,
        message: `Saved ${savedCount} marks successfully`,
        severity: 'success'
      });

      // Close the preview dialog
      setPreviewOpen(false);

      // Set success message with view grades button
      setSuccess(
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{`Saved ${savedCount} marks successfully`}</span>
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setActiveTab(1)}
              sx={{ mr: 1 }}
            >
              View Grades
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate(`/results/a-level/class-report/${selectedClass}/${selectedExam}`)}
            >
              View Class Report
            </Button>
          </Box>
        </Box>
      );

      // Refresh marks
      handleRefresh();
    } catch (err) {
      console.error('Error saving marks:', err);
      console.error('Error details:', err.response?.data);

      // Show error message
      setSnackbar({
        open: true,
        message: `Failed to save marks: ${err.response?.data?.message || err.message || 'Unknown error'}`,
        severity: 'error'
      });

      // Set error message
      setError(`Failed to save marks: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Handle view history button click
  const handleViewHistory = (studentId) => {
    // Navigate to marks history page
    navigate(`/results/history/${studentId}/${selectedSubject}/${selectedExam}`);
  };

  // Handle student selection
  const handleSelectStudents = (studentIds) => {
    setSelectedStudents(studentIds);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Form for selecting class, subject, and exam */}
      <ALevelMarksEntryForm
        onFormSubmit={handleFormSubmit}
        loading={loading}
        error={error}
        success={success}
        isAdmin={isAdmin}
        onRefresh={handleRefresh}
      />

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Marks entry and grades view */}
      {!loading && marks.length > 0 && (
        <Box>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab label="Enter Marks" />
            <Tab label="View Grades" />
          </Tabs>

          {activeTab === 0 && (
            <ALevelMarksTable
              marks={marks}
              onMarksChange={handleMarksChange}
              onCommentChange={handleCommentChange}
              onPrincipalChange={handlePrincipalChange}
              onSaveMarks={handleSaveMarks}
              onViewHistory={handleViewHistory}
              onSelectStudents={handleSelectStudents}
              selectedStudents={selectedStudents}
              saving={saving}
              showDebug={isAdmin}
            />
          )}

          {activeTab === 1 && (
            <ALevelGradesView
              marks={marks}
              onRefresh={handleRefresh}
              loading={loading}
            />
          )}
        </Box>
      )}

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onClose={handlePreviewClose}
        onSubmit={handleFinalSubmit}
        data={previewData}
        loading={saving}
        type="bulk"
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          action={
            snackbar.severity === 'success' && (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  handleSnackbarClose();
                  handleRefresh();
                }}
              >
                REFRESH
              </Button>
            )
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewALevelBulkMarksEntryV2;
