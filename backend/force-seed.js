const mongoose = require('mongoose');
const seedData = require('./seeder');

(async () => {
  try {
    console.log('Connecting to local MongoDB to seed data...');
    await mongoose.connect('mongodb://127.0.0.1:27017/unigigs');
    console.log('Connected! Runing seed function...');
    await seedData();
    console.log('Done.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
