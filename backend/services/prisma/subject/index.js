/**
 * Prisma Subject Service Index
 * 
 * This file exports all subject-related services.
 */

const baseSubjectService = require('./baseSubjectService');
const oLevelSubjectService = require('./oLevelSubjectService');
const aLevelSubjectService = require('./aLevelSubjectService');
const teacherSubjectService = require('./teacherSubjectService');

module.exports = {
  // Base subject service
  getSubjectsForStudent: baseSubjectService.getSubjectsForStudent,
  getSubjectsForClass: baseSubjectService.getSubjectsForClass,
  isTeacherAuthorizedForSubject: baseSubjectService.isTeacherAuthorizedForSubject,
  
  // O-Level subject service
  getOLevelSubjectsForStudent: oLevelSubjectService.getOLevelSubjectsForStudent,
  getStudentsForOLevelSubject: oLevelSubjectService.getStudentsForOLevelSubject,
  
  // A-Level subject service
  getALevelSubjectsForStudent: aLevelSubjectService.getALevelSubjectsForStudent,
  getStudentsForALevelSubject: aLevelSubjectService.getStudentsForALevelSubject,
  
  // Teacher subject service
  getSubjectsForTeacher: teacherSubjectService.getSubjectsForTeacher,
  getStudentsForSubject: teacherSubjectService.getStudentsForSubject
};
