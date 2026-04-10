const express = require('express');
const User = require('../models/User');
const Gig = require('../models/Gig');
const Payment = require('../models/Payment');
const Application = require('../models/Application');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalGigs, totalPayments, openGigs] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Gig.countDocuments(),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Gig.countDocuments({ status: 'open' }),
    ]);
    const revenue = totalPayments[0]?.total || 0;
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt');
    res.json({ totalUsers, totalGigs, revenue, openGigs, recentUsers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.name = { $regex: search, $options: 'i' };
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await User.countDocuments(query);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/suspend
router.put('/users/:id/suspend', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/activate
router.put('/users/:id/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { isActive: true }, { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/gigs
router.get('/gigs', async (req, res) => {
  try {
    const gigs = await Gig.find()
      .populate('client', 'name email')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/gigs/:id
router.delete('/gigs/:id', async (req, res) => {
  try {
    await Gig.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gig deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
