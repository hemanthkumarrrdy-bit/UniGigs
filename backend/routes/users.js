const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - list freelancers
router.get('/', protect, async (req, res) => {
  try {
    const { skill, search, page = 1, limit = 12 } = req.query;
    
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'student');

    if (skill) query = query.contains('skills', [skill]);
    if (search) query = query.ilike('name', `%${search}%`);

    const from = (page - 1) * limit;
    const to = from + Number(limit) - 1;

    const { data: users, count, error } = await query
      .order('rating', { ascending: false })
      .range(from, to);

    if (error) throw error;
    res.json({ users, total: count, pages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: user, error: userErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (userErr || !user) return res.status(404).json({ message: 'User not found' });

    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviewer_id(name, avatar)')
      .eq('reviewee_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({ user, reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { data: updated, error } = await supabase
      .from('profiles')
      .update(req.body)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
