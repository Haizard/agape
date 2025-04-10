const PDFDocument = require('pdfkit');

/**
 * Generate a class result report PDF
 * @param {Object} report - The report data
 * @param {Object} res - Express response object
 */
const generateClassResultPDF = (report, res) => {
  // Create a new PDF document
  const doc = new PDFDocument({
    margin: 30,
    size: 'A4',
    layout: 'landscape'
  });

  // Pipe the PDF to the response
  doc.pipe(res);

  // Set default font
  doc.font('Helvetica');

  // Add header
  doc.fontSize(16).text(`${report.examName.toUpperCase()} - ${new Date().getFullYear()}`, { align: 'center' });
  doc.moveDown(0.5);

  // Add class name
  doc.fontSize(12).text(`Class Name: ${report.class.fullName}`, { align: 'left' });
  doc.moveDown(1);

  // Set a smaller font size for the entire document
  doc.fontSize(8);

  // Calculate column widths
  const pageWidth = doc.page.width - 60; // Accounting for margins

  // Fixed column widths with padding between columns
  let numberWidth = 25;
  let nameWidth = 120;
  let sexWidth = 25;

  // Calculate how many subjects we can fit on a page
  let subjectWidth = 35; // Width for each subject column (mark + grade combined)

  // Summary column widths
  let totalWidth = 30;
  let avgWidth = 30;
  let divisionWidth = 25;
  let pointsWidth = 25;
  let rankWidth = 25;

  // Column padding to ensure content stays within boundaries
  const columnPadding = 3;

  // Debug: Log the column structure
  console.log('Column structure:');
  console.log('Number width:', numberWidth);
  console.log('Name width:', nameWidth);
  console.log('Sex width:', sexWidth);
  console.log('Subject width:', subjectWidth);
  console.log('Total width:', totalWidth);
  console.log('Avg width:', avgWidth);
  console.log('Division width:', divisionWidth);
  console.log('Points width:', pointsWidth);
  console.log('Rank width:', rankWidth);

  // Get all subjects
  const allSubjects = report.subjectStatistics;
  const totalSubjects = allSubjects.length;

  // Calculate total width needed
  const totalWidthNeeded = numberWidth + nameWidth + sexWidth +
                          (totalSubjects * subjectWidth) +
                          totalWidth + avgWidth + divisionWidth + pointsWidth + rankWidth;

  // Check if we need to adjust column widths further
  const needToAdjustWidths = totalWidthNeeded > pageWidth;

  // Adjust widths if needed
  if (needToAdjustWidths) {
    const scaleFactor = pageWidth / totalWidthNeeded;
    // Scale down all widths proportionally
    numberWidth *= scaleFactor;
    nameWidth *= scaleFactor;
    sexWidth *= scaleFactor;
    // Don't scale subject width below a minimum
    subjectWidth = Math.max(20, subjectWidth * scaleFactor);
  }

  // Start position for the table
  let yPos = doc.y;

  // Function to draw the table header
  const drawTableHeader = (startX, startY) => {
    doc.fontSize(8).font('Helvetica-Bold');

    let xPos = startX;
    let yPos = startY;

    // Debug: Log the starting position
    console.log('Header starting position:', xPos, yPos);

    // Draw student info headers
    doc.text('#', xPos + columnPadding, yPos + 5, { width: numberWidth - (columnPadding * 2), align: 'center' });
    xPos += numberWidth;
    console.log('After number column:', xPos);

    doc.text('STUDENT NAME', xPos + columnPadding, yPos + 5, { width: nameWidth - (columnPadding * 2), align: 'center' });
    xPos += nameWidth;
    console.log('After name column:', xPos);

    doc.text('SEX', xPos + columnPadding, yPos + 5, { width: sexWidth - (columnPadding * 2), align: 'center' });
    xPos += sexWidth;
    console.log('After sex column:', xPos);

    // Draw subject headers
    allSubjects.forEach((subject, index) => {
      // Abbreviate subject name to fit in column
      const subjectName = abbreviateSubject(subject.name);
      doc.text(subjectName, xPos + columnPadding, yPos + 5, { width: subjectWidth - (columnPadding * 2), align: 'center' });
      console.log(`Subject ${index + 1} (${subjectName}):`, xPos);

      // Calculate the middle point for the vertical separator
      const middleX = xPos + (subjectWidth / 2);

      // Draw a vertical line between marks and grade, starting below the subject name
      doc.moveTo(middleX, yPos + 25).lineTo(middleX, yPos + 45).stroke();

      xPos += subjectWidth;
    });

    // Draw summary headers
    doc.text('TOTAL', xPos + columnPadding, yPos + 5, { width: totalWidth - (columnPadding * 2), align: 'center' });
    xPos += totalWidth;
    console.log('After total column:', xPos);

    doc.text('AVG', xPos + columnPadding, yPos + 5, { width: avgWidth - (columnPadding * 2), align: 'center' });
    xPos += avgWidth;
    console.log('After avg column:', xPos);

    doc.text('DIV', xPos + columnPadding, yPos + 5, { width: divisionWidth - (columnPadding * 2), align: 'center' });
    xPos += divisionWidth;
    console.log('After div column:', xPos);

    doc.text('PTS', xPos + columnPadding, yPos + 5, { width: pointsWidth - (columnPadding * 2), align: 'center' });
    xPos += pointsWidth;
    console.log('After pts column:', xPos);

    doc.text('RANK', xPos + columnPadding, yPos + 5, { width: rankWidth - (columnPadding * 2), align: 'center' });
    console.log('After rank column:', xPos + rankWidth);

    // Move down for the next row (extra space for the mark/grade headers)
    yPos += 45; // Increased from 35 to 45

    // Draw horizontal line
    doc.moveTo(startX, yPos - 5).lineTo(doc.page.width - 30, yPos - 5).stroke();

    // Draw vertical lines for column separators
    let lineX = startX;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos - 5).stroke(); // Left border

    // Student info columns
    lineX += numberWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos - 5).stroke();

    lineX += nameWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos - 5).stroke();

    lineX += sexWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos - 5).stroke();

    // Subject columns
    allSubjects.forEach(() => {
      lineX += subjectWidth;
      doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos - 5).stroke();
    });

    // Summary columns
    lineX += totalWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos - 5).stroke();

    lineX += avgWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos - 5).stroke();

    lineX += divisionWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos - 5).stroke();

    lineX += pointsWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos - 5).stroke();

    doc.moveTo(doc.page.width - 30, startY - 5).lineTo(doc.page.width - 30, yPos - 5).stroke(); // Right border

    // Reset font
    doc.font('Helvetica');

    return yPos;
  };

  // Function to draw a student row
  const drawStudentRow = (student, index, startX, startY) => {
    let xPos = startX;
    let yPos = startY;

    // Debug: Log the student data
    console.log(`Drawing student ${index + 1}:`, student.name);
    console.log('Starting position:', xPos, yPos);

    // Student number
    doc.text(String(index + 1), xPos + columnPadding, yPos + 10, { width: numberWidth - (columnPadding * 2), align: 'center' });
    xPos += numberWidth;
    console.log('After number column:', xPos);

    // Student name
    doc.text(student.name, xPos + columnPadding, yPos + 10, { width: nameWidth - (columnPadding * 2), align: 'center' });
    xPos += nameWidth;
    console.log('After name column:', xPos);

    // Student sex
    const sex = student.sex || (student.name.includes('F') ? 'F' : 'M'); // Fallback logic
    doc.text(sex, xPos + columnPadding, yPos + 10, { width: sexWidth - (columnPadding * 2), align: 'center' });
    xPos += sexWidth;
    console.log('After sex column:', xPos);

    // Create a map of subject results for easy lookup
    const subjectResultsMap = {};
    student.results.forEach(result => {
      const subject = result.subject || result.subjectId;
      if (subject && subject.name) {
        subjectResultsMap[subject.name] = result;
      }
    });

    // Draw subject marks and grades
    allSubjects.forEach((subject, index) => {
      console.log(`Drawing subject ${index + 1} (${subject.name}) at position:`, xPos);
      const result = subjectResultsMap[subject.name];

      if (result) {
        // Get marks and grade values
        const marksValue = result.marks || result.marksObtained || 0;
        const gradeValue = result.grade || '-';
        console.log(`  Result found: marks=${marksValue}, grade=${gradeValue}`);

        // Calculate the middle point for the vertical separator
        const middleX = xPos + (subjectWidth / 2);

        // Draw marks in the left half
        doc.text(String(marksValue), xPos + columnPadding, yPos + 10, { width: (subjectWidth / 2) - (columnPadding * 2), align: 'center' });

        // Draw grade in the right half
        doc.text(gradeValue, middleX + columnPadding, yPos + 10, { width: (subjectWidth / 2) - (columnPadding * 2), align: 'center' });

        // Draw a small vertical line between marks and grade
        doc.moveTo(middleX, yPos).lineTo(middleX, yPos + 25).stroke();
      } else {
        console.log(`  No result found for subject: ${subject.name}`);
        // Calculate the middle point for the vertical separator
        const middleX = xPos + (subjectWidth / 2);

        // No result for this subject
        doc.text('-', xPos + columnPadding, yPos + 10, { width: (subjectWidth / 2) - (columnPadding * 2), align: 'center' });
        doc.text('-', middleX + columnPadding, yPos + 10, { width: (subjectWidth / 2) - (columnPadding * 2), align: 'center' });
      }

      xPos += subjectWidth;
      console.log(`  After subject ${index + 1} (${subject.name}):`, xPos);
    });

    // Draw summary data
    // Total marks
    doc.text(String(student.totalMarks || 0), xPos + columnPadding, yPos + 10, { width: totalWidth - (columnPadding * 2), align: 'center' });
    xPos += totalWidth;

    // Average marks
    doc.text(String(student.averageMarks || '0.00'), xPos + columnPadding, yPos + 10, { width: avgWidth - (columnPadding * 2), align: 'center' });
    xPos += avgWidth;

    // Division
    const division = student.division ? student.division.replace('Division ', '') : '-';
    doc.text(division, xPos + columnPadding, yPos + 10, { width: divisionWidth - (columnPadding * 2), align: 'center' });
    xPos += divisionWidth;

    // Points
    doc.text(String(student.bestSevenPoints || 0), xPos + columnPadding, yPos + 10, { width: pointsWidth - (columnPadding * 2), align: 'center' });
    xPos += pointsWidth;

    // Rank
    doc.text(String(student.rank || '-'), xPos + columnPadding, yPos + 10, { width: rankWidth - (columnPadding * 2), align: 'center' });

    // Draw horizontal line
    doc.moveTo(startX, yPos + 25).lineTo(doc.page.width - 30, yPos + 25).stroke();

    // Draw vertical lines for column separators
    let lineX = startX;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos + 25).stroke(); // Left border

    // Student info columns
    lineX += numberWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos + 25).stroke();

    lineX += nameWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos + 25).stroke();

    lineX += sexWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos + 25).stroke();

    // Subject columns
    allSubjects.forEach(() => {
      lineX += subjectWidth;
      doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos + 25).stroke();
    });

    // Summary columns
    lineX += totalWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos + 25).stroke();

    lineX += avgWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos + 25).stroke();

    lineX += divisionWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos + 25).stroke();

    lineX += pointsWidth;
    doc.moveTo(lineX, startY - 5).lineTo(lineX, yPos + 25).stroke();

    doc.moveTo(doc.page.width - 30, startY - 5).lineTo(doc.page.width - 30, yPos + 25).stroke(); // Right border

    return yPos + 25; // Return the next row position with more space
  };

  // Debug: Log the report structure
  console.log('Report structure:');
  console.log('Number of students:', report.students.length);
  console.log('Number of subjects:', report.subjectStatistics.length);
  console.log('Sample student:', JSON.stringify(report.students[0], null, 2));

  // Draw the table
  // Draw table header
  yPos = drawTableHeader(30, yPos);

  // Draw horizontal line at the top of the table
  doc.moveTo(30, yPos - 20).lineTo(doc.page.width - 30, yPos - 20).stroke();

  // Draw student rows
  report.students.forEach((student, index) => {
    // Check if we need a new page
    if (yPos > doc.page.height - 50) {
      doc.addPage();
      yPos = 50;

      // Add header to new page
      doc.fontSize(16).text(`${report.examName.toUpperCase()} - ${new Date().getFullYear()}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Class Name: ${report.class.fullName} (Continued)`, { align: 'left' });
      doc.moveDown(1);

      // Redraw the table header
      yPos = drawTableHeader(30, yPos);

      // Draw horizontal line at the top of the table
      doc.moveTo(30, yPos - 20).lineTo(doc.page.width - 30, yPos - 20).stroke();
    }

    // Draw student row
    yPos = drawStudentRow(student, index, 30, yPos);
  });

  // Draw final horizontal line
  doc.moveTo(30, yPos - 5).lineTo(doc.page.width - 30, yPos - 5).stroke();

  // Add some space
  yPos += 30;

  // Add results summary section
  doc.fontSize(14).font('Helvetica-Bold').text('RESULTS SUMMARY', 30, yPos, { align: 'left' });
  doc.moveDown(1);
  yPos = doc.y;

  // Draw summary table header
  doc.fontSize(10).font('Helvetica-Bold');

  // Calculate summary table column widths
  const summaryNumberWidth = 30;
  const summarySubjectWidth = 150;
  const summaryStudentsWidth = 80;
  const summaryGradeWidth = 40;
  const summaryGpaWidth = 50;

  // Draw summary header cells
  xPos = 30;

  doc.text('#', xPos, yPos);
  xPos += summaryNumberWidth;

  doc.text('SUBJECT NAME', xPos, yPos);
  xPos += summarySubjectWidth;

  doc.text('NO OF STUDENTS', xPos, yPos);
  xPos += summaryStudentsWidth;

  // Grade headers
  doc.text('PERFORMANCE', xPos, yPos, { width: summaryGradeWidth * 5, align: 'center' });
  xPos += summaryGradeWidth * 5;

  doc.text('GPA', xPos, yPos);

  // Draw grade sub-headers
  yPos += 15;
  xPos = 30 + summaryNumberWidth + summarySubjectWidth + summaryStudentsWidth;

  doc.text('A', xPos, yPos, { width: summaryGradeWidth, align: 'center' });
  xPos += summaryGradeWidth;

  doc.text('B', xPos, yPos, { width: summaryGradeWidth, align: 'center' });
  xPos += summaryGradeWidth;

  doc.text('C', xPos, yPos, { width: summaryGradeWidth, align: 'center' });
  xPos += summaryGradeWidth;

  doc.text('D', xPos, yPos, { width: summaryGradeWidth, align: 'center' });
  xPos += summaryGradeWidth;

  doc.text('F', xPos, yPos, { width: summaryGradeWidth, align: 'center' });

  // Move down for the next row
  yPos += 20;

  // Draw horizontal line
  doc.moveTo(30, yPos - 5).lineTo(doc.page.width - 30, yPos - 5).stroke();

  // Reset font
  doc.font('Helvetica');

  // Draw subject summary rows
  report.subjectStatistics.forEach((subject, index) => {
    // Check if we need a new page
    if (yPos > doc.page.height - 50) {
      doc.addPage();
      yPos = 50;

      // Add header to new page
      doc.fontSize(16).text(`${report.examName.toUpperCase()} - ${new Date().getFullYear()}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').text('RESULTS SUMMARY (Continued)', { align: 'left' });
      doc.moveDown(1);

      // Reset font
      doc.fontSize(10).font('Helvetica');
    }

    // Draw subject row
    xPos = 30;

    // Subject number
    doc.text(String(index + 1), xPos, yPos);
    xPos += summaryNumberWidth;

    // Subject name
    doc.text(subject.name, xPos, yPos, { width: summarySubjectWidth - 5 });
    xPos += summarySubjectWidth;

    // Number of students
    doc.text(String(subject.studentCount || 0), xPos, yPos, { width: summaryStudentsWidth, align: 'center' });
    xPos += summaryStudentsWidth;

    // Grade counts
    doc.text(String(subject.grades.A || 0), xPos, yPos, { width: summaryGradeWidth, align: 'center' });
    xPos += summaryGradeWidth;

    doc.text(String(subject.grades.B || 0), xPos, yPos, { width: summaryGradeWidth, align: 'center' });
    xPos += summaryGradeWidth;

    doc.text(String(subject.grades.C || 0), xPos, yPos, { width: summaryGradeWidth, align: 'center' });
    xPos += summaryGradeWidth;

    doc.text(String(subject.grades.D || 0), xPos, yPos, { width: summaryGradeWidth, align: 'center' });
    xPos += summaryGradeWidth;

    doc.text(String(subject.grades.F || 0), xPos, yPos, { width: summaryGradeWidth, align: 'center' });
    xPos += summaryGradeWidth;

    // Calculate GPA
    const totalGrades = (subject.grades.A || 0) + (subject.grades.B || 0) + (subject.grades.C || 0) + (subject.grades.D || 0) + (subject.grades.F || 0);
    const totalPoints = (subject.grades.A || 0) * 1 + (subject.grades.B || 0) * 2 + (subject.grades.C || 0) * 3 + (subject.grades.D || 0) * 4 + (subject.grades.F || 0) * 5;
    const gpa = totalGrades > 0 ? (totalPoints / totalGrades).toFixed(4) : '---';

    doc.text(gpa, xPos, yPos, { width: summaryGpaWidth, align: 'center' });

    // Move down for the next row
    yPos += 20;
  });

  // Draw horizontal line
  doc.moveTo(30, yPos - 5).lineTo(doc.page.width - 30, yPos - 5).stroke();

  // Add some space
  yPos += 30;

  // Add division calculation explanation
  doc.fontSize(12).font('Helvetica-Bold').text('DIVISION CALCULATION (BASED ON BEST 7 SUBJECTS)', 30, yPos, { align: 'center' });
  doc.moveDown(0.5);
  yPos = doc.y;

  // Create a table for division explanation
  const divisionExplanation = [
    ['Division', 'Points Range', 'Grade Points'],
    ['I', '7-14 points', 'A (75-100%) = 1 point'],
    ['II', '15-21 points', 'B (65-74%) = 2 points'],
    ['III', '22-25 points', 'C (50-64%) = 3 points'],
    ['IV', '26-32 points', 'D (30-49%) = 4 points'],
    ['0', '33-36 points', 'F (0-29%) = 5 points']
  ];

  // Draw division explanation table
  const divColWidths = [(doc.page.width - 60) / 3, (doc.page.width - 60) / 3, (doc.page.width - 60) / 3];

  // Draw header
  doc.font('Helvetica-Bold');
  doc.text(divisionExplanation[0][0], 30, yPos, { width: divColWidths[0], align: 'center' });
  doc.text(divisionExplanation[0][1], 30 + divColWidths[0], yPos, { width: divColWidths[1], align: 'center' });
  doc.text(divisionExplanation[0][2], 30 + divColWidths[0] + divColWidths[1], yPos, { width: divColWidths[2], align: 'center' });

  // Draw rows
  doc.font('Helvetica');
  let divRowTop = yPos + 20;

  for (let i = 1; i < divisionExplanation.length; i++) {
    doc.text(divisionExplanation[i][0], 30, divRowTop, { width: divColWidths[0], align: 'center' });
    doc.text(divisionExplanation[i][1], 30 + divColWidths[0], divRowTop, { width: divColWidths[1], align: 'center' });
    doc.text(divisionExplanation[i][2], 30 + divColWidths[0] + divColWidths[1], divRowTop, { width: divColWidths[2], align: 'center' });
    divRowTop += 15;
  }

  // Add some space
  yPos = divRowTop + 30;

  // Add approval section
  doc.fontSize(12).font('Helvetica-Bold').text('APPROVED BY', 30, yPos, { align: 'left' });
  doc.moveDown(1);
  yPos = doc.y;

  // Academic teacher approval
  doc.fontSize(10).font('Helvetica');
  doc.text('1. ACADEMIC TEACHER', 30, yPos);
  doc.text('NAME :', 150, yPos);
  doc.moveTo(200, yPos + 10).lineTo(400, yPos + 10).stroke();

  doc.text('SIGN :', 150, yPos + 20);
  doc.moveTo(200, yPos + 30).lineTo(400, yPos + 30).stroke();

  // Head of school approval
  doc.text('2. HEAD OF SCHOOL', 30, yPos + 40);
  doc.text('NAME :', 150, yPos + 40);
  doc.moveTo(200, yPos + 50).lineTo(400, yPos + 50).stroke();

  doc.text('SIGN :', 450, yPos + 40);
  doc.moveTo(500, yPos + 50).lineTo(700, yPos + 50).stroke();

  // Finalize the PDF
  doc.end();
};

/**
 * Abbreviate subject name to fit in column
 * @param {string} subjectName - The full subject name
 * @returns {string} - The abbreviated subject name
 */
function abbreviateSubject(subjectName) {
  const abbreviations = {
    'Mathematics': 'MATH',
    'Basic Mathematics': 'MATH',
    'English': 'ENG',
    'Kiswahili': 'KIS',
    'Biology': 'BIO',
    'Chemistry': 'CHEM',
    'Physics': 'PHY',
    'History': 'HIST',
    'Geography': 'GEO',
    'Civics': 'CIV',
    'Computer Studies': 'COMP',
    'Book Keeping': 'B/K',
    'Commerce': 'COMM',
    'bible knowledge': 'B/K'
  };

  return abbreviations[subjectName] || subjectName.substring(0, 4).toUpperCase();
}

module.exports = {
  generateClassResultPDF
};
