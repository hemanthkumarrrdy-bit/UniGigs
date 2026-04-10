const https = require('https');
const fs = require('fs');

const url = 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.4.zip';
const dest = 'mongo.zip';

console.log('Starting stream download for MongoDB...');
const file = fs.createWriteStream(dest);

https.get(url, (response) => {
  const total = parseInt(response.headers['content-length'], 10);
  let downloaded = 0;

  response.pipe(file);

  response.on('data', (chunk) => {
    downloaded += chunk.length;
    process.stdout.write(`\rProgress: ${(downloaded / 1024 / 1024).toFixed(2)} MB / ${(total / 1024 / 1024).toFixed(2)} MB`);
  });

  file.on('finish', () => {
    file.close();
    console.log('\nDownload complete.');
    process.exit(0);
  });
}).on('error', (err) => {
  fs.unlink(dest, () => {});
  console.error('\nDownload error:', err.message);
  process.exit(1);
});
