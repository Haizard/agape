import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateExcelReport = async (data, className) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Results');

  // Set header
  worksheet.mergeCells('A1:S1');
  worksheet.getCell('A1').value = `OPEN TEST RESULT - ${new Date().getFullYear()}`;
  worksheet.getCell('A2').value = `Class Name: ${className}`;

  // Dynamic headers based on available subjects
  const baseHeaders = ['#', 'STUDENT NAME', 'SEX'];
  const subjectHeaders = data.subjects.flatMap(subject => [`${subject.name}`, 'Grade']);
  const summaryHeaders = ['TOTAL', 'AVG', 'DIV', 'POINTS', 'POS'];
  const headers = [...baseHeaders, ...subjectHeaders, ...summaryHeaders];

  worksheet.addRow(headers);

  // Add data dynamically based on available subjects
  data.students.forEach((student, index) => {
    const baseData = [index + 1, student.name, student.sex];
    const subjectData = student.subjects.flatMap(subject => [subject.marks, subject.grade]);
    const summaryData = [student.total, student.average, student.division, student.points, student.position];
    
    worksheet.addRow([...baseData, ...subjectData, ...summaryData]);
  });

  // Add summary section
  worksheet.addRow([]);
  worksheet.addRow(['RESULTS SUMMARY']);
  worksheet.addRow(['#', 'SUBJECT NAME', 'NO OF STUDENTS', 'A', 'B', 'C', 'D', 'F', 'GPA']);

  data.summary.forEach((subject, index) => {
    worksheet.addRow([
      index + 1,
      subject.name,
      subject.totalStudents,
      subject.gradeDistribution.A,
      subject.gradeDistribution.B,
      subject.gradeDistribution.C,
      subject.gradeDistribution.D,
      subject.gradeDistribution.F,
      subject.gpa
    ]);
  });

  // Style the worksheet
  worksheet.getColumn(2).width = 30;
  worksheet.getRow(1).font = { bold: true, size: 14 };
  worksheet.getRow(3).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export const generatePDFReport = (data, className) => {
  const doc = new jsPDF('landscape');
  
  // Add title
  doc.setFontSize(16);
  doc.text(`OPEN TEST RESULT - ${new Date().getFullYear()}`, 14, 15);
  doc.setFontSize(12);
  doc.text(`Class Name: ${className}`, 14, 25);

  // Dynamic headers based on available subjects
  const baseHeaders = ['#', 'Name', 'Sex'];
  const subjectHeaders = data.subjects.map(subject => subject.name);
  const summaryHeaders = ['Total', 'Avg', 'Div', 'Pos'];
  const studentHeaders = [baseHeaders.concat(subjectHeaders).concat(summaryHeaders)];

  const studentData = data.students.map((student, index) => {
    const baseData = [index + 1, student.name, student.sex];
    const subjectData = student.subjects.map(subject => `${subject.marks}(${subject.grade})`);
    const summaryData = [student.total, student.average, student.division, student.position];
    
    return [...baseData, ...subjectData, ...summaryData];
  });

  doc.autoTable({
    head: studentHeaders,
    body: studentData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [70, 70, 70] },
    columnStyles: {
      0: { cellWidth: 10 }, // # column
      1: { cellWidth: 40 }, // Name column
      2: { cellWidth: 15 }, // Sex column
    },
    didDrawPage: function(data) {
      // Add header to each page
      doc.setFontSize(16);
      doc.text(`OPEN TEST RESULT - ${new Date().getFullYear()}`, 14, 15);
    }
  });

  // Add summary table
  doc.addPage();
  doc.text('RESULTS SUMMARY', 14, 15);

  const summaryHeaders = [
    ['#', 'Subject', 'Total', 'A', 'B', 'C', 'D', 'F', 'GPA']
  ];

  const summaryData = data.summary.map((subject, index) => [
    index + 1,
    subject.name,
    subject.totalStudents,
    subject.gradeDistribution.A,
    subject.gradeDistribution.B,
    subject.gradeDistribution.C,
    subject.gradeDistribution.D,
    subject.gradeDistribution.F,
    subject.gpa
  ]);

  doc.autoTable({
    head: summaryHeaders,
    body: summaryData,
    startY: 25,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [70, 70, 70] }
  });

  return doc;
};
