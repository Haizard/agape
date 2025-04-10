const express = require('express');
const router = express.Router();
const News = require('../models/News');
const { authenticateToken, authorizeRole } = require('./authMiddleware');

// Get all news items
router.get('/', async (req, res) => {
  try {
    const news = await News.find().sort({ date: -1 });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific news item by ID
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'News item not found' });
    }
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create news item (admin only)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const news = new News(req.body);
    const savedNews = await news.save();
    res.status(201).json(savedNews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update news item (admin only)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const updatedNews = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedNews) {
      return res.status(404).json({ message: 'News item not found' });
    }
    res.json(updatedNews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete news item (admin only)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const deletedNews = await News.findByIdAndDelete(req.params.id);
    if (deletedNews) {
      res.json({ message: 'News item deleted successfully' });
    } else {
      res.status(404).json({ message: 'News item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
