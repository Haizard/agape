const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const FeeSchedule = require('../models/FeeSchedule');
const StudentFee = require('../models/StudentFee');
const Student = require('../models/Student');
const AcademicYear = require('../models/AcademicYear');
const Class = require('../models/Class');

// Get all fee schedules
router.get('/', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { academicYear, class: classId, active } = req.query;
    
    // Build query
    const query = {};
    if (academicYear) query.academicYear = mongoose.Types.ObjectId(academicYear);
    if (classId) query.class = mongoose.Types.ObjectId(classId);
    if (active === 'true') query.isActive = true;
    
    const schedules = await FeeSchedule.find(query)
      .populate('academicYear', 'name year isActive')
      .populate('class', 'name section stream')
      .sort({ createdAt: -1 });
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching fee schedules:', error);
    res.status(500).json({ message: 'Error fetching fee schedules' });
  }
});

// Get a single fee schedule
router.get('/:id', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const schedule = await FeeSchedule.findById(req.params.id)
      .populate('academicYear', 'name year isActive')
      .populate('class', 'name section stream');
    
    if (!schedule) {
      return res.status(404).json({ message: 'Fee schedule not found' });
    }
    
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching fee schedule:', error);
    res.status(500).json({ message: 'Error fetching fee schedule' });
  }
});

// Create a new fee schedule
router.post('/', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { name, description, academicYear, class: classId, installments, enableReminders, reminderDays } = req.body;
    
    // Validate required fields
    if (!name || !academicYear || !installments || installments.length === 0) {
      return res.status(400).json({ message: 'Name, academic year, and at least one installment are required' });
    }
    
    // Validate installments
    const totalPercentage = installments.reduce((sum, installment) => sum + installment.percentage, 0);
    if (totalPercentage !== 100) {
      return res.status(400).json({ message: `Installment percentages must add up to 100%. Current total: ${totalPercentage}%` });
    }
    
    // Create schedule
    const schedule = new FeeSchedule({
      name,
      description,
      academicYear,
      class: classId || null,
      installments: installments.map(installment => ({
        name: installment.name,
        dueDate: installment.dueDate,
        percentage: installment.percentage
      })),
      enableReminders: enableReminders !== undefined ? enableReminders : true,
      reminderDays: reminderDays || 7,
      isActive: true,
      createdBy: req.user.userId
    });
    
    await schedule.save();
    
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating fee schedule:', error);
    res.status(500).json({ message: 'Error creating fee schedule' });
  }
});

// Update a fee schedule
router.put('/:id', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { name, description, academicYear, class: classId, installments, enableReminders, reminderDays } = req.body;
    
    // Validate required fields
    if (!name || !academicYear || !installments || installments.length === 0) {
      return res.status(400).json({ message: 'Name, academic year, and at least one installment are required' });
    }
    
    // Validate installments
    const totalPercentage = installments.reduce((sum, installment) => sum + installment.percentage, 0);
    if (totalPercentage !== 100) {
      return res.status(400).json({ message: `Installment percentages must add up to 100%. Current total: ${totalPercentage}%` });
    }
    
    // Find and update schedule
    const schedule = await FeeSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Fee schedule not found' });
    }
    
    schedule.name = name;
    schedule.description = description;
    schedule.academicYear = academicYear;
    schedule.class = classId || null;
    schedule.installments = installments.map(installment => ({
      name: installment.name,
      dueDate: installment.dueDate,
      percentage: installment.percentage
    }));
    schedule.enableReminders = enableReminders !== undefined ? enableReminders : schedule.enableReminders;
    schedule.reminderDays = reminderDays || schedule.reminderDays;
    schedule.updatedBy = req.user.userId;
    
    await schedule.save();
    
    res.json(schedule);
  } catch (error) {
    console.error('Error updating fee schedule:', error);
    res.status(500).json({ message: 'Error updating fee schedule' });
  }
});

// Delete a fee schedule
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const schedule = await FeeSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Fee schedule not found' });
    }
    
    // Check if schedule is in use
    const studentFees = await StudentFee.find({ feeSchedule: req.params.id });
    
    if (studentFees.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete fee schedule that is in use. Deactivate it instead.',
        inUseCount: studentFees.length
      });
    }
    
    await schedule.remove();
    
    res.json({ message: 'Fee schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee schedule:', error);
    res.status(500).json({ message: 'Error deleting fee schedule' });
  }
});

