const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/payments/create-intent - client pays into escrow
router.post('/create-intent', protect, async (req, res) => {
  try {
    const { gigId, freelancerId } = req.body;
    const { data: gig, error: gigErr } = await supabase
      .from('gigs')
      .select('budget, title')
      .eq('id', gigId)
      .single();

    if (gigErr || !gig) return res.status(404).json({ message: 'Gig not found' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(gig.budget * 100),
      currency: 'usd',
      metadata: { gigId, clientId: req.user.id, freelancerId },
    });

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        gig_id: gigId, client_id: req.user.id,
        freelancer_id: freelancerId, amount: gig.budget,
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select()
      .single();

    if (payErr) throw payErr;

    res.json({ clientSecret: paymentIntent.client_secret, paymentId: payment.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/:id/release - client releases payment to freelancer
router.post('/:id/release', protect, async (req, res) => {
  try {
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('*, gig:gigs(title)')
      .eq('id', req.params.id)
      .single();

    if (payErr || !payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.client_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    const { data: updated, error: updateErr } = await supabase
      .from('payments')
      .update({ status: 'released' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    await supabase.from('gigs').update({ status: 'completed' }).eq('id', payment.gig_id);
    
    await supabase.from('notifications').insert({
      user_id: payment.freelancer_id,
      type: 'payment',
      title: 'Payment Released!',
      message: `$${payment.amount} has been released for "${payment.gig.title}"`,
      link: '/payments',
    });

    res.json({ message: 'Payment released', payment: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/history - transaction history
router.get('/history', protect, async (req, res) => {
  try {
    const field = req.user.role === 'client' ? 'client_id' : 'freelancer_id';
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*, gig:gigs(title), client:profiles!client_id(name, avatar), freelancer:profiles!freelancer_id(name, avatar)')
      .eq(field, req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
