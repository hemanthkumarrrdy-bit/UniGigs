const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { db } = require('../config/firebase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/payments/create-intent
router.post('/create-intent', protect, async (req, res) => {
  try {
    const { gigId, freelancerId } = req.body;
    const gigDoc = await db.collection('gigs').doc(gigId).get();

    if (!gigDoc.exists) return res.status(404).json({ message: 'Gig not found' });
    const gig = gigDoc.data();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(gig.budget * 100),
      currency: 'usd',
      metadata: { gigId, clientId: req.user.id, freelancerId },
    });

    const paymentData = {
      gig_id: gigId,
      client_id: req.user.id,
      freelancer_id: freelancerId,
      amount: gig.budget,
      status: 'pending',
      stripe_payment_intent_id: paymentIntent.id,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('payments').add(paymentData);

    res.json({ clientSecret: paymentIntent.client_secret, paymentId: docRef.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/:id/release
router.post('/:id/release', protect, async (req, res) => {
  try {
    const payRef = db.collection('payments').doc(req.params.id);
    const payDoc = await payRef.get();

    if (!payDoc.exists) return res.status(404).json({ message: 'Payment not found' });
    const payment = payDoc.data();
    
    if (payment.client_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    await payRef.update({ status: 'released' });
    await db.collection('gigs').doc(payment.gig_id).update({ status: 'completed' });
    
    const gigDoc = await db.collection('gigs').doc(payment.gig_id).get();
    
    await db.collection('notifications').add({
      user_id: payment.freelancer_id,
      type: 'payment',
      title: 'Payment Released!',
      message: `$${payment.amount} has been released for "${gigDoc.data().title}"`,
      link: '/payments',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.json({ message: 'Payment released' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/history
router.get('/history', protect, async (req, res) => {
  try {
    const field = req.user.role === 'client' ? 'client_id' : 'freelancer_id';
    const snapshot = await db.collection('payments')
      .where(field, '==', req.user.id)
      .orderBy('createdAt', 'desc')
      .get();

    const payments = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();
      const gigDoc = await db.collection('gigs').doc(data.gig_id).get();
      const clientDoc = await db.collection('profiles').doc(data.client_id).get();
      const freelancerDoc = await db.collection('profiles').doc(data.freelancer_id).get();
      
      return { 
        ...data, 
        id: doc.id, 
        _id: doc.id,
        gig: gigDoc.exists ? { title: gigDoc.data().title } : null,
        client: clientDoc.exists ? clientDoc.data() : null,
        freelancer: freelancerDoc.exists ? freelancerDoc.data() : null
      };
    }));

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
