const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper function to get remarks based on grade
function getRemarks(grade) {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Satisfactory';
    case 'F': return 'Fail';
    default: return 'N/A';
  }
}

// Helper function to calculate GPA from grade distribution
function calculateGPA(gradeDistribution) {
  const totalStudents = Object.values(gradeDistribution).reduce((sum, count) => sum + count, 0);
  if (totalStudents === 0) return '---';
  
  const gradePoints = {
    'A': 1,
    'B': 2,
    'C': 3,
    'D': 4,
    'F': 5
  };
  
  let weightedSum = 0;
  for (const [grade, count] of Object.entries(gradeDistribution)) {
    weightedSum += gradePoints[grade] * count;
  }
  
  return (weightedSum / totalStudents).toFixed(4);
}

/**
 * Generate a class result report PDF
 * @param {Object} report - The report data
 * @param {Object} res - Express response object to pipe the PDF to
 */
function generateClassResultPDF(report, res) {
  // Create a new PDF document
  const doc = new PDFDocument({ 
    margin: 30,
    size: 'A3',
    layout: 'landscape'
  });
  
  // Pipe the PDF to the response
  doc.pipe(res);
  
  // Set font
  doc.font('Helvetica');
  
  // Add header
  doc.fontSize(16).text(`${report.examName || 'OPEN TEST'} RESULT - ${new Date().getFullYear()}`, { align: 'center' });
  doc.moveDown(0.5);
  
  // Add class information
  doc.fontSize(12).text(`Class Name : ${report.class?.fullName || 'Unknown'}`, { align: 'left' });
  doc.moveDown(1);
  
  // Get all subjects from the report
  const subjects = [];
  if (report.subjectStatistics && Array.isArray(report.subjectStatistics)) {
    report.subjectStatistics.forEach(stat => {
      if (stat.name) {
        subjects.push(stat.name);
      }
    });
  }
  
  // Calculate page width and column widths
  const pageWidth = doc.page.width - 60; // Accounting for margins
  const numCol = 30; // Number of columns (adjust as needed)
  const rankWidth = 20;
  const nameWidth = 150;
  const sexWidth = 20;
  const subjectWidth = 40; // Width for each subject (marks + grade)
  const totalWidth = 40;
  const avgWidth = 40;
  const divWidth = 20;
  const pointsWidth = 20;
  const rankWidth2 = 20;
  
  // Draw table header
  let yPos = doc.y;
  let xPos = 30;
  
  // Draw header row
  doc.fontSize(10).text('#', xPos, yPos, { width: rankWidth, align: 'center' });
  xPos += rankWidth;
  
  doc.text('STUDENT NAME', xPos, yPos, { width: nameWidth, align: 'center' });
  xPos += nameWidth;
  
  doc.text('SEX', xPos, yPos, { width: sexWidth, align: 'center' });
  xPos += sexWidth;
  
  // Subject headers
  subjects.forEach(subject => {
    doc.text(subject, xPos, yPos, { width: subjectWidth, align: 'center' });
    xPos += subjectWidth;
  });
  
  // Summary headers
  doc.text('TOTAL', xPos, yPos, { width: totalWidth, align: 'center' });
  xPos += totalWidth;
  
  doc.text('AVG', xPos, yPos, { width: avgWidth, align: 'center' });
  xPos += avgWidth;
  
  doc.text('DIV', xPos, yPos, { width: divWidth, align: 'center' });
  xPos += divWidth;
  
  doc.text('PTS', xPos, yPos, { width: pointsWidth, align: 'center' });
  xPos += pointsWidth;
  
  doc.text('RANK', xPos, yPos, { width: rankWidth2, align: 'center' });
  
  // Draw horizontal line
  doc.moveTo(30, yPos - 5)
    .lineTo(doc.page.width - 30, yPos - 5)
    .stroke();
  
  doc.moveTo(30, yPos + 15)
    .lineTo(doc.page.width - 30, yPos + 15)
    .stroke();
  
  // Draw student rows
  yPos += 20;
  
  // Sort students by rank
  const students = [...(report.students || [])].sort((a, b) => (a.rank || 999) - (b.rank || 999));
  
  students.forEach((student, index) => {
    xPos = 30;
    
    // Draw student number
    doc.fontSize(9).text(String(index + 1), xPos, yPos, { width: rankWidth, align: 'center' });
    xPos += rankWidth;
    
    // Draw student name
    doc.text(student.name || 'Unknown', xPos, yPos, { width: nameWidth });
    xPos += nameWidth;
    
    // Draw student sex (assuming it's available in the data)
    const sex = student.gender === 'Male' ? 'M' : student.gender === 'Female' ? 'F' : '-';
    doc.text(sex, xPos, yPos, { width: sexWidth, align: 'center' });
    xPos += sexWidth;
    
    // Map of subject results for quick lookup
    const subjectResultsMap = {};
    (student.results || []).forEach(result => {
      const subjectName = result.subject?.name || result.subjectId?.name || 'Unknown';
      subjectResultsMap[subjectName] = result;
    });
    
    // Draw subject marks and grades
    subjects.forEach(subjectName => {
      const result = subjectResultsMap[subjectName];
      if (result) {
        const marks = result.marks || result.marksObtained || 0;
        const grade = result.grade || '-';
        doc.text(`${marks}`, xPos, yPos, { width: subjectWidth / 2, align: 'center' });
        doc.text(`${grade}`, xPos + subjectWidth / 2, yPos, { width: subjectWidth / 2, align: 'center' });
      } else {
        doc.text('-', xPos, yPos, { width: subjectWidth / 2, align: 'center' });
        doc.text('-', xPos + subjectWidth / 2, yPos, { width: subjectWidth / 2, align: 'center' });
      }
      xPos += subjectWidth;
    });
    
    // Draw summary data
    const totalMarks = student.totalMarks || 0;
    const averageMarks = student.averageMarks || '0.00';
    const division = student.division?.replace('Division ', '') || '0';
    const points = student.bestSevenPoints || 0;
    const rank = student.rank || '-';
    
    doc.text(String(totalMarks), xPos, yPos, { width: totalWidth, align: 'center' });
    xPos += totalWidth;
    
    doc.text(String(averageMarks), xPos, yPos, { width: avgWidth, align: 'center' });
    xPos += avgWidth;
    
    doc.text(division, xPos, yPos, { width: divWidth, align: 'center' });
    xPos += divWidth;
    
    doc.text(String(points), xPos, yPos, { width: pointsWidth, align: 'center' });
    xPos += pointsWidth;
    
    doc.text(String(rank), xPos, yPos, { width: rankWidth2, align: 'center' });
    
    yPos += 15;
    
    // Add a new page if we're near the bottom
    if (yPos > doc.page.height - 150) {
      doc.addPage({ size: 'A3', layout: 'landscape', margin: 30 });
      yPos = 50;
    }
  });
  
  // Draw final horizontal line
  doc.moveTo(30, yPos - 5)
    .lineTo(doc.page.width - 30, yPos - 5)
    .stroke();
  
  // Add some space
  yPos += 30;
  
  // Add results summary section
  doc.fontSize(12).text('RESULTS SUMMARY', 30, yPos, { align: 'left' });
  yPos += 20;
  
  // Draw summary table header
  xPos = 30;
  
  // Calculate summary table column widths
  const summaryNumWidth = 20;
  const summarySubjectWidth = 150;
  const summaryStudentsWidth = 80;
  const summaryGradeWidth = 40;
  const summaryGpaWidth = 40;
  
  // Draw summary header
  doc.fontSize(10).text('#', xPos, yPos, { width: summaryNumWidth, align: 'center' });
  xPos += summaryNumWidth;
  
  doc.text('SUBJECT NAME', xPos, yPos, { width: summarySubjectWidth, align: 'center' });
  xPos += summarySubjectWidth;
  
  doc.text('NO OF STUDENTS', xPos, yPos, { width: summaryStudentsWidth, align: 'center' });
  xPos += summaryStudentsWidth;
  
  doc.text('PERFORMANCE', xPos, yPos, { width: summaryGradeWidth * 5, align: 'center' });
  xPos += summaryGradeWidth * 5;
  
  doc.text('GPA', xPos, yPos, { width: summaryGpaWidth, align: 'center' });
  
  // Draw second header row for grades
  yPos += 15;
  xPos = 30 + summaryNumWidth + summarySubjectWidth + summaryStudentsWidth;
  
  doc.text('A', xPos, yPos, { width: summaryGradeWidth, align: 'center' });
  xPos += summaryGradeWidth;
  
  doc.text('B', xPos, yPos, { width: summaryGradeWidth, align: 'center' });
  xPos += summaryGradeWidth;
  
  doc.text('C', xPos, yPos, { width: summaryGradeWidth, align: 'center' });
  xPos += summaryGradeWidth;
  
  doc.text('D', xPos, yPos, { width: summaryGradeWidth, align: 'center' });
  xPos += summaryGradeWidth;
  
  doc.text('F', xPos, yPos, { width: summaryGradeWidth, align: 'center' });
  
  // Draw horizontal lines
  doc.moveTo(30, yPos - 20)
    .lineTo(doc.page.width - 30, yPos - 20)
    .stroke();
  
  doc.moveTo(30, yPos + 15)
    .lineTo(doc.page.width - 30, yPos + 15)
    .stroke();
  
  // Draw subject summary rows
  yPos += 20;
  
  report.subjectStatistics.forEach((subject, index) => {
    xPos = 30;
    
    // Draw subject number
    doc.fontSize(9).text(String(index + 1), xPos, yPos, { width: summaryNumWidth, align: 'center' });
    xPos += summaryNumWidth;
    
    // Draw subject name
    doc.text(subject.name || 'Unknown', xPos, yPos, { width: summarySubjectWidth });
    xPos += summarySubjectWidth;
    
    // Draw number of students
    const numStudents = subject.studentCount || 0;
    doc.text(String(numStudents), xPos, yPos, { width: summaryStudentsWidth, align: 'center' });
    xPos += summaryStudentsWidth;
    
    // Draw grade distribution
    const grades = subject.grades || { A: 0, B: 0, C: 0, D: 0, F: 0 };
    
    doc.text(String(grades.A || 0), xPos, yPos, { width: summaryGradeWidth, align: 'center' });
    xPos += summaryGradeWidth;
    
    doc.text(String(grades.B || 0), xPos, yPos, { width: summaryGradeWidth, align: 'center' });
    xPos += summaryGradeWidth;
    
    doc.text(String(grades.C || 0), xPos, yPos, { width: summaryGradeWidth, align: 'center' });
    xPos += summaryGradeWidth;
    
    doc.text(String(grades.D || 0), xPos, yPos, { width: summaryGradeWidth, align: 'center' });
    xPos += summaryGradeWidth;
    
    doc.text(String(grades.F || 0), xPos, yPos, { width: summaryGradeWidth, align: 'center' });
    xPos += summaryGradeWidth;
    
    // Calculate and draw GPA
    const gpa = calculateGPA(grades);
    doc.text(gpa, xPos, yPos, { width: summaryGpaWidth, align: 'center' });
    
    yPos += 15;
  });
  
  // Draw final horizontal line
  doc.moveTo(30, yPos - 5)
    .lineTo(doc.page.width - 30, yPos - 5)
    .stroke();
  
  // Add approval section
  yPos += 20;
  doc.fontSize(12).text('APPROVED BY', 30, yPos, { align: 'left' });
  yPos += 20;
  
  // Academic teacher approval
  doc.fontSize(10).text('1. ACADEMIC TEACHER', 30, yPos);
  doc.text('NAME :', 200, yPos);
  doc.moveTo(250, yPos + 5).lineTo(450, yPos + 5).stroke();
  
  yPos += 15;
  doc.text('SIGN :', 200, yPos);
  doc.moveTo(250, yPos + 5).lineTo(450, yPos + 5).stroke();
  
  // Head of school approval
  yPos += 20;
  doc.fontSize(10).text('2. HEAD OF SCHOOL', 30, yPos);
  doc.text('NAME :', 200, yPos);
  doc.moveTo(250, yPos + 5).lineTo(450, yPos + 5).stroke();
  doc.text('SIGN :', 500, yPos);
  doc.moveTo(550, yPos + 5).lineTo(750, yPos + 5).stroke();
  
  // Finalize the PDF
  doc.end();
}

