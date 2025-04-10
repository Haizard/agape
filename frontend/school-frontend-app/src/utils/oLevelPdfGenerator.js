import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate a PDF for an O-Level student result report
 * @param {Object} report - The normalized student result report
 * @returns {jsPDF} - The generated PDF document
 */
export const generateOLevelStudentResultPDF = (report) => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Add school header
  doc.setFontSize(16);
  doc.text('Evangelical Lutheran Church in Tanzania - Northern Diocese', 105, 15, { align: 'center' });
  doc.setFontSize(18);
  doc.text('Agape Lutheran Junior Seminary', 105, 25, { align: 'center' });

  // Add contact information
  doc.setFontSize(10);
  doc.text('P.O.BOX 8882,\nMoshi, Tanzania.', 20, 35);

  // Add Lutheran Church logo
  const logoUrl = `${window.location.origin}/images/lutheran_logo.png`;
  try {
    doc.addImage(logoUrl, 'PNG', 85, 30, 30, 30);
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
  }

  // Add right-side contact information
  doc.setFontSize(10);
  doc.text('Mobile phone: 0759767735\nEmail: infoagapeseminary@gmail.co', 170, 35, { align: 'right' });

  // Add report title
  doc.setFontSize(14);
  doc.text('O-LEVEL STUDENT RESULT REPORT', 105, 55, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Academic Year: ${report.academicYear || ''}`, 105, 65, { align: 'center' });

  // Add student information
  doc.setFontSize(12);
  doc.text(`Name: ${report.student?.fullName || report.studentDetails?.name || ''}`, 20, 80);
  doc.text(`Class: ${report.class?.fullName || report.studentDetails?.class || ''}`, 20, 90);
  doc.text(`Roll Number: ${report.student?.rollNumber || report.studentDetails?.rollNumber || ''}`, 20, 100);
  doc.text(`Rank: ${report.rank || report.studentDetails?.rank || 'N/A'} of ${report.totalStudents || report.studentDetails?.totalStudents || 'N/A'}`, 20, 110);

  // Add exam information
  doc.text(`Exam: ${report.exam?.name || report.examName || ''}`, 140, 80);
  doc.text(`Term: ${report.exam?.term || ''}`, 140, 90);
  doc.text(`Gender: ${report.student?.gender || report.studentDetails?.gender || ''}`, 140, 100);

  // Add subject results table
  const tableData = [];

  // Use either results or subjectResults based on what's available
  const subjectResults = report.results || report.subjectResults || [];

  // Map the subject results to table rows
  for (const result of subjectResults) {
    const subjectName = result.subject?.name || result.subject || '';
    const marks = result.marks !== undefined ? result.marks : (result.marksObtained || 0);
    const grade = result.grade || '';
    const points = result.points !== undefined ? result.points : '';
    const remarks = result.remarks || '';

    tableData.push([subjectName, marks, grade, points, remarks]);
  }

  // Add total row
  const totalMarks = report.totalMarks !== undefined ? report.totalMarks :
                    (report.summary?.totalMarks !== undefined ? report.summary.totalMarks : 0);
  const totalPoints = report.points !== undefined ? report.points :
                     (report.summary?.totalPoints !== undefined ? report.summary.totalPoints : 0);
  const bestSevenPoints = report.bestSevenPoints !== undefined ? report.bestSevenPoints :
                         (report.summary?.bestSevenPoints !== undefined ? report.summary.bestSevenPoints : 0);

  // Calculate division based on best seven points (O-Level division system)
  const calculateDivision = (points) => {
    if (points >= 7 && points <= 14) return 'I';
    if (points >= 15 && points <= 21) return 'II';
    if (points >= 22 && points <= 25) return 'III';
    if (points >= 26 && points <= 32) return 'IV';
    return '0';
  };

  // Get division or calculate it if not provided
  const calculatedDivision = report.division || report.summary?.division || calculateDivision(bestSevenPoints);

  tableData.push([
    'Total',
    totalMarks,
    '',
    totalPoints,
    'Performance'
  ]);

  doc.autoTable({
    startY: 120,
    head: [['Subject', 'Marks', 'Grade', 'Points', 'Remarks']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    footStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 'auto' }
    }
  });

  // Add summary information
  const finalY = doc.lastAutoTable.finalY + 10;

  // Get summary data
  const averageMarks = report.averageMarks !== undefined ? report.averageMarks :
                      (report.summary?.averageMarks !== undefined ? report.summary.averageMarks : 0);
  // Use the previously calculated bestSevenPoints
  const displayDivision = calculatedDivision || 'N/A';
  const rank = report.rank !== undefined ? report.rank :
              (report.summary?.rank !== undefined ? report.summary.rank : 'N/A');

  // Add summary table
  doc.autoTable({
    startY: finalY,
    head: [['Average Marks', 'Best 7 Points', 'Division', 'Rank']],
    body: [[`${averageMarks}%`, bestSevenPoints, displayDivision, rank]],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10 }
  });

  // Add grade distribution
  const gradeDistribution = report.gradeDistribution || report.summary?.gradeDistribution;
  if (gradeDistribution) {
    doc.setFontSize(14);
    doc.text('Grade Distribution', 105, finalY + 70, { align: 'center' });

    const gradeData = Object.entries(gradeDistribution).map(([grade, count]) => [
      grade, count
    ]);

    doc.autoTable({
      startY: finalY + 75,
      head: [['Grade', 'Count']],
      body: gradeData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      margin: { left: 50, right: 50 },
    });
  }

  // Add division explanation
  doc.setFontSize(10);
  doc.text('Division Guide:', 20, finalY + 120);
  doc.text('Division I: 7-14 points | Division II: 15-21 points | Division III: 22-25 points | Division IV: 26-32 points | Division 0: 33+ points', 20, finalY + 130);

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 20,
      { align: 'center' }
    );
    doc.text(
      'Evangelical Lutheran Church in Tanzania - Northern Diocese',
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  return doc;
};

/**
 * Generate a PDF for an O-Level class result report
 * @param {Object} report - The normalized class result report
 * @returns {jsPDF} - The generated PDF document
 */
export const generateOLevelClassResultPDF = (report) => {
  // Create a new PDF document
  const doc = new jsPDF('landscape');

  // Add school header
  doc.setFontSize(16);
  doc.text('Evangelical Lutheran Church in Tanzania - Northern Diocese', 150, 15, { align: 'center' });
  doc.setFontSize(18);
  doc.text('Agape Lutheran Junior Seminary', 150, 25, { align: 'center' });

  // Add contact information
  doc.setFontSize(10);
  doc.text('P.O.BOX 8882,\nMoshi, Tanzania.', 20, 35);

  // Add Lutheran Church logo
  const logoUrl = `${window.location.origin}/images/lutheran_logo.png`;
  try {
    doc.addImage(logoUrl, 'PNG', 135, 30, 30, 30);
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
  }

  // Add right-side contact information
  doc.setFontSize(10);
  doc.text('Mobile phone: 0759767735\nEmail: infoagapeseminary@gmail.co', 280, 35, { align: 'right' });

  // Add report title
  doc.setFontSize(14);
  doc.text('O-LEVEL CLASS RESULT REPORT', 150, 55, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`${report.className || ''} ${report.section || ''} - ${report.examName || ''}`, 150, 65, { align: 'center' });
  doc.text(`Academic Year: ${report.academicYear || ''}`, 150, 75, { align: 'center' });

  // Add summary information
  doc.text(`Total Students: ${report.totalStudents || ''}`, 20, 90);
  doc.text(`Class Average: ${report.classAverage?.toFixed(2) || ''}%`, 100, 90);

  // Create table headers
  const headers = ['Rank', 'Student Name', 'Sex'];

  // Add subject headers
  if (report.subjects) {
    for (const subject of report.subjects) {
      headers.push(`${subject.name} (Marks)`);
      headers.push(`${subject.name} (Grade)`);
    }
  }

  // Add summary headers
  headers.push('Total', 'Average', 'Division', 'Points', 'Rank');

  // Create table data
  const tableData = [];

  if (report.students) {
    // Sort students by rank for downloaded reports
    const sortedStudents = [...report.students].sort((a, b) => {
      const rankA = Number.parseInt(a.rank, 10) || 0;
      const rankB = Number.parseInt(b.rank, 10) || 0;
      return rankA - rankB;
    });

    for (const student of sortedStudents) {
      const row = [
        student.rank || '',
        student.name || student.studentName || '',
        student.sex || ''
      ];

      // Add subject results
      if (report.subjects) {
        for (const subject of report.subjects) {
          const subjectResult = student.results?.find(
            result => result.subjectId === subject.id || result.subject === subject.name
          );

          if (subjectResult) {
            row.push(subjectResult.marks || subjectResult.marksObtained || '');
            row.push(subjectResult.grade || '');
          } else {
            row.push('-');
            row.push('-');
          }
        }
      }

      // Add summary data
      row.push(
        student.totalMarks || '',
        student.averageMarks || '',
        student.division || '',
        student.points || student.totalPoints || '',
        student.rank || ''
      );

      tableData.push(row);
    }
  }

  // Add the results table
  doc.autoTable({
    startY: 100,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 40 },
      2: { cellWidth: 15 }
    }
  });

  // Add division distribution
  const finalY = doc.lastAutoTable.finalY + 10;

  // Calculate division distribution
  const divisions = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 };

  if (report.students) {
    for (const student of report.students) {
      const div = student.division || '';
      if (div && divisions[div] !== undefined) {
        divisions[div]++;
      }
    }
  }

  const divisionData = Object.entries(divisions).map(([division, count]) => [
    `Division ${division}`,
    count,
    report.students?.length ? `${(count / report.students.length * 100).toFixed(1)}%` : '0%'
  ]);

  doc.autoTable({
    startY: finalY + 5,
    head: [['Division', 'Count', 'Percentage']],
    body: divisionData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    margin: { left: 100, right: 100 },
  });

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Page ${i} of ${pageCount}`,
      150,
      doc.internal.pageSize.height - 20,
      { align: 'center' }
    );
    doc.text(
      'Evangelical Lutheran Church in Tanzania - Northern Diocese',
      150,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  return doc;
};

export default {
  generateOLevelStudentResultPDF,
  generateOLevelClassResultPDF
};
