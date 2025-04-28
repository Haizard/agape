import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import newALevelResultService from '../../services/newALevelResultService';
import PreviewDialog from '../common/PreviewDialog';
import {
  filterALevelStudentsBySubject,
  createALevelCombinationsMap,
  extractALevelCombinations,
  formatALevelStudentName
} from '../../utils/legacyALevelUtils';

/**
 * New A-Level Bulk Marks Entry Component
 *
 * This component allows teachers to enter marks for multiple A-Level students at once
 * with improved validation and error handling.
 */
const NewALevelBulkMarksEntry = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  // State for form fields
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState([]);

  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showCombinationsDialog, setShowCombinationsDialog] = useState(false);
  const [studentCombinations, setStudentCombinations] = useState([]);
  const [studentSubjectsMap, setStudentSubjectsMap] = useState({});
  const [filteredStudents, setFilteredStudents] = useState([]);

  // State for class and subject details
  const [className, setClassName] = useState('');
  const [subjectDetails, setSubjectDetails] = useState(null);
  const [examDetails, setExamDetails] = useState(null);

  // Load classes when component mounts
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);

        // Fetch A-Level classes
        const response = await api.get('/api/classes?educationLevel=A_LEVEL');
        setClasses(response.data);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Load subjects when class is selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass) return;

      try {
        setLoading(true);

        // First, get the class details to see what subjects are in this class
        const fetchClassResponse = await api.get(`/api/classes/${selectedClass}`);
        console.log('Class details:', fetchClassResponse.data);

        if (fetchClassResponse.data && fetchClassResponse.data.subjects) {
          console.log('Class subjects:', fetchClassResponse.data.subjects);
        }

        // Get class name
        setClassName(fetchClassResponse.data.name);

        // Fetch subjects for the selected class
        let response;

        if (isAdmin) {
          // Admin can see all subjects
          console.log('Admin user - showing all subjects');
          // Fetch subjects using the prisma endpoint
          response = await api.get(`/api/prisma/subjects/class/${selectedClass}`);
          console.log('Prisma subjects response:', response.data);

          if (response.data.success) {
            setSubjects(response.data.data.subjects || []);
          } else {
            // Fallback to the old endpoint
            response = await api.get('/api/subjects');
            console.log('All subjects:', response.data);

            // Filter to only show A-Level subjects
            response.data = response.data.filter(subject =>
              subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
            );
            console.log('Filtered A-Level subjects:', response.data);
            setSubjects(response.data);
          }
        } else {
          // Teachers can only see assigned subjects
          try {
            // Get teacher ID
            const teacherResponse = await api.get('/api/teachers/profile/me');
            const teacherId = teacherResponse.data._id;

            // Fetch teacher's assigned subjects for the class
            const assignmentsResponse = await api.get('/api/teacher-subject-assignments', {
              params: { teacherId, classId: selectedClass }
            });

            // assignmentsResponse.data is an array of assignments
            // Each assignment has a subjectId object
            const subjects = assignmentsResponse.data.map(a => a.subjectId);
            setSubjects(subjects);
          } catch (error) {
            console.error('Error fetching teacher subject assignments:', error);
            setSubjects([]);
          }
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedClass, isAdmin]);

  // Load exams when component mounts
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);

        // Fetch active exams
        const response = await api.get('/api/exams?status=active');
        setExams(response.data);
      } catch (err) {
        console.error('Error fetching exams:', err);
        setError('Failed to load exams. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Load students when subject and exam are selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass || !selectedSubject || !selectedExam) return;

      try {
        setLoading(true);
        setError(''); // Clear any previous errors

        console.log('Fetching students for class:', selectedClass);
        console.log('Selected subject:', selectedSubject);
        console.log('Selected exam:', selectedExam);

        // Import the A-Level student service for better filtering
        const aLevelStudentService = await import('../../services/aLevelStudentService');

        // Use the improved Prisma-based filtering
        console.log('Using Prisma-based student filtering');
        const filteredStudentsResponse = await aLevelStudentService.getStudentsFilteredBySubject(
          selectedClass,
          selectedSubject,
          false // Only include eligible students (who take this subject)
        );

        console.log('filteredStudentsResponse:', filteredStudentsResponse);

        // Defensive check and logging for students array
        const filteredStudentData = filteredStudentsResponse?.data?.students;
        if (!Array.isArray(filteredStudentData)) {
          console.error('API did not return students array:', filteredStudentsResponse);
          setFilteredStudents([]);
          setError('Failed to load students. Please try again.');
          setLoading(false);
          return;
        }
        console.log(`Prisma filtering returned ${filteredStudentData.length} eligible students`);

        // If no students were found, show a warning
        if (filteredStudentData.length === 0) {
          setError(`No students found who take ${filteredStudentsResponse.data?.subject?.name || 'this subject'}. Please check the subject and class selection.`);
        }

        // Store the filtered students for later use
        setFilteredStudents(filteredStudentData);

        // Create a simple array of enhanced students from the filtered data
        const enhancedStudents = filteredStudentData.map(student => ({
          _id: student.id || student.studentId,
          id: student.id || student.studentId,
          firstName: student.firstName || '',
          lastName: student.lastName || '',
          name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
          isPrincipal: student.isPrincipal || false,
          isEligible: student.isEligible || true,
          eligibilityMessage: student.eligibilityMessage || null
        }));

        console.log(`Processed ${enhancedStudents.length} students for marks entry`);

        // Log a sample student for debugging
        if (enhancedStudents.length > 0) {
          console.log('Sample student:', enhancedStudents[0]);
        }

        // Get subject details
        const subjectResponse = await api.get(`/api/subjects/${selectedSubject}`);
        setSubjectDetails(subjectResponse.data);

        // Get exam details
        const examResponse = await api.get(`/api/exams/${selectedExam}`);
        console.log('Exam details:', examResponse.data);

        // Check if the exam has the selected class in its classes array
        let classInExam = false;
        if (examResponse.data && examResponse.data.classes) {
          // More flexible check for class ID in exam's classes array
          classInExam = examResponse.data.classes.some(c => {
            // Direct string comparison
            if (c.class === selectedClass) return true;

            // Object comparison
            if (typeof c.class === 'object' && c.class !== null) {
              if (c.class._id === selectedClass) return true;
              if (c.class.id === selectedClass) return true;
              if (String(c.class._id) === String(selectedClass)) return true;
            }

            // String representation comparison
            if (String(c.class) === String(selectedClass)) return true;

            return false;
          });

          console.log(`Class ${selectedClass} in exam: ${classInExam}`);

          if (!classInExam) {
            console.warn(`Warning: Selected class ${selectedClass} is not in the exam's classes array`);
            // Log the exam's classes for debugging
            console.log('Exam classes:', examResponse.data.classes);

            // TEMPORARY WORKAROUND: Continue anyway but show a warning
            setError(`Warning: This exam (${examResponse.data.name}) may not be properly configured for this class, but we'll try to proceed anyway.`);

            // Uncomment the lines below to enforce strict validation
            // setError(`This exam (${examResponse.data.name}) is not configured for this class. Please select a different exam or class.`);
            // setLoading(false);
            // return; // Stop processing further
          }
        }

        // Check if the selected subject is in the exam's subjects array for the class
        let subjectInExam = false;
        if (classInExam && examResponse.data.classes) {
          // Find the class in the exam's classes array
          const examClass = examResponse.data.classes.find(c => {
            if (c.class === selectedClass) return true;
            if (typeof c.class === 'object' && c.class !== null) {
              if (c.class._id === selectedClass) return true;
              if (c.class.id === selectedClass) return true;
              if (String(c.class._id) === String(selectedClass)) return true;
            }
            if (String(c.class) === String(selectedClass)) return true;
            return false;
          });

          if (examClass && examClass.subjects) {
            // Check if the selected subject is in the class's subjects array
            subjectInExam = examClass.subjects.some(s => {
              if (s === selectedSubject) return true;
              if (typeof s === 'object' && s !== null) {
                if (s._id === selectedSubject) return true;
                if (s.id === selectedSubject) return true;
                if (String(s._id) === String(selectedSubject)) return true;
              }
              if (String(s) === String(selectedSubject)) return true;
              return false;
            });

            console.log(`Subject ${selectedSubject} in exam class subjects: ${subjectInExam}`);

            if (!subjectInExam) {
              console.warn(`Warning: Selected subject ${selectedSubject} is not in the exam's subjects array for class ${selectedClass}`);
              // Log the exam class subjects for debugging
              console.log('Exam class subjects:', examClass.subjects);

              // TEMPORARY WORKAROUND: Continue anyway but show a warning
              setError(`Warning: This subject may not be properly configured for this exam and class, but we'll try to proceed anyway.`);
            }
          }
        }

        setExamDetails(examResponse.data);

        // Use the legacy approach to filter students by subject combinations
        const marksData = [];

        // First, try to collect subject combinations for all students
        // This is a critical step to ensure we have the correct subject combinations
        const tempStudentSubjectsMap = {};

        console.log('Attempting to fetch subject combinations for each student...');
        for (const student of enhancedStudents) {
          try {
            // Get student subjects
            console.log(`Fetching subjects for student ${student._id}`);
            const studentSubjectsResponse = await api.get(`/api/students/${student._id}/subjects`);
            const studentSubjects = studentSubjectsResponse.data;

            if (studentSubjects && Array.isArray(studentSubjects) && studentSubjects.length > 0) {
              console.log(`Found ${studentSubjects.length} subjects for student ${student._id}`);

              // Add subject combination to student object
              student.subjects = studentSubjects.map(subject => ({
                subjectId: subject._id || subject.subjectId,
                isPrincipal: !!subject.isPrincipal,
                name: subject.name
              }));

              // Also add to the map for later use
              tempStudentSubjectsMap[student._id] = studentSubjects;
            } else {
              console.log(`No subjects found for student ${student._id}`);
            }
          } catch (err) {
            console.error(`Error fetching subjects for student ${student._id}:`, err);
          }
        }

        // Update the state variable with the map
        setStudentSubjectsMap(tempStudentSubjectsMap);

        // Check if any students have subject combinations
        const anyStudentHasSubjectCombination = enhancedStudents.some(student =>
          student.subjectCombination || student.combination || (student.subjects && student.subjects.length > 0)
        );

        console.log(`Any student has subject combination: ${anyStudentHasSubjectCombination}`);

        // Create a map of student IDs to their subject combinations
        let combinationsMap = {};
        let tempFilteredStudents = [];

        if (anyStudentHasSubjectCombination) {
          try {
            // Extract combinations from the student data
            const combinations = extractALevelCombinations(enhancedStudents);
            combinationsMap = createALevelCombinationsMap(combinations);

            // Log the combinations map for debugging
            console.log('Combinations map keys:', Object.keys(combinationsMap));
            if (Object.keys(combinationsMap).length > 0) {
              const firstStudentId = Object.keys(combinationsMap)[0];
              console.log(`First student combination (${firstStudentId}):`, combinationsMap[firstStudentId]);
            }

            // Get the subject details to determine if it's principal
            console.log(`Filtering students for subject ${selectedSubject} (${subjectDetails?.name || 'Unknown'})`);

            // Filter students who have this subject in their combination
            // First try without specifying principal/subsidiary (get all students with this subject)
            const allStudentsWithSubject = filterALevelStudentsBySubject(enhancedStudents, selectedSubject, null, combinationsMap);
            console.log(`Found ${allStudentsWithSubject.length} students who take ${subjectDetails?.name || selectedSubject} (any type)`);

            // Then try as principal subject for determining principal status
            const principalStudents = filterALevelStudentsBySubject(enhancedStudents, selectedSubject, true, combinationsMap);
            console.log(`Found ${principalStudents.length} students who take ${subjectDetails?.name || selectedSubject} as principal subject`);

            // Then try as subsidiary subject for determining subsidiary status
            const subsidiaryStudents = filterALevelStudentsBySubject(enhancedStudents, selectedSubject, false, combinationsMap);
            console.log(`Found ${subsidiaryStudents.length} students who take ${subjectDetails?.name || selectedSubject} as subsidiary subject`);

            // Create a map of principal students for quick lookup
            const principalStudentMap = {};
            for (const student of principalStudents) {
              principalStudentMap[student._id] = true;
            }

            // Process all students with the subject, marking them as principal or subsidiary
            const combinedStudents = allStudentsWithSubject.map(student => ({
              ...student,
              isPrincipal: !!principalStudentMap[student._id]
            }));

            console.log(`Combined ${combinedStudents.length} students who take ${subjectDetails?.name || selectedSubject}`);

            // If we found students who take this subject, use them
            if (combinedStudents.length > 0) {
              tempFilteredStudents = combinedStudents;
              console.log('Using filtered students who take this subject');
            } else {
              // Try a more aggressive approach - check if any students have subjects at all
              console.log('No students found with exact subject match, trying more aggressive matching...');

              // Try to match by subject name if available
              if (subjectDetails && subjectDetails.name) {
                const subjectName = subjectDetails.name.toLowerCase();
                const matchedByName = enhancedStudents.filter(student => {
                  // Check if student has subjects with matching name
                  if (student.subjects && Array.isArray(student.subjects)) {
                    return student.subjects.some(s =>
                      s.name && s.name.toLowerCase().includes(subjectName) ||
                      subjectName.includes(s.name.toLowerCase())
                    );
                  }
                  return false;
                });

                if (matchedByName.length > 0) {
                  console.log(`Found ${matchedByName.length} students by subject name matching`);
                  tempFilteredStudents = matchedByName;
                } else {
                  // If no students take this subject, show all students
                  console.log('No students found who take this subject, showing all students');
                  tempFilteredStudents = enhancedStudents;
                }
              } else {
                // If no subject details or no students take this subject, show all students
                console.log('No students found who take this subject, showing all students');
                tempFilteredStudents = enhancedStudents;
              }
            }
          } catch (error) {
            console.error('Error filtering students by subject combination:', error);
            // Fallback to showing all students
            tempFilteredStudents = enhancedStudents;
          }
        } else {
          // If no students have subject combinations, show all students
          console.log('No students have subject combinations, showing all students');
          tempFilteredStudents = enhancedStudents;
        }

        // Update the state variable with the filtered students
        setFilteredStudents(tempFilteredStudents);

        // Manual filtering as a fallback
        if (tempFilteredStudents.length === enhancedStudents.length && studentSubjectsMap && Object.keys(studentSubjectsMap).length > 0) {
          console.log('Attempting manual filtering using fetched subject data...');

          const manuallyFilteredStudents = enhancedStudents.filter(student => {
            const studentSubjects = studentSubjectsMap[student._id];
            if (!studentSubjects) return false;

            // Try exact ID match first
            const exactMatch = studentSubjects.some(subject =>
              subject._id === selectedSubject ||
              subject.subjectId === selectedSubject ||
              subject._id?.toString() === selectedSubject.toString() ||
              subject.subjectId?.toString() === selectedSubject.toString()
            );

            if (exactMatch) return true;

            // Try name match if available
            if (subjectDetails && subjectDetails.name) {
              const subjectName = subjectDetails.name.toLowerCase();
              return studentSubjects.some(subject =>
                subject.name &&
                (subject.name.toLowerCase().includes(subjectName) ||
                 subjectName.includes(subject.name.toLowerCase()))
              );
            }

            return false;
          });

          if (manuallyFilteredStudents.length > 0) {
            console.log(`Manual filtering found ${manuallyFilteredStudents.length} students who take this subject`);
            tempFilteredStudents = manuallyFilteredStudents;
            setFilteredStudents(manuallyFilteredStudents);
          }
        }

        // If we still don't have any students, try one more approach with the API
        if (tempFilteredStudents.length === enhancedStudents.length) {
          console.log('Attempting to fetch students directly from the API for this subject...');
          try {
            // Try to fetch students directly for this subject
            const subjectStudentsResponse = await api.get(`/api/subjects/${selectedSubject}/students?classId=${selectedClass}`);
            if (subjectStudentsResponse.data && Array.isArray(subjectStudentsResponse.data) && subjectStudentsResponse.data.length > 0) {
              console.log(`API returned ${subjectStudentsResponse.data.length} students for subject ${selectedSubject}`);

              // Create a map of student IDs from the API response
              const subjectStudentIds = new Set(subjectStudentsResponse.data.map(s => s._id));

              // Filter our students to only include those returned by the API
              const apiFilteredStudents = enhancedStudents.filter(student => subjectStudentIds.has(student._id));

              if (apiFilteredStudents.length > 0) {
                console.log(`Found ${apiFilteredStudents.length} matching students from API in our enhanced students list`);
                tempFilteredStudents = apiFilteredStudents;
                setFilteredStudents(apiFilteredStudents);
              }
            }
          } catch (err) {
            console.error('Error fetching students for subject from API:', err);
          }
        }

        // Update success message
        if (tempFilteredStudents.length === 0) {
          setSuccess(`No students in this class take this subject.`);
        } else if (tempFilteredStudents.length === 1) {
          setSuccess(`Showing 1 student who takes this subject.`);
        } else {
          setSuccess(`Showing ${tempFilteredStudents.length} students who take this subject.`);
        }

        // Process each student
        for (const student of tempFilteredStudents) {
          try {
            // Log student details for debugging
            console.log(`Processing student ${student._id} (${formatALevelStudentName(student)})`);

            // Determine if this student takes this subject (isInCombination)
            let isInCombination = false;

            // Method 1: Check in combinationsMap
            if (combinationsMap[student._id] && combinationsMap[student._id].subjects) {
              isInCombination = combinationsMap[student._id].subjects.some(s =>
                s.subjectId === selectedSubject ||
                s.subjectId.toString() === selectedSubject.toString()
              );
              console.log(`Method 1 (combinationsMap): Student ${student._id} isInCombination=${isInCombination}`);
            }

            // Method 2: Check in student.subjects (from API)
            if (!isInCombination && student.subjects && Array.isArray(student.subjects)) {
              isInCombination = student.subjects.some(s =>
                s.subjectId === selectedSubject ||
                s.subjectId.toString() === selectedSubject.toString()
              );
              console.log(`Method 2 (student.subjects): Student ${student._id} isInCombination=${isInCombination}`);
            }

            // Method 3: Check in studentSubjectsMap
            if (!isInCombination && studentSubjectsMap[student._id]) {
              isInCombination = studentSubjectsMap[student._id].some(s =>
                s._id === selectedSubject ||
                s.subjectId === selectedSubject ||
                s._id?.toString() === selectedSubject.toString() ||
                s.subjectId?.toString() === selectedSubject.toString()
              );
              console.log(`Method 3 (studentSubjectsMap): Student ${student._id} isInCombination=${isInCombination}`);
            }

            // Method 4: Check if student was in filtered list from legacy function
            if (!isInCombination && filteredStudents.length < enhancedStudents.length) {
              // If we're showing a filtered list, assume all students in the list take the subject
              isInCombination = true;
              console.log(`Method 4 (filtered list): Student ${student._id} isInCombination=${isInCombination}`);
            }

            // Determine if this is a principal subject for this student
            let isPrincipal = false;

            // First check if it's already set on the student object
            if (student.isPrincipal !== undefined) {
              isPrincipal = student.isPrincipal;
            }
            // Then check in combinationsMap
            else if (combinationsMap[student._id] && combinationsMap[student._id].subjects) {
              const subjectEntry = combinationsMap[student._id].subjects.find(s =>
                s.subjectId === selectedSubject ||
                s.subjectId.toString() === selectedSubject.toString()
              );
              if (subjectEntry) {
                isPrincipal = !!subjectEntry.isPrincipal;
              }
            }
            // Then check in student.subjects
            else if (student.subjects && Array.isArray(student.subjects)) {
              const subjectEntry = student.subjects.find(s =>
                s.subjectId === selectedSubject ||
                s.subjectId.toString() === selectedSubject.toString()
              );
              if (subjectEntry) {
                isPrincipal = !!subjectEntry.isPrincipal;
              }
            }
            // Finally check in studentSubjectsMap
            else if (studentSubjectsMap[student._id]) {
              const subjectEntry = studentSubjectsMap[student._id].find(s =>
                s._id === selectedSubject ||
                s.subjectId === selectedSubject ||
                s._id?.toString() === selectedSubject.toString() ||
                s.subjectId?.toString() === selectedSubject.toString()
              );
              if (subjectEntry) {
                isPrincipal = !!subjectEntry.isPrincipal;
              }
            }

            console.log(`Student ${student._id} isPrincipal=${isPrincipal}`);

            // Check if marks already exist for this student
            let existingResult = null;
            try {
              // Check if this is an A-Level student before fetching results
              if (student.level === 'A' || student.educationLevel === 'A' || student.educationLevel === 'A_LEVEL') {
                const resultsResponse = await api.get(`/api/new-a-level/results/student/${student._id}/exam/${selectedExam}`);
                if (resultsResponse.data && resultsResponse.data.results) {
                  existingResult = resultsResponse.data.results.find(
                    result => result.subjectId &&
                    (result.subjectId === selectedSubject ||
                     (result.subjectId._id && result.subjectId._id === selectedSubject) ||
                     (result.subjectId.toString() === selectedSubject.toString()))
                  );
                }
              }
            } catch (err) {
              console.log(`No existing result for student ${student._id}:`, err.message);
              // No existing result
            }

            // Check student eligibility for this subject
            let eligibilityWarning = null;
            try {
              // Call the eligibility validation endpoint
              const eligibilityResponse = await api.get('/api/prisma/marks/validate-eligibility', {
                params: {
                  studentId: student._id,
                  subjectId: selectedSubject
                }
              });

              console.log(`Eligibility check for student ${student._id}:`, eligibilityResponse.data);

              // If student is not eligible, add a warning
              if (eligibilityResponse.data.success && !eligibilityResponse.data.isEligible) {
                eligibilityWarning = eligibilityResponse.data.message || 'Student may not be eligible for this subject';
              }
            } catch (error) {
              console.error(`Error checking eligibility for student ${student._id}:`, error);
            }

            // Add student to marks data
            const markData = {
              studentId: student._id,
              studentName: formatALevelStudentName(student),
              examId: selectedExam,
              subjectId: selectedSubject,
              classId: selectedClass,
              marksObtained: existingResult ? existingResult.marksObtained : '',
              grade: existingResult ? existingResult.grade : '',
              points: existingResult ? existingResult.points : '',
              comment: existingResult ? existingResult.comment : '',
              isPrincipal: existingResult ? existingResult.isPrincipal : (isPrincipal || false),
              isInCombination: isInCombination,
              eligibilityWarning: eligibilityWarning,
              _id: existingResult ? existingResult._id : null
            };

            // Add academicYearId and examTypeId if available
            if (examDetails?.academicYear) {
              markData.academicYearId = examDetails.academicYear;
            } else if (examDetails?.academicYearId) {
              markData.academicYearId = examDetails.academicYearId;
            }

            if (examDetails?.examType) {
              markData.examTypeId = examDetails.examType;
            } else if (examDetails?.examTypeId) {
              markData.examTypeId = examDetails.examTypeId;
            }

            marksData.push(markData);
          } catch (err) {
            console.error(`Error processing student ${student._id}:`, err);
          }
        }

        // Log the marks data before sorting
        console.log('Marks data before sorting:', marksData);
        console.log('Number of students:', marksData.length);

        // Sort marks data by student name
        marksData.sort((a, b) => a.studentName.localeCompare(b.studentName));

        console.log('Number of students after sorting:', marksData.length);
        setMarks(marksData);

        // Show a message if no students are found
        if (marksData.length === 0) {
          setError(`No students found in this class. Please select a different class.`);
        } else {
          // Clear any previous error message and set an informational message
          setError('');

          // Success message is already set above
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, selectedSubject, selectedExam, isAdmin]);

  // Handle form field changes
  const handleClassChange = (e) => {
    const classId = e.target.value;
    console.log('Class changed to:', classId);
    setSelectedClass(classId);
    setSelectedSubject('');
    setMarks([]);
    setError('');
    setSuccess('');
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    console.log('Subject changed to:', subjectId);
    setSelectedSubject(subjectId);
    setMarks([]);
    setError('');
    setSuccess('');
  };

  const handleExamChange = (e) => {
    const examId = e.target.value;
    console.log('Exam changed to:', examId);
    setSelectedExam(examId);
    setMarks([]);
    setError('');
    setSuccess('');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle showing subject combinations
  const handleShowCombinations = () => {
    // Prepare the student combinations data
    const combinationsData = marks.map(mark => {
      // Get the student's subjects
      let studentSubjects = [];

      // Try to get subjects from studentSubjectsMap
      if (mark.studentId && studentSubjectsMap && studentSubjectsMap[mark.studentId]) {
        studentSubjects = studentSubjectsMap[mark.studentId].map(subject => ({
          name: subject.name || 'Unknown Subject',
          isPrincipal: !!subject.isPrincipal,
          isCurrentSubject: subject._id === selectedSubject || subject.subjectId === selectedSubject
        }));
      }
      // Try to get subjects from student.subjects
      else if (mark.studentId) {
        const student = filteredStudents.find(s => s._id === mark.studentId);
        if (student && student.subjects && Array.isArray(student.subjects)) {
          studentSubjects = student.subjects.map(subject => ({
            name: subject.name || 'Unknown Subject',
            isPrincipal: !!subject.isPrincipal,
            isCurrentSubject: subject.subjectId === selectedSubject
          }));
        }
      }

      return {
        studentId: mark.studentId,
        studentName: mark.studentName,
        isInCombination: mark.isInCombination,
        subjects: studentSubjects
      };
    });

    setStudentCombinations(combinationsData);
    setShowCombinationsDialog(true);
  };

  // Handle marks change for a student
  const handleMarksChange = (studentId, value) => {
    // Validate marks (0-100)
    if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
      const updatedMarks = marks.map(mark => {
        if (mark.studentId === studentId) {
          const numValue = value === '' ? '' : Number(value);
          const grade = value === '' ? '' : newALevelResultService.calculateGrade(numValue);
          const points = value === '' ? '' : newALevelResultService.calculatePoints(grade);

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
    }
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

  // Handle refresh button click
  const handleRefresh = () => {
    // Reload students and marks
    if (selectedClass && selectedSubject && selectedExam) {
      // Reset marks
      setMarks([]);
      setError('');
      setSuccess('');

      // Trigger useEffect to reload students by setting a temporary value and then back
      const currentExam = selectedExam;
      setSelectedExam('');

      // Use setTimeout to ensure state updates properly
      setTimeout(() => {
        setSelectedExam(currentExam);
      }, 100);
    }
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
      // Log the data being sent
      console.log('Sending marks data:', previewData.marks);

      // Submit to the new A-Level API endpoint
      const response = await newALevelResultService.batchCreateResults(previewData.marks);
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
          <Typography>{`Saved ${savedCount} marks successfully`}</Typography>
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

      // Log more detailed error information
      if (err.response?.data?.errors) {
        console.error('Validation errors:', err.response.data.errors);
      }

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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        A-Level Bulk Marks Entry
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Class selection */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                label="Class"
                onChange={handleClassChange}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Select a class</em>
                </MenuItem>
                {Array.isArray(classes) && classes.map(cls => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Subject selection */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth disabled={!selectedClass || loading}>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                label="Subject"
                onChange={handleSubjectChange}
              >
                <MenuItem value="">
                  <em>Select a subject</em>
                </MenuItem>
                {Array.isArray(subjects) && subjects.map(subject => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Exam selection */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Exam</InputLabel>
              <Select
                value={selectedExam}
                label="Exam"
                onChange={handleExamChange}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Select an exam</em>
                </MenuItem>
                {Array.isArray(exams) && exams.map(exam => (
                  <MenuItem key={exam._id} value={exam._id}>
                    {exam.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Error and success messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Marks entry table */}
      {!loading && selectedClass && selectedSubject && selectedExam && marks.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Enter Marks" />
            <Tab label="View Grades" />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {activeTab === 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Enter Marks for {marks.length} Students
                    </Typography>
                    <Tooltip title="Students with green background have this subject in their combination">
                      <IconButton color="info" size="small" sx={{ ml: 1 }}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Warning icon indicates student may not be eligible for this subject">
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        <WarningIcon color="warning" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          = Eligibility Warning
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                  <Box>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveMarks}
                      disabled={saving}
                      sx={{ mr: 1 }}
                    >
                      {saving ? 'Saving...' : 'Save Marks'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={handleRefresh}
                      disabled={loading}
                      sx={{ mr: 1 }}
                    >
                      Refresh
                    </Button>

                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        console.log('Debug Info:');
                        console.log('Class:', selectedClass);
                        console.log('Subject:', selectedSubject);
                        console.log('Exam:', selectedExam);
                        console.log('Subject Details:', subjectDetails);
                        console.log('Exam Details:', examDetails);
                        console.log('Students with subjects:', marks.filter(m => m.isInCombination).length);
                        alert(`Debug info logged to console. Class: ${selectedClass}, Subject: ${selectedSubject}, Exam: ${selectedExam}`);
                      }}
                    >
                      Debug
                    </Button>
                  </Box>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="5%">#</TableCell>
                        <TableCell width="20%">Student Name</TableCell>
                        <TableCell width="20%">Subject Combination</TableCell>
                        <TableCell width="15%">Marks (0-100)</TableCell>
                        <TableCell width="15%">Comment</TableCell>
                        <TableCell width="10%">Principal Subject</TableCell>
                        <TableCell width="5%">Status</TableCell>
                        <TableCell width="5%">History</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {marks.map((mark, index) => (
                        <TableRow
                          key={mark.studentId}
                          sx={{
                            backgroundColor: mark.isInCombination ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                          }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {mark.studentName}
                              {mark.eligibilityWarning && (
                                <Tooltip title={mark.eligibilityWarning}>
                                  <WarningIcon color="warning" fontSize="small" sx={{ ml: 1 }} />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={mark.marksObtained}
                              onChange={(e) => handleMarksChange(mark.studentId, e.target.value)}
                              inputProps={{ min: 0, max: 100, step: 0.1 }}
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={mark.comment || ''}
                              onChange={(e) => handleCommentChange(mark.studentId, e.target.value)}
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={mark.isPrincipal || false}
                              onChange={(e) => handlePrincipalChange(mark.studentId, e.target.checked)}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {mark.isInCombination ? (
                              <Chip
                                label="Yes"
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Tooltip title="This subject is not in the student's combination">
                                <Chip
                                  label="No"
                                  color="error"
                                  size="small"
                                  variant="outlined"
                                />
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {mark._id ? (
                              <Tooltip title="Marks already saved">
                                <CheckIcon color="success" />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Marks not saved yet">
                                <WarningIcon color="warning" />
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleViewHistory(mark.studentId)}
                              disabled={!mark._id}
                            >
                              <HistoryIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {activeTab === 1 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Grades Summary
                    </Typography>
                    <Tooltip title="Students with green background have this subject in their combination">
                      <IconButton color="info" size="small" sx={{ ml: 1 }}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Warning icon indicates student may not be eligible for this subject">
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        <WarningIcon color="warning" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          = Eligibility Warning
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={handleRefresh}
                      disabled={loading}
                      sx={{ mr: 1 }}
                    >
                      Refresh
                    </Button>

                  </Box>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="5%">#</TableCell>
                        <TableCell width="25%">Student Name</TableCell>
                        <TableCell width="10%">Marks</TableCell>
                        <TableCell width="10%">Grade</TableCell>
                        <TableCell width="10%">Points</TableCell>
                        <TableCell width="10%">Principal</TableCell>
                        <TableCell width="10%">In Combination</TableCell>
                        <TableCell width="10%">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {marks.map((mark, index) => (
                        <TableRow
                          key={mark.studentId}
                          sx={{
                            backgroundColor: mark.isInCombination ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                          }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {mark.studentName}
                              {mark.eligibilityWarning && (
                                <Tooltip title={mark.eligibilityWarning}>
                                  <WarningIcon color="warning" fontSize="small" sx={{ ml: 1 }} />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{mark.marksObtained !== '' ? mark.marksObtained : '-'}</TableCell>
                          <TableCell>{mark.grade || '-'}</TableCell>
                          <TableCell>{mark.points || '-'}</TableCell>
                          <TableCell>
                            {mark.isPrincipal ? (
                              <Chip
                                label="Principal"
                                color="primary"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                label="Subsidiary"
                                color="default"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {mark.isInCombination ? (
                              <Chip
                                label="Yes"
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                label="No"
                                color="error"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {mark._id ? (
                              <Chip
                                icon={<CheckIcon />}
                                label="Saved"
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                icon={<WarningIcon />}
                                label="Not Saved"
                                color="warning"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Grade distribution */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Grade Distribution
                  </Typography>
                  <Grid container spacing={2}>
                    {['A', 'B', 'C', 'D', 'E', 'S', 'F'].map(grade => {
                      const count = marks.filter(mark => mark.grade === grade).length;
                      const percentage = marks.length > 0 ? (count / marks.length) * 100 : 0;

                      return (
                        <Grid item xs={6} sm={3} md={1.7} key={grade}>
                          <Paper
                            sx={{
                              p: 1,
                              textAlign: 'center',
                              bgcolor: grade === 'A' ? '#4caf50' :
                                      grade === 'B' ? '#8bc34a' :
                                      grade === 'C' ? '#cddc39' :
                                      grade === 'D' ? '#ffeb3b' :
                                      grade === 'E' ? '#ffc107' :
                                      grade === 'S' ? '#ff9800' :
                                      '#f44336',
                              color: ['A', 'B', 'C'].includes(grade) ? 'white' : 'black'
                            }}
                          >
                            <Typography variant="h6">{grade}</Typography>
                            <Typography variant="body2">{count} ({percentage.toFixed(1)}%)</Typography>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </>
            )}
          </Box>
        </Paper>
      )}

      {/* Save button at bottom */}
      {!loading && selectedClass && selectedSubject && selectedExam && marks.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveMarks}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Save All Marks'}
          </Button>
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

export default NewALevelBulkMarksEntry;
