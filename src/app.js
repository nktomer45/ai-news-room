const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');
const logger = require('./config/logger');

const routes = require('./routes/index');

const { notFoundHandler, globalErrorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Middleware
// CORS configuration
app.use(cors({
  origin: ['https://ai-news-room-2.onrender.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api', routes);

// Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
