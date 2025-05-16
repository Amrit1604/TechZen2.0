// routes/auth.js
const express = require('express');
const router = express.Router();
const { createSession, deleteSession } = require('../utils/sessionManager');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Create new user with hashed password
    const newUser = new User({
      username,
      email,
      password  // Password will be hashed by the pre-save hook in the User model
    });

    await newUser.save();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username });
    console.log('User exists?', !!user);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const sessionId = createSession({ 
      username,
      userId: user._id,
      email: user.email
    });
    
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
router.get('/user', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  console.log('API User request - Session ID:', sessionId);
  
  const { sessions } = require('../utils/sessionManager');
  console.log('Available sessions:', Array.from(sessions.keys()));
  
  if (sessionId && sessions.has(sessionId)) {
    const sessionData = sessions.get(sessionId);
    console.log('API user request - session data:', sessionData);

    try {
      // Get the most up-to-date user data from the database
      const user = await User.findOne({ username: sessionData.username });
      
      if (user) {
        res.status(200).json({ 
          username: user.username,
          email: user.email,
          id: sessionId
        });
      } else {
        // If user not found in DB but has session, return session data
        res.status(200).json({ 
          username: sessionData.username || 'User',
          id: sessionId
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      res.status(200).json({
        username: sessionData.username || 'User',
        id: sessionId
      });
    }
  } else {
    console.log('API user request - no valid session');
    res.status(401).json({ error: 'Not logged in' });
  }
});


// Update profile route
router.post('/update-profile', async (req, res) => {
  try {
    console.log('Profile update request received:', req.body);
    const { username, email, currentPassword, newPassword } = req.body;
    
    // Get current user ID from session or cookie
    let userId;
    
    if (req.session && req.session.user) {
      userId = req.session.user.id || req.session.user.userId;
      console.log('Using ID from session:', userId);
    } else if (req.cookies.sessionId) {
      const { sessions } = require('../utils/sessionManager');
      const sessionData = sessions.get(req.cookies.sessionId);
      userId = sessionData?.userId;
      console.log('Using ID from cookie session:', userId);
    }
    
    if (!userId) {
      console.log('No user ID found in session');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Find user in database
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('User found:', user.username);
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      console.log('Invalid current password');
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Check if new username is already taken (if username is changing)
    if (username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(409).json({ error: 'Username is already taken' });
      }
    }
    
    // Check if new email is already taken (if email is changing)
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(409).json({ error: 'Email is already taken' });
      }
    }
    
    // Update user info
    user.username = username;
    user.email = email;
    
    // Update password if provided
    if (newPassword) {
      user.password = newPassword; // Will be hashed by pre-save hook
    }
    
    await user.save();
    console.log('User updated successfully');
    
    // Update session if using standard sessions
    if (req.session && req.session.user) {
      req.session.user.username = username;
      req.session.user.email = email;
    }
    
    // Update custom session if using that system
    if (req.cookies.sessionId) {
      const { sessions } = require('../utils/sessionManager');
      if (sessions.has(req.cookies.sessionId)) {
        const sessionData = sessions.get(req.cookies.sessionId);
        sessionData.username = username;
        sessionData.email = email;
        sessions.set(req.cookies.sessionId, sessionData);
      }
    }
    
    // Send success response
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;