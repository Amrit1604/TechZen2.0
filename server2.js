const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
require('dotenv').config();

// Import middleware
const { 
  requestLogger, 
  setupBodyParsers, 
  setupCookieParser, 
  setupStaticFiles 
} = require('./middleware/appMiddleware');

// Import authentication middleware
const { isAuthenticated } = require('./middleware/authMiddleware');

// Import routes
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');
const aiRoutes = require('./routes/ai');
const { router: viewRouter, publicRoutes, protectedRoutes } = require('./routes/views');
const sellRouter = require('./routes/sell');

// Import socket handler
let setupCustomerSockets;
try {
  setupCustomerSockets = require('./sockets/customer');
} catch (err) {
  console.warn('Warning: sockets/customer.js not found, skipping socket setup:', err.message);
}

// Import error handlers
const { notFoundHandler, errorHandler } = require('./middleware/errorHandlers');

// Setup Express application
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new FileStore({
    path: './sessions',
    ttl: 86400
  }),
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Apply middleware
setupBodyParsers(app);
setupCookieParser(app);
setupStaticFiles(app);
requestLogger(app);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Debug middleware for sessions
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session Data:', req.session);
  console.log('User:', req.user);
  next();
});

// Public routes
app.use('/', publicRoutes);

// Authentication routes
app.use('/api/auth', authRouter);

// Legacy auth endpoints
app.post('/login', (req, res, next) => {
  authRouter.handle(req, res, next);
});

app.post('/signup', (req, res, next) => {
  authRouter.handle(req, res, next);
});

// API routes
app.use('/api', apiRouter);
app.use('/api/sell', sellRouter);

// ChatBot route
app.use('/', aiRoutes);

// Protected view routes
const protectedPaths = ['/home', '/ai', '/news', '/gadgets', '/blogs', '/customer', '/chatbot', '/selling', '/selling2'];
protectedPaths.forEach(path => {
  app.get(path, isAuthenticated, (req, res, next) => {
    console.log(`Accessing ${path} - User:`, req.user);
    protectedRoutes.handle(req, res, next);
  });
});

// User API route
app.get('/api/user', isAuthenticated, (req, res) => {
  console.log('GET /api/user - User:', req.user);
  if (req.user) {
    res.json({ username: req.user.username });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Socket setup
if (setupCustomerSockets) {
  setupCustomerSockets(io);
} else {
  console.log('Socket.IO running without customer socket handlers');
}

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

module.exports = { app, server };