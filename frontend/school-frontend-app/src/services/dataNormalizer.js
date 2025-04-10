/**
 * Data normalization layer
 * This module transforms API responses into flat, string-based structures
 * that can be safely rendered in React components
 */

/**
 * Normalize a student object
 * @param {Object} student - The student object from the API
 * @returns {Object} - A normalized student object with string values
 */
export const normalizeStudent = (student) => {
  if (!student) return null;
  
  return {
    id: student._id ? String(student._id) : '',
    firstName: student.firstName ? String(student.firstName) : '',
    lastName: student.lastName ? String(student.lastName) : '',
    fullName: student.firstName && student.lastName 
      ? `${String(student.firstName)} ${String(student.lastName)}` 
      : (student.name ? String(student.name) : ''),
    rollNumber: student.rollNumber ? String(student.rollNumber) : '',
    email: student.email ? String(student.email) : '',
    phone: student.phone ? String(student.phone) : '',
    gender: student.gender ? String(student.gender) : '',
    dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth) : '',
    address: student.address ? String(student.address) : '',
    // Add any other properties you need
  };
};

/**
 * Normalize a subject object
 * @param {Object} subject - The subject object from the API
 * @returns {Object} - A normalized subject object with string values
 */
export const normalizeSubject = (subject) => {
  if (!subject) return null;
  
  return {
    id: subject._id ? String(subject._id) : '',
    name: subject.name ? String(subject.name) : '',
    code: subject.code ? String(subject.code) : '',
    type: subject.type ? String(subject.type) : '',
    description: subject.description ? String(subject.description) : '',
    // Add any other properties you need
  };
};

/**
 * Normalize a class object
 * @param {Object} classObj - The class object from the API
 * @returns {Object} - A normalized class object with string values
 */
export const normalizeClass = (classObj) => {
  if (!classObj) return null;
  
  return {
    id: classObj._id ? String(classObj._id) : '',
    name: classObj.name ? String(classObj.name) : '',
    section: classObj.section ? String(classObj.section) : '',
    stream: classObj.stream ? String(classObj.stream) : '',
    fullName: [
      classObj.name ? String(classObj.name) : '',
      classObj.section ? String(classObj.section) : '',
      classObj.stream ? String(classObj.stream) : ''
    ].filter(Boolean).join(' '),
    // Add any other properties you need
  };
};

/**
 * Normalize a result object
 * @param {Object} result - The result object from the API
 * @returns {Object} - A normalized result object with string values
 */
export const normalizeResult = (result) => {
  if (!result) return null;
  
  return {
    id: result._id ? String(result._id) : '',
    marks: result.marks !== undefined ? String(result.marks) : '',
    grade: result.grade ? String(result.grade) : '',
    points: result.points !== undefined ? String(result.points) : '',
    remarks: result.remarks ? String(result.remarks) : '',
    present: result.present !== undefined ? Boolean(result.present) : true,
    // Add any other properties you need
  };
};

/**
 * Normalize a student result report
 * @param {Object} report - The student result report from the API
 * @returns {Object} - A normalized student result report with string values
 */
export const normalizeStudentResultReport = (report) => {
  if (!report) return null;
  
  return {
    id: report._id ? String(report._id) : '',
    student: report.student ? normalizeStudent(report.student) : null,
    exam: {
      id: report.exam?._id ? String(report.exam._id) : '',
      name: report.exam?.name ? String(report.exam.name) : '',
      term: report.exam?.term ? String(report.exam.term) : '',
      year: report.exam?.year ? String(report.exam.year) : '',
    },
    class: report.class ? normalizeClass(report.class) : null,
    academicYear: report.academicYear ? String(report.academicYear) : '',
    results: Array.isArray(report.results) 
      ? report.results.map(result => ({
          ...normalizeResult(result),
          subject: result.subject ? normalizeSubject(result.subject) : null,
        }))
      : [],
    totalMarks: report.totalMarks !== undefined ? String(report.totalMarks) : '',
    averageMarks: report.averageMarks !== undefined ? String(report.averageMarks) : '',
    grade: report.grade ? String(report.grade) : '',
    points: report.points !== undefined ? String(report.points) : '',
    division: report.division ? String(report.division) : '',
    rank: report.rank !== undefined ? String(report.rank) : '',
    remarks: report.remarks ? String(report.remarks) : '',
    // Add any other properties you need
  };
};

