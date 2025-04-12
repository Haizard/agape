// Start both servers
const { spawn } = require('child_process');

// Start the health check server
const healthServer = spawn('node', ['koyeb-server.js'], {
  stdio: 'inherit'
});

console.log('Started health check server (PID:', healthServer.pid, ')');

// Start the main server
const mainServer = spawn('node', ['server.js'], {
  stdio: 'inherit'
});

console.log('Started main server (PID:', mainServer.pid, ')');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  healthServer.kill();
  mainServer.kill();
  process.exit(0);
});

// Handle child process exit
healthServer.on('exit', (code) => {
  console.log(`Health check server exited with code ${code}`);
  if (code !== 0) {
    console.error('Health check server crashed, restarting...');
    // Restart the health check server
    const newHealthServer = spawn('node', ['koyeb-server.js'], {
      stdio: 'inherit'
    });
    console.log('Restarted health check server (PID:', newHealthServer.pid, ')');
  }
});

mainServer.on('exit', (code) => {
  console.log(`Main server exited with code ${code}`);
  if (code !== 0) {
    console.error('Main server crashed, shutting down...');
    healthServer.kill();
    process.exit(1);
  }
});
