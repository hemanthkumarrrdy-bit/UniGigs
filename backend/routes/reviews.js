const express = require('express');
const { db } = require('../config/firebase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews
router.post('/', protect, async (req, res) => {
  try {
    const { revieweeId, gigId, rating, comment } = req.body;
    
    // Check for existing review
    const existing = await db.collection('reviews')
      .where('reviewer_id', '==', req.user.id)
      .where('gig_id', '==', gigId)
      .get();

    if (!existing.empty) return res.status(400).json({ message: 'Already reviewed this gig' });

    // Create review
    const reviewData = {
      reviewer_id: req.user.id,
      reviewee_id: revieweeId,
      gig_id: gigId,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('reviews').add(reviewData);
    
    const reviewerDoc = await db.collection('profiles').doc(req.user.id).get();
    res.status(201).json({ ...reviewData, id: docRef.id, _id: docRef.id, reviewer: reviewerDoc.data() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/:userId
router.get('/:userId', protect, async (req, res) => {
  try {
    const snapshot = await db.collection('reviews')
      .where('reviewee_id', '==', req.params.userId)
      .orderBy('createdAt', 'desc')
      .get();

    const reviews = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();
      const reviewerDoc = await db.collection('profiles').doc(data.reviewer_id).get();
      const gigDoc = await db.collection('gigs').doc(data.gig_id).get();
      return { 
        ...data, 
        id: doc.id, 
        _id: doc.id, 
        reviewer: reviewerDoc.exists ? reviewerDoc.data() : null,
        gig: gigDoc.exists ? { title: gigDoc.data().title } : null
      };
    }));

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
