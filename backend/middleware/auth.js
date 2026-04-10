const { auth, db } = require('../config/firebase');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'Not authorized' });

    // Verify token with Firebase
    const decodedToken = await auth.verifyIdToken(token);
    
    // Fetch profile from Firestore
    const profileDoc = await db.collection('profiles').doc(decodedToken.uid).get();
    
    if (!profileDoc.exists) {
      return res.status(401).json({ message: 'User profile not found' });
    }

    const profile = profileDoc.data();
    req.user = { id: profileDoc.id, ...profile };
    next();
  } catch (err) {
    console.error('❌ Auth Middleware Error:', err.message);
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ message: 'Admin access required' });
};

module.exports = { protect, adminOnly };
