const express = require('express');
const User = require('../models/User');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - list freelancers
router.get('/', protect, async (req, res) => {
  try {
    const { skill, search, page = 1, limit = 12 } = req.query;
    const query = { role: 'student', isActive: true };
    if (skill) query.skills = { $in: [skill] };
    if (search) query.name = { $regex: search, $options: 'i' };
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ rating: -1 });
    const total = await User.countDocuments(query);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const reviews = await Review.find({ reviewee: req.params.id })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ user, reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, skills, portfolio, location, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, skills, portfolio, location, avatar },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
