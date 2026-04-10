const { admin, db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
  const users = [
    {
      email: 'student@demo.com',
      password: 'student123',
      displayName: 'Demo Student',
      role: 'student'
    },
    {
      email: 'business@demo.com',
      password: 'business123',
      displayName: 'Demo Business',
      role: 'client'
    }
  ];

  for (const user of users) {
    try {
      const passwordHash = await bcrypt.hash(user.password, 10);

      let uid;
      try {
        // Try creating new user
        const authUser = await admin.auth().createUser({
          email: user.email,
          password: user.password,
          displayName: user.displayName,
        });
        uid = authUser.uid;
      } catch (err) {
        if (err.code === 'auth/email-already-exists') {
          // Get existing user
          const existing = await admin.auth().getUserByEmail(user.email);
          uid = existing.uid;
          console.log(`ℹ️ User ${user.email} already exists, updating profile...`);
        } else throw err;
      }

      // Upsert Firestore profile with passwordHash
      await db.collection('profiles').doc(uid).set({
        name: user.displayName,
        email: user.email,
        role: user.role,
        passwordHash,
        bio: `This is a demo ${user.role} account.`,
        avatar: '',
        skills: [],
        isActive: true,
        rating: 0,
        reviewCount: 0,
        earnings: 0,
        createdAt: new Date().toISOString()
      }, { merge: true });

      console.log(`✅ ${user.role}: ${user.email} | Password: ${user.password}`);
    } catch (err) {
      console.error(`❌ Error with ${user.email}:`, err.message);
    }
  }
  process.exit();
};

seedUsers();
