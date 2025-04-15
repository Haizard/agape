import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Chip,
  TextField,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

import './ClassTabularReport.css';

/**
 * ClassTabularReport Component
 * Displays a comprehensive academic report for an entire class in a tabular format
 * with all students from different subject combinations in a single view
 */
const ClassTabularReport = () => {
  const { classId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examData, setExamData] = useState(null);
  const [filterCombination, setFilterCombination] = useState('');
  const [updatingEducationLevel, setUpdatingEducationLevel] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [filterForm, setFilterForm] = useState('');
  const [combinations, setCombinations] = useState([]);
  // Add academicYear and term state variables with default values
  const [academicYear, setAcademicYear] = useState('current');
  const [term, setTerm] = useState('current');

  // Extract query parameters from URL
  useEffect(() => {
    try {
      const queryParams = new URLSearchParams(window.location.search);
      const yearParam = queryParams.get('academicYear');
      const termParam = queryParams.get('term');

      if (yearParam) {
        setAcademicYear(yearParam);
      }

      if (termParam) {
        setTerm(termParam);
      }
    } catch (err) {
      console.error('Error parsing URL parameters:', err);
      // Use default values if there's an error
      setAcademicYear('current');
      setTerm('current');
    }
  }, []);

  // Generate demo data for testing
  const generateDemoData = useCallback(() => {
    // Define subject combinations
    const subjectCombinations = [
      { code: 'PCM', name: 'Physics, Chemistry, Mathematics' },
      { code: 'PGM', name: 'Physics, Geography, Mathematics' },
      { code: 'HKL', name: 'History, Kiswahili, Literature' },
      { code: 'CBG', name: 'Chemistry, Biology, Geography' }
    ];

    // Define all possible subjects
    const allPossibleSubjects = [
      { code: 'PHY', name: 'Physics', isPrincipal: true },
      { code: 'CHE', name: 'Chemistry', isPrincipal: true },
      { code: 'MAT', name: 'Mathematics', isPrincipal: true },
      { code: 'BIO', name: 'Biology', isPrincipal: true },
      { code: 'GEO', name: 'Geography', isPrincipal: true },
      { code: 'HIS', name: 'History', isPrincipal: true },
      { code: 'KIS', name: 'Kiswahili', isPrincipal: true },
      { code: 'LIT', name: 'Literature', isPrincipal: true },
      { code: 'GS', name: 'General Studies', isPrincipal: false },
      { code: 'BAM', name: 'Basic Applied Mathematics', isPrincipal: false },
      { code: 'ENG', name: 'English Language', isPrincipal: false }
    ];

    // Generate demo students
    const demoStudents = [];

    // Helper function to get random marks
    const getRandomMarks = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Helper function to get grade from marks
    const getGrade = (marks) => {
      if (marks >= 80) return 'A';
      if (marks >= 70) return 'B';
      if (marks >= 60) return 'C';
      if (marks >= 50) return 'D';
      if (marks >= 40) return 'E';
      return 'F';
    };

    // Helper function to get points from grade
    const getPoints = (grade) => {
      switch (grade) {
        case 'A': return 1;
        case 'B': return 2;
        case 'C': return 3;
        case 'D': return 4;
        case 'E': return 5;
        case 'F': return 6;
        default: return null;
      }
    };

    // Generate 24 students with different combinations (12 Form 5, 12 Form 6)
    for (let i = 1; i <= 24; i++) {
      // Determine if this is a Form 5 or Form 6 student
      const isForm5 = i <= 12;
      const form = isForm5 ? 5 : 6;

      // Assign a combination
      const combinationIndex = (i - 1) % subjectCombinations.length;
      const combination = subjectCombinations[combinationIndex];

      // Determine which subjects this student takes based on combination
      let studentSubjects = [];

      // Add principal subjects based on combination
      if (combination.code === 'PCM') {
        studentSubjects.push(
          { ...allPossibleSubjects.find(s => s.code === 'PHY'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'CHE'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'MAT'), isPrincipal: true }
        );
      } else if (combination.code === 'PGM') {
        studentSubjects.push(
          { ...allPossibleSubjects.find(s => s.code === 'PHY'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'GEO'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'MAT'), isPrincipal: true }
        );
      } else if (combination.code === 'HKL') {
        studentSubjects.push(
          { ...allPossibleSubjects.find(s => s.code === 'HIS'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'KIS'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'LIT'), isPrincipal: true }
        );
      } else if (combination.code === 'CBG') {
        studentSubjects.push(
          { ...allPossibleSubjects.find(s => s.code === 'CHE'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'BIO'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'GEO'), isPrincipal: true }
        );
      }

      // Add compulsory subjects for all students
      studentSubjects.push(
        { ...allPossibleSubjects.find(s => s.code === 'GS'), isPrincipal: false },
        { ...allPossibleSubjects.find(s => s.code === 'BAM'), isPrincipal: false },
        { ...allPossibleSubjects.find(s => s.code === 'ENG'), isPrincipal: false }
      );

      // Generate marks, grades, and points for each subject
      // Form 6 students generally perform better than Form 5
      const minMarks = isForm5 ? 40 : 50;
      const maxMarks = isForm5 ? 90 : 95;

      studentSubjects = studentSubjects.map(subject => {
        const marks = getRandomMarks(minMarks, maxMarks);
        const grade = getGrade(marks);
        const points = getPoints(grade);
        return { ...subject, marks, grade, points };
      });

      // Calculate total marks and points
      const totalMarks = studentSubjects.reduce((sum, s) => sum + s.marks, 0);
      const totalPoints = studentSubjects.reduce((sum, s) => sum + s.points, 0);
      const averageMarks = (totalMarks / studentSubjects.length).toFixed(2);

      // Calculate best three principal points
      const principalSubjects = studentSubjects.filter(s => s.isPrincipal);
      const bestThreePrincipal = [...principalSubjects].sort((a, b) => a.points - b.points).slice(0, 3);
      const bestThreePoints = bestThreePrincipal.reduce((sum, s) => sum + s.points, 0);

      // Determine division
      let division = 'N/A';
      if (bestThreePoints >= 3 && bestThreePoints <= 9) division = 'I';
      else if (bestThreePoints >= 10 && bestThreePoints <= 12) division = 'II';
      else if (bestThreePoints >= 13 && bestThreePoints <= 17) division = 'III';
      else if (bestThreePoints >= 18 && bestThreePoints <= 19) division = 'IV';
      else if (bestThreePoints >= 20 && bestThreePoints <= 21) division = 'V';

      // Create student object
      const student = {
        id: `student-${i}`,
        name: `Student ${i}`,
        admissionNumber: `F${form}-${i.toString().padStart(3, '0')}`,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        combination: combination.code,
        combinationName: combination.name,
        subjects: studentSubjects,
        form: form,
        summary: {
          totalMarks,
          averageMarks,
          totalPoints,
          bestThreePoints,
          division,
          rank: i // Will be recalculated later
        }
      };

      demoStudents.push(student);
    }

    // Calculate ranks based on best three points (separately for Form 5 and Form 6)
    const form5Students = demoStudents.filter(s => s.form === 5);
    const form6Students = demoStudents.filter(s => s.form === 6);

    // Sort and assign ranks for Form 5
    form5Students.sort((a, b) => a.summary.bestThreePoints - b.summary.bestThreePoints);
    for (let i = 0; i < form5Students.length; i++) {
      form5Students[i].summary.rank = i + 1;
    }

    // Sort and assign ranks for Form 6
    form6Students.sort((a, b) => a.summary.bestThreePoints - b.summary.bestThreePoints);
    for (let i = 0; i < form6Students.length; i++) {
      form6Students[i].summary.rank = i + 1;
    }

    // Get all unique subjects across all students
    const uniqueSubjects = [];
    for (const student of demoStudents) {
      for (const subject of student.subjects) {
        if (!uniqueSubjects.some(s => s.code === subject.code)) {
          uniqueSubjects.push({
            code: subject.code,
            name: subject.name,
            isPrincipal: subject.isPrincipal
          });
        }
      }
    }

    // Sort subjects: principal subjects first, then subsidiary subjects
    uniqueSubjects.sort((a, b) => {
      // First sort by principal/subsidiary
      if (a.isPrincipal && !b.isPrincipal) return -1;
      if (!a.isPrincipal && b.isPrincipal) return 1;
      // Then sort alphabetically by code
      return a.code.localeCompare(b.code);
    });

    // Create class data
    const classData = {
      id: 'demo-class',
      name: 'A-Level Science',
      educationLevel: 'A_LEVEL',
      academicYear: '2023-2024',
      term: 'Term 2',
      students: demoStudents,
      subjects: uniqueSubjects,
      combinations: subjectCombinations
    };

    // Create exam data
    const examData = {
      id: 'demo-exam',
      name: 'Mid-Term Examination',
      startDate: '2023-10-15',
      endDate: '2023-10-25',
      term: 'Term 2',
      academicYear: '2023-2024'
    };

    return { classData, examData };
  }, []);

  // Fetch class and exam data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Log current state for debugging
      console.log('Current state before fetching data:');
      console.log('academicYear:', academicYear);
      console.log('term:', term);
      console.log('classId:', classId);
      console.log('examId:', examId);

      // Validate classId and examId
      if (!classId || classId === 'undefined' || classId === 'null') {
        setError('Invalid class ID. Please select a valid class.');
        setLoading(false);
        return;
      }

      if (!examId || examId === 'undefined' || examId === 'null') {
        setError('Invalid exam ID. Please select a valid exam.');
        setLoading(false);
        return;
      }

      // Check if this is a demo request
      if (classId === 'demo-class' && examId === 'demo-exam') {
        console.log('Generating demo data');
        const { classData, examData } = generateDemoData();
        setClassData(classData);
        setExamData(examData);
        setStudents(classData.students);
        setSubjects(classData.subjects);
        setCombinations(classData.combinations);
        setLoading(false);
        return;
      }

      // Construct the API URL with academicYear and term if available
      let classUrl = `${process.env.REACT_APP_API_URL || ''}/api/classes/${classId}`;

      // Add academicYear and term as query parameters if they are valid
      const queryParams = [];
      if (academicYear && academicYear !== 'current') {
        queryParams.push(`academicYear=${academicYear}`);
      }
      if (term && term !== 'current') {
        queryParams.push(`term=${term}`);
      }

      // Add query parameters to URL if any exist
      if (queryParams.length > 0) {
        classUrl += `?${queryParams.join('&')}`;
      }

      console.log('Fetching class data from:', classUrl);

      const classResponse = await axios.get(classUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const classData = classResponse.data;
      setClassData(classData);

      // Determine if this is Form 5 or Form 6 class
      const isForm5 = classData.name?.includes('5') || classData.form === 5 || classData.form === '5';
      const isForm6 = classData.name?.includes('6') || classData.form === 6 || classData.form === '6';

      // Set education level
      const educationLevel = classData.educationLevel || 'A_LEVEL';
      console.log(`Class education level: ${educationLevel}`);

      // If this is not an A-Level class, we'll adapt the data structure later

      // Construct the API URL with academicYear and term if available
      let examUrl = `${process.env.REACT_APP_API_URL || ''}/api/exams/${examId}`;

      // Add academicYear and term as query parameters if they are valid
      const examQueryParams = [];
      if (academicYear && academicYear !== 'current') {
        examQueryParams.push(`academicYear=${academicYear}`);
      }
      if (term && term !== 'current') {
        examQueryParams.push(`term=${term}`);
      }

      // Add query parameters to URL if any exist
      if (examQueryParams.length > 0) {
        examUrl += `?${examQueryParams.join('&')}`;
      }

      console.log('Fetching exam data from:', examUrl);

      const examResponse = await axios.get(examUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setExamData(examResponse.data);

      // Construct the API URL with academicYear and term if available
      let studentsUrl = `${process.env.REACT_APP_API_URL || ''}/api/students?class=${classId}`;

      // Add academicYear and term as query parameters if they are valid
      const studentsQueryParams = [];
      if (academicYear && academicYear !== 'current') {
        studentsQueryParams.push(`academicYear=${academicYear}`);
      }
      if (term && term !== 'current') {
        studentsQueryParams.push(`term=${term}`);
      }

      // Add query parameters to URL if any exist
      if (studentsQueryParams.length > 0) {
        studentsUrl += `&${studentsQueryParams.join('&')}`;
      }

      console.log('Fetching students from:', studentsUrl);

      const studentsResponse = await axios.get(studentsUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Fetch results for each student
      const studentsWithResults = await Promise.all(
        studentsResponse.data.map(async (student) => {
          try {
            // Try multiple API endpoints to ensure compatibility
            let resultsUrl = `${process.env.REACT_APP_API_URL || ''}/api/results/comprehensive/student/${student._id}/${examId}`;
            resultsUrl += `?academicYear=${academicYear}&term=${term}`;
            let resultsResponse;

            try {
              // Try the primary endpoint first
              resultsResponse = await axios.get(resultsUrl, {
                headers: {
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
            } catch (primaryError) {
              console.error(`Error with primary endpoint for student ${student._id}:`, primaryError);

              try {
                // Try the A-Level fallback endpoint
                resultsUrl = `${process.env.REACT_APP_API_URL || ''}/api/a-level-comprehensive/student/${student._id}/${examId}`;
                resultsUrl += `?academicYear=${academicYear}&term=${term}`;
                console.log(`Trying A-Level fallback endpoint for student ${student._id}:`, resultsUrl);

                resultsResponse = await axios.get(resultsUrl, {
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                });
              } catch (aLevelError) {
                console.error(`Error with A-Level fallback endpoint for student ${student._id}:`, aLevelError);

                // Try the O-Level fallback endpoint
                resultsUrl = `${process.env.REACT_APP_API_URL || ''}/api/o-level-results/student/${student._id}/${examId}`;
                resultsUrl += `?academicYear=${academicYear}&term=${term}`;
                console.log(`Trying O-Level fallback endpoint for student ${student._id}:`, resultsUrl);

                // This will throw if it fails, which is what we want
                resultsResponse = await axios.get(resultsUrl, {
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                });
              }
            }

            const resultData = resultsResponse.data;

            // Log the raw result data for debugging
            console.log('Raw result data for student:', student._id);
            console.log('Result data keys:', Object.keys(resultData));

            // Log subject-related data
            if (resultData.subjectResults) {
              console.log('subjectResults:', resultData.subjectResults);
            }
            if (resultData.subjects) {
              console.log('subjects:', resultData.subjects);
            }
            if (resultData.results) {
              console.log('results:', resultData.results);
            }

            // Check if this is an O-Level report and adapt the data structure
            // First check the class education level from classData
            const classEducationLevel = classData.educationLevel || 'A_LEVEL';

            // Then check the result data education level
            const resultEducationLevel = resultData.educationLevel || classEducationLevel;

            // Determine if this is O-Level or A-Level
            const isOLevel = resultEducationLevel === 'O_LEVEL' ||
                           (classEducationLevel === 'O_LEVEL' &&
                            resultData.subjectResults &&
                            !resultData.principalSubjects);

            console.log(`Processing ${isOLevel ? 'O-Level' : 'A-Level'} data for student ${student._id}`);
            console.log('Result data structure:', Object.keys(resultData));

            let allSubjects = [];

            if (isOLevel) {
              console.log('Processing O-Level report data for class report');
              // Convert O-Level data structure to our format
              allSubjects = (resultData.subjectResults || []).map(subject => ({
                subject: subject.subject?.name || subject.subjectName,
                code: subject.subject?.code || subject.subjectCode || '',
                marks: subject.marks,
                grade: subject.grade,
                points: subject.points,
                isPrincipal: true
              }));
            } else {
              console.log('Processing A-Level data structure for student');

              // Log the actual data structure for debugging
              if (resultData.principalSubjects) {
                console.log('Principal subjects:', resultData.principalSubjects);
              }
              if (resultData.subsidiarySubjects) {
                console.log('Subsidiary subjects:', resultData.subsidiarySubjects);
              }
              if (resultData.allSubjects) {
                console.log('All subjects:', resultData.allSubjects);
              }

              // Handle different A-Level data structures
              if (resultData.allSubjects && Array.isArray(resultData.allSubjects) && resultData.allSubjects.length > 0) {
                // Use the allSubjects array if available (this is the most reliable source)
                console.log('Using allSubjects array for processing');
                allSubjects = resultData.allSubjects.map(s => ({
                  ...s,
                  isPrincipal: s.isPrincipal !== undefined ? s.isPrincipal : true,
                  // Ensure consistent structure
                  subject: s.subject?.name || s.subject || s.name,
                  code: s.code || s.subject?.code || (s.subject?.name ? s.subject.name.substring(0, 3).toUpperCase() : ''),
                  marks: s.marks !== undefined ? s.marks : (s.marksObtained !== undefined ? s.marksObtained : null),
                  grade: s.grade || '-',
                  points: s.points || 0
                }));
              } else if (resultData.principalSubjects || resultData.subsidiarySubjects) {
                // Standard A-Level structure with principal and subsidiary subjects
                console.log('Using principalSubjects and subsidiarySubjects arrays for processing');
                allSubjects = [
                  ...(resultData.principalSubjects || []).map(s => ({
                    ...s,
                    isPrincipal: true,
                    // Ensure consistent structure
                    subject: s.subject?.name || s.subject || s.name,
                    code: s.code || s.subject?.code || (s.subject?.name ? s.subject.name.substring(0, 3).toUpperCase() : ''),
                    marks: s.marks !== undefined ? s.marks : (s.marksObtained !== undefined ? s.marksObtained : null),
                    grade: s.grade || '-',
                    points: s.points || 0
                  })),
                  ...(resultData.subsidiarySubjects || []).map(s => ({
                    ...s,
                    isPrincipal: false,
                    // Ensure consistent structure
                    subject: s.subject?.name || s.subject || s.name,
                    code: s.code || s.subject?.code || (s.subject?.name ? s.subject.name.substring(0, 3).toUpperCase() : ''),
                    marks: s.marks !== undefined ? s.marks : (s.marksObtained !== undefined ? s.marksObtained : null),
                    grade: s.grade || '-',
                    points: s.points || 0
                  }))
                ];
              } else if (resultData.subjectResults) {
                // Alternative structure with subjectResults array
                allSubjects = (resultData.subjectResults || []).map(s => ({
                  ...s,
                  isPrincipal: s.isPrincipal || true,  // Default to principal if not specified
                  // Ensure consistent structure
                  subject: s.subject?.name || s.subject || s.name,
                  code: s.code || s.subject?.code || '',
                  marks: s.marks !== undefined ? s.marks : (s.marksObtained !== undefined ? s.marksObtained : null),
                  grade: s.grade || '-',
                  points: s.points || 0
                }));
              } else if (resultData.subjects) {
                // Another alternative with subjects array
                allSubjects = (resultData.subjects || []).map(s => ({
                  ...s,
                  isPrincipal: s.isPrincipal || true,  // Default to principal if not specified
                  // Ensure consistent structure
                  subject: s.subject?.name || s.subject || s.name,
                  code: s.code || s.subject?.code || '',
                  marks: s.marks !== undefined ? s.marks : (s.marksObtained !== undefined ? s.marksObtained : null),
                  grade: s.grade || '-',
                  points: s.points || 0
                }));
              } else if (resultData.results && Array.isArray(resultData.results)) {
                // Yet another alternative with results array
                allSubjects = (resultData.results || []).map(s => ({
                  ...s,
                  isPrincipal: s.isPrincipal || true,  // Default to principal if not specified
                  // Ensure consistent structure
                  subject: s.subject?.name || s.subject || s.name,
                  code: s.code || s.subject?.code || '',
                  marks: s.marks !== undefined ? s.marks : (s.marksObtained !== undefined ? s.marksObtained : null),
                  grade: s.grade || '-',
                  points: s.points || 0
                }));
              } else {
                // If no recognized structure, log an error and return empty array
                console.error('Unrecognized A-Level data structure:', resultData);
                allSubjects = [];
              }

              // Log the processed subjects
              console.log(`Processed ${allSubjects.length} subjects for A-Level student:`,
                allSubjects.map(s => `${s.subject} (${s.code}): ${s.marks}`))
            }

            // Check if we have a combination code but no subjects
            if (allSubjects.length === 0 && (student.combination || student.subjectCombination)) {
              // First, try to fetch actual marks data for this student
              try {
                console.log(`Attempting to fetch actual marks data for student ${student._id}`);
                const marksUrl = `${process.env.REACT_APP_API_URL || ''}/api/v2/results/student/${student._id}?examId=${examId}&academicYear=${academicYear}&term=${term}`;

                const marksResponse = await axios.get(marksUrl, {
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                });

                console.log('Marks data response:', marksResponse.data);

                if (marksResponse.data && Array.isArray(marksResponse.data) && marksResponse.data.length > 0) {
                  // Convert the marks data to our subject format
                  allSubjects = marksResponse.data.map(result => ({
                    subject: result.subject?.name || result.subjectName,
                    code: result.subject?.code || result.subjectCode || '',
                    marks: result.marksObtained,
                    grade: result.grade,
                    points: result.points,
                    isPrincipal: result.isPrincipal !== undefined ? result.isPrincipal : true
                  }));

                  console.log(`Successfully fetched ${allSubjects.length} subjects with marks for student ${student._id}`);
                }
              } catch (error) {
                console.error(`Error fetching marks data from v2 API for student ${student._id}:`, error);

                // Try the direct marks API as a fallback
                try {
                  console.log(`Attempting to fetch marks from direct API for student ${student._id}`);
                  const directMarksUrl = `${process.env.REACT_APP_API_URL || ''}/api/marks?studentId=${student._id}&examId=${examId}`;

                  const directMarksResponse = await axios.get(directMarksUrl, {
                    headers: {
                      'Accept': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  });

                  console.log('Direct marks data response:', directMarksResponse.data);

                  if (directMarksResponse.data && Array.isArray(directMarksResponse.data) && directMarksResponse.data.length > 0) {
                    // Convert the marks data to our subject format
                    allSubjects = directMarksResponse.data.map(result => ({
                      subject: result.subject?.name || result.subjectName,
                      code: result.subject?.code || result.subjectCode || '',
                      marks: result.marksObtained || result.marks,
                      grade: result.grade,
                      points: result.points,
                      isPrincipal: result.isPrincipal !== undefined ? result.isPrincipal : true
                    }));

                    console.log(`Successfully fetched ${allSubjects.length} subjects with marks from direct API for student ${student._id}`);
                  }
                } catch (directError) {
                  console.error(`Error fetching marks from direct API for student ${student._id}:`, directError);

                  // Try the education level specific APIs as a last resort
                  try {
                    // Determine if this is likely an A-Level or O-Level student
                    const isLikelyALevel = student.form === 5 || student.form === 6 ||
                                         student.form === '5' || student.form === '6' ||
                                         (student.className && (student.className.includes('5') || student.className.includes('6')));

                    const apiEndpoint = isLikelyALevel ?
                      `/api/a-level-results/student-marks/${student._id}/${examId}` :
                      `/api/o-level-results/student-marks/${student._id}/${examId}`;

                    console.log(`Attempting to fetch marks from ${isLikelyALevel ? 'A-Level' : 'O-Level'} API for student ${student._id}`);
                    const levelSpecificUrl = `${process.env.REACT_APP_API_URL || ''}${apiEndpoint}`;

                    const levelSpecificResponse = await axios.get(levelSpecificUrl, {
                      headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    });

                    console.log(`${isLikelyALevel ? 'A-Level' : 'O-Level'} marks data response:`, levelSpecificResponse.data);

                    if (levelSpecificResponse.data &&
                        (Array.isArray(levelSpecificResponse.data) ||
                         levelSpecificResponse.data.subjects ||
                         levelSpecificResponse.data.results)) {

                      // Extract the relevant data array
                      const resultsArray = Array.isArray(levelSpecificResponse.data) ?
                                          levelSpecificResponse.data :
                                          levelSpecificResponse.data.subjects ||
                                          levelSpecificResponse.data.results ||
                                          [];

                      if (Array.isArray(resultsArray) && resultsArray.length > 0) {
                        // Convert the marks data to our subject format
                        allSubjects = resultsArray.map(result => ({
                          subject: result.subject?.name || result.subjectName || result.name,
                          code: result.subject?.code || result.subjectCode || result.code || '',
                          marks: result.marksObtained || result.marks || result.mark,
                          grade: result.grade,
                          points: result.points,
                          isPrincipal: result.isPrincipal !== undefined ? result.isPrincipal : true
                        }));

                        console.log(`Successfully fetched ${allSubjects.length} subjects with marks from ${isLikelyALevel ? 'A-Level' : 'O-Level'} API for student ${student._id}`);
                      }
                    }
                  } catch (levelSpecificError) {
                    console.error(`Error fetching marks from education level specific API for student ${student._id}:`, levelSpecificError);
                  }
                }
              }
            }

            // If we still have no subjects, generate them from the combination
            if (allSubjects.length === 0 && (student.combination || student.subjectCombination)) {
              console.log(`Student has combination ${student.combination || student.subjectCombination} but no subjects. Generating subjects from combination.`);

              let combinationCode = student.combination || student.subjectCombination;

              // Check if the combination is a MongoDB ObjectID (24 hex characters)
              const isMongoId = typeof combinationCode === 'string' &&
                               /^[0-9a-fA-F]{24}$/.test(combinationCode);

              if (isMongoId) {
                console.log(`Combination appears to be a MongoDB ObjectID: ${combinationCode}`);
                // Since we can't fetch the actual combination details in real-time,
                // we'll use a default combination based on the student's form
                const isForm5 = student.form === 5 || student.form === '5' ||
                               student.className?.includes('5');
                const isForm6 = student.form === 6 || student.form === '6' ||
                               student.className?.includes('6');

                // Assign a default combination based on form and student ID
                // Use the student ID to deterministically assign different combinations
                // This ensures students get different combinations for better testing
                const studentIdStr = String(student._id || student.id || '');
                const lastChar = studentIdStr.charAt(studentIdStr.length - 1);

                // Use the last character of the student ID to determine the combination
                let defaultCombination = 'PCM'; // Default

                if (['0', '1', '2', '3'].includes(lastChar)) {
                  defaultCombination = 'PCM'; // Physics, Chemistry, Mathematics
                } else if (['4', '5', '6'].includes(lastChar)) {
                  defaultCombination = 'HKL'; // History, Kiswahili, Literature
                } else if (['7', '8'].includes(lastChar)) {
                  defaultCombination = 'EGM'; // Economics, Geography, Mathematics
                } else if (['9', 'a', 'b', 'c', 'd', 'e', 'f'].includes(lastChar.toLowerCase())) {
                  defaultCombination = 'CBG'; // Chemistry, Biology, Geography
                }

                combinationCode = defaultCombination;
                console.log(`Using default combination code: ${combinationCode} for Form ${isForm5 ? '5' : isForm6 ? '6' : 'unknown'} student (based on ID: ${studentIdStr})`);

                // Also store the combination code in the student object for later use
                student.combinationCode = combinationCode;
              }

              const combinationMap = {
                'P': { code: 'PHY', name: 'Physics', isPrincipal: true },
                'C': { code: 'CHE', name: 'Chemistry', isPrincipal: true },
                'M': { code: 'MAT', name: 'Mathematics', isPrincipal: true },
                'B': { code: 'BIO', name: 'Biology', isPrincipal: true },
                'G': { code: 'GEO', name: 'Geography', isPrincipal: true },
                'H': { code: 'HIS', name: 'History', isPrincipal: true },
                'K': { code: 'KIS', name: 'Kiswahili', isPrincipal: true },
                'L': { code: 'LIT', name: 'Literature', isPrincipal: true },
                'E': { code: 'ECO', name: 'Economics', isPrincipal: true }
              };

              // Generate subjects from combination code
              const generatedSubjects = [];

              // Add principal subjects from combination code
              if (typeof combinationCode === 'string') {
                // Define standard combinations with their subjects
                const standardCombinations = {
                  'PCM': ['P', 'C', 'M'],
                  'PCB': ['P', 'C', 'B'],
                  'HKL': ['H', 'K', 'L'],
                  'HGE': ['H', 'G', 'E'],
                  'EGM': ['E', 'G', 'M'],
                  'CBG': ['C', 'B', 'G']
                };

                // Check if this is a standard combination
                if (standardCombinations[combinationCode]) {
                  console.log(`Processing standard combination code: ${combinationCode}`);
                  // Use the predefined subjects for this combination
                  for (const char of standardCombinations[combinationCode]) {
                    if (combinationMap[char]) {
                      generatedSubjects.push({
                        ...combinationMap[char],
                        marks: null,
                        grade: '-',
                        points: 0
                      });
                    }
                  }
                } else {
                  // For non-standard codes, try to extract characters
                  console.log(`Processing non-standard combination code: ${combinationCode}`);
                  // First check if it's a longer format like 'PCM-Physics,Chemistry,Mathematics'
                  if (combinationCode.includes('-')) {
                    const [code, subjectsStr] = combinationCode.split('-');
                    const subjects = subjectsStr.split(',').map(s => s.trim());

                    for (const subjectName of subjects) {
                      // Find the corresponding code for this subject name
                      let subjectCode = '';
                      for (const [code, details] of Object.entries(combinationMap)) {
                        if (details.name.toLowerCase() === subjectName.toLowerCase()) {
                          subjectCode = details.code;
                          break;
                        }
                      }

                      generatedSubjects.push({
                        code: subjectCode || subjectName.substring(0, 3).toUpperCase(),
                        name: subjectName,
                        isPrincipal: true,
                        marks: null,
                        grade: '-',
                        points: 0
                      });
                    }
                  } else {
                    // Try to extract characters from the code
                    for (const char of combinationCode) {
                      if (combinationMap[char]) {
                        generatedSubjects.push({
                          ...combinationMap[char],
                          marks: null,
                          grade: '-',
                          points: 0
                        });
                      }
                    }
                  }
                }
              }

              // Add common subsidiary subjects
              generatedSubjects.push(
                { code: 'GS', name: 'General Studies', isPrincipal: false, marks: null, grade: '-', points: 0 },
                { code: 'BAM', name: 'Basic Applied Mathematics', isPrincipal: false, marks: null, grade: '-', points: 0 },
                { code: 'ENG', name: 'English Language', isPrincipal: false, marks: null, grade: '-', points: 0 }
              );

              // Try to fetch actual marks for each subject
              try {
                console.log(`Attempting to fetch individual subject marks for student ${student._id}`);

                // Create a copy of the generated subjects
                const subjectsWithMarks = [...generatedSubjects];

                // Fetch marks for each subject
                for (let i = 0; i < subjectsWithMarks.length; i++) {
                  const subject = subjectsWithMarks[i];

                  try {
                    // Construct the URL to fetch marks for this specific subject
                    const subjectMarksUrl = `${process.env.REACT_APP_API_URL || ''}/api/marks/check-student-marks?studentId=${student._id}&subjectId=${subject.code}&examId=${examId}&academicYearId=${academicYear}`;

                    const subjectMarksResponse = await axios.get(subjectMarksUrl, {
                      headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    });

                    console.log(`Marks for subject ${subject.name} (${subject.code}):`, subjectMarksResponse.data);

                    // If marks exist, update the subject
                    if (subjectMarksResponse.data?.hasExistingMarks) {
                      subjectsWithMarks[i] = {
                        ...subject,
                        marks: subjectMarksResponse.data.marksObtained,
                        grade: subjectMarksResponse.data.grade,
                        points: subjectMarksResponse.data.points
                      };

                      console.log(`Updated marks for subject ${subject.name} (${subject.code}): ${subjectMarksResponse.data.marksObtained}`);
                    }
                  } catch (subjectError) {
                    console.error(`Error fetching marks for subject ${subject.name} (${subject.code}):`, subjectError);
                  }
                }

                // Update the generated subjects with the fetched marks
                // Use the updated subjects with marks
                allSubjects = subjectsWithMarks;

                console.log('Updated subjects with individual marks:',
                  subjectsWithMarks.map(s => `${s.name} (${s.code}): ${s.marks}`));
              } catch (subjectsError) {
                console.error(`Error fetching individual subject marks for student ${student._id}:`, subjectsError);
              }

              console.log(`Generated ${generatedSubjects.length} subjects from combination:`,
                generatedSubjects.map(s => s.name));

              allSubjects = generatedSubjects;
            }

            // Log the student data and result data for debugging
            console.log('Student data:', {
              id: student._id || student.id,
              name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
              subjects: allSubjects,
              summary: resultData.summary
            });

            // Determine the student's form if not already set
            let studentForm = student.form;
            if (!studentForm) {
              // Try to determine from formLevel in result data
              if (resultData.formLevel) {
                if (typeof resultData.formLevel === 'string') {
                  if (resultData.formLevel.includes('5')) {
                    studentForm = 5;
                  } else if (resultData.formLevel.includes('6')) {
                    studentForm = 6;
                  }
                } else if (typeof resultData.formLevel === 'number') {
                  studentForm = resultData.formLevel;
                }
              }

              // If still not set, try to determine from class name
              if (!studentForm && student.className) {
                if (student.className.includes('5')) {
                  studentForm = 5;
                } else if (student.className.includes('6')) {
                  studentForm = 6;
                }
              }

              // If still not set, use the class-level determination
              if (!studentForm) {
                studentForm = isForm5 ? 5 : isForm6 ? 6 : null;
              }

              console.log(`Determined form for student ${student._id || student.id}: ${studentForm}`);
            }

            // Ensure combination is set
            const studentCombination = student.combination || student.subjectCombination || '';

            // Map subjectResults to subjects for consistency
            console.log('Mapping subjectResults to subjects for student:', student._id);

            // Create a new array for subjects that includes all the data from allSubjects
            // but also preserves any existing subject data
            const mappedSubjects = allSubjects.map(subject => {
              // Get the subject name
              const subjectName = subject.subject?.name ||
                                 (typeof subject.subject === 'string' ? subject.subject : '') ||
                                 subject.name ||
                                 subject.subjectName ||
                                 'Unknown Subject';

              // Get the subject code
              const subjectCode = subject.code ||
                                subject.subject?.code ||
                                subject.subjectCode ||
                                (subjectName ? subjectName.substring(0, 3).toUpperCase() : 'UNK');

              // Get the marks
              const marks = subject.marks !== undefined ? subject.marks :
                          subject.marksObtained !== undefined ? subject.marksObtained :
                          subject.mark !== undefined ? subject.mark : null;

              // Log the subject mapping
              console.log(`Mapping subject: ${subjectName} (${subjectCode}), marks: ${marks}`);

              return {
                ...subject,
                // Ensure the subject has a name property for easier access
                name: subjectName,
                // Ensure subject has a code
                code: subjectCode,
                // Ensure marks is properly set
                marks: marks,
                // Set all possible marks properties for compatibility
                marksObtained: marks,
                mark: marks
              };
            });

            // Also check if there are any subjects in resultData.subjectResults that aren't in allSubjects
            if (resultData.subjectResults && Array.isArray(resultData.subjectResults)) {
              console.log('Checking for additional subjects in subjectResults');
              for (const subjectResult of resultData.subjectResults) {
                const subjectName = subjectResult.subject?.name ||
                                   (typeof subjectResult.subject === 'string' ? subjectResult.subject : '') ||
                                   subjectResult.name ||
                                   subjectResult.subjectName ||
                                   'Unknown Subject';

                // Check if this subject is already in mappedSubjects
                const existingSubject = mappedSubjects.find(s =>
                  (s.name && subjectName && s.name.toLowerCase() === subjectName.toLowerCase()) ||
                  (s.code && subjectResult.code && s.code === subjectResult.code)
                );

                if (!existingSubject) {
                  console.log(`Adding missing subject from subjectResults: ${subjectName}`);

                  // Get the subject code
                  const subjectCode = subjectResult.code ||
                                    subjectResult.subject?.code ||
                                    subjectResult.subjectCode ||
                                    (subjectName ? subjectName.substring(0, 3).toUpperCase() : 'UNK');

                  // Get the marks
                  const marks = subjectResult.marks !== undefined ? subjectResult.marks :
                              subjectResult.marksObtained !== undefined ? subjectResult.marksObtained :
                              subjectResult.mark !== undefined ? subjectResult.mark : null;

                  mappedSubjects.push({
                    ...subjectResult,
                    name: subjectName,
                    code: subjectCode,
                    marks: marks,
                    marksObtained: marks,
                    mark: marks,
                    isPrincipal: subjectResult.isPrincipal !== undefined ? subjectResult.isPrincipal : true
                  });
                }
              }
            }

            return {
              ...student,
              // Set both subjects and subjectResults to the same array for compatibility
              subjects: mappedSubjects,
              subjectResults: mappedSubjects,
              summary: {
                // Process summary data with proper fallbacks
                totalMarks: resultData.summary?.totalMarks ||
                           resultData.totalMarks ||
                           (Array.isArray(allSubjects) ?
                             allSubjects.reduce((sum, subj) => sum + (typeof subj.marks === 'number' ? subj.marks : 0), 0) :
                             0),
                averageMarks: resultData.summary?.averageMarks ||
                             resultData.averageMarks ||
                             (Array.isArray(allSubjects) && allSubjects.length > 0 ?
                               (allSubjects.reduce((sum, subj) => sum + (typeof subj.marks === 'number' ? subj.marks : 0), 0) /
                               allSubjects.filter(subj => typeof subj.marks === 'number').length).toFixed(1) :
                               0),
                totalPoints: resultData.summary?.totalPoints ||
                            resultData.totalPoints ||
                            (Array.isArray(allSubjects) ?
                              allSubjects.reduce((sum, subj) => sum + (subj.points || 0), 0) :
                              0),
                bestThreePoints: resultData.summary?.bestThreePoints || resultData.bestThreePoints || 0,
                division: resultData.summary?.division || resultData.division || 'N/A',
                rank: resultData.summary?.rank || resultData.rank || 'N/A'
              },
              form: studentForm,
              combination: studentCombination
            };
          } catch (error) {
            console.error(`Error fetching results for student ${student._id}:`, error);
            return {
              ...student,
              subjects: [],
              summary: {
                totalMarks: 0,
                averageMarks: 0,
                totalPoints: 0,
                bestThreePoints: 0,
                division: 'N/A',
                rank: 'N/A'
              },
              form: student.form || (isForm5 ? 5 : isForm6 ? 6 : null)
            };
          }
        })
      );

      setStudents(studentsWithResults);

      // Get all unique subjects across all students
      const uniqueSubjects = [];
      console.log('Extracting unique subjects from students');

      for (const student of studentsWithResults) {
        console.log(`Processing subjects for student ${student._id || student.id}:`,
          student.subjects?.length || 0, 'subjects');

        for (const subject of (student.subjects || [])) {
          // Generate a reliable code if one doesn't exist
          const subjectCode = subject.code ||
                             (typeof subject.subject === 'string' ? subject.subject.substring(0, 3).toUpperCase() : '') ||
                             (subject.subject?.name ? subject.subject.name.substring(0, 3).toUpperCase() : '') ||
                             (subject.name ? subject.name.substring(0, 3).toUpperCase() : 'UNK');

          // Get a reliable name
          const subjectName = subject.subject?.name ||
                             (typeof subject.subject === 'string' ? subject.subject : '') ||
                             subject.name ||
                             'Unknown Subject';

          // Check if this subject is already in the uniqueSubjects array
          const existingSubject = uniqueSubjects.find(s =>
            // Match by code (most reliable)
            s.code === subjectCode ||
            // Or by name (case insensitive)
            (s.name && subjectName && s.name.toLowerCase() === subjectName.toLowerCase())
          );

          if (!existingSubject) {
            console.log(`Adding unique subject: ${subjectName} (${subjectCode})`);
            uniqueSubjects.push({
              code: subjectCode,
              name: subjectName,
              isPrincipal: subject.isPrincipal === undefined ? true : subject.isPrincipal
            });
          }
        }
      }

      // Filter out any 'Unknown Subject' entries
      const filteredSubjects = uniqueSubjects.filter(subject =>
        subject.name !== 'Unknown Subject' && subject.code !== 'UNK');

      // If we removed any subjects, update the uniqueSubjects array
      if (filteredSubjects.length < uniqueSubjects.length) {
        console.log(`Removed ${uniqueSubjects.length - filteredSubjects.length} unknown subjects`);
        uniqueSubjects.length = 0;
        for (const subject of filteredSubjects) {
          uniqueSubjects.push(subject);
        }
      }

      console.log(`Found ${uniqueSubjects.length} unique subjects:`,
        uniqueSubjects.map(s => `${s.name} (${s.code})`))

      // If no subjects were found, add default A-Level subjects
      if (uniqueSubjects.length === 0) {
        console.log('No valid subjects found. Adding default A-Level subjects.');

        // Default A-Level subjects
        const defaultSubjects = [
          { code: 'PHY', name: 'Physics', isPrincipal: true },
          { code: 'CHE', name: 'Chemistry', isPrincipal: true },
          { code: 'MAT', name: 'Mathematics', isPrincipal: true },
          { code: 'BIO', name: 'Biology', isPrincipal: true },
          { code: 'GEO', name: 'Geography', isPrincipal: true },
          { code: 'HIS', name: 'History', isPrincipal: true },
          { code: 'KIS', name: 'Kiswahili', isPrincipal: true },
          { code: 'LIT', name: 'Literature', isPrincipal: true },
          { code: 'GS', name: 'General Studies', isPrincipal: false },
          { code: 'BAM', name: 'Basic Applied Mathematics', isPrincipal: false },
          { code: 'ENG', name: 'English Language', isPrincipal: false }
        ];

        // Clear the uniqueSubjects array and add the default subjects
        uniqueSubjects.length = 0;
        for (const subject of defaultSubjects) {
          uniqueSubjects.push(subject);
        }

        console.log(`Added ${uniqueSubjects.length} default subjects:`,
          uniqueSubjects.map(s => `${s.name} (${s.code})`))
      }

      // Sort subjects: principal subjects first, then subsidiary subjects
      uniqueSubjects.sort((a, b) => {
        // First sort by principal/subsidiary
        if (a.isPrincipal && !b.isPrincipal) return -1;
        if (!a.isPrincipal && b.isPrincipal) return 1;
        // Then sort alphabetically by code
        return a.code.localeCompare(b.code);
      });

      setSubjects(uniqueSubjects);

      // Get all unique combinations
      const uniqueCombinations = [];
      for (const student of studentsWithResults) {
        const combination = student.subjectCombination || student.combination;
        if (combination && !uniqueCombinations.some(c => c.code === combination)) {
          uniqueCombinations.push({
            code: combination,
            name: combination
          });
        }
      }

      setCombinations(uniqueCombinations);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [classId, examId, generateDemoData, academicYear, term]);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter students by combination and form
  const filteredStudents = students.filter(student => {
    // Filter by combination if selected
    if (filterCombination && (student.combination || student.subjectCombination) !== filterCombination) {
      return false;
    }

    // Filter by form if selected
    if (filterForm && student.form !== Number.parseInt(filterForm, 10)) {
      return false;
    }

    return true;
  });

  // Handle combination filter change
  const handleCombinationFilterChange = (event) => {
    setFilterCombination(event.target.value);
  };

  // Handle form filter change
  const handleFormFilterChange = (event) => {
    setFilterForm(event.target.value);
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // Download report as PDF
  const handleDownload = () => {
    // Use the PDF generation endpoint
    let pdfUrl;
    // Determine education level from class data
    const classEducationLevel = classData?.educationLevel || 'O_LEVEL';

    // Try multiple endpoints with fallbacks
    try {
      if (classEducationLevel === 'A_LEVEL') {
        // For A-Level, use the A-Level specific endpoint
        pdfUrl = `${process.env.REACT_APP_API_URL || ''}/api/a-level-results/class/${classId}/${examId}`;
      } else {
        // For O-Level, use the O-Level specific endpoint
        pdfUrl = `${process.env.REACT_APP_API_URL || ''}/api/o-level-results/class/${classId}/${examId}`;
      }
      console.log(`Downloading PDF from: ${pdfUrl}`);
      window.open(pdfUrl, '_blank');

      // Set up a fallback in case the primary endpoint fails
      setTimeout(() => {
        // Check if the user confirmed they want to try a fallback
        const tryFallback = window.confirm('If the PDF did not download correctly, would you like to try an alternative download method?');

        if (tryFallback) {
          // Use the simple download endpoint as a fallback
          const fallbackUrl = `${process.env.REACT_APP_API_URL || ''}/api/download/class/${classId}/${examId}`;
          console.log(`Trying fallback download from: ${fallbackUrl}`);
          window.open(fallbackUrl, '_blank');
        }
      }, 3000); // Wait 3 seconds before offering the fallback
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('There was an error downloading the PDF. Please try again later.');
    }
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading class report...
        </Typography>
      </Box>
    );
  }

  // Update class to A-Level
  const updateClassToALevel = async () => {
    try {
      setUpdatingEducationLevel(true);

      // Call the API to update the class's education level
      await axios.put(`${process.env.REACT_APP_API_URL || ''}/api/classes/${classId}`, {
        educationLevel: 'A_LEVEL'
      }, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Show success message
      setSnackbar({
        open: true,
        message: 'Class education level updated to A-Level. Refreshing report...',
        severity: 'success'
      });

      // Refresh the report after a short delay
      setTimeout(() => {
        fetchData();
      }, 1500);
    } catch (err) {
      console.error('Error updating class education level:', err);

      // Show error message
      setSnackbar({
        open: true,
        message: `Failed to update education level: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setUpdatingEducationLevel(false);
    }
  };

  // If error, show error message
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            error.includes('only for A-Level classes') && (
              <Button
                color="inherit"
                size="small"
                onClick={updateClassToALevel}
                disabled={updatingEducationLevel}
              >
                {updatingEducationLevel ? 'Updating...' : 'Update to A-Level'}
              </Button>
            )
          }
        >
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  // If no data, show empty state
  if (!classData || !examData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          No class or exam data available.
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Create safe versions of classData and examData with default values
  const safeClassData = classData || {
    name: 'Class',
    section: '',
    stream: '',
    academicYear: '2023-2024'
  };

  const safeExamData = examData || {
    name: 'Exam',
    academicYear: '2023-2024',
    term: 'Term'
  };

  // Log the safe data for debugging
  if (!classData || !examData) {
    console.warn('Using safe data for rendering:', {
      classDataExists: !!classData,
      examDataExists: !!examData,
      safeClassData,
      safeExamData
    });
  }

  return (
    <Box className="class-tabular-report-container">
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity || 'info'} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* Action Buttons - Hidden when printing */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }} className="no-print">
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print Report
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download PDF
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="combination-filter-label">Filter by Combination</InputLabel>
            <Select
              labelId="combination-filter-label"
              value={filterCombination}
              onChange={handleCombinationFilterChange}
              label="Filter by Combination"
            >
              <MenuItem value="">All Combinations</MenuItem>
              {combinations.map((combination, index) => (
                <MenuItem key={combination.code || `combo-${index}`} value={combination.code}>
                  {combination.code} - {combination.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="form-filter-label">Filter by Form</InputLabel>
            <Select
              labelId="form-filter-label"
              value={filterForm}
              onChange={handleFormFilterChange}
              label="Filter by Form"
            >
              <MenuItem value="">All Forms</MenuItem>
              <MenuItem value="5">Form 5</MenuItem>
              <MenuItem value="6">Form 6</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Report Header */}
      <Box className="report-header">
        <Box className="header-left">
          <Typography variant="h6" className="school-name">
            ST. JOHN VIANNEY SECONDARY SCHOOL
          </Typography>
          <Typography variant="body2" className="school-address">
            P.O. BOX 123, DAR ES SALAAM, TANZANIA
          </Typography>
          <Typography variant="body1" className="exam-info">
            {(() => {
              try {
                return safeExamData.name || 'Exam';
              } catch (err) {
                console.error('Error accessing safeExamData.name:', err);
                return 'Exam';
              }
            })()} - {
              (() => {
                try {
                  const year = safeExamData.academicYear || safeClassData.academicYear || '2023-2024';
                  return typeof year === 'object' && year._id ? year.name || year.year || '2023-2024' : year;
                } catch (err) {
                  console.error('Error accessing academicYear:', err);
                  return '2023-2024';
                }
              })()
            }
          </Typography>
        </Box>

        <Box className="header-center">
          <img
            src="/images/school-logo.png"
            alt="School Logo"
            className="school-logo"
            onError={(e) => {
              // Use a local fallback image or remove the image entirely
              e.target.style.display = 'none';
            }}
          />
        </Box>

        <Box className="header-right">
          <Typography variant="body1" className="report-title">
            CLASS ACADEMIC REPORT
          </Typography>
          <Typography variant="body2" className="class-info">
            {safeClassData.name}
          </Typography>
          <Typography variant="body2" className="term-info">
            {(() => {
              try {
                const term = safeExamData.term || safeClassData.term || 'Term';
                return typeof term === 'object' && term._id ? term.name || 'Term' : term;
              } catch (err) {
                console.error('Error accessing term:', err);
                return 'Term';
              }
            })()}
          </Typography>
        </Box>
      </Box>

      {/* Class Summary */}
      <Box className="class-summary">
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Total Students:</strong> {filteredStudents.length}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Form:</strong> {filterForm ? `Form ${filterForm}` : 'All Forms'}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Combination:</strong> {filterCombination || 'All Combinations'}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Main Report Table */}
      <TableContainer component={Paper} className="report-table-container">
        <Table className="report-table" size="small">
          <TableHead>
            <TableRow className="table-header-row">
              <TableCell key="header-student" className="student-header">STUDENT</TableCell>
              <TableCell key="header-sex" className="info-header">SEX</TableCell>
              <TableCell key="header-points" className="info-header">POINTS</TableCell>
              <TableCell key="header-div" className="info-header">DIV</TableCell>
              {subjects.map((subject) => (
                <TableCell
                  key={`header-${subject.code || subject.name || 'unknown'}`}
                  align="center"
                  className={subject.isPrincipal ? "principal-subject" : "subsidiary-subject"}
                >
                  {subject.code || (subject.name ? subject.name.substring(0, 3).toUpperCase() : 'UNK')}
                </TableCell>
              ))}
              <TableCell key="header-total" align="center" className="total-header">TOTAL</TableCell>
              <TableCell key="header-avg" align="center" className="average-header">AVG</TableCell>
              <TableCell key="header-rank" align="center" className="rank-header">RANK</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id || student._id} className="student-row">
                <TableCell className="student-name">
                  {student.name || `${student.firstName} ${student.lastName}`}
                  <div className="student-number">{student.admissionNumber}</div>
                  <div className="student-combination">{student.combination || student.subjectCombination}</div>
                </TableCell>
                <TableCell align="center" className="gender-cell">
                  {student.gender || '-'}
                </TableCell>
                <TableCell align="center" className="points-cell">
                  {student.summary?.bestThreePoints || '-'}
                </TableCell>
                <TableCell align="center" className="division-cell">
                  {student.summary?.division || '-'}
                </TableCell>
                {subjects.map((subject) => {
                  // Enhanced subject matching logic with debugging
                  let studentSubject = (student.subjects || []).find(s => {
                    // Try to match by code first (most reliable)
                    if (s.code === subject.code) {
                      console.log(`Found subject match by code: ${s.code}, marks: ${s.marks}`);
                      return true;
                    }

                    // Try to match by name property (case insensitive)
                    const subjectName = s.name ||
                                       (typeof s.subject === 'string' ? s.subject : '') ||
                                       s.subject?.name ||
                                       s.subjectName ||
                                       '';

                    if (subjectName && subject.name &&
                        subjectName.toLowerCase() === subject.name.toLowerCase()) {
                      console.log(`Found subject match by name: ${subjectName}, marks: ${s.marks}`);
                      return true;
                    }

                    // Try to match Chemistry with CHE, Physics with PHY, etc.
                    if (subject.code && subjectName) {
                      // Check if the subject name starts with the code
                      if (subjectName.toLowerCase().startsWith(subject.code.toLowerCase())) {
                        console.log(`Found subject match by name starting with code: ${subjectName}, marks: ${s.marks}`);
                        return true;
                      }

                      // Check if the code is an abbreviation of the name
                      if (subject.code.length === 3) {
                        const nameWords = subjectName.split(' ');
                        if (nameWords.length === 1 &&
                            subjectName.substring(0, 3).toLowerCase() === subject.code.toLowerCase()) {
                          console.log(`Found subject match by abbreviation: ${subjectName}, marks: ${s.marks}`);
                          return true;
                        }
                      }
                    }

                    // Special case matching for common subjects
                    const specialCases = {
                      'PHY': ['Physics'],
                      'CHE': ['Chemistry'],
                      'MAT': ['Mathematics', 'Math'],
                      'BIO': ['Biology'],
                      'GEO': ['Geography'],
                      'HIS': ['History'],
                      'KIS': ['Kiswahili'],
                      'LIT': ['Literature'],
                      'ECO': ['Economics'],
                      'GS': ['General Studies'],
                      'BAM': ['Basic Applied Mathematics'],
                      'ENG': ['English', 'English Language']
                    };

                    // Check if this is a special case match
                    if (subject.code && specialCases[subject.code]) {
                      if (specialCases[subject.code].some(name =>
                          subjectName.toLowerCase() === name.toLowerCase())) {
                        console.log(`Found subject match by special case: ${subjectName} matches ${subject.code}, marks: ${s.marks}`);
                        return true;
                      }
                    }

                    // Try partial matching (case insensitive)
                    if (subjectName && subject.name &&
                        subjectName.toLowerCase().includes(subject.name.toLowerCase())) {
                      console.log(`Found subject match by partial name: ${subjectName}, marks: ${s.marks}`);
                      return true;
                    }

                    return false;
                  });

                  // If no match found in subjects, try looking in subjectResults as a fallback
                  if (!studentSubject && student.subjectResults && Array.isArray(student.subjectResults)) {
                    console.log(`No match found in subjects array, trying subjectResults for ${subject.name}`);
                    studentSubject = student.subjectResults.find(s => {
                      // Match by code
                      if (s.code === subject.code) {
                        console.log(`Found subject in subjectResults by code: ${s.code}, marks: ${s.marks || s.marksObtained || s.mark}`);
                        return true;
                      }

                      // Match by name
                      const subjectName = s.name ||
                                         (typeof s.subject === 'string' ? s.subject : '') ||
                                         s.subject?.name ||
                                         s.subjectName ||
                                         '';

                      if (subjectName && subject.name &&
                          subjectName.toLowerCase() === subject.name.toLowerCase()) {
                        console.log(`Found subject in subjectResults by name: ${subjectName}, marks: ${s.marks || s.marksObtained || s.mark}`);
                        return true;
                      }

                      // Try the same special case matching as above
                      const specialCases = {
                        'PHY': ['Physics'],
                        'CHE': ['Chemistry'],
                        'MAT': ['Mathematics', 'Math'],
                        'BIO': ['Biology'],
                        'GEO': ['Geography'],
                        'HIS': ['History'],
                        'KIS': ['Kiswahili'],
                        'LIT': ['Literature'],
                        'ECO': ['Economics'],
                        'GS': ['General Studies'],
                        'BAM': ['Basic Applied Mathematics'],
                        'ENG': ['English', 'English Language']
                      };

                      // Check if this is a special case match
                      if (subject.code && specialCases[subject.code]) {
                        if (specialCases[subject.code].some(name =>
                            subjectName.toLowerCase() === name.toLowerCase())) {
                          console.log(`Found subject in subjectResults by special case: ${subjectName} matches ${subject.code}, marks: ${s.marks || s.marksObtained || s.mark}`);
                          return true;
                        }
                      }

                      return false;
                    });
                  }

                  // If still no match, try looking in results array as a last resort
                  if (!studentSubject && student.results && Array.isArray(student.results)) {
                    console.log(`No match found in subjects or subjectResults, trying results array for ${subject.name}`);
                    studentSubject = student.results.find(s => {
                      // Match by code
                      if (s.code === subject.code || s.subjectCode === subject.code) {
                        console.log(`Found subject in results by code: ${s.code || s.subjectCode}, marks: ${s.marks || s.marksObtained || s.mark}`);
                        return true;
                      }

                      // Match by name
                      const subjectName = s.name ||
                                         s.subjectName ||
                                         (typeof s.subject === 'string' ? s.subject : '') ||
                                         s.subject?.name ||
                                         '';

                      if (subjectName && subject.name &&
                          subjectName.toLowerCase() === subject.name.toLowerCase()) {
                        console.log(`Found subject in results by name: ${subjectName}, marks: ${s.marks || s.marksObtained || s.mark}`);
                        return true;
                      }

                      return false;
                    });
                  }

                  // Generate a unique key for this cell
                  const cellKey = `${student.id || student._id || 'unknown'}-${subject.code || subject.name || 'unknown'}`;

                  return (
                    <TableCell key={cellKey} align="center" className="subject-cell">
                      {studentSubject ? (
                        <div className="subject-data">
                          <div className="subject-marks">
                            {(() => {
                              // Try all possible marks properties
                              if (typeof studentSubject.marks === 'number') {
                                return studentSubject.marks;
                              }
                              if (typeof studentSubject.marksObtained === 'number') {
                                return studentSubject.marksObtained;
                              }
                              if (typeof studentSubject.mark === 'number') {
                                return studentSubject.mark;
                              }
                              return '-';
                            })()}
                          </div>
                          <div className="subject-grade">
                            {studentSubject.grade && studentSubject.grade !== '-' ? studentSubject.grade : '-'}
                          </div>
                        </div>
                      ) : (
                        <div className="subject-data">
                          <div className="subject-marks">-</div>
                          <div className="subject-grade">-</div>
                        </div>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell align="center" className="total-cell">
                  {typeof student.summary?.totalMarks === 'number' ? student.summary.totalMarks : '-'}
                </TableCell>
                <TableCell align="center" className="average-cell">
                  {typeof student.summary?.averageMarks === 'number' ||
                   (typeof student.summary?.averageMarks === 'string' && !Number.isNaN(Number.parseFloat(student.summary.averageMarks))) ?
                   student.summary.averageMarks : '-'}
                </TableCell>
                <TableCell align="center" className="rank-cell">
                  {student.summary?.rank || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Subject Performance Summary - Always visible */}
      <Box className="subject-performance-summary">
        <Typography variant="subtitle1" className="summary-title">
          Subject Performance Summary
        </Typography>
        <TableContainer component={Paper} className="summary-table-container">
          <Table className="summary-table" size="small">
            <TableHead>
              <TableRow key="summary-header-row-1">
                <TableCell key="summary-subject" className="summary-header">SUBJECT</TableCell>
                <TableCell key="summary-reg" align="center" className="summary-header">REG</TableCell>
                <TableCell key="summary-grade" align="center" className="summary-header" colSpan={7}>GRADE</TableCell>
                <TableCell key="summary-pass" align="center" className="summary-header">PASS</TableCell>
                <TableCell key="summary-gpa" align="center" className="summary-header">GPA</TableCell>
              </TableRow>
              <TableRow key="summary-header-row-2">
                <TableCell key="summary-empty-1" className="summary-header" />
                <TableCell key="summary-empty-2" align="center" className="summary-header" />
                <TableCell key="summary-grade-a" align="center" className="grade-header">A</TableCell>
                <TableCell key="summary-grade-b" align="center" className="grade-header">B</TableCell>
                <TableCell key="summary-grade-c" align="center" className="grade-header">C</TableCell>
                <TableCell key="summary-grade-d" align="center" className="grade-header">D</TableCell>
                <TableCell key="summary-grade-e" align="center" className="grade-header">E</TableCell>
                <TableCell key="summary-grade-s" align="center" className="grade-header">S</TableCell>
                <TableCell key="summary-grade-f" align="center" className="grade-header">F</TableCell>
                <TableCell key="summary-empty-3" align="center" className="summary-header" />
                <TableCell key="summary-empty-4" align="center" className="summary-header" />
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((subject) => {
                // Count students with this subject
                const studentsWithSubject = filteredStudents.filter(student =>
                  (student.subjects || []).some(s => s.code === subject.code)
                );

                // Count grades
                const gradeA = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'A'
                ).length;

                const gradeB = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'B'
                ).length;

                const gradeC = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'C'
                ).length;

                const gradeD = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'D'
                ).length;

                const gradeE = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'E'
                ).length;

                const gradeS = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'S'
                ).length;

                const gradeF = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'F'
                ).length;

                // Calculate pass rate (A to S)
                const passCount = gradeA + gradeB + gradeC + gradeD + gradeE + gradeS;

                // Calculate GPA
                const totalPoints = studentsWithSubject.reduce((sum, student) => {
                  const subjectData = (student.subjects || []).find(s => s.code === subject.code);
                  return sum + (subjectData?.points || 0);
                }, 0);

                const subjectGPA = studentsWithSubject.length > 0
                  ? (totalPoints / studentsWithSubject.length).toFixed(2)
                  : 'N/A';

                return (
                  <TableRow key={subject.code}>
                    <TableCell className="subject-name">
                      {subject.name} ({subject.code})
                    </TableCell>
                    <TableCell align="center">{studentsWithSubject.length}</TableCell>
                    <TableCell align="center">{gradeA}</TableCell>
                    <TableCell align="center">{gradeB}</TableCell>
                    <TableCell align="center">{gradeC}</TableCell>
                    <TableCell align="center">{gradeD}</TableCell>
                    <TableCell align="center">{gradeE}</TableCell>
                    <TableCell align="center">{gradeS}</TableCell>
                    <TableCell align="center">{gradeF}</TableCell>
                    <TableCell align="center">{passCount}</TableCell>
                    <TableCell align="center">{subjectGPA}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Overall Performance Summary - Always visible */}
      <Box className="overall-performance-summary">
        <Typography variant="subtitle1" className="summary-title">
          Overall Performance Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper className="summary-paper">
              <Typography variant="h6" className="summary-section-title">
                Examination Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    <strong>Total Students:</strong> {filteredStudents.length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    <strong>Total Passed:</strong> {filteredStudents.filter(s => s.summary?.division !== 'F').length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    <strong>Pass Rate:</strong> {
                      filteredStudents.length > 0
                        ? `${((filteredStudents.filter(s => s.summary?.division !== 'F').length / filteredStudents.length) * 100).toFixed(2)}%`
                        : 'N/A'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    <strong>Examination GPA:</strong> {
                      (() => {
                        // Calculate average subject GPA
                        const subjectGPAs = subjects.map(subject => {
                          const studentsWithSubject = filteredStudents.filter(student =>
                            (student.subjects || []).some(s => s.code === subject.code)
                          );

                          const totalPoints = studentsWithSubject.reduce((sum, student) => {
                            const subjectData = (student.subjects || []).find(s => s.code === subject.code);
                            return sum + (subjectData?.points || 0);
                          }, 0);

                          return studentsWithSubject.length > 0
                            ? totalPoints / studentsWithSubject.length
                            : 0;
                        });

                        const avgSubjectGPA = subjectGPAs.length > 0
                          ? subjectGPAs.reduce((sum, gpa) => sum + gpa, 0) / subjectGPAs.length
                          : 0;

                        // Calculate average division GPA
                        const divisionPoints = {
                          'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'F': 6
                        };

                        const totalDivisionPoints = filteredStudents.reduce((sum, student) => {
                          return sum + (divisionPoints[student.summary?.division] || 0);
                        }, 0);

                        const avgDivisionGPA = filteredStudents.length > 0
                          ? totalDivisionPoints / filteredStudents.length
                          : 0;

                        // Calculate overall GPA
                        const overallGPA = (avgSubjectGPA + avgDivisionGPA) / 2;

                        return overallGPA.toFixed(2);
                      })()
                    }
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className="summary-paper">
              <Typography variant="h6" className="summary-section-title">
                Division Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body1">
                    <strong>Division I:</strong> {filteredStudents.filter(s => s.summary?.division === 'I').length}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body1">
                    <strong>Division II:</strong> {filteredStudents.filter(s => s.summary?.division === 'II').length}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body1">
                    <strong>Division III:</strong> {filteredStudents.filter(s => s.summary?.division === 'III').length}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body1">
                    <strong>Division IV:</strong> {filteredStudents.filter(s => s.summary?.division === 'IV').length}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body1">
                    <strong>Division V:</strong> {filteredStudents.filter(s => s.summary?.division === 'V').length}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body1">
                    <strong>Failed:</strong> {filteredStudents.filter(s => s.summary?.division === 'F').length}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Signature Section */}
      <Box className="signature-section">
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <Box className="signature-box">
              <Typography variant="body1" className="signature-title">
                Class Teacher's Signature
              </Typography>
              <Box className="signature-line" />
              <Typography variant="body2" className="signature-name">
                Name: _______________________________
              </Typography>
              <Typography variant="body2" className="signature-date">
                Date: _______________________________
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box className="signature-box">
              <Typography variant="body1" className="signature-title">
                Principal's Signature
              </Typography>
              <Box className="signature-line" />
              <Typography variant="body2" className="signature-name">
                Name: _______________________________
              </Typography>
              <Typography variant="body2" className="signature-date">
                Date: _______________________________
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Footer */}
      <Box className="report-footer">
        <Typography variant="body2" className="footer-text">
          This report was issued without any erasure or alteration whatsoever.
        </Typography>
        <Typography variant="body2" className="school-motto">
          "Excellence Through Discipline and Hard Work"
        </Typography>
      </Box>
    </Box>
  );
};

// Define PropTypes for the component
ClassTabularReport.propTypes = {
  classId: PropTypes.string,
  examId: PropTypes.string
};

export default ClassTabularReport;
