import * as XLSX from 'xlsx';

/**
 * Generate an Excel report for class results
 * @param {Object} report - The report data
 * @param {string} className - The class name for the file name
 * @param {string} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {ArrayBuffer} - The Excel file as an ArrayBuffer
 */
export const generateExcelReport = (report, className, educationLevel = 'O_LEVEL') => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Create student results worksheet
  createStudentResultsWorksheet(wb, report);

  // Create subject summary worksheet
  createSubjectSummaryWorksheet(wb, report);

  // Generate Excel file
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
};

/**
 * Create a worksheet for student results
 * @param {Object} wb - The workbook
 * @param {Object} report - The report data
 */
const createStudentResultsWorksheet = (wb, report) => {
  // Get current year
  const year = report.year || new Date().getFullYear();

  // Create header rows
  const headerRows = [
    [`OPEN TEST RESULT - ${year}`],
    [`Class Name: ${report.className || 'Unknown'}`],
    [`${educationLevel === 'O_LEVEL' ? 'O-Level' : 'A-Level'} Results`],
    [] // Empty row
  ];

  // Get all subjects
  const subjects = report.subjects || [];

  // Create column headers
  const baseHeaders = ['#', 'STUDENT NAME', 'SEX'];
  const subjectHeaders = subjects.map(subject => subject.code || subject.name);
  const summaryHeaders = ['TOTAL', 'AVERAGE', 'DIVISION', 'POINTS', 'RANK'];
  const columnHeaders = [...baseHeaders, ...subjectHeaders, ...summaryHeaders];

  // Add column headers to header rows
  headerRows.push(columnHeaders);

  // Create data rows
  const dataRows = [];

  // Process each student
  (report.students || []).forEach((student, index) => {
    const row = [
      index + 1,
      student.studentName || `${student.firstName} ${student.lastName}`,
      student.sex || student.gender || '-'
    ];

    // Add subject marks
    subjects.forEach(subject => {
      // Find the subject result for this student
      const subjectResult = student.subjects?.[subject.id] ||
                           student.subjectResults?.find(r => r.subjectId === subject.id) ||
                           student.results?.find(r => r.subject?.name === subject.name);

      // Get the marks, handling missing values
      const marks = subjectResult?.marks ||
                   subjectResult?.marksObtained ||
                   (subjectResult?.present ? subjectResult.marks : '-');

      row.push(marks === null || marks === undefined ? '-' : marks);
    });

    // Add summary columns
    row.push(
      student.totalMarks || '-',
      student.averageMarks || '-',
      student.division || '-',
      student.points || student.totalPoints || '-',
      student.rank || '-'
    );

    dataRows.push(row);
  });

  // Combine header rows and data rows
  const allRows = [...headerRows, ...dataRows];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  const colWidths = [
    { wch: 5 },  // #
    { wch: 30 }, // Student Name
    { wch: 5 },  // Sex
    ...subjects.map(() => ({ wch: 8 })), // Subject columns
    { wch: 8 },  // Total
    { wch: 8 },  // Average
    { wch: 8 },  // Division
    { wch: 8 },  // Points
    { wch: 5 }   // Rank
  ];

  ws['!cols'] = colWidths;

  // Set merged cells for title and class name
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnHeaders.length - 1 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: columnHeaders.length - 1 } }  // Class Name
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Student Results');
};

/**
 * Create a worksheet for subject summary
 * @param {Object} wb - The workbook
 * @param {Object} report - The report data
 */
const createSubjectSummaryWorksheet = (wb, report) => {
  // Get all subjects
  const subjects = report.subjects || [];

  // Create header rows
  const headerRows = [
    ['Subject Summary'],
    [] // Empty row
  ];

  // Create column headers
  const columnHeaders = ['SUBJECT', 'NO OF STUDENTS', 'A', 'B', 'C', 'D', 'F', 'GPA'];

  // Add column headers to header rows
  headerRows.push(columnHeaders);

  // Create data rows
  const dataRows = [];

  // Process each subject
  subjects.forEach(subject => {
    // Calculate grade distribution for this subject
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    let totalPoints = 0;
    let studentCount = 0;

    // Process each student's result for this subject
    (report.students || []).forEach(student => {
      const subjectResult = student.subjects?.[subject.id] ||
                           student.subjectResults?.find(r => r.subjectId === subject.id) ||
                           student.results?.find(r => r.subject?.name === subject.name);

      if (subjectResult && subjectResult.grade) {
        gradeDistribution[subjectResult.grade] = (gradeDistribution[subjectResult.grade] || 0) + 1;
        totalPoints += subjectResult.points || 0;
        studentCount++;
      }
    });

    // Calculate GPA (1-5 scale, A=1, F=5)
    const gpa = studentCount > 0 ?
      ((gradeDistribution.A * 1 + gradeDistribution.B * 2 + gradeDistribution.C * 3 +
        gradeDistribution.D * 4 + gradeDistribution.F * 5) / studentCount).toFixed(2) :
      '-';

    dataRows.push([
      subject.name,
      studentCount,
      gradeDistribution.A || 0,
      gradeDistribution.B || 0,
      gradeDistribution.C || 0,
      gradeDistribution.D || 0,
      gradeDistribution.F || 0,
      gpa
    ]);
  });

  // Add approvals section
  dataRows.push([]); // Empty row
  dataRows.push(['APPROVED BY']);
  dataRows.push([]);
  dataRows.push(['ACADEMIC TEACHER NAME : ___________________________', '', '', 'SIGN: ___________________________']);
  dataRows.push([]);
  dataRows.push(['HEAD OF SCHOOL NAME   : ___________________________', '', '', 'SIGN: ___________________________']);

  // Combine header rows and data rows
  const allRows = [...headerRows, ...dataRows];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  const colWidths = [
    { wch: 30 }, // Subject
    { wch: 15 }, // No of Students
    { wch: 5 },  // A
    { wch: 5 },  // B
    { wch: 5 },  // C
    { wch: 5 },  // D
    { wch: 5 },  // F
    { wch: 8 }   // GPA
  ];

  ws['!cols'] = colWidths;

  // Set merged cells for title
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnHeaders.length - 1 } } // Title
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Subject Summary');
};

export default {
  generateExcelReport
};
