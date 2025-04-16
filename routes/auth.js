// routes/auth.js
const express = require('express');
const router = express.Router();
const { readUsers, writeUsers } = require('../utils/userUtils');
const { createSession, deleteSession } = require('../utils/sessionManager');
// Signup route
router.post('/signup', (req, res) => {
  try {
    const { username, email, password } = req.body;
    const users = readUsers();

    if (users[username]) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    users[username] = { email, password };
    writeUsers(users);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login route
router.post('/login', (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;
    const users = readUsers();
    
    console.log('Users database:', users);
    console.log('User exists?', !!users[username]);
    
    if (!users[username] || users[username].password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const sessionId = createSession({ username });
    
    res.cookie('sessionId', sessionId, { httpOnly: true, path: '/' });
    res.status(200).json({ redirect: '/home' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;
  
  deleteSession(sessionId);
  res.clearCookie('sessionId');
  res.status(200).json({ success: true });
});

// Get current user
router.get('/user', (req, res) => {
  const sessionId = req.cookies.sessionId;
  console.log('API User request - Session ID:', sessionId);
  
  const { sessions } = require('../utils/sessionManager');  // Fix this path
  console.log('Available sessions:', Array.from(sessions.keys()));
  
  if (sessionId && sessions.has(sessionId)) {
    const sessionData = sessions.get(sessionId);
    console.log('API user request - session data:', sessionData);
    res.status(200).json({ 
      username: sessionData.username || 'User',
      id: sessionId
    });
  } else {
    console.log('API user request - no valid session');
    res.status(401).json({ error: 'Not logged in' });
  }
});

module.exports = router;
