const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'All fields required' });

    const { data: { user, session }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role } // This meta data is used by the PostgreSQL trigger to create a profile
      }
    });

    if (error) return res.status(400).json({ message: error.message });

    res.status(201).json({
      _id: user.id,
      name,
      email: user.email,
      role,
      token: session?.access_token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(401).json({ message: 'Invalid credentials' });

    // Fetch the profile associated with this user
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      ...profile,
      _id: profile.id, // maintain compatibility with frontend expected field names
      token: data.session.access_token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
