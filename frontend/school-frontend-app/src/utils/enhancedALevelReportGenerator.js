import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate an enhanced PDF for an A-Level class result report
 * @param {Object} report - The normalized class result report
 * @returns {jsPDF} - The generated PDF document
 */
export const generateEnhancedALevelReportPDF = (report) => {
  // Create a new PDF document in portrait orientation
  const doc = new jsPDF('portrait');

  // Set default font
  doc.setFont('helvetica');

  // Add school header
  addSchoolHeader(doc);

  // Add division summary
  addDivisionSummary(doc, report);

  // Add individual student results
  addIndividualStudentResults(doc, report);

  // Add page break
  doc.addPage();

  // Add school header again for the summary page
  addSchoolHeader(doc);

  // Add school summary report
  addSchoolSummaryReport(doc, report);

  return doc;
};

/**
 * Add school header to the PDF
 * @param {jsPDF} doc - The PDF document
 */
const addSchoolHeader = (doc) => {
  // Set font for header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Evangelical Lutheran Church in Tanzania - Northern Diocese', doc.internal.pageSize.width / 2, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.text('Agape Lutheran Junior Seminary', doc.internal.pageSize.width / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PO Box 8882, Moshi, Tanzania', doc.internal.pageSize.width / 2, 40, { align: 'center' });
  doc.text('Mobile: 0759767735 | Email: infoagapeseminary@gmail.com', doc.internal.pageSize.width / 2, 45, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${new Date().getFullYear()} FORM FIVE EXAMINATION RESULTS`, doc.internal.pageSize.width / 2, 55, { align: 'center' });

  // Add a line
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(20, 60, doc.internal.pageSize.width - 20, 60);
};

/**
 * Add division summary to the PDF
 * @param {jsPDF} doc - The PDF document
 * @param {Object} report - The report data
 */
const addDivisionSummary = (doc, report) => {
  // Calculate division summary
  const divisionSummary = report.divisionSummary || {
    'I': 0,
    'II': 0,
    'III': 0,
    'IV': 0,
    '0': 0
  };

  // Add division summary
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `DIV-I: ${divisionSummary.I || 0} | DIV-II: ${divisionSummary.II || 0} | DIV-III: ${divisionSummary.III || 0} | DIV-IV: ${divisionSummary.IV || 0} | DIV-0: ${divisionSummary['0'] || 0}`,
    doc.internal.pageSize.width / 2,
    70,
    { align: 'center' }
  );
};

/**
 * Add individual student results to the PDF
 * @param {jsPDF} doc - The PDF document
 * @param {Object} report - The report data
 */
const addIndividualStudentResults = (doc, report) => {
  const students = report.students || [];
  const startY = 80;

  // Get all unique subjects from student combinations
  const allSubjects = new Set();
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

  // Prepare table headers
  const baseHeaders = ['#', 'STUDENT NAME', 'SEX', 'POINT', 'DIVISION'];
  const subjectHeaders = uniqueSubjects;
  const summaryHeaders = ['TOTAL', 'AVERAGE', 'RANK'];
  const allHeaders = [...baseHeaders, ...subjectHeaders, ...summaryHeaders];

  // Prepare table data
  const tableData = [];

  // If no students, add a placeholder row
  if (!students || students.length === 0) {
    tableData.push([
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

    tableData.push(row);
  });
  }

  // Add student results table
  doc.autoTable({
    head: [allHeaders],
    body: tableData,
    startY: startY,
    styles: { fontSize: 8, cellPadding: 1 },
    headStyles: { fillColor: [70, 70, 70], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 8 }, // #
      1: { cellWidth: 30 }, // Student Name
      2: { cellWidth: 8 }, // Sex
      3: { cellWidth: 10 }, // Point
      4: { cellWidth: 15 }, // Division
    },
    didDrawPage: (data) => {
      // Add page number to footer
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(
        `Page ${pageNumber}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );

      // Add school name to footer
      doc.text(
        'Agape Lutheran Junior Seminary',
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );

      // Add header to new pages (except the first page)
      if (data.pageNumber > 1) {
        addSchoolHeader(doc);
        addDivisionSummary(doc, report);
      }
    }
  });
};

/**
 * Add school summary report to the PDF
 * @param {jsPDF} doc - The PDF document
 * @param {Object} report - The report data
 */
const addSchoolSummaryReport = (doc, report) => {
  // Add overall performance section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Performance', 20, 70);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Passed Candidates: ${report.overallPerformance?.totalPassed || 0}`, 20, 80);
  doc.text(`Examination GPA: ${report.overallPerformance?.examGpa || '0.00'}`, 120, 80);

  // Add division summary table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Division Summary', 20, 95);

  const divisionSummary = report.divisionSummary || {
    'I': 0,
    'II': 0,
    'III': 0,
    'IV': 0,
    '0': 0
  };

  const totalStudents = report.students?.length || 0;

  doc.autoTable({
    head: [['REGISTERED', 'ABSENT', 'SAT', 'DIV I', 'DIV II', 'DIV III', 'DIV IV', 'DIV 0']],
    body: [[
      totalStudents,
      0,
      totalStudents,
      divisionSummary.I || 0,
      divisionSummary.II || 0,
      divisionSummary.III || 0,
      divisionSummary.IV || 0,
      divisionSummary['0'] || 0
    ]],
    startY: 100,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [70, 70, 70], textColor: 255, fontStyle: 'bold' }
  });

  // Add subject-wise performance summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject-Wise Performance Summary', 20, doc.autoTable.previous.finalY + 20);

  const subjectPerformance = report.subjectPerformance || {};
  const subjectRows = Object.values(subjectPerformance).map(subject => [
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

  doc.autoTable({
    head: [['SUBJECT NAME', 'REG', 'A', 'B', 'C', 'D', 'E', 'S', 'F', 'PASS', 'GPA']],
    body: subjectRows,
    startY: doc.autoTable.previous.finalY + 25,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [70, 70, 70], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 40 } // Subject Name
    }
  });

  // Add approvals section
  const finalY = doc.autoTable.previous.finalY + 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('APPROVED BY', 20, finalY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ACADEMIC TEACHER NAME : ___________________________', 20, finalY + 15);
  doc.text('SIGN: ___________________________', 20, finalY + 25);

  doc.text('HEAD OF SCHOOL NAME   : ___________________________', 20, finalY + 45);
  doc.text('SIGN: ___________________________', 20, finalY + 55);

  // Add page number to footer
  const pageNumber = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.text(
    `Page ${pageNumber}`,
    20,
    doc.internal.pageSize.height - 10
  );

  // Add school name to footer
  doc.text(
    'Agape Lutheran Junior Seminary',
    doc.internal.pageSize.width / 2,
    doc.internal.pageSize.height - 10,
    { align: 'center' }
  );
};


