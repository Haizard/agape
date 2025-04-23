/**
 * Prisma Marks Service Index
 *
 * This file exports all marks-related services.
 */

const baseMarksService = require('./baseMarksService');
const oLevelMarksService = require('./oLevelMarksService');
const aLevelMarksService = require('./aLevelMarksService');
const marksCheckService = require('./marksCheckService');
const eligibilityService = require('./eligibilityService');
const aLevelStudentFilterService = require('./aLevelStudentFilterService');

module.exports = {
  // Base marks service
  enterMarks: baseMarksService.enterMarks,
  enterBatchMarks: baseMarksService.enterBatchMarks,
  checkTeacherAuthorization: baseMarksService.checkTeacherAuthorization,

  // O-Level marks service
  enterOLevelMarks: oLevelMarksService.enterOLevelMarks,
  checkExistingOLevelMarks: oLevelMarksService.checkExistingOLevelMarks,

  // A-Level marks service
  enterALevelMarks: aLevelMarksService.enterALevelMarks,
  checkExistingALevelMarks: aLevelMarksService.checkExistingALevelMarks,

  // Marks check service
  checkExistingMarks: marksCheckService.checkExistingMarks,
  checkStudentMarks: marksCheckService.checkStudentMarks,

  // Eligibility service
  validateStudentSubjectEligibility: eligibilityService.validateStudentSubjectEligibility,
  batchValidateEligibility: eligibilityService.batchValidateEligibility,

  // A-Level student filter service
  getStudentsFilteredBySubject: aLevelStudentFilterService.getStudentsFilteredBySubject
};
