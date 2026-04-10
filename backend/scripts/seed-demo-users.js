const { admin, db } = require('../config/firebase');

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
      // Create in Firebase Auth
      const authUser = await admin.auth().createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });

      // Create in Firestore Profiles
      await db.collection('profiles').doc(authUser.uid).set({
        name: user.displayName,
        email: user.email,
        role: user.role,
        bio: `This is a demo ${user.role} account.`,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      console.log(`✅ Created ${user.role}: ${user.email} (Password: ${user.password})`);
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        console.log(`ℹ️ User ${user.email} already exists.`);
      } else {
        console.error(`❌ Error creating ${user.email}:`, err.message);
      }
    }
  }
  process.exit();
};

seedUsers();
