const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/applications - apply for a gig
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student')
      return res.status(403).json({ message: 'Only students can apply' });
    
    const { gigId, coverLetter, proposedBudget } = req.body;
    
    // Check if gig is open
    const { data: gig, error: gigErr } = await supabase
      .from('gigs')
      .select('client_id, title, status')
      .eq('id', gigId)
      .single();

    if (gigErr || !gig || gig.status !== 'open')
      return res.status(400).json({ message: 'Gig not available' });

    // Check for existing application
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('gig_id', gigId)
      .eq('applicant_id', req.user.id)
      .single();

    if (existing) return res.status(400).json({ message: 'Already applied' });

    // Create application
    const { data: application, error: appErr } = await supabase
      .from('applications')
      .insert({
        gig_id: gigId, applicant_id: req.user.id, cover_letter: coverLetter, proposed_budget: proposedBudget,
      })
      .select()
      .single();

    if (appErr) throw appErr;

    // Increment applications count (using a simple update for now, or RPC)
    await supabase.rpc('increment_applications_count', { row_id: gigId });

    // Create Notification
    await supabase.from('notifications').insert({
      user_id: gig.client_id,
      type: 'application',
      title: 'New Application',
      message: `${req.user.name} applied for "${gig.title}"`,
      link: `/gigs/${gigId}/applications`,
    });

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/applications/gig/:gigId - get all applications for a gig
router.get('/gig/:gigId', protect, async (req, res) => {
  try {
    const { data: gig, error: gigErr } = await supabase
      .from('gigs')
      .select('client_id')
      .eq('id', req.params.gigId)
      .single();

    if (gigErr || !gig) return res.status(404).json({ message: 'Gig not found' });
    if (gig.client_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    const { data: applications, error: appErr } = await supabase
      .from('applications')
      .select('*, applicant:profiles!applicant_id(name, avatar, bio, skills, rating, review_count)')
      .eq('gig_id', req.params.gigId);

    if (appErr) throw appErr;
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/applications/my - student's own applications
router.get('/my', protect, async (req, res) => {
  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select('*, gig:gigs(*, client:profiles!client_id(name, avatar))')
      .eq('applicant_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/applications/:id/status - accept or reject
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const { data: application, error: fetchErr } = await supabase
      .from('applications')
      .select('*, gig:gigs(*)')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !application) return res.status(404).json({ message: 'Application not found' });
    if (application.gig.client_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    const { data: updated, error: updateErr } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    if (status === 'accepted') {
      await supabase
        .from('gigs')
        .update({ status: 'inprogress', assigned_to: application.applicant_id })
        .eq('id', application.gig_id);

      await supabase.from('notifications').insert({
        user_id: application.applicant_id,
        type: 'application',
        title: 'Application Accepted!',
        message: `Your application for "${application.gig.title}" was accepted`,
        link: `/gigs/${application.gig_id}`,
      });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
