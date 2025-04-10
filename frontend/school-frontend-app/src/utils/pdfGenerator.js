import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate a PDF for a student result report
 * @param {Object} report - The normalized student result report
 * @returns {jsPDF} - The generated PDF document
 */
export const generateStudentResultPDF = (report) => {
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

  // Add logo placeholder (in a real implementation, you would add an actual logo)
  // doc.addImage(logoData, 'PNG', 85, 30, 30, 30);

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
  doc.text(`Name: ${report.student?.fullName || ''}`, 20, 80);
  doc.text(`Class: ${report.class?.fullName || ''}`, 20, 90);
  doc.text(`Roll Number: ${report.student?.rollNumber || ''}`, 20, 100);
  doc.text(`Rank: ${report.rank || 'N/A'} of ${report.totalStudents || 'N/A'}`, 20, 110);

  // Add exam information
  doc.text(`Exam: ${report.exam?.name || ''}`, 140, 80);
  doc.text(`Term: ${report.exam?.term || ''}`, 140, 90);
  doc.text(`Gender: ${report.student?.gender || ''}`, 140, 100);

  // Add subject results table
  const tableData = [];

  // Use either results or subjectResults based on what's available
  const subjectResults = report.results || report.subjectResults || [];

  // Map the subject results to table rows
  subjectResults.forEach(result => {
    const subjectName = result.subject?.name || result.subject || '';
    const marks = result.marks !== undefined ? result.marks : 0;
    const grade = result.grade || '';
    const points = result.points !== undefined ? result.points : '';
    const remarks = result.remarks || '';

    tableData.push([subjectName, marks, grade, points, remarks]);
  });

  // Add total row
  const totalMarks = report.totalMarks !== undefined ? report.totalMarks :
                    (report.summary?.totalMarks !== undefined ? report.summary.totalMarks : 0);
  const totalPoints = report.points !== undefined ? report.points :
                     (report.summary?.totalPoints !== undefined ? report.summary.totalPoints : 0);
  const grade = report.grade || (report.summary?.division ? report.summary.division.replace('Division ', '') : '');

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

  // Get summary information from the appropriate location in the report
  const averageMarks = report.averageMarks || report.summary?.averageMarks || '0';
  const division = report.division || report.summary?.division || '';
  const rank = report.rank || report.summary?.rank || 'N/A';
  const bestSevenPoints = report.bestSevenPoints || report.summary?.bestSevenPoints || '';

  // Add summary section title
  doc.setFontSize(14);
  doc.text('Summary', 20, finalY);
  doc.setFontSize(12);

  // Add summary details
  doc.text(`Total Marks: ${totalMarks}`, 20, finalY + 10);
  doc.text(`Average Marks: ${averageMarks}%`, 20, finalY + 20);
  doc.text(`Total Points: ${totalPoints}`, 20, finalY + 30);
  doc.text(`Best Seven Points: ${bestSevenPoints}`, 20, finalY + 40);
  doc.text(`Division: ${division}`, 20, finalY + 50);
  doc.text(`Rank: ${rank}`, 20, finalY + 60);

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
 * Generate a PDF for a class result report
 * @param {Object} report - The normalized class result report
 * @returns {jsPDF} - The generated PDF document
 */
export const generateClassResultPDF = (report) => {
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

  // Add logo placeholder (in a real implementation, you would add an actual logo)
  // doc.addImage(logoData, 'PNG', 85, 30, 30, 30);

  // Add right-side contact information
  doc.setFontSize(10);
  doc.text('Mobile phone: 0759767735\nEmail: infoagapeseminary@gmail.co', 280, 35, { align: 'right' });

  // Add report title
  doc.setFontSize(14);
  doc.text(`${report.educationLevel === 'A_LEVEL' ? 'A-LEVEL' : 'O-LEVEL'} CLASS RESULT REPORT`, 150, 55, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`${report.className || ''} ${report.section || ''} - ${report.examName || ''}`, 150, 65, { align: 'center' });
  doc.text(`Academic Year: ${report.academicYear || ''}`, 150, 75, { align: 'center' });

  // Add summary information
  doc.text(`Total Students: ${report.totalStudents || ''}`, 20, 60);
  doc.text(`Class Average: ${report.classAverage?.toFixed(2) || ''}%`, 100, 60);
  doc.text(`Total Subjects: ${report.subjects?.length || ''}`, 180, 60);

  // Create headers for the results table
  const headers = ['Rank', 'Student Name', 'Sex'];

  // Add subject headers
  if (report.subjects) {
    report.subjects.forEach(subject => {
      headers.push(`${subject.name} (Marks)`);
      headers.push(`${subject.name} (Grade)`);
    });
  }

  // Add summary headers
  headers.push('Total', 'Average', 'Division', 'Points', 'Rank');

  // Create table data
  const tableData = [];

  if (report.students) {
    report.students.forEach(student => {
      const row = [
        student.rank || '',
        student.studentName || '',
        student.sex || ''
      ];

      // Add subject results
      if (report.subjects) {
        report.subjects.forEach(subject => {
          const subjectResult = student.subjectResults?.find(
            result => result.subjectId === subject.id
          );

          if (subjectResult?.present) {
            row.push(subjectResult.marks || '');
            row.push(subjectResult.grade || '');
          } else {
            row.push('-');
            row.push('-');
          }
        });
      }

      // Add summary data
      row.push(
        student.totalMarks || '',
        student.averageMarks || '',
        student.division || '',
        student.points || '',
        student.rank || ''
      );

      tableData.push(row);
    });
  }

  // Add the results table
  doc.autoTable({
    startY: 70,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 30 }, 2: { cellWidth: 10 } },
  });

  // Add division analysis
  const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(14);
  doc.text('Division Analysis', 150, finalY, { align: 'center' });

  // Calculate division counts
  const divisions = {
    'I': report.students?.filter(student => student.division === 'I').length || 0,
    'II': report.students?.filter(student => student.division === 'II').length || 0,
    'III': report.students?.filter(student => student.division === 'III').length || 0,
    'IV': report.students?.filter(student => student.division === 'IV').length || 0,
    '0': report.students?.filter(student => student.division === '0').length || 0
  };

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
  generateStudentResultPDF,
  generateClassResultPDF
};
