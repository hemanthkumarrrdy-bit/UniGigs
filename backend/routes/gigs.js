const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/gigs - browse with filters
router.get('/', protect, async (req, res) => {
  try {
    const { category, minBudget, maxBudget, status = 'open', search, page = 1, limit = 12 } = req.query;
    
    let query = supabase
      .from('gigs')
      .select('*, client:profiles!client_id(name, avatar, rating), assignedTo:profiles!assigned_to(name, avatar)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (minBudget) query = query.gte('budget', Number(minBudget));
    if (maxBudget) query = query.lte('budget', Number(maxBudget));
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + Number(limit) - 1;

    const { data: gigs, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({ gigs, total: count, pages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/gigs/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: gig, error } = await supabase
      .from('gigs')
      .select('*, client:profiles!client_id(name, avatar, bio, rating, review_count), assignedTo:profiles!assigned_to(name, avatar)')
      .eq('id', req.params.id)
      .single();

    if (error || !gig) return res.status(404).json({ message: 'Gig not found' });
    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/gigs - create gig (clients only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'client' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Only clients can post gigs' });
    
    const { title, description, category, budget, deadline, tags, requirements, isRemote, location } = req.body;
    
    const { data: gig, error } = await supabase
      .from('gigs')
      .insert({
        title, description, category, budget, deadline, tags, requirements, isRemote, location,
        client_id: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/gigs/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const { data: gig, error: fetchErr } = await supabase
      .from('gigs')
      .select('client_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !gig) return res.status(404).json({ message: 'Gig not found' });
    if (gig.client_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    const { data: updated, error: updateErr } = await supabase
      .from('gigs')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/gigs/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const { data: gig, error: fetchErr } = await supabase
      .from('gigs')
      .select('client_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !gig) return res.status(404).json({ message: 'Gig not found' });
    if (gig.client_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    const { error: deleteErr } = await supabase
      .from('gigs')
      .delete()
      .eq('id', req.params.id);

    if (deleteErr) throw deleteErr;
    res.json({ message: 'Gig deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/gigs/my/posted - client's own gigs
router.get('/my/posted', protect, async (req, res) => {
  try {
    const { data: gigs, error } = await supabase
      .from('gigs')
      .select('*, assignedTo:profiles!assigned_to(name, avatar)')
      .eq('client_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
