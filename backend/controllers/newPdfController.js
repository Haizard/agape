const Result = require('../models/Result');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');

// Import PDF generators
const { generateStudentResultPDF } = require('../utils/studentReportPdfGenerator');
const { generateClassResultPDF } = require('../utils/classReportPdfGenerator');

// Import division calculator utility
const {
  calculateGrade,
  calculatePoints,
  calculateDivision,
  getRemarks,
  calculateBestSevenAndDivision
} = require('../utils/divisionCalculator');

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
    })
    .populate('subjectId', 'name code')
    .populate('subject', 'name code')
    .sort({ 'subjectId': 1 }); // Sort by subject ID to ensure consistent ordering

    // Log the results for debugging
    console.log('Results found:', results.map(r => ({
      subject: r.subject?.name || r.subjectId?.name || 'Unknown',
      subjectId: r.subject?._id || r.subjectId?._id || 'Unknown',
      marks: r.marksObtained,
      grade: r.grade,
      points: r.points
    })));

    // Log unique subjects for debugging
    const uniqueSubjects = new Set();
    for (const result of results) {
      const subjectId = result.subject?._id || result.subjectId?._id;
      if (subjectId) {
        uniqueSubjects.add(subjectId.toString());
      }
    }
    console.log(`Found ${uniqueSubjects.size} unique subjects in results:`, Array.from(uniqueSubjects));

    console.log('Results found:', results.length);
    if (results.length === 0) {
      return res.status(404).json({ message: 'No results found for this student and exam' });
    }

    // Calculate total marks and average
    let totalMarks = 0;
    let totalPoints = 0;
    const gradeDistribution = {};

    // Create a map of subject results for easy lookup and debugging
    const subjectResultsMap = {};
    for (const result of results) {
      const subject = result.subject || result.subjectId;
      if (subject?._id) {
        const subjectId = subject._id.toString();
        subjectResultsMap[subjectId] = result;
        console.log(`Mapped subject ${subject.name} (${subjectId}) to marks: ${result.marksObtained}`);
      }
    }

    for (const result of results) {
      // Use marksObtained instead of marks
      const marks = result.marksObtained || 0;
      const grade = result.grade || calculateGrade(marks);
      const points = result.points !== undefined ? result.points : calculatePoints(grade);

      totalMarks += marks;
      totalPoints += points;

      // Count grades for distribution
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    }

    const averageMarks = results.length > 0 ? totalMarks / results.length : 0;

    // Filter out results with no marks
    const validResults = results.filter(result => {
      const marks = result.marksObtained || 0;
      return marks > 0;
    });

    // Calculate best seven subjects and division using the utility function
    const { bestSevenResults, bestSevenPoints, division } = calculateBestSevenAndDivision(validResults);

    console.log('Student report division calculation:', {
      totalResults: results.length,
      validResults: validResults.length,
      bestSevenPoints,
      division
    });

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
        const grade = result.grade || calculateGrade(result.marksObtained || 0);
        const points = result.points !== undefined ? result.points : calculatePoints(grade);

        // Log the subject mapping for debugging
        console.log(`Mapping subject: ${subject?.name || 'Unknown'} (${subject?._id || 'Unknown'}) with marks: ${result.marksObtained}`);

        return {
          subject: subject ? subject.name : 'Unknown Subject',
          subjectId: subject ? subject._id : null,
          marks: result.marksObtained || 0,
          grade: grade,
          points: points,
          remarks: result.remarks || getRemarks(grade)
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

    // Initialize subject statistics
    const subjectStats = {};
    for (const subject of subjects) {
      subjectStats[subject._id.toString()] = {
        name: subject.name,
        totalMarks: 0,
        studentCount: 0,
        averageMarks: 0,
        grades: { A: 0, B: 0, C: 0, D: 0, F: 0 },
        highestMarks: 0,
        lowestMarks: 100
      };
    }

    // Get results for all students in the class for this exam
    const results = await Result.find({
      $or: [
        { classId: classId, examId: examId },
        { class: classId, exam: examId }
      ]
    })
      .populate('studentId', 'firstName lastName rollNumber gender')
      .populate('student', 'firstName lastName rollNumber gender')
      .populate('subjectId', 'name code')
      .populate('subject', 'name code')
      .sort({ 'subjectId': 1, 'studentId': 1 }); // Sort by subject ID and then student ID

    // Log the results for debugging
    console.log(`Found ${results.length} results for class ${classId} and exam ${examId}`);
    console.log('Sample results:', results.slice(0, 3).map(r => ({
      student: r.student?.firstName || r.studentId?.firstName || 'Unknown',
      subject: r.subject?.name || r.subjectId?.name || 'Unknown',
      subjectId: r.subject?._id || r.subjectId?._id || 'Unknown',
      marks: r.marksObtained,
      grade: r.grade,
      points: r.points
    })));

    // Log unique subjects for debugging
    const uniqueSubjects = new Set();
    for (const result of results) {
      const subjectId = result.subject?._id || result.subjectId?._id;
      if (subjectId) {
        uniqueSubjects.add(subjectId.toString());
      }
    }
    console.log(`Found ${uniqueSubjects.size} unique subjects in results:`, Array.from(uniqueSubjects));

    // Create a map of subject results for easy lookup and debugging
    const subjectMap = {};
    for (const result of results) {
      const subject = result.subject || result.subjectId;
      if (subject?._id) {
        const subjectId = subject._id.toString();
        if (!subjectMap[subjectId]) {
          subjectMap[subjectId] = {
            id: subjectId,
            name: subject.name,
            code: subject.code
          };
          console.log(`Added subject to map: ${subject.name} (${subjectId})`);
        }
      }
    }

    // Convert subject map to array and sort by ID for consistent ordering
    const sortedSubjects = Object.values(subjectMap).sort((a, b) => a.id.localeCompare(b.id));
    console.log('Sorted subjects:', sortedSubjects.map(s => s.name));

    // Group results by student
    const studentResultsMap = {};
    for (const result of results) {
      const student = result.student || result.studentId;
      if (!student?._id) continue;

      const studentId = student._id.toString();
      const subject = result.subject || result.subjectId;

      if (!subject?._id) continue;

      const subjectId = subject._id.toString();
      const marks = result.marksObtained || 0;
      const grade = result.grade || calculateGrade(marks);
      const points = result.points !== undefined ? result.points : calculatePoints(grade);

      // Update subject statistics
      if (subjectStats[subjectId]) {
        subjectStats[subjectId].totalMarks += marks;
        subjectStats[subjectId].studentCount++;
        subjectStats[subjectId].grades[grade]++;
        subjectStats[subjectId].highestMarks = Math.max(subjectStats[subjectId].highestMarks, marks);
        subjectStats[subjectId].lowestMarks = Math.min(subjectStats[subjectId].lowestMarks, marks);
      }

      // Initialize student result if not exists
      if (!studentResultsMap[studentId]) {
        studentResultsMap[studentId] = {
          studentId,
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          sex: student.gender === 'Male' ? 'M' : 'F',
          subjects: [],
          totalMarks: 0,
          totalPoints: 0,
          subjectCount: 0
        };
      }

      // Add subject result to student only if it has valid marks
      if (marks > 0) {
        studentResultsMap[studentId].subjects.push({
          name: subject.name,
          subjectId: subjectId, // Add subjectId for sorting
          marks,
          grade,
          points
        });
        console.log(`Added subject ${subject.name} (${subjectId}) with marks ${marks} to student ${studentId}`);
      }

      // Update student totals only if it has valid marks
      if (marks > 0) {
        studentResultsMap[studentId].totalMarks += marks;
        studentResultsMap[studentId].totalPoints += points;
        studentResultsMap[studentId].subjectCount++;
      }
    }

    // Calculate averages for subjects
    for (const subjectId of Object.keys(subjectStats)) {
      const stats = subjectStats[subjectId];
      if (stats.studentCount > 0) {
        stats.averageMarks = (stats.totalMarks / stats.studentCount).toFixed(2);
      }
    }

    // Convert student results map to array and calculate averages and divisions
    const studentSummaries = Object.values(studentResultsMap).map(student => {
      // Calculate student average
      const averageMarks = student.subjectCount > 0 ? student.totalMarks / student.subjectCount : 0;

      // Sort the student's subjects to match the global subject order
      student.subjects.sort((a, b) => {
        const aIndex = sortedSubjects.findIndex(s => s.id === a.subjectId);
        const bIndex = sortedSubjects.findIndex(s => s.id === b.subjectId);
        return aIndex - bIndex;
      });

      // Log the sorted subjects for this student
      console.log(`Sorted subjects for student ${student.name}:`,
        student.subjects.map(s => `${s.name} (${s.subjectId}): ${s.marks}`))

      // Calculate best seven subjects and division using the utility function
      const { bestSevenResults, bestSevenPoints, division } = calculateBestSevenAndDivision(student.subjects);

      return {
        ...student,
        averageMarks: averageMarks.toFixed(2),
        bestSevenPoints,
        division
      };
    });

    // Sort students by average marks for ranking
    studentSummaries.sort((a, b) => Number.parseFloat(b.averageMarks) - Number.parseFloat(a.averageMarks));

    // Assign ranks
    for (let index = 0; index < studentSummaries.length; index++) {
      studentSummaries[index].rank = index + 1;
    }

    // Calculate class average
    const classAverage = studentSummaries.length > 0
      ? studentSummaries.reduce((sum, s) => sum + Number.parseFloat(s.averageMarks), 0) / studentSummaries.length
      : 0;

    // Count divisions
    const divisionCounts = {
      'I': 0,
      'II': 0,
      'III': 0,
      'IV': 0,
      '0': 0
    };

    for (const summary of studentSummaries) {
      divisionCounts[summary.division]++;
    }

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
      // Use sorted subjects for consistent ordering
      subjects: sortedSubjects,
      subjectStatistics: Object.values(subjectStats).sort((a, b) => {
        // Find the index of each subject in the sortedSubjects array
        const aIndex = sortedSubjects.findIndex(s => s.name === a.name);
        const bIndex = sortedSubjects.findIndex(s => s.name === b.name);
        return aIndex - bIndex;
      }),
      studentResults: studentSummaries,
      summary: {
        classAverage: classAverage.toFixed(2),
        divisions: {
          "Division I": divisionCounts.I,
          "Division II": divisionCounts.II,
          "Division III": divisionCounts.III,
          "Division IV": divisionCounts.IV,
          "Division 0": divisionCounts["0"]
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
