import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

/**
 * Generate a PDF file from the A-Level report data
 * @param {Object} reportData - The report data
 * @param {string} reportTitle - The title of the report
 * @returns {jsPDF} - The PDF document
 */
export const generateALevelReportPDF = (reportData, reportTitle) => {
  // Create a new PDF document
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  
  // Set the title
  doc.setFontSize(16);
  doc.text(reportTitle, pageWidth / 2, margin, { align: 'center' });
  
  // Add school information
  doc.setFontSize(12);
  doc.text('Evangelical Lutheran Church in Tanzania - Northern Diocese', pageWidth / 2, margin + 10, { align: 'center' });
  doc.text('St. John Vianney Secondary School', pageWidth / 2, margin + 15, { align: 'center' });
  doc.text('PO Box 8882, Moshi, Tanzania', pageWidth / 2, margin + 20, { align: 'center' });
  doc.text(`CLASS: ${reportData.className} | EXAM: ${reportData.examName} | YEAR: ${reportData.year}`, pageWidth / 2, margin + 25, { align: 'center' });
  
  // Add division summary
  doc.setFontSize(14);
  doc.text('Division Summary', margin, margin + 35);
  
  const divisionSummary = reportData.divisionSummary || { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 };
  const totalStudents = reportData.students?.length || 0;
  
  doc.autoTable({
    startY: margin + 40,
    head: [['REGISTERED', 'ABSENT', 'SAT', 'DIV I', 'DIV II', 'DIV III', 'DIV IV', 'DIV 0']],
    body: [
      [
        totalStudents,
        0,
        totalStudents,
        divisionSummary['I'] || 0,
        divisionSummary['II'] || 0,
        divisionSummary['III'] || 0,
        divisionSummary['IV'] || 0,
        divisionSummary['0'] || 0
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 }
  });
  
  // Get all unique subjects
  const uniqueSubjects = reportData.subjects.map(subject => subject.name);
  
  // Add student results
  doc.setFontSize(14);
  doc.text('Student Results', margin, doc.autoTable.previous.finalY + 10);
  
  // Prepare the table headers
  const headers = ['NO.', 'STUDENT NAME', 'SEX', 'POINTS', 'DIVISION', ...uniqueSubjects, 'TOTAL', 'AVERAGE', 'RANK'];
  
  // Prepare the table data
  const tableData = reportData.students.map((student, index) => {
    const rowData = [
      index + 1,
      student.studentName || `${student.firstName} ${student.lastName}`,
      student.sex || student.gender || '-',
      student.points || '-',
      student.division || '-'
    ];
    
    // Add subject marks
    uniqueSubjects.forEach(subjectName => {
      const subjectResult = student.subjectResults?.find(sr => sr.subject?.name === subjectName);
      rowData.push(subjectResult?.marks !== undefined && subjectResult?.marks !== null ? subjectResult.marks : '-');
    });
    
    // Add summary columns
    rowData.push(student.totalMarks || '-');
    rowData.push(student.averageMarks || '-');
    rowData.push(student.rank || '-');
    
    return rowData;
  });
  
  // Add the student results table
  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 15,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10 }, // NO.
      1: { cellWidth: 30 }, // STUDENT NAME
      2: { cellWidth: 10 }, // SEX
      3: { cellWidth: 15 }, // POINTS
      4: { cellWidth: 15 }, // DIVISION
    }
  });
  
  // Add subject performance summary
  if (doc.autoTable.previous.finalY + 50 > pageHeight) {
    doc.addPage();
  }
  
  doc.setFontSize(14);
  doc.text('Subject Performance Summary', margin, doc.autoTable.previous.finalY + 10);
  
  // Prepare the subject performance data
  const subjectPerformanceHeaders = ['SUBJECT NAME', 'REG', 'A', 'B', 'C', 'D', 'E', 'S', 'F', 'PASS', 'GPA'];
  const subjectPerformanceData = Object.entries(reportData.subjectPerformance || {}).map(([key, subject]) => [
    subject.name,
    subject.registered,
    subject.grades?.A || 0,
    subject.grades?.B || 0,
    subject.grades?.C || 0,
    subject.grades?.D || 0,
    subject.grades?.E || 0,
    subject.grades?.S || 0,
    subject.grades?.F || 0,
    subject.passed,
    subject.gpa
  ]);
  
  // Add the subject performance table
  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 15,
    head: [subjectPerformanceHeaders],
    body: subjectPerformanceData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 }
  });
  
  // Add overall performance
  doc.setFontSize(14);
  doc.text('Overall Performance', margin, doc.autoTable.previous.finalY + 10);
  
  const overallPerformanceHeaders = ['TOTAL STUDENTS', 'TOTAL PASSED', 'EXAM GPA'];
  const overallPerformanceData = [
    [
      totalStudents,
      reportData.overallPerformance?.totalPassed || 0,
      reportData.overallPerformance?.examGpa || 'N/A'
    ]
  ];
  
  // Add the overall performance table
  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 15,
    head: [overallPerformanceHeaders],
    body: overallPerformanceData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 }
  });
  
  // Add approvals section
  if (doc.autoTable.previous.finalY + 50 > pageHeight) {
    doc.addPage();
  }
  
  doc.setFontSize(14);
  doc.text('APPROVED BY', margin, doc.autoTable.previous.finalY + 15);
  
  doc.setFontSize(12);
  doc.text('ACADEMIC TEACHER NAME: _______________________', margin, doc.autoTable.previous.finalY + 25);
  doc.text('SIGN: _______________________', margin, doc.autoTable.previous.finalY + 35);
  
  doc.text('HEAD OF SCHOOL NAME: _______________________', pageWidth - margin - 100, doc.autoTable.previous.finalY + 25);
  doc.text('SIGN: _______________________', pageWidth - margin - 100, doc.autoTable.previous.finalY + 35);
  
  return doc;
};

