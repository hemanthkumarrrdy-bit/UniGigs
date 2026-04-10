const express = require('express');
const { db, admin } = require('../config/firebase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/applications - apply for a gig
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student')
      return res.status(403).json({ message: 'Only students can apply' });
    
    const { gigId, coverLetter, proposedBudget } = req.body;
    
    // Check if gig is open
    const gigDoc = await db.collection('gigs').doc(gigId).get();
    if (!gigDoc.exists || gigDoc.data().status !== 'open')
      return res.status(400).json({ message: 'Gig not available' });

    const gig = gigDoc.data();

    // Check for existing application
    const existing = await db.collection('applications')
      .where('gig_id', '==', gigId)
      .where('applicant_id', '==', req.user.id)
      .get();

    if (!existing.empty) return res.status(400).json({ message: 'Already applied' });

    // Create application
    const appData = {
      gig_id: gigId,
      applicant_id: req.user.id,
      cover_letter: coverLetter,
      proposed_budget: proposedBudget,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    const appRef = await db.collection('applications').add(appData);

    // Increment applications count
    await db.collection('gigs').doc(gigId).update({
      applications_count: admin.firestore.FieldValue.increment(1)
    });

    // Create Notification
    await db.collection('notifications').add({
      user_id: gig.client_id,
      type: 'application',
      title: 'New Application',
      message: `${req.user.name} applied for "${gig.title}"`,
      link: `/gigs/${gigId}/applications`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ ...appData, id: appRef.id, _id: appRef.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/applications/gig/:gigId
router.get('/gig/:gigId', protect, async (req, res) => {
  try {
    const gigDoc = await db.collection('gigs').doc(req.params.gigId).get();
    if (!gigDoc.exists) return res.status(404).json({ message: 'Gig not found' });
    
    if (gigDoc.data().client_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    const snapshot = await db.collection('applications')
      .where('gig_id', '==', req.params.gigId)
      .get();

    const applications = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();
      const applicantDoc = await db.collection('profiles').doc(data.applicant_id).get();
      return { ...data, id: doc.id, _id: doc.id, applicant: applicantDoc.exists ? applicantDoc.data() : null };
    }));

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/applications/my
router.get('/my', protect, async (req, res) => {
  try {
    const snapshot = await db.collection('applications')
      .where('applicant_id', '==', req.user.id)
      .orderBy('createdAt', 'desc')
      .get();

    const applications = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();
      const gigDoc = await db.collection('gigs').doc(data.gig_id).get();
      let gig = gigDoc.exists ? { ...gigDoc.data(), id: gigDoc.id } : null;
      
      if (gig) {
        const clientDoc = await db.collection('profiles').doc(gig.client_id).get();
        gig.client = clientDoc.exists ? clientDoc.data() : null;
      }

      return { ...data, id: doc.id, _id: doc.id, gig };
    }));

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/applications/:id/status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const appRef = db.collection('applications').doc(req.params.id);
    const appDoc = await appRef.get();

    if (!appDoc.exists) return res.status(404).json({ message: 'Application not found' });
    const appData = appDoc.data();
    
    const gigDoc = await db.collection('gigs').doc(appData.gig_id).get();
    if (!gigDoc.exists || gigDoc.data().client_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    await appRef.update({ status });

    if (status === 'accepted') {
      await db.collection('gigs').doc(appData.gig_id).update({
        status: 'inprogress',
        assigned_to: appData.applicant_id
      });

      await db.collection('notifications').add({
        user_id: appData.applicant_id,
        type: 'application',
        title: 'Application Accepted!',
        message: `Your application for "${gigDoc.data().title}" was accepted`,
        link: `/gigs/${appData.gig_id}`,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    res.json({ ...appData, status, id: appDoc.id, _id: appDoc.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
