const express = require('express');
const router = express.Router();
const ParentContact = require('../models/ParentContact');
const Student = require('../models/Student');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all parent contacts
router.get('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const parentContacts = await ParentContact.find()
      .populate('studentId', 'firstName lastName rollNumber class');
    res.json(parentContacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get parent contacts for a specific student
router.get('/student/:studentId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const parentContacts = await ParentContact.find({ studentId: req.params.studentId });
    res.json(parentContacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get parent contacts for a specific class
router.get('/class/:classId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    // First get all students in the class
    const students = await Student.find({ class: req.params.classId });
    const studentIds = students.map(student => student._id);
    
    // Then get parent contacts for these students
    const parentContacts = await ParentContact.find({ 
      studentId: { $in: studentIds },
      isActive: true
    }).populate('studentId', 'firstName lastName rollNumber');
    
    res.json(parentContacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new parent contact
router.post('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { studentId, parentName, phoneNumber, relationship } = req.body;
    
    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const parentContact = new ParentContact({
      studentId,
      parentName,
      phoneNumber,
      relationship
    });
    
    const savedContact = await parentContact.save();
    res.status(201).json(savedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a parent contact
router.put('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { parentName, phoneNumber, relationship, isActive } = req.body;
    
    const updatedContact = await ParentContact.findByIdAndUpdate(
      req.params.id,
      { parentName, phoneNumber, relationship, isActive, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!updatedContact) {
      return res.status(404).json({ message: 'Parent contact not found' });
    }
    
    res.json(updatedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a parent contact
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const deletedContact = await ParentContact.findByIdAndDelete(req.params.id);
    
    if (!deletedContact) {
      return res.status(404).json({ message: 'Parent contact not found' });
    }
    
    res.json({ message: 'Parent contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
