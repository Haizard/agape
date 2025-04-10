const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const Finance = require('../models/Finance');
const User = require('../models/User');
const FeeStructure = require('../models/FeeStructure');
const FeeTemplate = require('../models/FeeTemplate');
const FeeSchedule = require('../models/FeeSchedule');
const StudentFee = require('../models/StudentFee');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Class = require('../models/Class');
const AcademicYear = require('../models/AcademicYear');
const QuickbooksConfig = require('../models/QuickbooksConfig');
const financeService = require('../services/financeService');
const quickbooksService = require('../services/quickbooksService');

// Middleware to check if QuickBooks is configured
const checkQuickbooksConfig = async (req, res, next) => {
  try {
    const config = await QuickbooksConfig.getConfig();
    req.quickbooksConfig = config;
    next();
  } catch (error) {
    console.error('Error checking QuickBooks configuration:', error);
    return res.status(500).json({ message: 'Error checking QuickBooks configuration' });
  }
};

// Send fee reminder
router.post('/send-reminder', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { studentFeeId, reminderType, message, sendToAll } = req.body;

    if (!studentFeeId || !reminderType || !message) {
      return res.status(400).json({ message: 'Student fee ID, reminder type, and message are required' });
    }

    // Find the student fee
    const studentFee = await StudentFee.findById(studentFeeId)
      .populate('student', 'firstName lastName admissionNumber parent')
      .populate('class', 'name section stream')
      .populate('academicYear', 'name year');

    if (!studentFee) {
      return res.status(404).json({ message: 'Student fee not found' });
    }

    // Check if parent contact information is available
    if (!studentFee.student.parent || (!studentFee.student.parent.phone && !studentFee.student.parent.email)) {
      return res.status(400).json({ message: 'Parent contact information not available' });
    }

    // Send reminder based on type
    let sentCount = 0;

    if (sendToAll) {
      // Find all student fees with similar status
      const query = {
        status: studentFee.status,
        academicYear: studentFee.academicYear._id
      };

      if (studentFee.class) {
        query.class = studentFee.class._id;
      }

      const similarFees = await StudentFee.find(query)
        .populate('student', 'firstName lastName admissionNumber parent')
        .populate('class', 'name section stream')
        .populate('academicYear', 'name year');

      // Send to all similar fees
      for (const fee of similarFees) {
        if (fee.student.parent) {
          if (reminderType === 'sms' || reminderType === 'both') {
            if (fee.student.parent.phone) {
              // Send SMS
              // This would typically use an SMS service like Twilio or Africa's Talking
              console.log(`Sending SMS to ${fee.student.parent.phone} for student ${fee.student.firstName} ${fee.student.lastName}`);
              // Implement SMS sending logic here
              sentCount++;
            }
          }

          if (reminderType === 'email' || reminderType === 'both') {
            if (fee.student.parent.email) {
              // Send Email
              console.log(`Sending Email to ${fee.student.parent.email} for student ${fee.student.firstName} ${fee.student.lastName}`);
              // Implement email sending logic here
              sentCount++;
            }
          }
        }
      }
    } else {
      // Send to just this student
      if (reminderType === 'sms' || reminderType === 'both') {
        if (studentFee.student.parent.phone) {
          // Send SMS
          console.log(`Sending SMS to ${studentFee.student.parent.phone} for student ${studentFee.student.firstName} ${studentFee.student.lastName}`);
          // Implement SMS sending logic here
          sentCount++;
        }
      }

      if (reminderType === 'email' || reminderType === 'both') {
        if (studentFee.student.parent.email) {
          // Send Email
          console.log(`Sending Email to ${studentFee.student.parent.email} for student ${studentFee.student.firstName} ${studentFee.student.lastName}`);
          // Implement email sending logic here
          sentCount++;
        }
      }
    }

    // Log the reminder
    await StudentFee.findByIdAndUpdate(studentFeeId, {
      $push: {
        reminders: {
          type: reminderType,
          message,
          sentBy: req.user.userId,
          sentAt: new Date()
        }
      }
    });

    res.json({
      message: `Fee reminder${sendToAll ? 's' : ''} sent successfully`,
      sentCount
    });
  } catch (error) {
    console.error('Error sending fee reminder:', error);
    res.status(500).json({ message: 'Error sending fee reminder' });
  }
});

// Fee Template Routes

// Get all fee templates
router.get('/fee-templates', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { status, academicYear, search } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (academicYear) {
      query.academicYear = academicYear;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const feeTemplates = await FeeTemplate.find(query)
      .populate('academicYear', 'name year')
      .populate('applicableClasses', 'name section stream')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(feeTemplates);
  } catch (error) {
    console.error('Error fetching fee templates:', error);
    res.status(500).json({ message: 'Error fetching fee templates' });
  }
});

// Get a specific fee template
router.get('/fee-templates/:id', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const feeTemplate = await FeeTemplate.findById(req.params.id)
      .populate('academicYear', 'name year')
      .populate('applicableClasses', 'name section stream')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    if (!feeTemplate) {
      return res.status(404).json({ message: 'Fee template not found' });
    }

    res.json(feeTemplate);
  } catch (error) {
    console.error('Error fetching fee template:', error);
    res.status(500).json({ message: 'Error fetching fee template' });
  }
});

// Create a new fee template
router.post('/fee-templates', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { name, description, components, status, applicableClasses, academicYear } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Create new fee template
    const feeTemplate = new FeeTemplate({
      name,
      description,
      components: components || [],
      status: status || 'draft',
      applicableClasses: applicableClasses || [],
      academicYear,
      createdBy: req.user.userId
    });

    await feeTemplate.save();

    res.status(201).json({
      message: 'Fee template created successfully',
      feeTemplate
    });
  } catch (error) {
    console.error('Error creating fee template:', error);
    res.status(500).json({ message: 'Error creating fee template' });
  }
});

// Update a fee template
router.put('/fee-templates/:id', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { name, description, components, status, applicableClasses, academicYear } = req.body;

    // Find fee template
    const feeTemplate = await FeeTemplate.findById(req.params.id);

    if (!feeTemplate) {
      return res.status(404).json({ message: 'Fee template not found' });
    }

    // Update fields
    if (name) feeTemplate.name = name;
    if (description !== undefined) feeTemplate.description = description;
    if (components) feeTemplate.components = components;
    if (status) feeTemplate.status = status;
    if (applicableClasses) feeTemplate.applicableClasses = applicableClasses;
    if (academicYear) feeTemplate.academicYear = academicYear;

    feeTemplate.updatedBy = req.user.userId;

    await feeTemplate.save();

    res.json({
      message: 'Fee template updated successfully',
      feeTemplate
    });
  } catch (error) {
    console.error('Error updating fee template:', error);
    res.status(500).json({ message: 'Error updating fee template' });
  }
});

