const logger = require('../config/logger');
const config = require('../config/config');

// 404 Not Found Handler
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
};

// Global Error Handling Middleware
const globalErrorHandler = (err, req, res, next) => {
  logger.error('Unhandled Error', { error: err });

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(config.isDev && { stack: err.stack }) // Only show stack in development
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
