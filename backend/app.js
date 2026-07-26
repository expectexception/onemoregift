const express = require('express');
const path = require('path');
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
  const devOrigins = [
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:3001", "http://127.0.0.1:3001",
    "http://localhost:3002", "http://127.0.0.1:3002"
  ];
  const allowedOrigins = isProd
    ? configuredOrigins
    : Array.from(new Set([...configuredOrigins, ...devOrigins]));

  // Avatars are sent as base64 data URLs in profile updates. The express default
  // of 100kb made larger avatars fail with PayloadTooLargeError.
  app.use(express.json({ limit: '2mb' }));
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

  // Static media is mounted BEFORE the rate limiter, a single gallery page loads
  // dozens of images and was eating the per-IP API budget, causing surprise 429s.
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

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    // Image/video GETs served from MongoDB storage are media, not API calls
    skip: (req) => req.method === 'GET' && req.path.startsWith('/api/v1/upload/'),
  }));
  app.use(mongoSanitize());
  // Maintenance mode: blocks public writes, leaves reads and the admin panel alive
  app.use(require('./middleware/maintenanceGuard'));

  app.use('/api/v1/auth', auth);
  app.use('/api/v1/admin', admin);
  app.use('/api/v1/giveaway', giveaway);
  app.use('/api/v1/upload', upload);
  app.use('/api/v1/profile', profile);
  app.use('/api/v1/config', configRoute);

  // ── New module routes ───────────────────────────────────────────────────────
  app.use('/api/v1/admin/surprise', require('./routes/surpriseAdmin'));
  app.use('/api/v1/admin/moments', require('./routes/momentsAdmin'));
  app.use('/api/v1/admin/products', require('./routes/productsAdmin'));
  app.use('/api/v1/admin/orders', require('./routes/ordersAdmin'));
  app.use('/api/v1/admin/stores', require('./routes/storesAdmin'));
  app.use('/api/v1/admin/gifts', require('./routes/giftsAdmin'));
  app.use('/api/v1/admin/audit-logs', require('./routes/auditLogsAdmin'));
  app.use('/api/v1/admin/roles', require('./routes/rolesAdmin'));

  // User facing surprise and moments
  app.use('/api/v1/surprise', require('./routes/surprise'));
  app.use('/api/v1/happy-moment', require('./routes/happyMoment'));
  app.use('/api/v1/shop', require('./routes/shop'));


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

  // Serve the favicon so browser/probe requests for /favicon.ico don't 500.
  app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'), (err) => {
      if (err && !res.headersSent) res.status(204).end();
    });
  });

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  return app;
}

module.exports = { createApp };
