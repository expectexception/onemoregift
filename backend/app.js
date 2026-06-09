const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const auth = require('./routes/auth');
const admin = require('./routes/admin');
const giveaway = require('./routes/giveaway');
const upload = require('./routes/upload');
const profile = require('./routes/user-profile');
const configRoute = require('./routes/config');

function createApp() {
  const app = express();
  const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const isProd = process.env.NODE_ENV === "production";
  const devOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
  const allowedOrigins = isProd
    ? configuredOrigins
    : Array.from(new Set([...configuredOrigins, ...devOrigins]));

  app.use(express.json());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS policy does not allow this origin'));
    },
    credentials: true,
  }));
  app.use(helmet({
    // Allow cross-origin resource loading (images served from backend port)
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  }));
  app.set('trust proxy', 1);
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(cookieParser());
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }));
  app.use(mongoSanitize());

  // Serve uploads from public/ with CORP header
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, require('express').static(require('path').join(__dirname, 'public', 'uploads')));

  // Serve custom media directory when IMAGE_STORAGE=disk and MEDIA_DIR is outside public/
  const mediaDir = process.env.MEDIA_DIR;
  if (mediaDir && process.env.IMAGE_STORAGE === 'disk') {
    const resolvedMedia = require('path').resolve(mediaDir);
    const isInsidePublic = resolvedMedia.includes(require('path').join('public', 'uploads'));
    if (!isInsidePublic) {
      app.use('/media', (req, res, next) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
      }, require('express').static(resolvedMedia));
      console.log(`[Media] Serving ${resolvedMedia} at /media`);
    }
  }
  app.use('/api/v1/auth', auth);
  app.use('/api/v1/admin', admin);
  app.use('/api/v1/giveaway', giveaway);
  app.use('/api/v1/upload', upload);
  app.use('/api/v1/profile', profile);
  app.use('/api/v1/config', configRoute);


  app.get('/api/v1/health', (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    return res.status(dbReady ? 200 : 503).json({
      error: false,
      status: dbReady ? 'ok' : 'degraded',
      service: 'giveaway-backend',
      db: dbReady ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  return app;
}

module.exports = { createApp };
