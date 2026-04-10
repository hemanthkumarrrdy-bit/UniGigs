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

    // Use admin API to bypass email confirmation for smoother UX
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (error) {
      console.error('❌ Supabase Auth Error:', error.message);
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({
      _id: user.id,
      name,
      email: user.email,
      role,
    });
  } catch (err) {
    console.error('❌ Registration Exception:', err.message);
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

    if (error) {
      console.error('❌ Login Error:', error.message);
      return res.status(401).json({ message: error.message === 'Email not confirmed' ? 'Please confirm your email or contact admin' : 'Invalid credentials' });
    }

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

// @route GET /api/auth/health
router.get('/health', async (req, res) => {
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    const duration = Date.now() - start;
    
    res.json({
      status: 'ok',
      supabase_connected: !error,
      supabase_error: error ? error.message : null,
      response_time_ms: duration,
      env_check: {
        has_url: !!process.env.SUPABASE_URL,
        has_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        url: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 20)}...` : 'none',
        node_version: process.version
      }
    });
  } catch (err) {
    console.error('❌ Health Check Exception:', err.message);
    res.status(500).json({ status: 'error', message: err.message, stack: err.stack });
  }
});

module.exports = router;
