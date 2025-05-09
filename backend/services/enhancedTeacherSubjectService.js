// Get subjects assigned to teacher for specific class
const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');

const getAssignedSubjectsForClass = async (teacherId, classId) => {
  try {
    const teacher = await Teacher.findById(teacherId)
      .populate('assignedSubjects')
      .populate('assignedClasses');

    const classAssignment = teacher.assignedClasses.find(
      c => c.class.toString() === classId
    );

    if (!classAssignment) {
      return [];
    }

    return classAssignment.subjects.map(s => ({
      _id: s.subject._id,
      name: s.subject.name,
      code: s.subject.code,
      isCore: s.isCore
    }));
  } catch (error) {
    console.error('Error fetching assigned subjects:', error);
    throw new Error('Failed to retrieve assigned subjects');
  }
};

module.exports = {
  getAssignedSubjectsForClass
};