// Delete a fee template
router.delete('/fee-templates/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const feeTemplate = await FeeTemplate.findById(req.params.id);

    if (!feeTemplate) {
      return res.status(404).json({ message: 'Fee template not found' });
    }

    // Check if the template is used in any fee structures
    const feeStructures = await FeeStructure.find({ template: req.params.id });

    if (feeStructures.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete fee template as it is used in fee structures',
        feeStructures: feeStructures.map(fs => ({ id: fs._id, name: fs.name }))
      });
    }

    await FeeTemplate.findByIdAndDelete(req.params.id);

    res.json({ message: 'Fee template deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee template:', error);
    res.status(500).json({ message: 'Error deleting fee template' });
  }
});

// Clone a fee template
router.post('/fee-templates/:id/clone', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'New template name is required' });
    }

    // Find source template
    const sourceTemplate = await FeeTemplate.findById(req.params.id);

    if (!sourceTemplate) {
      return res.status(404).json({ message: 'Source fee template not found' });
    }

    // Create new template with copied data
    const newTemplate = new FeeTemplate({
      name,
      description: `Clone of ${sourceTemplate.name}: ${sourceTemplate.description || ''}`,
      components: sourceTemplate.components,
      status: 'draft',  // Always start as draft
      applicableClasses: sourceTemplate.applicableClasses,
      academicYear: sourceTemplate.academicYear,
      createdBy: req.user.userId
    });

    await newTemplate.save();

    res.status(201).json({
      message: 'Fee template cloned successfully',
      feeTemplate: newTemplate
    });
  } catch (error) {
    console.error('Error cloning fee template:', error);
    res.status(500).json({ message: 'Error cloning fee template' });
  }
});

// Fee Schedule Routes

// Get all fee schedules
router.get('/fee-schedules', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { academicYear, class: classId, active } = req.query;

    // Build query
    const query = {};

    if (academicYear) {
      query.academicYear = academicYear;
    }

    if (classId) {
      query.class = classId;
    }

    if (active === 'true') {
      query.isActive = true;
    } else if (active === 'false') {
      query.isActive = false;
    }

    const feeSchedules = await FeeSchedule.find(query)
      .populate('academicYear', 'name year isActive')
      .populate('class', 'name grade')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(feeSchedules);
  } catch (error) {
    console.error('Error fetching fee schedules:', error);
    res.status(500).json({ message: 'Error fetching fee schedules' });
  }
});

// Get a single fee schedule
router.get('/fee-schedules/:id', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const feeSchedule = await FeeSchedule.findById(req.params.id)
      .populate('academicYear', 'name year isActive')
      .populate('class', 'name grade')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    if (!feeSchedule) {
      return res.status(404).json({ message: 'Fee schedule not found' });
    }

    res.json(feeSchedule);
  } catch (error) {
    console.error('Error fetching fee schedule:', error);
    res.status(500).json({ message: 'Error fetching fee schedule' });
  }
});

// Create a new fee schedule
router.post('/fee-schedules', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { name, description, academicYear, class: classId, installments, enableReminders, reminderDays, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!academicYear) {
      return res.status(400).json({ message: 'Academic year is required' });
    }

    if (!installments || !Array.isArray(installments) || installments.length === 0) {
      return res.status(400).json({ message: 'At least one installment is required' });
    }

    // Validate installment percentages
    const totalPercentage = installments.reduce((sum, installment) => sum + installment.percentage, 0);
    if (totalPercentage !== 100) {
      return res.status(400).json({ message: `Installment percentages must add up to 100%. Current total: ${totalPercentage}%` });
    }

    // Create new fee schedule
    const feeSchedule = new FeeSchedule({
      name,
      description,
      academicYear,
      class: classId || null,
      installments,
      enableReminders: enableReminders !== undefined ? enableReminders : true,
      reminderDays: reminderDays || 7,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.userId
    });

    await feeSchedule.save();

    res.status(201).json({
      message: 'Fee schedule created successfully',
      feeSchedule
    });
  } catch (error) {
    console.error('Error creating fee schedule:', error);
    res.status(500).json({ message: error.message || 'Error creating fee schedule' });
  }
});

// Update a fee schedule
router.put('/fee-schedules/:id', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { name, description, academicYear, class: classId, installments, enableReminders, reminderDays, isActive } = req.body;

    // Find fee schedule
    const feeSchedule = await FeeSchedule.findById(req.params.id);

    if (!feeSchedule) {
      return res.status(404).json({ message: 'Fee schedule not found' });
    }

    // Update fields
    if (name) feeSchedule.name = name;
    if (description !== undefined) feeSchedule.description = description;
    if (academicYear) feeSchedule.academicYear = academicYear;
    if (classId !== undefined) feeSchedule.class = classId || null;
    if (enableReminders !== undefined) feeSchedule.enableReminders = enableReminders;
    if (reminderDays) feeSchedule.reminderDays = reminderDays;
    if (isActive !== undefined) feeSchedule.isActive = isActive;

    // Update installments if provided
    if (installments && Array.isArray(installments)) {
      // Validate installment percentages
      const totalPercentage = installments.reduce((sum, installment) => sum + installment.percentage, 0);
      if (totalPercentage !== 100) {
        return res.status(400).json({ message: `Installment percentages must add up to 100%. Current total: ${totalPercentage}%` });
      }

      feeSchedule.installments = installments;
    }

    feeSchedule.updatedBy = req.user.userId;
    feeSchedule.updatedAt = new Date();

    await feeSchedule.save();

    res.json({
      message: 'Fee schedule updated successfully',
      feeSchedule
    });
  } catch (error) {
    console.error('Error updating fee schedule:', error);
    res.status(500).json({ message: error.message || 'Error updating fee schedule' });
  }
});

// Delete a fee schedule
router.delete('/fee-schedules/:id', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const feeSchedule = await FeeSchedule.findById(req.params.id);

    if (!feeSchedule) {
      return res.status(404).json({ message: 'Fee schedule not found' });
    }

    // Check if the schedule is used in any student fees
    const studentFees = await StudentFee.find({ 'paymentSchedule.scheduleId': req.params.id });

    if (studentFees.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete fee schedule as it is used in student fees',
        studentFees: studentFees.map(sf => ({ id: sf._id, student: sf.student }))
      });
    }

    await FeeSchedule.findByIdAndDelete(req.params.id);

    res.json({ message: 'Fee schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee schedule:', error);
    res.status(500).json({ message: 'Error deleting fee schedule' });
  }
});

