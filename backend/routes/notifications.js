const express = require('express');
const { db } = require('../config/firebase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', protect, async (req, res) => {
  try {
    const snapshot = await db.collection('notifications')
      .where('user_id', '==', req.user.id)
      .orderBy('createdAt', 'desc')
      .limit(30)
      .get();

    const notifications = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, _id: doc.id }));
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', protect, async (req, res) => {
  try {
    const snapshot = await db.collection('notifications')
      .where('user_id', '==', req.user.id)
      .where('is_read', '==', false)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { is_read: true });
    });
    await batch.commit();

    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', protect, async (req, res) => {
  try {
    await db.collection('notifications').doc(req.params.id).update({ is_read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