/**
 * Generate an Excel file from the A-Level report data
 * @param {Object} reportData - The report data
 * @param {string} reportTitle - The title of the report
 * @returns {Blob} - The Excel file as a Blob
 */
export const generateALevelReportExcel = (reportData, reportTitle) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Get all unique subjects
  const uniqueSubjects = reportData.subjects.map(subject => subject.name);
  
  // Create the division summary worksheet
  const divisionSummary = reportData.divisionSummary || { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 };
  const totalStudents = reportData.students?.length || 0;
  
  const divisionSummaryData = [
    ['DIVISION SUMMARY'],
    ['REGISTERED', 'ABSENT', 'SAT', 'DIV I', 'DIV II', 'DIV III', 'DIV IV', 'DIV 0'],
    [
      totalStudents,
      0,
      totalStudents,
      divisionSummary['I'] || 0,
      divisionSummary['II'] || 0,
      divisionSummary['III'] || 0,
      divisionSummary['IV'] || 0,
      divisionSummary['0'] || 0
    ]
  ];
  
  const divisionSummaryWs = XLSX.utils.aoa_to_sheet(divisionSummaryData);
  XLSX.utils.book_append_sheet(wb, divisionSummaryWs, 'Division Summary');
  
  // Create the student results worksheet
  const studentResultsHeaders = ['NO.', 'STUDENT NAME', 'SEX', 'POINTS', 'DIVISION', ...uniqueSubjects, 'TOTAL', 'AVERAGE', 'RANK'];
  
  const studentResultsData = [
    ['STUDENT RESULTS'],
    studentResultsHeaders,
    ...reportData.students.map((student, index) => {
      const rowData = [
        index + 1,
        student.studentName || `${student.firstName} ${student.lastName}`,
        student.sex || student.gender || '-',
        student.points || '-',
        student.division || '-'
      ];
      
      // Add subject marks
      uniqueSubjects.forEach(subjectName => {
        const subjectResult = student.subjectResults?.find(sr => sr.subject?.name === subjectName);
        rowData.push(subjectResult?.marks !== undefined && subjectResult?.marks !== null ? subjectResult.marks : '-');
      });
      
      // Add summary columns
      rowData.push(student.totalMarks || '-');
      rowData.push(student.averageMarks || '-');
      rowData.push(student.rank || '-');
      
      return rowData;
    })
  ];
  
  const studentResultsWs = XLSX.utils.aoa_to_sheet(studentResultsData);
  XLSX.utils.book_append_sheet(wb, studentResultsWs, 'Student Results');
  
  // Create the subject performance worksheet
  const subjectPerformanceHeaders = ['SUBJECT NAME', 'REG', 'A', 'B', 'C', 'D', 'E', 'S', 'F', 'PASS', 'GPA'];
  
  const subjectPerformanceData = [
    ['SUBJECT PERFORMANCE SUMMARY'],
    subjectPerformanceHeaders,
    ...Object.entries(reportData.subjectPerformance || {}).map(([key, subject]) => [
      subject.name,
      subject.registered,
      subject.grades?.A || 0,
      subject.grades?.B || 0,
      subject.grades?.C || 0,
      subject.grades?.D || 0,
      subject.grades?.E || 0,
      subject.grades?.S || 0,
      subject.grades?.F || 0,
      subject.passed,
      subject.gpa
    ])
  ];
  
  const subjectPerformanceWs = XLSX.utils.aoa_to_sheet(subjectPerformanceData);
  XLSX.utils.book_append_sheet(wb, subjectPerformanceWs, 'Subject Performance');
  
  // Create the overall performance worksheet
  const overallPerformanceHeaders = ['TOTAL STUDENTS', 'TOTAL PASSED', 'EXAM GPA'];
  
  const overallPerformanceData = [
    ['OVERALL PERFORMANCE'],
    overallPerformanceHeaders,
    [
      totalStudents,
      reportData.overallPerformance?.totalPassed || 0,
      reportData.overallPerformance?.examGpa || 'N/A'
    ]
  ];
  
  const overallPerformanceWs = XLSX.utils.aoa_to_sheet(overallPerformanceData);
  XLSX.utils.book_append_sheet(wb, overallPerformanceWs, 'Overall Performance');
  
  // Add report information worksheet
  const reportInfoData = [
    ['REPORT INFORMATION'],
    ['School', 'St. John Vianney Secondary School'],
    ['Address', 'PO Box 8882, Moshi, Tanzania'],
    ['Class', reportData.className],
    ['Exam', reportData.examName],
    ['Year', reportData.year],
    ['Education Level', reportData.educationLevel === 'A_LEVEL' ? 'A-Level' : 'O-Level']
  ];
  
  const reportInfoWs = XLSX.utils.aoa_to_sheet(reportInfoData);
  XLSX.utils.book_append_sheet(wb, reportInfoWs, 'Report Info');
  
  // Generate the Excel file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  
  // Convert to Blob
  return new Blob([wbout], { type: 'application/octet-stream' });
};

/**
 * Download a PDF file
 * @param {jsPDF} doc - The PDF document
 * @param {string} filename - The filename
 */
export const downloadPDF = (doc, filename) => {
  doc.save(filename);
};

/**
 * Download an Excel file
 * @param {Blob} blob - The Excel file as a Blob
 * @param {string} filename - The filename
 */
export const downloadExcel = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Print the report
 * @param {string} reportId - The ID of the report element
 */
export const printReport = (reportId) => {
  const reportElement = document.getElementById(reportId);
  if (!reportElement) {
    console.error(`Element with ID ${reportId} not found`);
    return;
  }
  
  html2canvas(reportElement).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    window.open(pdf.output('bloburl'), '_blank');
  });
};
