import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Sync as SyncIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon
} from '@mui/icons-material';

// Import sub-components
import MarksSelectors from './offline-marks/MarksSelectors';
import MarksTable from './offline-marks/MarksTable';
import SyncStatus from './offline-marks/SyncStatus';

// Import offline data service
import offlineDataService from '../../services/offlineDataService';

/**
 * OfflineMarksEntry Component
 *
 * Allows teachers to enter marks offline and sync when online
 */
const OfflineMarksEntry = () => {
  // State for selectors
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  // State for students and marks
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // State for network status
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null);

  // State for messages
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Initialize offline data service and network listeners
  useEffect(() => {
    // Initialize IndexedDB
    offlineDataService.initDB()
      .then(() => {
        console.log('IndexedDB initialized successfully');
      })
      .catch(err => {
        console.error('Error initializing IndexedDB:', err);
        setError('Failed to initialize offline storage. Some features may not work properly.');
      });

    // Set up network listeners
    offlineDataService.setupNetworkListeners(
      // Online callback
      () => {
        setIsOnline(true);
        fetchSyncStatus();
      },
      // Offline callback
      () => {
        setIsOnline(false);
      }
    );

    // Check initial online status
    setIsOnline(offlineDataService.isOnline());

    // Fetch initial sync status
    fetchSyncStatus();

    // Fetch initial data
    fetchInitialData();

    // Cleanup
    return () => {
      // Remove network listeners if needed
    };
  }, []);

  // Fetch sync status
  const fetchSyncStatus = async () => {
    try {
      const status = await offlineDataService.getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error('Error fetching sync status:', err);
    }
  };

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      // For development with mock data
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        // Mock academic years
        const mockAcademicYears = [
          { _id: '1', name: '2025-2026', isActive: true },
          { _id: '2', name: '2024-2025', isActive: false }
        ];
        setAcademicYears(mockAcademicYears);

        // Set active academic year as default
        const activeYear = mockAcademicYears.find(year => year.isActive);
        if (activeYear) {
          setSelectedAcademicYear(activeYear._id);

          // Mock terms
          const mockTerms = [
            { _id: '1', name: 'Term 1' },
            { _id: '2', name: 'Term 2' },
            { _id: '3', name: 'Term 3' }
          ];
          setTerms(mockTerms);

          // Set first term as default
          if (mockTerms.length > 0) {
            setSelectedTerm(mockTerms[0]._id);
          }
        }

        // Mock classes
        const mockClasses = [
          { _id: '1', name: 'Form 1A', educationLevel: 'O_LEVEL' },
          { _id: '2', name: 'Form 2B', educationLevel: 'O_LEVEL' },
          { _id: '3', name: 'Form 5 PCM', educationLevel: 'A_LEVEL' },
          { _id: '4', name: 'Form 6 PCB', educationLevel: 'A_LEVEL' }
        ];
        setClasses(mockClasses);

        return;
      }

      // In production, fetch from API
      if (isOnline) {
        // Fetch academic years
        const academicYearsResponse = await fetch('/api/new-academic-years');
        if (!academicYearsResponse.ok) {
          throw new Error('Failed to fetch academic years');
        }
        const academicYearsData = await academicYearsResponse.json();
        setAcademicYears(academicYearsData);

        // Set active academic year as default
        const activeYear = academicYearsData.find(year => year.isActive);
        if (activeYear) {
          setSelectedAcademicYear(activeYear._id);

          // Fetch terms for this academic year
          const termsResponse = await fetch(`/api/new-academic-years/${activeYear._id}`);
          if (!termsResponse.ok) {
            throw new Error('Failed to fetch terms');
          }
          const termsData = await termsResponse.json();
          setTerms(termsData.terms || []);

          // Set first term as default
          if (termsData.terms && termsData.terms.length > 0) {
            setSelectedTerm(termsData.terms[0]._id);
          }
        }

        // Fetch classes
        const classesResponse = await fetch('/api/classes');
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes');
        }
        const classesData = await classesResponse.json();
        setClasses(classesData);
      } else {
        // When offline, try to get data from IndexedDB
        // This would require storing this data for offline use
        setError('You are offline. Some data may not be available.');
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data. Please try again.');
    }
  };

  // Fetch terms when academic year changes
  useEffect(() => {
    if (!selectedAcademicYear) return;

    const fetchTerms = async () => {
      try {
        // For development with mock data
        if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
          const mockTerms = [
            { _id: '1', name: 'Term 1' },
            { _id: '2', name: 'Term 2' },
            { _id: '3', name: 'Term 3' }
          ];
          setTerms(mockTerms);

          // Set first term as default
          if (mockTerms.length > 0) {
            setSelectedTerm(mockTerms[0]._id);
          }

          return;
        }

        // In production, fetch from API
        if (isOnline) {
          const response = await fetch(`/api/new-academic-years/${selectedAcademicYear}`);
          if (!response.ok) {
            throw new Error('Failed to fetch terms');
          }
          const data = await response.json();
          setTerms(data.terms || []);

          // Set first term as default
          if (data.terms && data.terms.length > 0) {
            setSelectedTerm(data.terms[0]._id);
          }
        } else {
          // When offline, try to get data from IndexedDB
          // This would require storing this data for offline use
        }
      } catch (err) {
        console.error('Error fetching terms:', err);
        setError('Failed to load terms. Please try again.');
      }
    };

    fetchTerms();
  }, [selectedAcademicYear, isOnline]);

  // Fetch subjects when class changes
  useEffect(() => {
    if (!selectedClass) return;

    const fetchSubjects = async () => {
      try {
        // For development with mock data
        if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
          const mockSubjects = [
            { _id: '1', name: 'Mathematics' },
            { _id: '2', name: 'English' },
            { _id: '3', name: 'Physics' },
            { _id: '4', name: 'Chemistry' },
            { _id: '5', name: 'Biology' }
          ];
          setSubjects(mockSubjects);
          return;
        }

        // In production, fetch from API
        if (isOnline) {
          const response = await fetch(`/api/classes/${selectedClass}/subjects`);
          if (!response.ok) {
            throw new Error('Failed to fetch subjects');
          }
          const data = await response.json();
          setSubjects(data);

          // Save subjects data for offline use
          try {
            await offlineDataService.saveSubjectsOffline(data);
            console.log('Subjects data saved for offline use');
          } catch (saveErr) {
            console.error('Error saving subjects data for offline use:', saveErr);
            // Non-critical error, don't show to user
          }
        } else {
          // When offline, get subjects from IndexedDB
          try {
            const offlineSubjects = await offlineDataService.getSubjectsOffline();
            if (offlineSubjects && offlineSubjects.length > 0) {
              // Filter subjects for the selected class if needed
              setSubjects(offlineSubjects);
            } else {
              setError('No subjects available offline. Please connect to the internet to download subject data.');
            }
          } catch (offlineErr) {
            console.error('Error fetching subjects from offline storage:', offlineErr);
            setError('Failed to load subjects from offline storage.');
          }
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again.');
      }
    };

    fetchSubjects();
    // Reset selected subject when class changes
    setSelectedSubject('');
  }, [selectedClass, isOnline]);

  // Fetch students and marks when all selectors are set
  useEffect(() => {
    if (!selectedAcademicYear || !selectedTerm || !selectedClass || !selectedSubject) return;

    const fetchStudentsAndMarks = async () => {
      setLoading(true);
      setError(null);

      try {
        // For development with mock data
        if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
          const mockStudents = [
            { _id: '1', name: 'John Doe', registrationNumber: 'S001' },
            { _id: '2', name: 'Jane Smith', registrationNumber: 'S002' },
            { _id: '3', name: 'Michael Johnson', registrationNumber: 'S003' },
            { _id: '4', name: 'Emily Brown', registrationNumber: 'S004' },
            { _id: '5', name: 'David Wilson', registrationNumber: 'S005' }
          ];

          const mockMarks = [
            { studentId: '1', mark: 85, grade: 'A' },
            { studentId: '2', mark: 72, grade: 'B' },
            { studentId: '3', mark: 65, grade: 'C' },
            { studentId: '4', mark: 90, grade: 'A' },
            { studentId: '5', mark: 78, grade: 'B' }
          ];

          setStudents(mockStudents);
          setMarks(mockMarks);
          setLoading(false);
          return;
        }

        // Try to get data from offline storage first
        const offlineMarks = await offlineDataService.getMarksOffline({
          academicYearId: selectedAcademicYear,
          termId: selectedTerm,
          classId: selectedClass,
          subjectId: selectedSubject
        });

        // If online, fetch from API
        if (isOnline) {
          // Fetch students
          const studentsResponse = await fetch(`/api/classes/${selectedClass}/students`);
          if (!studentsResponse.ok) {
            throw new Error('Failed to fetch students');
          }
          const studentsData = await studentsResponse.json();
          setStudents(studentsData);

          // Save students data for offline use
          try {
            await offlineDataService.saveStudentsOffline(studentsData);
            console.log('Students data saved for offline use');
          } catch (saveErr) {
            console.error('Error saving students data for offline use:', saveErr);
            // Non-critical error, don't show to user
          }

          // Fetch marks
          const marksResponse = await fetch(
            `/api/marks?academicYear=${selectedAcademicYear}&term=${selectedTerm}&class=${selectedClass}&subject=${selectedSubject}`
          );

          if (!marksResponse.ok) {
            throw new Error('Failed to fetch marks');
          }

          const marksData = await marksResponse.json();

          // Merge with offline marks
          const mergedMarks = mergeMarks(marksData, offlineMarks);
          setMarks(mergedMarks);
        } else {
          // When offline, use only offline data
          setMarks(offlineMarks);

          // Get students from offline storage
          try {
            const offlineStudents = await offlineDataService.getStudentsOffline(selectedClass);
            if (offlineStudents && offlineStudents.length > 0) {
              setStudents(offlineStudents);
            } else {
              // If no students found in offline storage, show a helpful message
              setError('No student data available offline for this class. Please connect to the internet to download student data.');

              // Use empty array instead of mock data in production
              setStudents([]);
            }
          } catch (offlineErr) {
            console.error('Error fetching students from offline storage:', offlineErr);
            setError('Failed to load students from offline storage.');
            setStudents([]);
          }
        }
      } catch (err) {
        console.error('Error fetching students and marks:', err);
        setError('Failed to load students and marks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndMarks();
  }, [selectedAcademicYear, selectedTerm, selectedClass, selectedSubject, isOnline]);

  // Merge online and offline marks
  const mergeMarks = (onlineMarks, offlineMarks) => {
    // Create a map of student IDs to marks
    const marksMap = new Map();

    // Add online marks to the map
    onlineMarks.forEach(mark => {
      marksMap.set(mark.studentId, mark);
    });

    // Override with offline marks if they exist and are not synced
    offlineMarks.forEach(mark => {
      if (!mark.synced) {
        marksMap.set(mark.studentId, mark);
      }
    });

    // Convert map back to array
    return Array.from(marksMap.values());
  };

  // Handle mark change
  const handleMarkChange = (studentId, value) => {
    setMarks(prevMarks => {
      // Find if there's an existing mark for this student
      const existingMarkIndex = prevMarks.findIndex(mark => mark.studentId === studentId);

      if (existingMarkIndex >= 0) {
        // Update existing mark
        const updatedMarks = [...prevMarks];
        updatedMarks[existingMarkIndex] = {
          ...updatedMarks[existingMarkIndex],
          mark: value,
          // Calculate grade based on mark
          grade: calculateGrade(value)
        };
        return updatedMarks;
      } else {
        // Add new mark
        return [
          ...prevMarks,
          {
            studentId,
            mark: value,
            grade: calculateGrade(value)
          }
        ];
      }
    });
  };

  // Calculate grade based on mark
  const calculateGrade = (mark) => {
    if (mark >= 90) return 'A+';
    if (mark >= 80) return 'A';
    if (mark >= 70) return 'B';
    if (mark >= 60) return 'C';
    if (mark >= 50) return 'D';
    return 'F';
  };

  // Save marks
  const saveMarks = async () => {
    if (!selectedAcademicYear || !selectedTerm || !selectedClass || !selectedSubject) {
      setError('Please select all required fields');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Save each mark
      for (const mark of marks) {
        // Skip marks without a value
        if (mark.mark === undefined || mark.mark === null) continue;

        // Prepare mark data
        const markData = {
          ...mark,
          academicYearId: selectedAcademicYear,
          termId: selectedTerm,
          classId: selectedClass,
          subjectId: selectedSubject
        };

        // Save to offline storage
        await offlineDataService.saveMarksOffline(markData);
      }

      // Update sync status
      await fetchSyncStatus();

      setSuccess('Marks saved successfully. They will be synced when you are online.');

      // If online, try to sync immediately
      if (isOnline) {
        syncMarks();
      }
    } catch (err) {
      console.error('Error saving marks:', err);
      setError(`Failed to save marks: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Sync marks with server
  const syncMarks = async () => {
    if (!isOnline) {
      setError('Cannot sync while offline. Please connect to the internet and try again.');
      return;
    }

    setSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await offlineDataService.syncWithServer();

      if (result.success) {
        setSuccess(`Sync completed: ${result.synced} items synced, ${result.failed} failed.`);
      } else {
        setError(`Sync failed: ${result.message}`);
      }

      // Update sync status
      await fetchSyncStatus();
    } catch (err) {
      console.error('Error syncing marks:', err);
      setError(`Failed to sync marks: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Marks Entry
          {!isOnline && (
            <CloudOffIcon color="warning" sx={{ ml: 1 }} />
          )}
        </Typography>

        <Box>
          {syncStatus && (
            <SyncStatus
              syncStatus={syncStatus}
              isOnline={isOnline}
            />
          )}
        </Box>
      </Box>

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

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Class and Subject
        </Typography>

        <MarksSelectors
          academicYears={academicYears}
          selectedAcademicYear={selectedAcademicYear}
          setSelectedAcademicYear={setSelectedAcademicYear}
          terms={terms}
          selectedTerm={selectedTerm}
          setSelectedTerm={setSelectedTerm}
          classes={classes}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          subjects={subjects}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
        />
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        selectedAcademicYear && selectedTerm && selectedClass && selectedSubject && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Student Marks
              </Typography>

              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={saveMarks}
                  disabled={saving || syncing}
                  sx={{ mr: 1 }}
                >
                  {saving ? 'Saving...' : 'Save Marks'}
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<SyncIcon />}
                  onClick={syncMarks}
                  disabled={!isOnline || syncing || saving}
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <MarksTable
              students={students}
              marks={marks}
              handleMarkChange={handleMarkChange}
            />
          </Paper>
        )
      )}
    </Box>
  );
};

export default OfflineMarksEntry;
