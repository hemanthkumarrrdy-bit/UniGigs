const express = require('express');
const Review = require('../models/Review');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews
router.post('/', protect, async (req, res) => {
  try {
    const { revieweeId, gigId, rating, comment } = req.body;
    const exists = await Review.findOne({ reviewer: req.user._id, gig: gigId });
    if (exists) return res.status(400).json({ message: 'Already reviewed this gig' });
    const review = await Review.create({
      reviewer: req.user._id, reviewee: revieweeId, gig: gigId, rating, comment,
    });
    // Update reviewee's average rating
    const reviews = await Review.find({ reviewee: revieweeId });
    const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
    await User.findByIdAndUpdate(revieweeId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: reviews.length,
    });
    await review.populate('reviewer', 'name avatar');
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/:userId
router.get('/:userId', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar')
      .populate('gig', 'title')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
