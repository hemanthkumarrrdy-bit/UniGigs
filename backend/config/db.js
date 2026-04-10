const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Cloud MongoDB Failed. Starting Local Native MongoDB...`);
    
    // Launch local mongod
    const binaryPath = path.join(__dirname, '../mongodb/mongodb-win32-x86_64-windows-6.0.4/bin/mongod.exe');
    const dbPath = path.join(__dirname, '../data');
    if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath);

    const mongod = spawn(binaryPath, ['--dbpath', dbPath, '--port', '27017']);
    mongod.stdout.on('data', d => {}); 
    mongod.stderr.on('data', d => {});

    // Wait a second for it to start up
    await new Promise(resolve => setTimeout(resolve, 2000));

    await mongoose.connect('mongodb://127.0.0.1:27017/unigigs');
    console.log(`In-Memory MongoDB Connected at: mongodb://127.0.0.1:27017/unigigs`);
  }
};

module.exports = connectDB;

module.exports = connectDB;

module.exports = connectDB;
