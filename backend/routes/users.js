const express = require('express');
const { db } = require('../config/firebase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - list freelancers
router.get('/', protect, async (req, res) => {
  try {
    const { skill, search, page = 1, limit = 12 } = req.query;
    
    let query = db.collection('profiles').where('role', '==', 'student');

    if (skill) query = query.where('skills', 'array-contains', skill);
    
    const snapshot = await query.orderBy('rating', 'desc').get();
    let users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, _id: doc.id }));

    if (search) {
      users = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
    }

    const total = users.length;
    const paginatedUsers = users.slice((page - 1) * limit, page * limit);

    res.json({ users: paginatedUsers, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const doc = await db.collection('profiles').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ message: 'User not found' });

    const user = { ...doc.data(), id: doc.id, _id: doc.id };

    const reviewsSnapshot = await db.collection('reviews')
      .where('reviewee_id', '==', req.params.id)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const reviews = await Promise.all(reviewsSnapshot.docs.map(async rDoc => {
      const rData = rDoc.data();
      const reviewerDoc = await db.collection('profiles').doc(rData.reviewer_id).get();
      return { ...rData, id: rDoc.id, _id: rDoc.id, reviewer: reviewerDoc.exists ? reviewerDoc.data() : null };
    }));

    res.json({ user, reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const userRef = db.collection('profiles').doc(req.user.id);
    await userRef.update({ ...req.body, updatedAt: new Date().toISOString() });
    const updated = await userRef.get();
    res.json({ ...updated.data(), id: updated.id, _id: updated.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
