// middleware/authMiddleware.js

const { sessions } = require('../utils/sessionManager');

const isAuthenticated = (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  console.log(`Route ${req.path} access attempted with sessionId: ${sessionId}`);
  console.log(`Session exists: ${sessions.has(sessionId)}`);
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.redirect('/login');
  }
  next();
};

module.exports = {
  isAuthenticated
};