// Toggle active status
router.patch('/:id/toggle-active', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const schedule = await FeeSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Fee schedule not found' });
    }
    
    schedule.isActive = !schedule.isActive;
    schedule.updatedBy = req.user.userId;
    
    await schedule.save();
    
    res.json({ 
      message: `Fee schedule ${schedule.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: schedule.isActive
    });
  } catch (error) {
    console.error('Error toggling fee schedule status:', error);
    res.status(500).json({ message: 'Error toggling fee schedule status' });
  }
});

// Apply fee schedule to students
router.post('/:id/apply', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const schedule = await FeeSchedule.findById(req.params.id)
      .populate('academicYear')
      .populate('class');
    
    if (!schedule) {
      return res.status(404).json({ message: 'Fee schedule not found' });
    }
    
    if (!schedule.isActive) {
      return res.status(400).json({ message: 'Cannot apply inactive fee schedule' });
    }
    
    // Find eligible students
    const query = {
      status: 'active'
    };
    
    if (schedule.class) {
      query.class = schedule.class._id;
    }
    
    const students = await Student.find(query);
    
    if (students.length === 0) {
      return res.status(400).json({ message: 'No eligible students found' });
    }
    
    // Find student fees for the academic year
    const studentFees = await StudentFee.find({
      student: { $in: students.map(s => s._id) },
      academicYear: schedule.academicYear._id
    });
    
    // Create a map of student IDs to their fees
    const studentFeeMap = {};
    studentFees.forEach(fee => {
      studentFeeMap[fee.student.toString()] = fee;
    });
    
    // Apply schedule to each student
    let appliedCount = 0;
    let skippedCount = 0;
    
    for (const student of students) {
      const studentFee = studentFeeMap[student._id.toString()];
      
      if (!studentFee) {
        skippedCount++;
        continue; // Skip students without fee structure
      }
      
      // Check if schedule is already applied
      if (studentFee.feeSchedule && studentFee.feeSchedule.toString() === schedule._id.toString()) {
        skippedCount++;
        continue;
      }
      
      // Apply schedule
      studentFee.feeSchedule = schedule._id;
      studentFee.installments = schedule.installments.map(installment => ({
        name: installment.name,
        dueDate: installment.dueDate,
        percentage: installment.percentage,
        amount: (studentFee.totalAmount * installment.percentage) / 100,
        amountPaid: 0,
        balance: (studentFee.totalAmount * installment.percentage) / 100,
        status: 'pending'
      }));
      studentFee.updatedBy = req.user.userId;
      
      await studentFee.save();
      appliedCount++;
    }
    
    res.json({
      message: `Fee schedule applied to ${appliedCount} students. ${skippedCount} students skipped.`,
      appliedCount,
      skippedCount,
      totalStudents: students.length
    });
  } catch (error) {
    console.error('Error applying fee schedule:', error);
    res.status(500).json({ message: 'Error applying fee schedule' });
  }
});

// Get upcoming installments
router.get('/upcoming-installments', authenticateToken, authorizeRole(['admin', 'finance', 'teacher']), async (req, res) => {
  try {
    const { days = 30, academicYear, class: classId } = req.query;
    
    // Get current date and date range
    const currentDate = new Date();
    const endDate = new Date();
    endDate.setDate(currentDate.getDate() + parseInt(days));
    
    // Build query
    const query = {
      'installments.dueDate': { $gte: currentDate, $lte: endDate }
    };
    
    if (academicYear) query.academicYear = mongoose.Types.ObjectId(academicYear);
    if (classId) query.class = mongoose.Types.ObjectId(classId);
    
    // Find student fees with upcoming installments
    const studentFees = await StudentFee.find(query)
      .populate('student', 'firstName lastName admissionNumber')
      .populate('class', 'name section stream')
      .populate('academicYear', 'name year')
      .populate('feeStructure', 'name')
      .populate('feeSchedule', 'name');
    
    // Extract upcoming installments
    const upcomingInstallments = [];
    
    studentFees.forEach(fee => {
      fee.installments.forEach(installment => {
        const dueDate = new Date(installment.dueDate);
        
        if (dueDate >= currentDate && dueDate <= endDate && installment.status !== 'paid') {
          upcomingInstallments.push({
            student: {
              _id: fee.student._id,
              name: `${fee.student.firstName} ${fee.student.lastName}`,
              admissionNumber: fee.student.admissionNumber
            },
            class: fee.class ? {
              _id: fee.class._id,
              name: fee.class.name,
              section: fee.class.section,
              stream: fee.class.stream
            } : null,
            academicYear: fee.academicYear ? {
              _id: fee.academicYear._id,
              name: fee.academicYear.name || fee.academicYear.year
            } : null,
            feeStructure: fee.feeStructure ? {
              _id: fee.feeStructure._id,
              name: fee.feeStructure.name
            } : null,
            feeSchedule: fee.feeSchedule ? {
              _id: fee.feeSchedule._id,
              name: fee.feeSchedule.name
            } : null,
            installment: {
              name: installment.name,
              dueDate: installment.dueDate,
              amount: installment.amount,
              amountPaid: installment.amountPaid,
              balance: installment.balance,
              status: installment.status
            },
            daysUntilDue: Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24))
          });
        }
      });
    });
    
    // Sort by due date
    upcomingInstallments.sort((a, b) => new Date(a.installment.dueDate) - new Date(b.installment.dueDate));
    
    res.json({
      upcomingInstallments,
      count: upcomingInstallments.length,
      dateRange: {
        start: currentDate,
        end: endDate
      }
    });
  } catch (error) {
    console.error('Error fetching upcoming installments:', error);
    res.status(500).json({ message: 'Error fetching upcoming installments' });
  }
});

module.exports = router;
