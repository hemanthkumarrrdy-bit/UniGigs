const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Gig = require('./models/Gig');

const seedData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return; // already seeded

    console.log('Seeding initial data...');

    // Hash password for all dummy users
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('123456', salt);

    const client1 = await User.create({
      name: 'TechFlow Startup', email: 'client@techflow.com', password, role: 'client',
      bio: 'A fast-growing tech startup looking for talented students to build our MVP.',
      rating: 4.8, reviewCount: 12
    });

    const student1 = await User.create({
      name: 'Alex Design', email: 'alex@student.com', password, role: 'student',
      bio: 'UI/UX Designer specializing in clean, modern web apps and mobile interfaces. Figma expert.',
      skills: ['Figma', 'UI Design', 'Illustration'],
      rating: 4.9, reviewCount: 8, earnings: 1200
    });

    const student2 = await User.create({
      name: 'Sam Coder', email: 'sam@student.com', password, role: 'student',
      bio: 'Full-stack developer with 2 years of experience in React and Node.js.',
      skills: ['React', 'Node.js', 'Next.js', 'Typescript'],
      rating: 5.0, reviewCount: 4, earnings: 850
    });

    const admin = await User.create({
      name: 'System Admin', email: 'admin@unigigs.com', password, role: 'admin'
    });

    // Create Gigs
    const g1 = await Gig.create({
      client: client1._id,
      title: 'Design a Modern Landing Page for AI App',
      description: 'We need a stunning, high-conversion landing page designed in Figma. Dark mode preferred with gradient accents. Must be responsive.',
      category: 'Design',
      budget: 250,
      deadline: new Date(Date.now() + 7 * 86400000), // 7 days
      tags: ['Figma', 'UI/UX', 'Web Design'],
      location: 'Remote',
      status: 'open'
    });

    const g2 = await Gig.create({
      client: client1._id,
      title: 'Build a React Native Mobile App MVP',
      description: 'Looking for an experienced student developer to help build a 3-screen MVP mobile app using React Native and Expo.',
      category: 'Tech',
      budget: 600,
      deadline: new Date(Date.now() + 14 * 86400000), // 14 days
      tags: ['React Native', 'Mobile', 'Frontend'],
      location: 'Remote',
      status: 'open'
    });

    const g3 = await Gig.create({
      client: client1._id,
      title: 'Write 4 SEO Blog Posts about Cybersecurity',
      description: 'Need a writer who understands basic tech concepts to write four 1000-word blog posts focused on cybersecurity best practices.',
      category: 'Writing',
      budget: 120,
      deadline: new Date(Date.now() + 5 * 86400000), // 5 days
      tags: ['SEO', 'Content Writing', 'Tech'],
      location: 'Remote',
      status: 'open'
    });

    console.log('Seeding complete!');
    console.log('--- Test Accounts ---');
    console.log('Client: client@techflow.com / 123456');
    console.log('Student: alex@student.com / 123456');
    console.log('Admin: admin@unigigs.com   / 123456');
  } catch (err) {
    console.error('Seeding error:', err);
  }
};

module.exports = seedData;
