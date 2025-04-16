// middleware/errorHandlers.js

const path = require('path');

const errorHandler = (err, req, res, next) => {
  console.error(`${new Date().toISOString()} - Error:`, err.stack);
  
  // Determine status code (default to 500)
  const statusCode = err.statusCode || 500;
  
  // Check if request accepts HTML
  if (req.accepts('html')) {
    res.status(statusCode);
    // Render appropriate error page based on status code
    if (statusCode === 404) {
      return res.sendFile(path.join(__dirname, '..', 'public', 'html', 'error404.html'));
    } else {
      return res.sendFile(path.join(__dirname, '..', 'public', 'html', 'error500.html'));
    }
  }
  
  // If API request, return JSON
  if (req.accepts('json')) {
    return res.status(statusCode).json({ 
      error: {
        message: err.message || 'An unexpected error occurred',
        status: statusCode
      } 
    });
  }
  
  // Default plain text response
  res.status(statusCode).type('txt').send(err.message || 'Internal Server Error');
};

// 404 middleware for routes not found
const notFoundHandler = (req, res, next) => {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
