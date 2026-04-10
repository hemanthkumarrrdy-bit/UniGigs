const express = require('express');
const Gig = require('../models/Gig');
const Application = require('../models/Application');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/gigs - browse with filters
router.get('/', protect, async (req, res) => {
  try {
    const { category, minBudget, maxBudget, status = 'open', search, page = 1, limit = 12 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = Number(minBudget);
      if (maxBudget) query.budget.$lte = Number(maxBudget);
    }
    if (search) query.$text = { $search: search };

    const gigs = await Gig.find(query)
      .populate('client', 'name avatar rating')
      .populate('assignedTo', 'name avatar')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await Gig.countDocuments(query);
    res.json({ gigs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/gigs/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('client', 'name avatar bio rating reviewCount')
      .populate('assignedTo', 'name avatar');
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/gigs - create gig (clients only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'client' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Only clients can post gigs' });
    const { title, description, category, budget, deadline, tags, requirements, isRemote, location } = req.body;
    const gig = await Gig.create({
      title, description, category, budget, deadline, tags, requirements, isRemote, location,
      client: req.user._id,
    });
    res.status(201).json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/gigs/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    if (gig.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    const updated = await Gig.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/gigs/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    if (gig.client.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await gig.deleteOne();
    res.json({ message: 'Gig deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/gigs/my/posted - client's own gigs
router.get('/my/posted', protect, async (req, res) => {
  try {
    const gigs = await Gig.find({ client: req.user._id })
      .populate('assignedTo', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