// Toggle fee schedule active status
router.patch('/fee-schedules/:id/toggle-status', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const feeSchedule = await FeeSchedule.findById(req.params.id);

    if (!feeSchedule) {
      return res.status(404).json({ message: 'Fee schedule not found' });
    }

    feeSchedule.isActive = !feeSchedule.isActive;
    feeSchedule.updatedBy = req.user.userId;
    feeSchedule.updatedAt = new Date();

    await feeSchedule.save();

    res.json({
      message: `Fee schedule ${feeSchedule.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: feeSchedule.isActive
    });
  } catch (error) {
    console.error('Error toggling fee schedule status:', error);
    res.status(500).json({ message: 'Error toggling fee schedule status' });
  }
});

// Bulk operations for fee structures
router.post('/fee-structures/bulk', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { feeStructureIds, action, targetAcademicYear, targetClasses, adjustmentFactor } = req.body;

    if (!feeStructureIds || !Array.isArray(feeStructureIds) || feeStructureIds.length === 0) {
      return res.status(400).json({ message: 'Fee structure IDs are required' });
    }

    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    const result = {
      success: true,
      message: '',
      details: '',
      processed: 0,
      failed: 0
    };

    // Process based on action
    switch (action) {
      case 'activate':
        // Activate fee structures
        await FeeStructure.updateMany(
          { _id: { $in: feeStructureIds } },
          { status: 'active', updatedBy: req.user.userId, updatedAt: new Date() }
        );

        result.message = 'Fee structures activated successfully';
        result.details = `${feeStructureIds.length} fee structure(s) have been activated.`;
        result.processed = feeStructureIds.length;
        break;

      case 'archive':
        // Archive fee structures
        await FeeStructure.updateMany(
          { _id: { $in: feeStructureIds } },
          { status: 'archived', updatedBy: req.user.userId, updatedAt: new Date() }
        );

        result.message = 'Fee structures archived successfully';
        result.details = `${feeStructureIds.length} fee structure(s) have been archived.`;
        result.processed = feeStructureIds.length;
        break;

      case 'update': {
        // Update fee amounts
        if (!adjustmentFactor || adjustmentFactor <= 0) {
          return res.status(400).json({ message: 'Valid adjustment factor is required for update action' });
        }

        // Get all fee structures
        const feeStructuresToUpdate = await FeeStructure.find({ _id: { $in: feeStructureIds } });

        // Update each fee structure
        for (const feeStructure of feeStructuresToUpdate) {
          try {
            // Update fee components
            if (feeStructure.components && feeStructure.components.length > 0) {
              feeStructure.components = feeStructure.components.map(component => ({
                ...component,
                amount: Math.round(component.amount * adjustmentFactor)
              }));
            }

            // Recalculate total amount
            feeStructure.totalAmount = feeStructure.components.reduce(
              (total, component) => total + component.amount,
              0
            );

            feeStructure.updatedBy = req.user.userId;
            feeStructure.updatedAt = new Date();

            await feeStructure.save();
            result.processed++;
          } catch (error) {
            console.error(`Error updating fee structure ${feeStructure._id}:`, error);
            result.failed++;
          }
        }

        result.message = 'Fee structures updated successfully';
        result.details = `${result.processed} fee structure(s) have been updated with adjustment factor ${adjustmentFactor}.`;
        if (result.failed > 0) {
          result.details += ` ${result.failed} fee structure(s) failed to update.`;
        }
        break;
      }

      case 'copy': {
        // Copy fee structures to a new academic year
        if (!targetAcademicYear) {
          return res.status(400).json({ message: 'Target academic year is required for copy action' });
        }

        // Get all fee structures
        const feeStructuresToCopy = await FeeStructure.find({ _id: { $in: feeStructureIds } });

        // Copy each fee structure
        for (const feeStructure of feeStructuresToCopy) {
          try {
            // Create new fee structure
            const newFeeStructure = new FeeStructure({
              name: `${feeStructure.name} (Copy)`,
              description: feeStructure.description,
              academicYear: targetAcademicYear,
              class: targetClasses && targetClasses.length > 0 ? targetClasses : feeStructure.class,
              components: feeStructure.components,
              totalAmount: feeStructure.totalAmount,
              status: 'draft',
              template: feeStructure.template,
              createdBy: req.user.userId,
              createdAt: new Date()
            });

            await newFeeStructure.save();
            result.processed++;
          } catch (error) {
            console.error(`Error copying fee structure ${feeStructure._id}:`, error);
            result.failed++;
          }
        }

        result.message = 'Fee structures copied successfully';
        result.details = `${result.processed} fee structure(s) have been copied to the target academic year.`;
        if (result.failed > 0) {
          result.details += ` ${result.failed} fee structure(s) failed to copy.`;
        }
        break;
      }

      default: {
        return res.status(400).json({ message: 'Invalid action' });
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error processing bulk fee structures action:', error);
    res.status(500).json({ message: 'Error processing bulk fee structures action' });
  }
});

// Get all finance users
router.get('/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const financeUsers = await Finance.find()
      .populate('userId', 'username email role active');

    res.json(financeUsers);
  } catch (error) {
    console.error('Error fetching finance users:', error);
    res.status(500).json({ message: 'Error fetching finance users' });
  }
});

// Create a new finance user
router.post('/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { username, password, email, firstName, lastName, contactNumber, position, employeeId } = req.body;

    // Create user account
    const user = new User({
      username,
      password,
      email,
      role: 'finance',
      active: true
    });

    await user.save({ session });

    // Create finance profile
    const finance = new Finance({
      userId: user._id,
      firstName,
      lastName,
      email,
      contactNumber,
      position,
      employeeId,
      status: 'active'
    });

    await finance.save({ session });

    await session.commitTransaction();
    res.status(201).json({ message: 'Finance user created successfully', finance });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating finance user:', error);

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username, email, or employee ID already exists' });
    }

    res.status(500).json({ message: 'Error creating finance user' });
  } finally {
    session.endSession();
  }
});

// Get finance user profile
router.get('/profile', authenticateToken, authorizeRole(['finance', 'admin']), async (req, res) => {
  try {
    // If admin is checking, they need to provide a userId
    let userId = req.user.userId;
    if (req.user.role === 'admin' && req.query.userId) {
      userId = req.query.userId;
    }

    const finance = await Finance.findOne({ userId })
      .populate('userId', 'username email role active');

    if (!finance) {
      return res.status(404).json({ message: 'Finance profile not found' });
    }

    res.json(finance);
  } catch (error) {
    console.error('Error fetching finance profile:', error);
    res.status(500).json({ message: 'Error fetching finance profile' });
  }
});

// Update finance user profile
router.put('/profile/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { firstName, lastName, email, contactNumber, position, status } = req.body;

    const finance = await Finance.findById(req.params.id);
    if (!finance) {
      return res.status(404).json({ message: 'Finance profile not found' });
    }

    // Update finance profile
    finance.firstName = firstName || finance.firstName;
    finance.lastName = lastName || finance.lastName;
    finance.email = email || finance.email;
    finance.contactNumber = contactNumber || finance.contactNumber;
    finance.position = position || finance.position;
    finance.status = status || finance.status;

    await finance.save();

    // If status changed to inactive, deactivate user account
    if (status === 'inactive' || status === 'terminated') {
      await User.findByIdAndUpdate(finance.userId, { active: false });
    } else if (status === 'active') {
      await User.findByIdAndUpdate(finance.userId, { active: true });
    }

    res.json({ message: 'Finance profile updated successfully', finance });
  } catch (error) {
    console.error('Error updating finance profile:', error);
    res.status(500).json({ message: 'Error updating finance profile' });
  }
});

// Get all fee structures
router.get('/fee-structures', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { academicYear, class: classId, status } = req.query;

    // Build query
    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (classId) query.class = classId;
    if (status) query.status = status;

    const feeStructures = await FeeStructure.find(query)
      .populate('academicYear', 'name year')
      .populate('class', 'name section stream')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(feeStructures);
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    res.status(500).json({ message: 'Error fetching fee structures' });
  }
});

// Get a specific fee structure
router.get('/fee-structures/:id', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const feeStructure = await FeeStructure.findById(req.params.id)
      .populate('academicYear', 'name year')
      .populate('class', 'name section stream')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    res.json(feeStructure);
  } catch (error) {
    console.error('Error fetching fee structure:', error);
    res.status(500).json({ message: 'Error fetching fee structure' });
  }
});

// Create a new fee structure
router.post('/fee-structures', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const feeStructure = await financeService.createFeeStructure(req.body, req.user);
    res.status(201).json({ message: 'Fee structure created successfully', feeStructure });
  } catch (error) {
    console.error('Error creating fee structure:', error);

    if (error.code === 11000) {
      return res.status(400).json({ message: 'A fee structure already exists for this class and academic year' });
    }

    res.status(500).json({ message: 'Error creating fee structure' });
  }
});

// Update a fee structure
router.put('/fee-structures/:id', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const feeStructure = await financeService.updateFeeStructure(req.params.id, req.body, req.user);
    res.json({ message: 'Fee structure updated successfully', feeStructure });
  } catch (error) {
    console.error('Error updating fee structure:', error);
    res.status(500).json({ message: 'Error updating fee structure' });
  }
});

// Get all student fees
router.get('/student-fees', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { academicYear, class: classId, status, student } = req.query;

    // Build query
    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (classId) query.class = classId;
    if (status) query.status = status;
    if (student) query.student = student;

    const studentFees = await StudentFee.find(query)
      .populate('student', 'firstName lastName admissionNumber')
      .populate('feeStructure', 'name')
      .populate('academicYear', 'name year')
      .populate('class', 'name section stream')
      .sort({ 'student.firstName': 1, 'student.lastName': 1 });

    res.json(studentFees);
  } catch (error) {
    console.error('Error fetching student fees:', error);
    res.status(500).json({ message: 'Error fetching student fees' });
  }
});

// Get a specific student fee
// Generate student fee statement
router.get('/student-fees/:id/statement', authenticateToken, authorizeRole(['admin', 'finance', 'teacher']), async (req, res) => {
  try {
    const studentFee = await StudentFee.findById(req.params.id)
      .populate('student', 'firstName lastName admissionNumber parent')
      .populate('class', 'name section stream')
      .populate('academicYear', 'name year')
      .populate('feeStructure', 'name')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    if (!studentFee) {
      return res.status(404).json({ message: 'Student fee not found' });
    }

    // Get payments for this fee
    const payments = await Payment.find({ studentFee: req.params.id })
      .populate('receivedBy', 'username')
      .sort({ paymentDate: -1 });

    // Generate a simple HTML statement
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Statement</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .school-name { font-size: 24px; font-weight: bold; }
          .statement-title { font-size: 18px; margin: 10px 0; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">St. John Vianney School</div>
          <div class="statement-title">Fee Statement</div>
          <div>Generated on: ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="section">
          <div class="section-title">Student Information</div>
          <table>
            <tr>
              <th>Name</th>
              <td>${studentFee.student.firstName} ${studentFee.student.lastName}</td>
              <th>Admission Number</th>
              <td>${studentFee.student.admissionNumber}</td>
            </tr>
            <tr>
              <th>Class</th>
              <td>${studentFee.class.name}${studentFee.class.section ? ` - ${studentFee.class.section}` : ''}${studentFee.class.stream ? ` (${studentFee.class.stream})` : ''}</td>
              <th>Academic Year</th>
              <td>${studentFee.academicYear.name || studentFee.academicYear.year}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Fee Summary</div>
          <table>
            <tr>
              <th>Fee Structure</th>
              <td>${studentFee.feeStructure.name}</td>
              <th>Status</th>
              <td>${studentFee.status.charAt(0).toUpperCase() + studentFee.status.slice(1)}</td>
            </tr>
            <tr>
              <th>Total Amount</th>
              <td>TZS ${studentFee.totalAmount.toLocaleString()}</td>
              <th>Amount Paid</th>
              <td>TZS ${studentFee.amountPaid.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Balance</th>
              <td>TZS ${studentFee.balance.toLocaleString()}</td>
              <th>Due Date</th>
              <td>${new Date(studentFee.dueDate).toLocaleDateString()}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Fee Components</div>
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Amount</th>
                <th>Amount Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              ${studentFee.feeComponents.map(component => `
                <tr>
                  <td>${component.name}</td>
                  <td>TZS ${component.amount.toLocaleString()}</td>
                  <td>TZS ${component.amountPaid.toLocaleString()}</td>
                  <td>TZS ${component.balance.toLocaleString()}</td>
                  <td>${component.status.charAt(0).toUpperCase() + component.status.slice(1)}</td>
                  <td>${component.dueDate ? new Date(component.dueDate).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td>Total</td>
                <td>TZS ${studentFee.totalAmount.toLocaleString()}</td>
                <td>TZS ${studentFee.amountPaid.toLocaleString()}</td>
                <td>TZS ${studentFee.balance.toLocaleString()}</td>
                <td colspan="2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Payment History</div>
          ${payments.length === 0 ? '<p>No payment records found.</p>' : `
            <table>
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Reference</th>
                  <th>Received By</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(payment => `
                  <tr>
                    <td>${payment.receiptNumber}</td>
                    <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td>TZS ${payment.amount.toLocaleString()}</td>
                    <td>${payment.paymentMethod}</td>
                    <td>${payment.referenceNumber || 'N/A'}</td>
                    <td>${payment.receivedBy ? payment.receivedBy.username : 'System'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <div class="footer">
          <p>This is an official fee statement from St. John Vianney School.</p>
          <p>For any inquiries, please contact the finance office.</p>
        </div>
      </body>
      </html>
    `;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="fee-statement-${studentFee.student.admissionNumber}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Error generating fee statement:', error);
    res.status(500).json({ message: 'Error generating fee statement' });
  }
});

router.get('/student-fees/:id', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const studentFee = await StudentFee.findById(req.params.id)
      .populate('student', 'firstName lastName admissionNumber')
      .populate('feeStructure', 'name')
      .populate('academicYear', 'name year')
      .populate('class', 'name section stream')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    if (!studentFee) {
      return res.status(404).json({ message: 'Student fee not found' });
    }

    // Get payments for this fee
    const payments = await Payment.find({ studentFee: studentFee._id })
      .sort({ paymentDate: -1 })
      .populate('receivedBy', 'username');

    res.json({ studentFee, payments });
  } catch (error) {
    console.error('Error fetching student fee:', error);
    res.status(500).json({ message: 'Error fetching student fee' });
  }
});

// Assign fee structure to a student
router.post('/student-fees/assign', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { studentId, feeStructureId } = req.body;

    if (!studentId || !feeStructureId) {
      return res.status(400).json({ message: 'Student ID and fee structure ID are required' });
    }

    const result = await financeService.assignFeeStructureToStudent(studentId, feeStructureId, req.user);
    res.status(201).json({ message: 'Fee structure assigned successfully', studentFee: result });
  } catch (error) {
    console.error('Error assigning fee structure:', error);
    res.status(500).json({ message: error.message || 'Error assigning fee structure' });
  }
});

// Get fee details for a specific student
router.get('/student-fees/student/:studentId', authenticateToken, authorizeRole(['admin', 'finance', 'teacher', 'student']), async (req, res) => {
  try {
    const { academicYear } = req.query;

    if (!academicYear) {
      return res.status(400).json({ message: 'Academic year is required' });
    }

    const studentFeeDetails = await financeService.getStudentFeeDetails(req.params.studentId, academicYear);
    res.json(studentFeeDetails);
  } catch (error) {
    console.error('Error fetching student fee details:', error);
    res.status(500).json({ message: 'Error fetching student fee details' });
  }
});

// Get fee payment status for a class
router.get('/class-fees/:classId', authenticateToken, authorizeRole(['admin', 'finance', 'teacher']), async (req, res) => {
  try {
    const { academicYear } = req.query;

    if (!academicYear) {
      return res.status(400).json({ message: 'Academic year is required' });
    }

    const classFeeStatus = await financeService.getClassFeeStatus(req.params.classId, academicYear);
    res.json(classFeeStatus);
  } catch (error) {
    console.error('Error fetching class fee status:', error);
    res.status(500).json({ message: 'Error fetching class fee status' });
  }
});

// Record a payment
router.post('/payments', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const payment = await financeService.recordPayment(req.body, req.user);
    res.status(201).json({ message: 'Payment recorded successfully', payment });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: error.message || 'Error recording payment' });
  }
});

// Get all payments with stats
router.get('/payments', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { startDate, endDate, academicYear, class: classId, paymentMethod, search } = req.query;

    // Build query
    const query = {};

    // Join with studentFee to filter by academicYear and class
    const lookupStage = {
      $lookup: {
        from: 'studentfees',
        localField: 'studentFee',
        foreignField: '_id',
        as: 'studentFeeDetails'
      }
    };

    const unwindStage = {
      $unwind: {
        path: '$studentFeeDetails',
        preserveNullAndEmptyArrays: true
      }
    };

    const matchStages = [];

    // Base match stage
    const baseMatch = {};
    if (paymentMethod) baseMatch.paymentMethod = paymentMethod;

    // Add date range if provided
    if (startDate && endDate) {
      baseMatch.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (Object.keys(baseMatch).length > 0) {
      matchStages.push({ $match: baseMatch });
    }

    // Match stage after lookup for academicYear and class
    const lookupMatch = {};
    if (academicYear) lookupMatch['studentFeeDetails.academicYear'] = mongoose.Types.ObjectId(academicYear);
    if (classId) lookupMatch['studentFeeDetails.class'] = mongoose.Types.ObjectId(classId);

    if (Object.keys(lookupMatch).length > 0) {
      matchStages.push({ $match: lookupMatch });
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      matchStages.push({
        $match: {
          $or: [
            { receiptNumber: searchRegex },
            { referenceNumber: searchRegex },
            { 'studentFeeDetails.student.firstName': searchRegex },
            { 'studentFeeDetails.student.lastName': searchRegex },
            { 'studentFeeDetails.student.admissionNumber': searchRegex }
          ]
        }
      });
    }

    // Create pipeline
    const pipeline = [
      ...matchStages,
      lookupStage,
      unwindStage,
      // Lookup student details
      {
        $lookup: {
          from: 'students',
          localField: 'studentFeeDetails.student',
          foreignField: '_id',
          as: 'studentDetails'
        }
      },
      {
        $unwind: {
          path: '$studentDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      // Lookup class details
      {
        $lookup: {
          from: 'classes',
          localField: 'studentFeeDetails.class',
          foreignField: '_id',
          as: 'classDetails'
        }
      },
      {
        $unwind: {
          path: '$classDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      // Lookup academic year details
      {
        $lookup: {
          from: 'academicyears',
          localField: 'studentFeeDetails.academicYear',
          foreignField: '_id',
          as: 'academicYearDetails'
        }
      },
      {
        $unwind: {
          path: '$academicYearDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      // Lookup received by user details
      {
        $lookup: {
          from: 'users',
          localField: 'receivedBy',
          foreignField: '_id',
          as: 'receivedByDetails'
        }
      },
      {
        $unwind: {
          path: '$receivedByDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      // Project fields
      {
        $project: {
          _id: 1,
          receiptNumber: 1,
          amount: 1,
          paymentDate: 1,
          paymentMethod: 1,
          referenceNumber: 1,
          notes: 1,
          quickbooksInfo: 1,
          createdAt: 1,
          updatedAt: 1,
          studentFee: {
            _id: '$studentFeeDetails._id',
            totalAmount: '$studentFeeDetails.totalAmount',
            amountPaid: '$studentFeeDetails.amountPaid',
            balance: '$studentFeeDetails.balance',
            status: '$studentFeeDetails.status',
            student: {
              _id: '$studentDetails._id',
              firstName: '$studentDetails.firstName',
              lastName: '$studentDetails.lastName',
              admissionNumber: '$studentDetails.admissionNumber'
            },
            class: {
              _id: '$classDetails._id',
              name: '$classDetails.name',
              section: '$classDetails.section',
              stream: '$classDetails.stream'
            },
            academicYear: {
              _id: '$academicYearDetails._id',
              name: '$academicYearDetails.name',
              year: '$academicYearDetails.year'
            }
          },
          receivedBy: {
            _id: '$receivedByDetails._id',
            username: '$receivedByDetails.username'
          }
        }
      }
    ];

    // Execute pipeline
    const payments = await Payment.aggregate(pipeline);

    // Get payment stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total payments
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Today's payments
    const todayPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate >= today && paymentDate < tomorrow;
    });
    const todayPaymentsCount = todayPayments.length;
    const todayAmount = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Pending reconciliation (not synced with QuickBooks)
    const pendingPayments = payments.filter(payment => {
      return !payment.quickbooksInfo || payment.quickbooksInfo.syncStatus !== 'synced';
    });
    const pendingPaymentsCount = pendingPayments.length;
    const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const stats = {
      totalPayments,
      totalAmount,
      todayPayments: todayPaymentsCount,
      todayAmount,
      pendingPayments: pendingPaymentsCount,
      pendingAmount
    };

    // Return payments and stats
    res.json({ payments, stats });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

// Get a specific payment
router.get('/payments/:id', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'firstName lastName admissionNumber')
      .populate({
        path: 'studentFee',
        populate: [
          { path: 'feeStructure', select: 'name' },
          { path: 'academicYear', select: 'name year' },
          { path: 'class', select: 'name section stream' }
        ]
      })
      .populate('receivedBy', 'username');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Error fetching payment' });
  }
});

// Generate financial reports (POST method)
router.post('/reports', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const report = await financeService.generateFinancialReport(req.body);
    res.json(report);
  } catch (error) {
    console.error('Error generating financial report:', error);
    res.status(500).json({ message: error.message || 'Error generating financial report' });
  }
});

// Generate financial reports (GET method)
router.get('/reports/:reportType', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { academicYear, class: classId, startDate, endDate, paymentMethod } = req.query;

    // Convert report type from kebab-case to snake_case
    const reportTypeMap = {
      'fee-collection': 'payment_collection',
      'fee-balance': 'fee_balance',
      'payment-method': 'payment_method',
      'financial-summary': 'financial_summary'
    };

    const reportParams = {
      reportType: reportTypeMap[reportType] || reportType,
      academicYearId: academicYear,
      classId,
      startDate: startDate || new Date(new Date().getFullYear(), 0, 1).toISOString(), // Default to start of year
      endDate: endDate || new Date().toISOString(), // Default to today
      paymentMethod
    };

    const report = await financeService.generateFinancialReport(reportParams);
    res.json(report);
  } catch (error) {
    console.error('Error generating financial report:', error);
    res.status(500).json({ message: error.message || 'Error generating financial report' });
  }
});

// Export financial reports
router.get('/reports/:reportType/export', authenticateToken, authorizeRole(['admin', 'finance']), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { academicYear, class: classId, startDate, endDate, paymentMethod, format } = req.query;

    // Convert report type from kebab-case to snake_case
    const reportTypeMap = {
      'fee-collection': 'payment_collection',
      'fee-balance': 'fee_balance',
      'payment-method': 'payment_method',
      'financial-summary': 'financial_summary'
    };

    const reportParams = {
      reportType: reportTypeMap[reportType] || reportType,
      academicYearId: academicYear,
      classId,
      startDate: startDate || new Date(new Date().getFullYear(), 0, 1).toISOString(), // Default to start of year
      endDate: endDate || new Date().toISOString(), // Default to today
      paymentMethod
    };

    const report = await financeService.generateFinancialReport(reportParams);

    // Generate HTML for the report
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .school-name { font-size: 24px; font-weight: bold; }
          .report-title { font-size: 18px; margin: 10px 0; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">St. John Vianney School</div>
          <div class="report-title">${reportType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Report</div>
          <div>Generated on: ${new Date().toLocaleDateString()}</div>
        </div>
    `;

    // Add report-specific content
    if (reportType === 'fee-collection') {
      html += `
        <div class="section">
          <div class="section-title">Summary</div>
          <table>
            <tr>
              <th>Total Collections</th>
              <td>TZS ${report.totalAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Total Payments</th>
              <td>${report.totalPayments}</td>
            </tr>
            <tr>
              <th>Date Range</th>
              <td>${new Date(report.startDate).toLocaleDateString()} to ${new Date(report.endDate).toLocaleDateString()}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Collections by Date</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Number of Payments</th>
              </tr>
            </thead>
            <tbody>
              ${report.paymentsByDate.map(item => `
                <tr>
                  <td>${new Date(item.date).toLocaleDateString()}</td>
                  <td>TZS ${item.amount.toLocaleString()}</td>
                  <td>${item.count}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td>Total</td>
                <td>TZS ${report.totalAmount.toLocaleString()}</td>
                <td>${report.totalPayments}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Collections by Payment Method</div>
          <table>
            <thead>
              <tr>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Number of Payments</th>
              </tr>
            </thead>
            <tbody>
              ${report.paymentsByMethod.map(item => `
                <tr>
                  <td>${item.method}</td>
                  <td>TZS ${item.amount.toLocaleString()}</td>
                  <td>${item.count}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td>Total</td>
                <td>TZS ${report.totalAmount.toLocaleString()}</td>
                <td>${report.totalPayments}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    } else if (reportType === 'fee-balance') {
      html += `
        <div class="section">
          <div class="section-title">Summary</div>
          <table>
            <tr>
              <th>Total Fees</th>
              <td>TZS ${report.totalAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Total Paid</th>
              <td>TZS ${report.totalPaid.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Total Balance</th>
              <td>TZS ${report.totalBalance.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Payment Percentage</th>
              <td>${report.paymentPercentage.toFixed(2)}%</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Balance by Class</div>
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Total Fees</th>
                <th>Amount Paid</th>
                <th>Balance</th>
                <th>Students</th>
              </tr>
            </thead>
            <tbody>
              ${report.balanceByClass.map(item => `
                <tr>
                  <td>${item.className}</td>
                  <td>TZS ${item.totalAmount.toLocaleString()}</td>
                  <td>TZS ${item.amountPaid.toLocaleString()}</td>
                  <td>TZS ${item.balance.toLocaleString()}</td>
                  <td>${item.count}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td>Total</td>
                <td>TZS ${report.totalAmount.toLocaleString()}</td>
                <td>TZS ${report.totalPaid.toLocaleString()}</td>
                <td>TZS ${report.totalBalance.toLocaleString()}</td>
                <td>${report.studentFees.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    } else if (reportType === 'payment-method') {
      html += `
        <div class="section">
          <div class="section-title">Summary</div>
          <table>
            <tr>
              <th>Total Collections</th>
              <td>TZS ${report.totalAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Total Payments</th>
              <td>${report.totalPayments}</td>
            </tr>
            <tr>
              <th>Date Range</th>
              <td>${new Date(report.startDate).toLocaleDateString()} to ${new Date(report.endDate).toLocaleDateString()}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Collections by Payment Method</div>
          <table>
            <thead>
              <tr>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Number of Payments</th>
              </tr>
            </thead>
            <tbody>
              ${report.paymentsByMethod.map(item => `
                <tr>
                  <td>${item.method}</td>
                  <td>TZS ${item.amount.toLocaleString()}</td>
                  <td>${item.count}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td>Total</td>
                <td>TZS ${report.totalAmount.toLocaleString()}</td>
                <td>${report.totalPayments}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    html += `
        <div class="footer">
          <p>This is an official report from St. John Vianney School.</p>
          <p>For any inquiries, please contact the finance office.</p>
        </div>
      </body>
      </html>
    `;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Error exporting financial report:', error);
    res.status(500).json({ message: error.message || 'Error exporting financial report' });
  }
});

// QuickBooks Integration Routes

// Get QuickBooks configuration
router.get('/quickbooks/config', authenticateToken, authorizeRole(['admin', 'finance']), checkQuickbooksConfig, async (req, res) => {
  try {
    // Remove sensitive information
    const config = req.quickbooksConfig.toObject();
    delete config.clientSecret;
    delete config.accessToken;
    delete config.refreshToken;

    res.json(config);
  } catch (error) {
    console.error('Error fetching QuickBooks configuration:', error);
    res.status(500).json({ message: 'Error fetching QuickBooks configuration' });
  }
});

// Update QuickBooks configuration
router.put('/quickbooks/config', authenticateToken, authorizeRole(['admin']), checkQuickbooksConfig, async (req, res) => {
  try {
    const { environment, clientId, clientSecret, redirectUri, accountMappings, syncSettings } = req.body;

    // Update configuration
    const config = req.quickbooksConfig;
    config.environment = environment || config.environment;
    config.clientId = clientId || config.clientId;
    if (clientSecret) config.clientSecret = clientSecret;
    config.redirectUri = redirectUri || config.redirectUri;

    if (accountMappings) {
      config.accountMappings = {
        ...config.accountMappings,
        ...accountMappings
      };
    }

    if (syncSettings) {
      config.syncSettings = {
        ...config.syncSettings,
        ...syncSettings
      };
    }

    config.updatedBy = req.user.userId;

    await config.save();

    // Initialize QuickBooks service with new configuration
    await quickbooksService.initialize();

    // Remove sensitive information
    const updatedConfig = config.toObject();
    delete updatedConfig.clientSecret;
    delete updatedConfig.accessToken;
    delete updatedConfig.refreshToken;

    res.json({ message: 'QuickBooks configuration updated successfully', config: updatedConfig });
  } catch (error) {
    console.error('Error updating QuickBooks configuration:', error);
    res.status(500).json({ message: 'Error updating QuickBooks configuration' });
  }
});

// Get QuickBooks authorization URL
router.get('/quickbooks/auth-url', authenticateToken, authorizeRole(['admin', 'finance']), checkQuickbooksConfig, async (req, res) => {
  try {
    // Initialize QuickBooks service
    await quickbooksService.initialize();

    // Get authorization URL
    const authUrl = quickbooksService.getAuthorizationUrl();

    res.json({ authUrl });
  } catch (error) {
    console.error('Error getting QuickBooks authorization URL:', error);
    res.status(500).json({ message: 'Error getting QuickBooks authorization URL' });
  }
});

// Handle QuickBooks OAuth callback
router.get('/quickbooks/callback', async (req, res) => {
  try {
    // Initialize QuickBooks service
    await quickbooksService.initialize();

    // Handle callback
    const result = await quickbooksService.handleCallback(req.url);

    res.send(`
      <html>
        <body>
          <h1>QuickBooks Connected Successfully</h1>
          <p>You can close this window and return to the application.</p>
          <script>
            window.opener.postMessage({ type: 'quickbooks-auth-success', realmId: '${result.realmId}' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error handling QuickBooks callback:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>QuickBooks Connection Failed</h1>
          <p>Error: ${error.message}</p>
          <p>Please close this window and try again.</p>
          <script>
            window.opener.postMessage({ type: 'quickbooks-auth-error', error: '${error.message}' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  }
});

// Get QuickBooks accounts
router.get('/quickbooks/accounts', authenticateToken, authorizeRole(['admin', 'finance']), checkQuickbooksConfig, async (req, res) => {
  try {
    // Initialize QuickBooks service
    const isInitialized = await quickbooksService.initialize();

    if (!isInitialized) {
      return res.status(400).json({ message: 'QuickBooks is not configured or authorized' });
    }

    // Get accounts
    const accounts = await quickbooksService.getAccounts();

    res.json(accounts);
  } catch (error) {
    console.error('Error fetching QuickBooks accounts:', error);
    res.status(500).json({ message: 'Error fetching QuickBooks accounts' });
  }
});

// Get QuickBooks payment methods
router.get('/quickbooks/payment-methods', authenticateToken, authorizeRole(['admin', 'finance']), checkQuickbooksConfig, async (req, res) => {
  try {
    // Initialize QuickBooks service
    const isInitialized = await quickbooksService.initialize();

    if (!isInitialized) {
      return res.status(400).json({ message: 'QuickBooks is not configured or authorized' });
    }

    // Get payment methods
    const paymentMethods = await quickbooksService.getPaymentMethods();

    res.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching QuickBooks payment methods:', error);
    res.status(500).json({ message: 'Error fetching QuickBooks payment methods' });
  }
});

// Generate payment receipt
router.get('/payments/:id/receipt', authenticateToken, authorizeRole(['admin', 'finance', 'teacher']), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'studentFee',
        populate: [
          { path: 'student', select: 'firstName lastName admissionNumber' },
          { path: 'class', select: 'name section stream' },
          { path: 'academicYear', select: 'name year' },
          { path: 'feeStructure', select: 'name' }
        ]
      })
      .populate('receivedBy', 'username');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Generate a simple HTML receipt
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .school-name { font-size: 24px; font-weight: bold; }
          .receipt-title { font-size: 18px; margin: 10px 0; }
          .receipt-number { font-size: 16px; margin: 5px 0; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; }
          .signature { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature-line { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">St. John Vianney School</div>
          <div class="receipt-title">Payment Receipt</div>
          <div class="receipt-number">Receipt #: ${payment.receiptNumber}</div>
          <div>Date: ${new Date(payment.paymentDate).toLocaleDateString()}</div>
        </div>

        <div class="section">
          <div class="section-title">Student Information</div>
          <table>
            <tr>
              <th>Name</th>
              <td>${payment.studentFee.student.firstName} ${payment.studentFee.student.lastName}</td>
              <th>Admission Number</th>
              <td>${payment.studentFee.student.admissionNumber}</td>
            </tr>
            <tr>
              <th>Class</th>
              <td>${payment.studentFee.class.name}${payment.studentFee.class.section ? ` - ${payment.studentFee.class.section}` : ''}${payment.studentFee.class.stream ? ` (${payment.studentFee.class.stream})` : ''}</td>
              <th>Academic Year</th>
              <td>${payment.studentFee.academicYear.name || payment.studentFee.academicYear.year}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Payment Details</div>
          <table>
            <tr>
              <th>Amount Paid</th>
              <td>TZS ${payment.amount.toLocaleString()}</td>
              <th>Payment Method</th>
              <td>${payment.paymentMethod}</td>
            </tr>
            <tr>
              <th>Reference Number</th>
              <td>${payment.referenceNumber || 'N/A'}</td>
              <th>Received By</th>
              <td>${payment.receivedBy ? payment.receivedBy.username : 'System'}</td>
            </tr>
            ${payment.notes ? `
            <tr>
              <th>Notes</th>
              <td colspan="3">${payment.notes}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div class="section">
          <div class="section-title">Fee Summary (After Payment)</div>
          <table>
            <tr>
              <th>Fee Structure</th>
              <td>${payment.studentFee.feeStructure.name}</td>
              <th>Total Amount</th>
              <td>TZS ${payment.studentFee.totalAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Amount Paid (Total)</th>
              <td>TZS ${payment.studentFee.amountPaid.toLocaleString()}</td>
              <th>Balance</th>
              <td>TZS ${payment.studentFee.balance.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Status</th>
              <td colspan="3">${payment.studentFee.status.charAt(0).toUpperCase() + payment.studentFee.status.slice(1)}</td>
            </tr>
          </table>
        </div>

        <div class="signature">
          <div>
            <div class="signature-line">Cashier's Signature</div>
          </div>
          <div>
            <div class="signature-line">Official Stamp</div>
          </div>
        </div>

        <div class="footer">
          <p>This is an official receipt from St. John Vianney School.</p>
          <p>For any inquiries, please contact the finance office.</p>
        </div>
      </body>
      </html>
    `;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="payment-receipt-${payment.receiptNumber}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Error generating payment receipt:', error);
    res.status(500).json({ message: 'Error generating payment receipt' });
  }
});

// Send receipt via email
router.post('/payments/:id/email', authenticateToken, authorizeRole(['admin', 'finance', 'teacher']), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'studentFee',
        populate: [
          { path: 'student', select: 'firstName lastName admissionNumber parent' },
          { path: 'class', select: 'name section stream' },
          { path: 'academicYear', select: 'name year' },
          { path: 'feeStructure', select: 'name' }
        ]
      })
      .populate('receivedBy', 'username');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Get parent email
    const parentEmail = payment.studentFee.student.parent?.email;
    if (!parentEmail) {
      return res.status(400).json({ message: 'Parent email not found' });
    }

    // Generate receipt HTML (same as the receipt route)
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .school-name { font-size: 24px; font-weight: bold; }
          .receipt-title { font-size: 18px; margin: 10px 0; }
          .receipt-number { font-size: 16px; margin: 5px 0; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; }
          .signature { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature-line { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">St. John Vianney School</div>
          <div class="receipt-title">Payment Receipt</div>
          <div class="receipt-number">Receipt #: ${payment.receiptNumber}</div>
          <div>Date: ${new Date(payment.paymentDate).toLocaleDateString()}</div>
        </div>

        <div class="section">
          <div class="section-title">Student Information</div>
          <table>
            <tr>
              <th>Name</th>
              <td>${payment.studentFee.student.firstName} ${payment.studentFee.student.lastName}</td>
              <th>Admission Number</th>
              <td>${payment.studentFee.student.admissionNumber}</td>
            </tr>
            <tr>
              <th>Class</th>
              <td>${payment.studentFee.class.name}${payment.studentFee.class.section ? ` - ${payment.studentFee.class.section}` : ''}${payment.studentFee.class.stream ? ` (${payment.studentFee.class.stream})` : ''}</td>
              <th>Academic Year</th>
              <td>${payment.studentFee.academicYear.name || payment.studentFee.academicYear.year}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Payment Details</div>
          <table>
            <tr>
              <th>Amount Paid</th>
              <td>TZS ${payment.amount.toLocaleString()}</td>
              <th>Payment Method</th>
              <td>${payment.paymentMethod}</td>
            </tr>
            <tr>
              <th>Reference Number</th>
              <td>${payment.referenceNumber || 'N/A'}</td>
              <th>Received By</th>
              <td>${payment.receivedBy ? payment.receivedBy.username : 'System'}</td>
            </tr>
            ${payment.notes ? `
            <tr>
              <th>Notes</th>
              <td colspan="3">${payment.notes}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div class="section">
          <div class="section-title">Fee Summary (After Payment)</div>
          <table>
            <tr>
              <th>Fee Structure</th>
              <td>${payment.studentFee.feeStructure.name}</td>
              <th>Total Amount</th>
              <td>TZS ${payment.studentFee.totalAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Amount Paid (Total)</th>
              <td>TZS ${payment.studentFee.amountPaid.toLocaleString()}</td>
              <th>Balance</th>
              <td>TZS ${payment.studentFee.balance.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Status</th>
              <td colspan="3">${payment.studentFee.status.charAt(0).toUpperCase() + payment.studentFee.status.slice(1)}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>This is an official receipt from St. John Vianney School.</p>
          <p>For any inquiries, please contact the finance office.</p>
        </div>
      </body>
      </html>
    `;

    // In a real implementation, you would send an email with the receipt
    // For now, we'll just simulate it
    console.log(`Sending receipt email to ${parentEmail}`);

    // Update the payment record to indicate that a receipt was sent
    payment.receiptSent = true;
    payment.receiptSentAt = new Date();
    await payment.save();

    res.json({ message: 'Receipt sent successfully', email: parentEmail });
  } catch (error) {
    console.error('Error sending receipt email:', error);
    res.status(500).json({ message: 'Error sending receipt email' });
  }
});

// Send fee reminder
router.post('/student-fees/:id/reminder', authenticateToken, authorizeRole(['admin', 'finance', 'teacher']), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Reminder message is required' });
    }

    const studentFee = await StudentFee.findById(req.params.id)
      .populate('student', 'firstName lastName admissionNumber parent')
      .populate('class', 'name section stream')
      .populate('academicYear', 'name year')
      .populate('feeStructure', 'name');

    if (!studentFee) {
      return res.status(404).json({ message: 'Student fee not found' });
    }

    // Get parent contact information
    const parentPhone = studentFee.student.parent?.phone;
    const parentEmail = studentFee.student.parent?.email;

    if (!parentPhone && !parentEmail) {
      return res.status(400).json({ message: 'Parent contact information not found' });
    }

    // In a real implementation, you would send an SMS or email with the reminder
    // For now, we'll just simulate it
    if (parentPhone) {
      console.log(`Sending reminder SMS to ${parentPhone}: ${message}`);
    }

    if (parentEmail) {
      console.log(`Sending reminder email to ${parentEmail}: ${message}`);
    }

    // Record the reminder in the database
    const reminder = new FeeReminder({
      studentFee: studentFee._id,
      message,
      sentBy: req.user.userId,
      sentAt: new Date(),
      sentVia: parentPhone ? 'sms' : 'email',
      recipient: parentPhone || parentEmail
    });

    await reminder.save();

    res.json({
      message: 'Reminder sent successfully',
      contactInfo: {
        phone: parentPhone || 'Not available',
        email: parentEmail || 'Not available'
      }
    });
  } catch (error) {
    console.error('Error sending fee reminder:', error);
    res.status(500).json({ message: 'Error sending fee reminder' });
  }
});

module.exports = router;
