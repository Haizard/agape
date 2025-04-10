const Result = require('../models/Result');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');

// Import PDF generators
const { generateStudentResultPDF } = require('../utils/studentReportPdfGenerator');
const { generateClassResultPDF } = require('../utils/classReportPdfGenerator');

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

/**
 * Generate a student result report PDF
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.generateStudentResultPDF = async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    // Fetch the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Fetch the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Fetch the class
    const studentClass = await Class.findById(student.class);
    if (!studentClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Fetch the results
    console.log('Fetching results with studentId:', studentId, 'and examId:', examId);
    const results = await Result.find({
      $or: [
        { studentId: studentId, examId: examId },
        { student: studentId, exam: examId }
      ]
    }).populate('subjectId').populate('subject');

    console.log('Results found:', results.length);
    if (results.length === 0) {
      return res.status(404).json({ message: 'No results found for this student and exam' });
    }

    // Calculate total marks and average
    let totalMarks = 0;
    let totalPoints = 0;
    const gradeDistribution = {};

    results.forEach(result => {
      // Use marksObtained instead of marks
      const marks = result.marksObtained || 0;
      totalMarks += marks;
      totalPoints += result.points || 0;

      // Count grades for distribution
      const grade = result.grade || 'F';
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    const averageMarks = results.length > 0 ? totalMarks / results.length : 0;

    // Calculate best seven subjects (lowest points = best grades)
    const sortedResults = [...results].sort((a, b) => (a.points || 5) - (b.points || 5));
    const bestSevenResults = sortedResults.slice(0, 7);
    const bestSevenPoints = bestSevenResults.reduce((sum, result) => sum + (result.points || 5), 0);

    // Determine division based on best seven points
    let division;
    if (bestSevenPoints >= 7 && bestSevenPoints <= 14) {
      division = 'I';
    } else if (bestSevenPoints >= 15 && bestSevenPoints <= 21) {
      division = 'II';
    } else if (bestSevenPoints >= 22 && bestSevenPoints <= 25) {
      division = 'III';
    } else if (bestSevenPoints >= 26 && bestSevenPoints <= 32) {
      division = 'IV';
    } else {
      division = '0';
    }

    // Prepare the report data
    const report = {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'St. John Vianney Secondary School',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      studentDetails: {
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        class: `${studentClass.name} ${studentClass.section || ''} ${studentClass.stream || ''}`.trim(),
        gender: student.gender
      },
      subjectResults: results.map(result => {
        const subject = result.subject || result.subjectId;
        return {
          subject: subject ? subject.name : 'Unknown Subject',
          marks: result.marksObtained || 0,
          grade: result.grade || 'F',
          points: result.points || 5,
          remarks: result.remarks || getRemarks(result.grade || 'F')
        };
      }),
      summary: {
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints,
        bestSevenPoints,
        division,
        rank: 'N/A',
        gradeDistribution
      },
      student: {
        fullName: `${student.firstName} ${student.lastName}`,
        sex: student.gender === 'Male' ? 'M' : 'F'
      },
      class: {
        fullName: `${studentClass.name} ${studentClass.section || ''} ${studentClass.stream || ''}`.trim()
      },
      exam: {
        name: exam.name,
        term: exam.term || 'Term 1'
      },
      totalMarks,
      averageMarks: averageMarks.toFixed(2),
      points: totalPoints,
      bestSevenPoints,
      division
    };

    // Set the response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="student_result_${studentId}.pdf"`);

    // Generate the PDF using the new generator
    generateStudentResultPDF(report, res);
  } catch (error) {
    console.error('Error generating student result PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
};

/**
 * Generate a class result report PDF
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.generateClassResultPDF = async (req, res) => {
  try {
    const { classId, examId } = req.params;

    // Fetch the class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Fetch the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Fetch all students in the class
    const students = await Student.find({ class: classId });
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found in this class' });
    }

    // Fetch all subjects
    const subjects = await Subject.find();

    // Fetch all results for this class and exam
    const results = await Result.find({
      studentId: { $in: students.map(s => s._id) },
      examId: examId
    }).populate('subjectId studentId');

    // Group results by student
    const resultsByStudent = {};
    students.forEach(student => {
      resultsByStudent[student._id] = {
        student,
        results: []
      };
    });

    results.forEach(result => {
      if (resultsByStudent[result.studentId._id]) {
        resultsByStudent[result.studentId._id].results.push(result);
      }
    });

    // Calculate totals, averages, and divisions for each student
    const studentSummaries = [];

    Object.values(resultsByStudent).forEach(({ student, results }) => {
      if (results.length === 0) return;

      let totalMarks = 0;
      let totalPoints = 0;

      results.forEach(result => {
        // Use marksObtained instead of marks
        const marks = result.marksObtained || result.marks || 0;
        const points = result.points || 5;
        totalMarks += marks;
        totalPoints += points;
      });

      const averageMarks = results.length > 0 ? totalMarks / results.length : 0;

      // Calculate best seven subjects (lowest points = best grades)
      const sortedResults = [...results].sort((a, b) => (a.points || 5) - (b.points || 5));
      const bestSevenResults = sortedResults.slice(0, 7);
      const bestSevenPoints = bestSevenResults.reduce((sum, result) => sum + (result.points || 5), 0);

      // Determine division based on best seven points
      let division;
      if (bestSevenPoints >= 7 && bestSevenPoints <= 14) {
        division = 'I';
      } else if (bestSevenPoints >= 15 && bestSevenPoints <= 21) {
        division = 'II';
      } else if (bestSevenPoints >= 22 && bestSevenPoints <= 25) {
        division = 'III';
      } else if (bestSevenPoints >= 26 && bestSevenPoints <= 32) {
        division = 'IV';
      } else {
        division = '0';
      }

      studentSummaries.push({
        student,
        totalMarks,
        averageMarks,
        totalPoints,
        bestSevenPoints,
        division,
        results
      });
    });

    // Sort students by average marks (descending)
    studentSummaries.sort((a, b) => b.averageMarks - a.averageMarks);

    // Assign ranks
    studentSummaries.forEach((summary, index) => {
      summary.rank = index + 1;
    });

    // Calculate class average
    const classAverage = studentSummaries.length > 0
      ? studentSummaries.reduce((sum, s) => sum + s.averageMarks, 0) / studentSummaries.length
      : 0;

    // Count divisions
    const divisionCounts = {
      'I': 0,
      'II': 0,
      'III': 0,
      'IV': 0,
      '0': 0
    };

    studentSummaries.forEach(summary => {
      divisionCounts[summary.division]++;
    });

    // Create a new PDF document (landscape for class reports)
    const doc = new PDFDocument({ margin: 30, layout: 'landscape' });

    // Set the response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=class_result_${classId}_${examId}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add school header
    doc.fontSize(18).text('St. John Vianney Secondary School', { align: 'center' });
    doc.fontSize(14).text('Class Result Report', { align: 'center' });
    doc.fontSize(12).text(`${classObj.name} ${classObj.section || ''} - ${exam.name}`, { align: 'center' });
    doc.text(`Academic Year: ${exam.academicYear || ''}`, { align: 'center' });
    doc.moveDown();

    // Add summary information
    doc.fontSize(10).text(`Total Students: ${studentSummaries.length}`, { continued: true });
    doc.text(`Class Average: ${classAverage.toFixed(2)}%`, { align: 'center', continued: true });
    doc.text(`Total Subjects: ${subjects.length}`, { align: 'right' });
    doc.moveDown(2);

    // Add results table
    doc.fontSize(14).text('Student Results', { align: 'center' });
    doc.moveDown();

    // Table headers
    const tableTop = doc.y;
    const tableLeft = 30;

    // Calculate column widths
    const rankWidth = 30;
    const nameWidth = 120;
    const sexWidth = 30;
    const subjectWidth = 60; // Each subject gets two columns (marks and grade)
    const summaryWidth = 50;

    // Draw header row
    doc.fontSize(8).text('Rank', tableLeft, tableTop);
    doc.text('Student Name', tableLeft + rankWidth, tableTop);
    doc.text('Sex', tableLeft + rankWidth + nameWidth, tableTop);

    let currentX = tableLeft + rankWidth + nameWidth + sexWidth;

    // Subject headers
    subjects.forEach(subject => {
      doc.text(subject.name, currentX, tableTop, { width: subjectWidth, align: 'center' });
      currentX += subjectWidth;
    });

    // Summary headers
    doc.text('Total', currentX, tableTop, { width: summaryWidth, align: 'center' });
    doc.text('Average', currentX + summaryWidth, tableTop, { width: summaryWidth, align: 'center' });
    doc.text('Division', currentX + summaryWidth * 2, tableTop, { width: summaryWidth, align: 'center' });
    doc.text('Points', currentX + summaryWidth * 3, tableTop, { width: summaryWidth, align: 'center' });
    doc.text('Rank', currentX + summaryWidth * 4, tableTop, { width: summaryWidth, align: 'center' });

    // Draw second header row for marks/grade
    const secondHeaderTop = tableTop + 15;
    currentX = tableLeft + rankWidth + nameWidth + sexWidth;

    subjects.forEach(() => {
      doc.text('Marks', currentX, secondHeaderTop, { width: subjectWidth / 2, align: 'center' });
      doc.text('Grade', currentX + subjectWidth / 2, secondHeaderTop, { width: subjectWidth / 2, align: 'center' });
      currentX += subjectWidth;
    });

    // Draw horizontal lines
    doc.moveTo(tableLeft, tableTop - 5)
      .lineTo(doc.page.width - 30, tableTop - 5)
      .stroke();

    doc.moveTo(tableLeft, secondHeaderTop - 5)
      .lineTo(doc.page.width - 30, secondHeaderTop - 5)
      .stroke();

    doc.moveTo(tableLeft, secondHeaderTop + 15)
      .lineTo(doc.page.width - 30, secondHeaderTop + 15)
      .stroke();

    // Table rows
    let rowTop = secondHeaderTop + 20;

    studentSummaries.forEach(summary => {
      // Check if we need a new page
      if (rowTop > doc.page.height - 50) {
        doc.addPage({ margin: 30, layout: 'landscape' });
        rowTop = 50;

        // Redraw headers on new page
        doc.fontSize(8).text('Rank', tableLeft, rowTop - 20);
        doc.text('Student Name', tableLeft + rankWidth, rowTop - 20);
        doc.text('Sex', tableLeft + rankWidth + nameWidth, rowTop - 20);

        doc.moveTo(tableLeft, rowTop - 5)
          .lineTo(doc.page.width - 30, rowTop - 5)
          .stroke();
      }

      // Draw student row
      doc.fontSize(8).text(String(summary.rank), tableLeft, rowTop);
      doc.text(`${summary.student.firstName} ${summary.student.lastName}`, tableLeft + rankWidth, rowTop);
      doc.text(summary.student.gender || 'N/A', tableLeft + rankWidth + nameWidth, rowTop);

      currentX = tableLeft + rankWidth + nameWidth + sexWidth;

      // Subject results
      subjects.forEach(subject => {
        // Find the result for this subject
        const result = summary.results.find(r => {
          const resultSubjectId = r.subjectId?._id || r.subject?._id;
          return resultSubjectId && resultSubjectId.toString() === subject._id.toString();
        });

        if (result) {
          // Use marksObtained instead of marks
          const marks = result.marksObtained || result.marks || 0;
          const grade = result.grade || 'F';

          doc.text(String(marks), currentX, rowTop, { width: subjectWidth / 2, align: 'center' });
          doc.text(grade, currentX + subjectWidth / 2, rowTop, { width: subjectWidth / 2, align: 'center' });
        } else {
          doc.text('-', currentX, rowTop, { width: subjectWidth / 2, align: 'center' });
          doc.text('-', currentX + subjectWidth / 2, rowTop, { width: subjectWidth / 2, align: 'center' });
        }

        currentX += subjectWidth;
      });

      // Summary data
      doc.text(String(summary.totalMarks || 0), currentX, rowTop, { width: summaryWidth, align: 'center' });
      doc.text((summary.averageMarks || 0).toFixed(2), currentX + summaryWidth, rowTop, { width: summaryWidth, align: 'center' });
      doc.text(summary.division || 'N/A', currentX + summaryWidth * 2, rowTop, { width: summaryWidth, align: 'center' });
      doc.text(String(summary.bestSevenPoints || 0), currentX + summaryWidth * 3, rowTop, { width: summaryWidth, align: 'center' });
      doc.text(String(summary.rank || 'N/A'), currentX + summaryWidth * 4, rowTop, { width: summaryWidth, align: 'center' });

      rowTop += 15;
    });

    // Draw final horizontal line
    doc.moveTo(tableLeft, rowTop - 5)
      .lineTo(doc.page.width - 30, rowTop - 5)
      .stroke();

    // Add a new page for division analysis
    doc.addPage();

    // Add division analysis
    doc.fontSize(14).text('Division Analysis', { align: 'center' });
    doc.moveDown();

    // Create a table for division counts
    const divisionTableTop = doc.y;
    const divisionTableLeft = 150;
    const divisionColWidth = 100;

    doc.fontSize(10).text('Division', divisionTableLeft, divisionTableTop);
    doc.text('Count', divisionTableLeft + divisionColWidth, divisionTableTop);
    doc.text('Percentage', divisionTableLeft + divisionColWidth * 2, divisionTableTop);

    doc.moveTo(divisionTableLeft, divisionTableTop - 5)
      .lineTo(divisionTableLeft + divisionColWidth * 3, divisionTableTop - 5)
      .stroke();

    doc.moveTo(divisionTableLeft, divisionTableTop + 15)
      .lineTo(divisionTableLeft + divisionColWidth * 3, divisionTableTop + 15)
      .stroke();

    let divisionRowTop = divisionTableTop + 20;

    Object.entries(divisionCounts).forEach(([division, count]) => {
      const percentage = studentSummaries.length > 0
        ? (count / studentSummaries.length * 100).toFixed(1)
        : '0.0';

      doc.text(`Division ${division}`, divisionTableLeft, divisionRowTop);
      doc.text(String(count), divisionTableLeft + divisionColWidth, divisionRowTop);
      doc.text(`${percentage}%`, divisionTableLeft + divisionColWidth * 2, divisionRowTop);

      divisionRowTop += 20;
    });

    doc.moveTo(divisionTableLeft, divisionRowTop - 5)
      .lineTo(divisionTableLeft + divisionColWidth * 3, divisionRowTop - 5)
      .stroke();

    // Add footer
    doc.fontSize(8)
      .text(
        `Generated on ${new Date().toLocaleDateString()} - St. John Vianney Secondary School`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

    // Prepare the report data
    const report = {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'St. John Vianney Secondary School',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      classDetails: {
        name: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
        totalStudents: students.length,
        classTeacher: classObj.classTeacher ? `${classObj.classTeacher.firstName} ${classObj.classTeacher.lastName}` : 'N/A'
      },
      subjectStatistics: Object.values(subjectStats),
      studentResults: studentSummaries,
      summary: {
        classAverage: classAverage.toFixed(2),
        divisions: {
          'Division I': divisionCounts['I'],
          'Division II': divisionCounts['II'],
          'Division III': divisionCounts['III'],
          'Division IV': divisionCounts['IV'],
          'Division 0': divisionCounts['0']
        }
      },
      // Add these fields for compatibility with the PDF generator
      class: {
        name: classObj.name,
        section: classObj.section || '',
        stream: classObj.stream || '',
        fullName: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim()
      },
      exam: {
        name: exam.name,
        term: exam.term || 'Term 1'
      },
      // Convert student results to the format expected by the PDF generator
      students: studentSummaries.map(summary => ({
        id: summary.studentId,
        name: summary.name,
        rollNumber: summary.rollNumber,
        sex: summary.sex || 'M',
        results: summary.subjects.map(subject => ({
          subject: { name: subject.name },
          subjectId: { name: subject.name },
          marksObtained: subject.marks || 0,
          marks: subject.marks || 0,
          grade: subject.grade || 'F',
          points: subject.points || 5
        })),
        totalMarks: summary.totalMarks || 0,
        averageMarks: summary.averageMarks || '0.00',
        totalPoints: summary.totalPoints || 0,
        bestSevenPoints: summary.bestSevenPoints || 0,
        division: summary.division || 'Division 0',
        rank: summary.rank || 'N/A'
      }))
    };

    // Set the response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="class_result_${classId}.pdf"`);

    // Generate the PDF using the new generator
    generateClassResultPDF(report, res);
  } catch (error) {
    console.error('Error generating class result PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};

module.exports = exports;
