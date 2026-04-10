const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Gig = require('../models/Gig');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/payments/create-intent - client pays into escrow
router.post('/create-intent', protect, async (req, res) => {
  try {
    const { gigId, freelancerId } = req.body;
    const gig = await Gig.findById(gigId);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(gig.budget * 100), // cents
      currency: 'usd',
      metadata: { gigId, clientId: req.user._id.toString(), freelancerId },
    });

    const payment = await Payment.create({
      gig: gigId, client: req.user._id,
      freelancer: freelancerId, amount: gig.budget,
      stripePaymentIntentId: paymentIntent.id,
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentId: payment._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/:id/release - client releases payment to freelancer
router.post('/:id/release', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('gig');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    payment.status = 'released';
    await payment.save();
    await Gig.findByIdAndUpdate(payment.gig._id, { status: 'completed' });
    await Notification.create({
      user: payment.freelancer,
      type: 'payment',
      title: 'Payment Released!',
      message: `$${payment.amount} has been released for "${payment.gig.title}"`,
      link: '/payments',
    });
    res.json({ message: 'Payment released', payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/history - transaction history
router.get('/history', protect, async (req, res) => {
  try {
    const query = req.user.role === 'client'
      ? { client: req.user._id }
      : { freelancer: req.user._id };
    const payments = await Payment.find(query)
      .populate('gig', 'title')
      .populate('client', 'name avatar')
      .populate('freelancer', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
