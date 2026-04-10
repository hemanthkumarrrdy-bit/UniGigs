const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews
router.post('/', protect, async (req, res) => {
  try {
    const { revieweeId, gigId, rating, comment } = req.body;
    
    // Check for existing review
    const { data: exists } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', req.user.id)
      .eq('gig_id', gigId)
      .single();

    if (exists) return res.status(400).json({ message: 'Already reviewed this gig' });

    // Create review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        reviewer_id: req.user.id, reviewee_id: revieweeId, gig_id: gigId, rating, comment,
      })
      .select('*, reviewer:profiles!reviewer_id(name, avatar)')
      .single();

    if (error) throw error;

    // Note: In production, aggregate rating/count updates should be done via a PostgreSQL Trigger 
    // for data consistency, but we'll stick to a simple strategy for now.
    
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/:userId
router.get('/:userId', protect, async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviewer_id(name, avatar), gig:gigs(title)')
      .eq('reviewee_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
