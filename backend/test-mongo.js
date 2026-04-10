const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  try {
    console.log('Starting MongoMemoryServer...');
    const mongoServer = await MongoMemoryServer.create();
    console.log('URI:', mongoServer.getUri());
    process.exit(0);
  } catch (err) {
    console.error('MongoMemoryServer Error:', err.message);
    process.exit(1);
  }
})();
