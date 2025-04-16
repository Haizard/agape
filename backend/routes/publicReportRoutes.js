const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const ALevelResult = require('../models/ALevelResult');
const OLevelResult = require('../models/OLevelResult');
const AcademicYear = require('../models/AcademicYear');

// Import logger
const logger = require('../utils/logger');

/**
 * Public API endpoint for A-Level class results (JSON only, no authentication required)
 * This endpoint is specifically designed for public access to class reports
 */
router.get('/a-level/class/:classId/:examId', async (req, res) => {
  try {
    const { classId, examId } = req.params;
    const { format = 'json' } = req.query;

    logger.info(`GET /api/public/a-level/class/${classId}/${examId} - Generating public A-Level class result data`);

    // Find the class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      logger.warn(`Class not found with ID: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if this is an A-Level class
    if (classObj.educationLevel !== 'A_LEVEL') {
      logger.warn(`Class ${classId} is not an A-Level class`);
      return res.status(400).json({ message: 'This endpoint is only for A-Level classes' });
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      logger.warn(`Exam not found with ID: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get students in this class
    const students = await Student.find({ class: classId })
      .populate('subjectCombination')
      .sort({ firstName: 1, lastName: 1 });

    if (!students || students.length === 0) {
      logger.warn(`No students found in class ${classId}`);
      return res.json({
        className: classObj.name,
        examName: exam.name,
        students: [],
        message: 'No students found in this class'
      });
    }

    // Get all subjects for this class
    const subjects = await Subject.find({
      _id: { $in: classObj.subjects.map(s => s.subject) }
    });

    // Process each student's results
    const studentResults = await Promise.all(students.map(async (student) => {
      // Get the student's results for this exam
      const results = await ALevelResult.find({
        student: student._id,
        exam: examId
      }).populate('subject');

      // Get the student's subject combination
      const combination = student.subjectCombination ?
        student.subjectCombination.code || 'Unknown' : 'Unknown';

      // Calculate total marks and average
      let totalMarks = 0;
      let subjectCount = 0;
      let principalPoints = 0;
      let subsidiaryPoints = 0;
      let bestThreePoints = 0;

      // Process subject results
      const subjectResults = results.map(result => {
        const subject = result.subject;

        // Determine if this is a principal or subsidiary subject
        const isPrincipal = subject && (
          subject.category === 'Principal' ||
          (combination && combination.substring(0, 3).includes(subject?.code?.charAt(0) || ''))
        );

        const isSubsidiary = subject && (
          subject.category === 'Subsidiary' ||
          subject.code === 'GS' ||
          subject.code === 'BAM'
        );

        // Calculate grade based on marks
        let grade = '-';
        let points = 0;

        if (result.marksObtained !== undefined && result.marksObtained !== null) {
          // A-Level grading system
          if (isPrincipal) {
            if (result.marksObtained >= 80) { grade = 'A'; points = 5; }
            else if (result.marksObtained >= 70) { grade = 'B'; points = 4; }
            else if (result.marksObtained >= 60) { grade = 'C'; points = 3; }
            else if (result.marksObtained >= 50) { grade = 'D'; points = 2; }
            else if (result.marksObtained >= 40) { grade = 'E'; points = 1; }
            else { grade = 'F'; points = 0; }
          } else if (isSubsidiary) {
            if (result.marksObtained >= 80) { grade = 'a'; points = 2; }
            else if (result.marksObtained >= 70) { grade = 'b'; points = 1.5; }
            else if (result.marksObtained >= 60) { grade = 'c'; points = 1; }
            else if (result.marksObtained >= 50) { grade = 'd'; points = 0.5; }
            else if (result.marksObtained >= 40) { grade = 'e'; points = 0; }
            else { grade = 'f'; points = 0; }
          }

          // Add to total marks
          totalMarks += result.marksObtained;
          subjectCount++;

          // Add to points
          if (isPrincipal) {
            principalPoints += points;
          } else if (isSubsidiary) {
            subsidiaryPoints += points;
          }
        }

        return {
          subjectId: subject ? subject._id : 'unknown',
          subjectName: subject ? subject.name : 'Unknown Subject',
          subjectCode: subject ? subject.code : 'UNK',
          marksObtained: result.marksObtained,
          grade,
          points,
          isPrincipal: isPrincipal || false,
          isSubsidiary: isSubsidiary || false
        };
      });

      // Calculate best three principal subjects
      const principalSubjects = subjectResults
        .filter(s => s.isPrincipal)
        .sort((a, b) => b.points - a.points);

      if (principalSubjects.length >= 3) {
        bestThreePoints = principalSubjects.slice(0, 3).reduce((sum, s) => sum + s.points, 0);
      } else {
        bestThreePoints = principalSubjects.reduce((sum, s) => sum + s.points, 0);
      }

      // Add subsidiary points
      const totalPoints = bestThreePoints + subsidiaryPoints;

      // Calculate division
      let division = 'IV';
      if (totalPoints >= 9) division = 'I';
      else if (totalPoints >= 6) division = 'II';
      else if (totalPoints >= 3) division = 'III';

      // Calculate average
      const average = subjectCount > 0 ? (totalMarks / subjectCount).toFixed(1) : 0;

      return {
        _id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        gender: student.gender,
        combination,
        subjects: subjectResults,
        totalMarks,
        average,
        principalPoints,
        subsidiaryPoints,
        bestThreePoints,
        totalPoints,
        division
      };
    }));

    // Calculate class statistics
    const classAverage = studentResults.length > 0
      ? (studentResults.reduce((sum, s) => sum + Number.parseFloat(s.average), 0) / studentResults.length).toFixed(1)
      : 0;

    // Calculate division distribution
    const divisionDistribution = {
      'I': studentResults.filter(s => s.division === 'I').length,
      'II': studentResults.filter(s => s.division === 'II').length,
      'III': studentResults.filter(s => s.division === 'III').length,
      'IV': studentResults.filter(s => s.division === 'IV').length
    };

    // Format the report
    const report = {
      className: classObj.name,
      section: classObj.section || '',
      stream: classObj.stream || '',
      academicYear: classObj.academicYear ? classObj.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      students: studentResults,
      classAverage,
      totalStudents: students.length,
      divisionDistribution,
      educationLevel: 'A_LEVEL'
    };

    // Return the report as JSON
    res.json(report);
  } catch (error) {
    logger.error(`Error generating public A-Level class report: ${error.message}`, error);
    res.status(500).json({ message: `Error generating public A-Level class report: ${error.message}` });
  }
});

/**
 * Public API endpoint for O-Level class results (JSON only, no authentication required)
 * This endpoint is specifically designed for public access to class reports
 */
router.get('/o-level/class/:classId/:examId', async (req, res) => {
  try {
    const { classId, examId } = req.params;
    const { format = 'json' } = req.query;

    logger.info(`GET /api/public/o-level/class/${classId}/${examId} - Generating public O-Level class result data`);

    // Find the class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      logger.warn(`Class not found with ID: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if this is an O-Level class
    if (classObj.educationLevel !== 'O_LEVEL') {
      logger.warn(`Class ${classId} is not an O-Level class`);
      return res.status(400).json({ message: 'This endpoint is only for O-Level classes' });
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      logger.warn(`Exam not found with ID: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get students in this class
    const students = await Student.find({ class: classId })
      .sort({ firstName: 1, lastName: 1 });

    if (!students || students.length === 0) {
      logger.warn(`No students found in class ${classId}`);
      return res.json({
        className: classObj.name,
        examName: exam.name,
        students: [],
        message: 'No students found in this class'
      });
    }

    // Get all subjects for this class
    const subjects = await Subject.find({
      _id: { $in: classObj.subjects.map(s => s.subject) }
    });

    // Process each student's results
    const studentResults = await Promise.all(students.map(async (student) => {
      // Get the student's results for this exam
      const results = await OLevelResult.find({
        student: student._id,
        exam: examId
      }).populate('subject');

      // Calculate total marks and average
      let totalMarks = 0;
      let subjectCount = 0;
      let totalPoints = 0;

      // Process subject results
      const subjectResults = results.map(result => {
        const subject = result.subject;

        // Calculate grade based on marks
        let grade = '-';
        let points = 0;

        if (result.marksObtained !== undefined && result.marksObtained !== null) {
          // O-Level grading system
          if (result.marksObtained >= 81) { grade = 'A'; points = 1; }
          else if (result.marksObtained >= 61) { grade = 'B'; points = 2; }
          else if (result.marksObtained >= 41) { grade = 'C'; points = 3; }
          else if (result.marksObtained >= 31) { grade = 'D'; points = 4; }
          else if (result.marksObtained >= 21) { grade = 'E'; points = 5; }
          else if (result.marksObtained >= 11) { grade = 'S'; points = 6; }
          else { grade = 'F'; points = 7; }

          // Add to total marks
          totalMarks += result.marksObtained;
          subjectCount++;

          // Add to points
          totalPoints += points;
        }

        return {
          subjectId: subject ? subject._id : 'unknown',
          subjectName: subject ? subject.name : 'Unknown Subject',
          subjectCode: subject ? subject.code : 'UNK',
          marksObtained: result.marksObtained,
          grade,
          points
        };
      });

      // Calculate division
      let division = 'IV';
      if (totalPoints <= 17) division = 'I';
      else if (totalPoints <= 25) division = 'II';
      else if (totalPoints <= 33) division = 'III';

      // Calculate average
      const average = subjectCount > 0 ? (totalMarks / subjectCount).toFixed(1) : 0;

      return {
        _id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        gender: student.gender,
        subjects: subjectResults,
        totalMarks,
        average,
        totalPoints,
        division
      };
    }));

    // Calculate class statistics
    const classAverage = studentResults.length > 0
      ? (studentResults.reduce((sum, s) => sum + Number.parseFloat(s.average), 0) / studentResults.length).toFixed(1)
      : 0;

    // Calculate division distribution
    const divisionDistribution = {
      'I': studentResults.filter(s => s.division === 'I').length,
      'II': studentResults.filter(s => s.division === 'II').length,
      'III': studentResults.filter(s => s.division === 'III').length,
      'IV': studentResults.filter(s => s.division === 'IV').length
    };

    // Format the report
    const report = {
      className: classObj.name,
      section: classObj.section || '',
      stream: classObj.stream || '',
      academicYear: classObj.academicYear ? classObj.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      students: studentResults,
      classAverage,
      totalStudents: students.length,
      divisionDistribution,
      educationLevel: 'O_LEVEL'
    };

    // Return the report as JSON
    res.json(report);
  } catch (error) {
    logger.error(`Error generating public O-Level class report: ${error.message}`, error);
    res.status(500).json({ message: `Error generating public O-Level class report: ${error.message}` });
  }
});

module.exports = router;