/**
 * Generate a student result report PDF
 * @param {Object} report - The report data
 * @param {Object} res - Express response object to pipe the PDF to
 */
function generateStudentResultPDF(report, res) {
  // Create a new PDF document
  const doc = new PDFDocument({ margin: 50 });
  
  // Pipe the PDF to the response
  doc.pipe(res);
  
  // Set font
  doc.font('Helvetica');
  
  // Add school header
  doc.fontSize(18).text('St. John Vianney Secondary School', { align: 'center' });
  doc.fontSize(14).text('Student Result Report', { align: 'center' });
  doc.fontSize(12).text(`Academic Year: ${report.academicYear || 'Unknown'}`, { align: 'center' });
  doc.moveDown();
  
  // Add student information
  const studentName = report.studentDetails?.name || report.student?.fullName || 'Unknown';
  const className = report.studentDetails?.class || report.class?.fullName || 'Unknown';
  const examName = report.examName || 'Unknown';
  const term = report.exam?.term || 'Unknown';
  
  doc.fontSize(12).text(`Name: ${studentName}`, { continued: true });
  doc.text(`Class: ${className}`, { align: 'right' });
  doc.text(`Exam: ${examName}`, { continued: true });
  doc.text(`Term: ${term}`, { align: 'right' });
  doc.moveDown(2);
  
  // Add subject results table
  doc.fontSize(14).text('Subject Results', { align: 'center' });
  doc.moveDown();
  
  // Table headers
  const tableTop = doc.y;
  const tableLeft = 50;
  const colWidth = (doc.page.width - 100) / 5;
  
  doc.fontSize(10).text('Subject', tableLeft, tableTop);
  doc.text('Marks', tableLeft + colWidth, tableTop, { width: colWidth, align: 'center' });
  doc.text('Grade', tableLeft + colWidth * 2, tableTop, { width: colWidth, align: 'center' });
  doc.text('Points', tableLeft + colWidth * 3, tableTop, { width: colWidth, align: 'center' });
  doc.text('Remarks', tableLeft + colWidth * 4, tableTop);
  
  doc.moveTo(tableLeft, tableTop - 5)
    .lineTo(tableLeft + colWidth * 5, tableTop - 5)
    .stroke();
  
  doc.moveTo(tableLeft, tableTop + 15)
    .lineTo(tableLeft + colWidth * 5, tableTop + 15)
    .stroke();
  
  // Table rows
  let rowTop = tableTop + 20;
  
  // Use either results or subjectResults based on what's available
  const subjectResults = report.results || report.subjectResults || [];
  
  subjectResults.forEach(result => {
    const subjectName = result.subject?.name || result.subject || 'Unknown';
    const marks = result.marks !== undefined ? result.marks : (result.marksObtained || 0);
    const grade = result.grade || 'F';
    const points = result.points !== undefined ? result.points : 5;
    const remarks = result.remarks || getRemarks(grade);
    
    doc.text(subjectName, tableLeft, rowTop);
    doc.text(String(marks), tableLeft + colWidth, rowTop, { width: colWidth, align: 'center' });
    doc.text(grade, tableLeft + colWidth * 2, rowTop, { width: colWidth, align: 'center' });
    doc.text(String(points), tableLeft + colWidth * 3, rowTop, { width: colWidth, align: 'center' });
    doc.text(remarks, tableLeft + colWidth * 4, rowTop);
    
    rowTop += 20;
    
    // Add a new page if we're near the bottom
    if (rowTop > doc.page.height - 100) {
      doc.addPage();
      rowTop = 50;
    }
  });
  
  // Add total row
  doc.moveTo(tableLeft, rowTop - 5)
    .lineTo(tableLeft + colWidth * 5, rowTop - 5)
    .stroke();
  
  const totalMarks = report.totalMarks !== undefined ? report.totalMarks : 
                    (report.summary?.totalMarks !== undefined ? report.summary.totalMarks : 0);
  const totalPoints = report.points !== undefined ? report.points : 
                     (report.summary?.totalPoints !== undefined ? report.summary.totalPoints : 0);
  
  doc.fontSize(10).text('Total', tableLeft, rowTop, { bold: true });
  doc.text(String(totalMarks), tableLeft + colWidth, rowTop, { width: colWidth, align: 'center', bold: true });
  doc.text('', tableLeft + colWidth * 2, rowTop, { width: colWidth, align: 'center' });
  doc.text(String(totalPoints), tableLeft + colWidth * 3, rowTop, { width: colWidth, align: 'center', bold: true });
  doc.text('Performance', tableLeft + colWidth * 4, rowTop);
  
  doc.moveTo(tableLeft, rowTop + 15)
    .lineTo(tableLeft + colWidth * 5, rowTop + 15)
    .stroke();
  
  rowTop += 30;
  
  // Add summary information
  doc.fontSize(14).text('Summary', 50, rowTop);
  doc.setFontSize(12);
  
  // Get summary information from the appropriate location in the report
  const averageMarks = report.averageMarks || report.summary?.averageMarks || '0';
  const division = report.division || report.summary?.division || '';
  const rank = report.rank || report.summary?.rank || 'N/A';
  const bestSevenPoints = report.bestSevenPoints || report.summary?.bestSevenPoints || '';
  
  // Add summary details
  rowTop += 20;
  doc.text(`Total Marks: ${totalMarks}`, 50, rowTop);
  rowTop += 15;
  doc.text(`Average Marks: ${averageMarks}%`, 50, rowTop);
  rowTop += 15;
  doc.text(`Total Points: ${totalPoints}`, 50, rowTop);
  rowTop += 15;
  doc.text(`Best Seven Points: ${bestSevenPoints}`, 50, rowTop);
  rowTop += 15;
  doc.text(`Division: ${division}`, 50, rowTop);
  rowTop += 15;
  doc.text(`Rank: ${rank}`, 50, rowTop);
  
  // Add grade distribution if available
  const gradeDistribution = report.gradeDistribution || report.summary?.gradeDistribution;
  if (gradeDistribution) {
    rowTop += 30;
    doc.fontSize(14).text('Grade Distribution', { align: 'center' });
    doc.moveDown();
    
    // Create a simple table for grade distribution
    const grades = ['A', 'B', 'C', 'D', 'F'];
    const distTableTop = doc.y;
    const distTableLeft = (doc.page.width - 200) / 2;
    const distColWidth = 100;
    
    doc.fontSize(10).text('Grade', distTableLeft, distTableTop);
    doc.text('Count', distTableLeft + distColWidth, distTableTop);
    
    doc.moveTo(distTableLeft, distTableTop - 5)
      .lineTo(distTableLeft + distColWidth * 2, distTableTop - 5)
      .stroke();
    
    doc.moveTo(distTableLeft, distTableTop + 15)
      .lineTo(distTableLeft + distColWidth * 2, distTableTop + 15)
      .stroke();
    
    let distRowTop = distTableTop + 20;
    
    grades.forEach(grade => {
      const count = gradeDistribution[grade] || 0;
      doc.text(grade, distTableLeft, distRowTop);
      doc.text(String(count), distTableLeft + distColWidth, distRowTop);
      distRowTop += 20;
    });
  }
  
  // Add footer
  doc.fontSize(8)
    .text(
      `Generated on ${new Date().toLocaleDateString()} - St. John Vianney Secondary School`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
  
  // Finalize the PDF
  doc.end();
}

module.exports = {
  generateClassResultPDF,
  generateStudentResultPDF
};
