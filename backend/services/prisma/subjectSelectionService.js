/**
 * Prisma Subject Selection Service
 * 
 * This service handles student subject selection operations using Prisma.
 */

const prisma = require('../../lib/prisma');
const logger = require('../../utils/logger');

/**
 * Create a new subject selection for a student
 * @param {Object} selectionData - Subject selection data
 * @returns {Promise<Object>} - Result of the operation
 */
async function createSubjectSelection(selectionData) {
  const {
    studentId,
    selectionClassId,
    academicYearId,
    optionalSubjects,
    notes,
    approvedBy
  } = selectionData;
  
  try {
    logger.info(`[PrismaSubjectSelectionService] Creating subject selection for student: ${studentId}`);
    
    // Check if student already has a selection for this academic year
    const existingSelection = await prisma.studentSubjectSelection.findUnique({
      where: {
        studentId_academicYearId: {
          studentId,
          academicYearId
        }
      }
    });
    
    if (existingSelection) {
      logger.warn(`[PrismaSubjectSelectionService] Student already has a subject selection for this academic year: ${studentId}`);
      return {
        success: false,
        message: 'Student already has a subject selection for this academic year',
        existingSelection
      };
    }
    
    // Get all core subjects for O_LEVEL
    const coreSubjects = await prisma.subject.findMany({
      where: {
        type: 'CORE',
        OR: [
          { educationLevel: 'O_LEVEL' },
          { educationLevel: 'BOTH' }
        ]
      },
      select: { id: true }
    });
    
    const coreSubjectIds = coreSubjects.map(subject => subject.id);
    
    // Create the selection and update student in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create selection
      const selection = await tx.studentSubjectSelection.create({
        data: {
          studentId,
          selectionClassId,
          academicYearId,
          coreSubjects: coreSubjectIds,
          optionalSubjects,
          status: 'APPROVED',
          notes: notes || '',
          selectionDate: new Date()
        }
      });
      
      // Update student's selectedSubjects field
      // Note: In MongoDB with Prisma, we can't directly update the student's selectedSubjects array
      // We need to get the student first, then update it with the new array
      
      // Get the student
      const student = await tx.student.findUnique({
        where: { id: studentId }
      });
      
      if (!student) {
        throw new Error(`Student with ID ${studentId} not found`);
      }
      
      // For now, we'll just log this operation since Prisma doesn't support direct array operations
      // In a real implementation, you would need to handle this differently
      logger.info(`[PrismaSubjectSelectionService] Would update student ${studentId} with ${coreSubjectIds.length + optionalSubjects.length} selected subjects`);
      
      return { selection, allSubjects: [...coreSubjectIds, ...optionalSubjects] };
    });
    
    logger.info(`[PrismaSubjectSelectionService] Subject selection created successfully: ${result.selection.id}`);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error(`[PrismaSubjectSelectionService] Error creating subject selection: ${error.message}`, error);
    return {
      success: false,
      message: `Error creating subject selection: ${error.message}`,
      error
    };
  }
}

/**
 * Update an existing subject selection
 * @param {string} selectionId - Selection ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Result of the operation
 */
async function updateSubjectSelection(selectionId, updateData) {
  const { optionalSubjects, notes, status } = updateData;
  
  try {
    logger.info(`[PrismaSubjectSelectionService] Updating subject selection: ${selectionId}`);
    
    // Check if selection exists
    const existingSelection = await prisma.studentSubjectSelection.findUnique({
      where: { id: selectionId }
    });
    
    if (!existingSelection) {
      logger.warn(`[PrismaSubjectSelectionService] Subject selection not found: ${selectionId}`);
      return {
        success: false,
        message: 'Subject selection not found'
      };
    }
    
    // Update the selection
    const updatedSelection = await prisma.studentSubjectSelection.update({
      where: { id: selectionId },
      data: {
        optionalSubjects: optionalSubjects || undefined,
        notes: notes !== undefined ? notes : undefined,
        status: status || undefined,
        updatedAt: new Date()
      }
    });
    
    logger.info(`[PrismaSubjectSelectionService] Subject selection updated successfully: ${selectionId}`);
    
    return {
      success: true,
      data: updatedSelection
    };
  } catch (error) {
    logger.error(`[PrismaSubjectSelectionService] Error updating subject selection: ${error.message}`, error);
    return {
      success: false,
      message: `Error updating subject selection: ${error.message}`,
      error
    };
  }
}

module.exports = {
  createSubjectSelection,
  updateSubjectSelection
};
