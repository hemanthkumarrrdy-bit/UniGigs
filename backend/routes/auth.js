const express = require('express');
const bcrypt = require('bcryptjs');
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

    // 2. Hash password for fallback login
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create profile in Firestore
    const profile = {
      id: user.uid,
      name,
      email,
      role,
      passwordHash,
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
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Strategy 1: Try Firebase REST API if API key is set
    const API_KEY = process.env.FIREBASE_API_KEY;
    if (API_KEY && !API_KEY.includes('your_')) {
      const axios = require('axios');
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
        { email, password, returnSecureToken: true }
      );
      const { localId, idToken } = response.data;
      const profileDoc = await db.collection('profiles').doc(localId).get();
      if (!profileDoc.exists) return res.status(404).json({ message: 'Profile not found' });
      return res.json({ ...profileDoc.data(), _id: localId, token: idToken });
    }

    // Strategy 2: Admin SDK fallback — look up user by email, 
    // generate a custom token, return it as the session token.
    // (Custom tokens are valid for sign-in via Firebase Client SDK)
    const userRecord = await auth.getUserByEmail(email);

    // We cannot verify passwords server-side without the REST API key.
    // So we store a hashed password in Firestore during registration and verify it here.
    const profileDoc = await db.collection('profiles').doc(userRecord.uid).get();
    if (!profileDoc.exists) return res.status(404).json({ message: 'Profile not found' });

    const profile = profileDoc.data();

    // Check hashed password if available
    const bcrypt = require('bcryptjs');
    if (profile.passwordHash) {
      const isMatch = await bcrypt.compare(password, profile.passwordHash);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a custom token (acts as a short-lived auth token)
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.json({
      ...profile,
      _id: userRecord.uid,
      token: customToken,
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
