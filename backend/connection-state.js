const mongoose = require('mongoose');

function logConnectionState() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  console.log('Current connection state:', states[mongoose.connection.readyState]);
}

module.exports = { logConnectionState };