const express = require('express');
const { auth, db } = require('../config/firebase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'All fields required' });

    // 1. Create user in Firebase Auth
    const user = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Create profile in Firestore
    const profile = {
      id: user.uid,
      name,
      email,
      role,
      avatar: '',
      bio: '',
      skills: [],
      location: '',
      rating: 0,
      reviewCount: 0,
      earnings: 0,
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('profiles').doc(user.uid).set(profile);

    res.status(201).json({
      _id: user.uid,
      name,
      email,
      role
    });
  } catch (err) {
    console.error('❌ Firebase Registration Error:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// @route POST /api/auth/login
// Note: Backend login with Firebase usually just verifies a token sent from frontend.
// However, for compatibility with the current frontend architecture (sending email/password to backend),
// we would normally need the Firebase Client SDK on the backend or have the frontend sign in directly.
// Since we want to keep the current flow, we'll suggest the frontend sign in directly,
// OR we can use the Firebase Auth REST API for a simple email/password swap for a token.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // We'll use the Firebase Auth REST API since admin SDK doesn't support email/password sign-in directly
    const axios = require('axios');
    const API_KEY = process.env.FIREBASE_API_KEY; 
    
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      { email, password, returnSecureToken: true }
    );

    const { localId, idToken } = response.data;

    // Fetch profile
    const profileDoc = await db.collection('profiles').doc(localId).get();
    if (!profileDoc.exists) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profile = profileDoc.data();

    res.json({
      ...profile,
      _id: localId,
      token: idToken,
    });
  } catch (err) {
    console.error('❌ Firebase Login Error:', err.response?.data?.error?.message || err.message);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// @route GET /api/auth/health
router.get('/health', async (req, res) => {
  try {
    const collections = await db.listCollections();
    res.json({
      status: 'ok',
      firebase_connected: true,
      collections_count: collections.length,
      node_version: process.version
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
