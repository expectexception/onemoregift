const express = require('express');
const app = express();
app.use(express.json());
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const sanitizer = require("perfect-express-sanitizer");
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 9000;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
//Import Routes
const auth = require('./routes/auth');
const admin = require('./routes/admin');
const giveaway = require('./routes/giveaway');
const upload = require('./routes/upload');
const profile = require('./routes/user-profile');
//cors
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy does not allow this origin'));
    },
    credentials: true,
}));
//Middlewares
app.use(helmet());
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
//Static
app.use(express.static('public'))
app.use('/api/v1/auth', auth);
app.use('/api/v1/admin', admin);
app.use('/api/v1/giveaway', giveaway);
app.use('/api/v1/upload', upload);
app.use('/api/v1/profile', profile);
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
const connectDb = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log("Database connected");
    } catch (error) {
        console.log("Database connection failed", error.message);
        process.exit(1);
    }

}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    connectDb();
});