// utils/sessionManager.js

const sessions = new Map();

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function createSession(userData) {
  const sessionId = generateSessionId();
  sessions.set(sessionId, userData);
  console.log('Session created:', sessionId);
  return sessionId;
}

function getSession(sessionId) {
  return sessions.get(sessionId);
}

function deleteSession(sessionId) {
  if (sessionId) {
    sessions.delete(sessionId);
    return true;
  }
  return false;
}

module.exports = {
  sessions,
  generateSessionId,
  createSession,
  getSession,
  deleteSession
};
