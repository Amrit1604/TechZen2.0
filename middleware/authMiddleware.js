const User = require('../models/User');
const { sessions } = require('../utils/sessionManager');

const isAuthenticated = async (req, res, next) => {
  console.log('Checking auth - Session:', req.session);
  console.log('Checking auth - Cookies:', req.cookies);
  
  // Check for session authentication
  if (req.session && req.session.user) {
    req.user = req.session.user;
    console.log('User authenticated via session:', req.user.username);
    return next();
  }
  
  // Check for cookie authentication
  const sessionId = req.cookies.sessionId;
  if (sessionId && sessions.has(sessionId)) {
    const sessionData = sessions.get(sessionId);
    if (sessionData && sessionData.username) {
      req.user = sessionData;
      console.log('User authenticated via cookie:', req.user.username);
      return next();
    }
  }
  
  // Not authenticated, redirect to login
  console.log('Authentication failed, redirecting to login');
  res.redirect('/login');
};

module.exports = { isAuthenticated };