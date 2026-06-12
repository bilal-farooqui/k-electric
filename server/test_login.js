

async function run() {
  const payload = {
    username: 'maheen khan aslam',
    password: 'maheenaslam@123'
  };

  console.log('Sending login request directly to backend...');
  const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log('Response status:', res.status);
  const data = await res.json();
  console.log('Response body:', data);
}

run().catch(console.error);
