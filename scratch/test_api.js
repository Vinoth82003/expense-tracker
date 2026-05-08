const http = require('http');

const payload = JSON.stringify({
  subject: 'Test Email',
  body: 'This is a test',
  recipientFilter: {}
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/notifications/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Cookie': 'admin_session=true'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(payload);
req.end();
