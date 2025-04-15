import * as XLSX from 'xlsx';

/**
 * Generate an Excel report for A-Level class results
 * @param {Object} report - The report data
 * @param {string} className - The class name for the file name
 * @returns {ArrayBuffer} - The Excel file as an ArrayBuffer
 */
export const generateALevelExcelReport = (report, className) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Create student results worksheet
  createStudentResultsWorksheet(wb, report);

  // Create school summary worksheet
  createSchoolSummaryWorksheet(wb, report);

  // Write the workbook to an array buffer
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
};

/**
 * Create the student results worksheet
 * @param {Object} wb - The workbook
 * @param {Object} report - The report data
 */
const createStudentResultsWorksheet = (wb, report) => {
  // Get current year
  const year = report.year || new Date().getFullYear();

  // Create header rows
  const headerRows = [
    ['Evangelical Lutheran Church in Tanzania - Northern Diocese'],
    ['Agape Lutheran Junior Seminary'],
    ['PO Box 8882, Moshi, Tanzania'],
    ['Mobile: 0759767735 | Email: infoagapeseminary@gmail.com'],
    [],
    [`${year} FORM FIVE EXAMINATION RESULTS`],
    []
  ];

  // Add division summary
  const divisionSummary = report.divisionSummary || {
    'I': 0,
    'II': 0,
    'III': 0,
    'IV': 0,
    '0': 0
  };

  headerRows.push([
    `DIV-I: ${divisionSummary.I || 0} | DIV-II: ${divisionSummary.II || 0} | DIV-III: ${divisionSummary.III || 0} | DIV-IV: ${divisionSummary.IV || 0} | DIV-0: ${divisionSummary['0'] || 0}`
  ]);

  headerRows.push([]);

  // Get all unique subjects from student combinations
  const allSubjects = new Set();
  const students = report.students || [];

  for (const student of students) {
    const studentSubjects = student.subjectResults || [];
    for (const subject of studentSubjects) {
      if (subject.subject?.name) {
        allSubjects.add(subject.subject.name);
      }
    }
  }

  // Convert to array and sort alphabetically
  const uniqueSubjects = Array.from(allSubjects).sort();

  // Create table headers
  const baseHeaders = ['#', 'STUDENT NAME', 'SEX', 'POINT', 'DIVISION'];
  const subjectHeaders = uniqueSubjects;
  const summaryHeaders = ['TOTAL', 'AVERAGE', 'RANK'];
  const tableHeaders = [...baseHeaders, ...subjectHeaders, ...summaryHeaders];

  headerRows.push(tableHeaders);

  // Create data rows
  const dataRows = [];

  // If no students, add a placeholder row
  if (!students || students.length === 0) {
    dataRows.push([
      1,
      'No students available',
      '-',
      '-',
      '-',
      ...uniqueSubjects.map(() => '-'),
      '-',
      '-',
      '-'
    ]);
  } else {
    // Process each student
    students.forEach((student, index) => {
    const row = [
      index + 1,
      student.studentName || `${student.firstName} ${student.lastName}`,
      student.sex || student.gender || '-',
      student.points || student.totalPoints || '-',
      student.division || '-'
    ];

    // Add subject marks
    uniqueSubjects.forEach(subjectName => {
      // Find the subject result for this student
      const subjectResult = student.subjectResults?.find(r => r.subject?.name === subjectName);

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
      student.rank || '-'
    );

    dataRows.push(row);
  });
  }

  // Combine all rows
  const allRows = [...headerRows, ...dataRows];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  const colWidths = [
    { wch: 5 },  // #
    { wch: 30 }, // Student Name
    { wch: 5 },  // Sex
    { wch: 8 },  // Point
    { wch: 10 }, // Division
  ];

  // Add widths for subject columns
  uniqueSubjects.forEach(() => {
    colWidths.push({ wch: 12 });
  });

  // Add widths for summary columns
  colWidths.push({ wch: 10 }); // Total
  colWidths.push({ wch: 10 }); // Average
  colWidths.push({ wch: 8 });  // Rank

  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Student Results');

  // Apply styles (as much as XLSX allows)
  // Note: XLSX has limited styling capabilities

  // Merge cells for header
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: tableHeaders.length - 1 } }, // First header row
    { s: { r: 1, c: 0 }, e: { r: 1, c: tableHeaders.length - 1 } }, // Second header row
    { s: { r: 2, c: 0 }, e: { r: 2, c: tableHeaders.length - 1 } }, // Third header row
    { s: { r: 3, c: 0 }, e: { r: 3, c: tableHeaders.length - 1 } }, // Fourth header row
    { s: { r: 5, c: 0 }, e: { r: 5, c: tableHeaders.length - 1 } }, // Sixth header row
    { s: { r: 7, c: 0 }, e: { r: 7, c: tableHeaders.length - 1 } }  // Eighth header row
  ];
};

