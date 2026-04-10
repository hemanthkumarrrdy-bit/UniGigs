const express = require('express');
const { db } = require('../config/firebase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/gigs - browse with filters
router.get('/', protect, async (req, res) => {
  try {
    const { category, minBudget, maxBudget, status = 'open', search, page = 1, limit = 12 } = req.query;
    
    let query = db.collection('gigs');

    if (status) query = query.where('status', '==', status);
    if (category) query = query.where('category', '==', category);
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    let gigs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, _id: doc.id }));

    if (minBudget) gigs = gigs.filter(g => g.budget >= Number(minBudget));
    if (maxBudget) gigs = gigs.filter(g => g.budget <= Number(maxBudget));
    if (search) {
      const s = search.toLowerCase();
      gigs = gigs.filter(g => g.title.toLowerCase().includes(s) || g.description.toLowerCase().includes(s));
    }

    const count = gigs.length;
    const from = (page - 1) * limit;
    const paginatedGigs = gigs.slice(from, from + Number(limit));

    // Fetch client info for each gig (simplified for now)
    const gigsWithClient = await Promise.all(paginatedGigs.map(async gig => {
      const clientDoc = await db.collection('profiles').doc(gig.client_id).get();
      return { ...gig, client: clientDoc.exists ? clientDoc.data() : null };
    }));

    res.json({ gigs: gigsWithClient, total: count, pages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/gigs/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const doc = await db.collection('gigs').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ message: 'Gig not found' });
    
    const gig = { ...doc.data(), id: doc.id, _id: doc.id };
    
    const clientDoc = await db.collection('profiles').doc(gig.client_id).get();
    gig.client = clientDoc.exists ? clientDoc.data() : null;

    if (gig.assigned_to) {
      const assigneeDoc = await db.collection('profiles').doc(gig.assigned_to).get();
      gig.assignedTo = assigneeDoc.exists ? assigneeDoc.data() : null;
    }

    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/gigs
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'client' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Only clients can post gigs' });
    
    const { title, description, category, budget, deadline, tags, requirements, isRemote, location } = req.body;
    
    const gigData = {
      title, description, category, budget, deadline, tags, requirements, isRemote, location,
      client_id: req.user.id,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('gigs').add(gigData);
    res.status(201).json({ ...gigData, id: docRef.id, _id: docRef.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/gigs/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const gigRef = db.collection('gigs').doc(req.params.id);
    const doc = await gigRef.get();

    if (!doc.exists) return res.status(404).json({ message: 'Gig not found' });
    if (doc.data().client_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    const updatedData = { ...req.body, updatedAt: new Date().toISOString() };
    await gigRef.update(updatedData);
    res.json({ ...doc.data(), ...updatedData, id: doc.id, _id: doc.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/gigs/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const gigRef = db.collection('gigs').doc(req.params.id);
    const doc = await gigRef.get();

    if (!doc.exists) return res.status(404).json({ message: 'Gig not found' });
    if (doc.data().client_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    await gigRef.delete();
    res.json({ message: 'Gig deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/gigs/my/posted
router.get('/my/posted', protect, async (req, res) => {
  try {
    const snapshot = await db.collection('gigs')
      .where('client_id', '==', req.user.id)
      .orderBy('createdAt', 'desc')
      .get();

    const gigs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, _id: doc.id }));
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
