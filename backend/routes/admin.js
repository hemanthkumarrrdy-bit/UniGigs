const express = require('express');
const { db } = require('../config/firebase');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const usersSnapshot = await db.collection('profiles').where('role', '!=', 'admin').get();
    const gigsSnapshot = await db.collection('gigs').get();
    const paymentsSnapshot = await db.collection('payments').get();
    
    const totalUsers = usersSnapshot.size;
    const totalGigs = gigsSnapshot.size;
    const openGigs = gigsSnapshot.docs.filter(d => d.data().status === 'open').length;
    
    let revenue = 0;
    paymentsSnapshot.forEach(doc => {
      revenue += (doc.data().amount || 0);
    });

    const recentUsersSnapshot = await db.collection('profiles')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    const recentUsers = recentUsersSnapshot.docs.map(doc => ({
      id: doc.id,
      _id: doc.id,
      ...doc.data()
    }));

    res.json({ totalUsers, totalGigs, revenue, openGigs, recentUsers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    let query = db.collection('profiles');

    if (role) query = query.where('role', '==', role);
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    let users = snapshot.docs.map(doc => ({ id: doc.id, _id: doc.id, ...doc.data() }));

    if (search) {
      users = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()));
    }

    const total = users.length;
    const paginatedUsers = users.slice((page - 1) * limit, page * limit);

    res.json({ users: paginatedUsers, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/suspend
router.put('/users/:id/suspend', async (req, res) => {
  try {
    const userRef = db.collection('profiles').doc(req.params.id);
    await userRef.update({ isActive: false });
    const updated = await userRef.get();
    res.json({ id: updated.id, _id: updated.id, ...updated.data() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/activate
router.put('/users/:id/activate', async (req, res) => {
  try {
    const userRef = db.collection('profiles').doc(req.params.id);
    await userRef.update({ isActive: true });
    const updated = await userRef.get();
    res.json({ id: updated.id, _id: updated.id, ...updated.data() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/gigs
router.get('/gigs', async (req, res) => {
  try {
    const snapshot = await db.collection('gigs')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const gigs = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();
      const clientDoc = await db.collection('profiles').doc(data.client_id).get();
      let assignee = null;
      if (data.assigned_to) {
        const assigneeDoc = await db.collection('profiles').doc(data.assigned_to).get();
        assignee = assigneeDoc.exists ? assigneeDoc.data() : null;
      }
      return { 
        ...data, 
        id: doc.id, 
        _id: doc.id, 
        client: clientDoc.exists ? clientDoc.data() : null,
        assignedTo: assignee
      };
    }));

    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/gigs/:id
router.delete('/gigs/:id', async (req, res) => {
  try {
    await db.collection('gigs').doc(req.params.id).delete();
    res.json({ message: 'Gig deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