/**
 * Create the school summary worksheet
 * @param {Object} wb - The workbook
 * @param {Object} report - The report data
 */
const createSchoolSummaryWorksheet = (wb, report) => {
  // Get current year
  const year = report.year || new Date().getFullYear();

  // Create header rows
  const headerRows = [
    ['Evangelical Lutheran Church in Tanzania - Northern Diocese'],
    ['Agape Lutheran Junior Seminary'],
    ['PO Box 8882, Moshi, Tanzania'],
    ['Mobile: 0759767735 | Email: infoagapeseminary@gmail.com'],
    [],
    [`${year} FORM FIVE EXAMINATION RESULTS - SCHOOL SUMMARY`],
    []
  ];

  // Add overall performance section
  headerRows.push(['Overall Performance']);
  headerRows.push([]);
  headerRows.push([
    'Total Passed Candidates:',
    report.overallPerformance?.totalPassed || 0,
    '',
    'Examination GPA:',
    report.overallPerformance?.examGpa || '0.00'
  ]);
  headerRows.push([]);

  // Add division summary table
  headerRows.push(['Division Summary']);
  headerRows.push([]);

  const divisionSummary = report.divisionSummary || {
    'I': 0,
    'II': 0,
    'III': 0,
    'IV': 0,
    '0': 0
  };

  const totalStudents = report.students?.length || 0;

  headerRows.push([
    'REGISTERED',
    'ABSENT',
    'SAT',
    'DIV I',
    'DIV II',
    'DIV III',
    'DIV IV',
    'DIV 0'
  ]);

  headerRows.push([
    totalStudents,
    0,
    totalStudents,
    divisionSummary.I || 0,
    divisionSummary.II || 0,
    divisionSummary.III || 0,
    divisionSummary.IV || 0,
    divisionSummary['0'] || 0
  ]);

  headerRows.push([]);
  headerRows.push([]);

  // Add subject-wise performance summary
  headerRows.push(['Subject-Wise Performance Summary']);
  headerRows.push([]);

  headerRows.push([
    'SUBJECT NAME',
    'REG',
    'A',
    'B',
    'C',
    'D',
    'E',
    'S',
    'F',
    'PASS',
    'GPA'
  ]);

  // Create data rows
  const dataRows = [];

  // Process each subject
  const subjectPerformance = report.subjectPerformance || {};

  Object.values(subjectPerformance).forEach(subject => {
    dataRows.push([
      subject.name,
      subject.registered,
      subject.grades.A,
      subject.grades.B,
      subject.grades.C,
      subject.grades.D,
      subject.grades.E,
      subject.grades.S,
      subject.grades.F,
      subject.passed,
      subject.gpa
    ]);
  });

  // Add approvals section
  dataRows.push([]);
  dataRows.push([]);
  dataRows.push(['APPROVED BY']);
  dataRows.push([]);
  dataRows.push(['ACADEMIC TEACHER NAME:', '___________________________']);
  dataRows.push(['SIGN:', '___________________________']);
  dataRows.push([]);
  dataRows.push(['HEAD OF SCHOOL NAME:', '___________________________']);
  dataRows.push(['SIGN:', '___________________________']);

  // Combine all rows
  const allRows = [...headerRows, ...dataRows];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 30 }, // First column
    { wch: 15 }, // Second column
    { wch: 10 }, // Third column
    { wch: 10 }, // Fourth column
    { wch: 10 }, // Fifth column
    { wch: 10 }, // Sixth column
    { wch: 10 }, // Seventh column
    { wch: 10 }, // Eighth column
    { wch: 10 }, // Ninth column
    { wch: 10 }, // Tenth column
    { wch: 10 }  // Eleventh column
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'School Summary');

  // Apply styles (as much as XLSX allows)
  // Note: XLSX has limited styling capabilities

  // Merge cells for header
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // First header row
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Second header row
    { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } }, // Third header row
    { s: { r: 3, c: 0 }, e: { r: 3, c: 10 } }, // Fourth header row
    { s: { r: 5, c: 0 }, e: { r: 5, c: 10 } }, // Sixth header row
    { s: { r: 7, c: 0 }, e: { r: 7, c: 10 } }, // Eighth header row
    { s: { r: 17, c: 0 }, e: { r: 17, c: 10 } } // Subject header row
  ];
};