/**
 * Normalize a class result report
 * @param {Object} report - The class result report from the API
 * @returns {Object} - A normalized class result report with string values
 */
export const normalizeClassResultReport = (report) => {
  if (!report) return null;
  
  return {
    id: report._id ? String(report._id) : '',
    className: report.className ? String(report.className) : '',
    section: report.section ? String(report.section) : '',
    stream: report.stream ? String(report.stream) : '',
    examName: report.examName ? String(report.examName) : '',
    academicYear: report.academicYear ? String(report.academicYear) : '',
    totalStudents: report.totalStudents !== undefined ? String(report.totalStudents) : '',
    classAverage: report.classAverage !== undefined ? Number(report.classAverage) : 0,
    subjects: Array.isArray(report.subjects) 
      ? report.subjects.map(subject => normalizeSubject(subject))
      : [],
    students: Array.isArray(report.students) 
      ? report.students.map(student => ({
          studentId: student.studentId ? String(student.studentId) : '',
          studentName: student.studentName ? String(student.studentName) : '',
          sex: student.sex ? String(student.sex) : '',
          totalMarks: student.totalMarks !== undefined ? String(student.totalMarks) : '',
          averageMarks: student.averageMarks !== undefined ? String(student.averageMarks) : '',
          grade: student.grade ? String(student.grade) : '',
          points: student.points !== undefined ? String(student.points) : '',
          division: student.division ? String(student.division) : '',
          rank: student.rank !== undefined ? String(student.rank) : '',
          subjectResults: Array.isArray(student.subjectResults) 
            ? student.subjectResults.map(result => normalizeResult(result))
            : [],
        }))
      : [],
    // Add any other properties you need
  };
};

/**
 * Normalize an API response
 * @param {Object} response - The API response
 * @returns {Object} - A normalized API response
 */
export const normalizeApiResponse = (response) => {
  if (!response) return response;
  
  // If it's an axios response with a data property
  if (response.data) {
    return {
      ...response,
      data: normalizeData(response.data),
    };
  }
  
  // Otherwise normalize the response directly
  return normalizeData(response);
};

/**
 * Normalize any data
 * @param {any} data - The data to normalize
 * @returns {any} - Normalized data
 */
export const normalizeData = (data) => {
  if (!data) return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => normalizeData(item));
  }
  
  // Handle objects
  if (typeof data === 'object' && data !== null) {
    // Check if it's a student result report
    if (data.student && data.results) {
      return normalizeStudentResultReport(data);
    }
    
    // Check if it's a class result report
    if (data.className && data.students) {
      return normalizeClassResultReport(data);
    }
    
    // Check if it's a student
    if (data.firstName && data.lastName) {
      return normalizeStudent(data);
    }
    
    // Check if it's a subject
    if (data.name && data.type) {
      return normalizeSubject(data);
    }
    
    // Check if it's a class
    if (data.name && (data.section || data.stream)) {
      return normalizeClass(data);
    }
    
    // For other objects, normalize all properties
    const normalizedData = {};
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'object' && data[key] !== null) {
        normalizedData[key] = normalizeData(data[key]);
      } else if (data[key] !== undefined && data[key] !== null) {
        normalizedData[key] = String(data[key]);
      } else {
        normalizedData[key] = data[key];
      }
    });
    
    return normalizedData;
  }
  
  // Return primitive values as is
  return data;
};

export default {
  normalizeStudent,
  normalizeSubject,
  normalizeClass,
  normalizeResult,
  normalizeStudentResultReport,
  normalizeClassResultReport,
  normalizeApiResponse,
  normalizeData,
};
