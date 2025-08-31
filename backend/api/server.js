// server.js: The backend API server for POUR CHOICES
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const winston = require('winston');
const app = express();
const port = process.env.PORT || 5001;

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'access.log' }) // Log all requests
  ]
});

// Middleware to log all requests
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

// Dynamic CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = ['https://pourchoicesapp.com', 'http://localhost:5000'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(cors(corsOptions)); // Apply CORS to all routes
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres.lrvraigdihzkgphjdezk',
  host: 'aws-1-us-east-1.pooler.supabase.com',
  database: 'postgres',
  password: '7pB-32ha.bDZSA_',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Test route to check DB connection
app.get('/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    logger.info('Database connection test successful');
    res.send('Database connected successfully!');
    client.release();
  } catch (err) {
    logger.error(`DB connection error: ${err.message}`);
    res.status(500).json({ error: `Error connecting to DB: ${err.message}` });
  }
});

// Track clicks and visits
app.post('/track-event', async (req, res) => {
  const { eventType, page, element } = req.body;
  if (!eventType || !page) {
    return res.status(400).json({ error: 'eventType and page are required' });
  }
  try {
    const client = await pool.connect();
    const query = `
      INSERT INTO visitor_events (event_type, page, element, ip_address, timestamp)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`;
    const result = await client.query(query, [eventType, page, element, req.ip, new Date()]);
    logger.info(`Tracked event: ${eventType} on ${page} at ${element}`);
    client.release();
    res.status(201).json({ message: 'Event tracked', event: result.rows[0] });
  } catch (err) {
    logger.error(`Event tracking error: ${err.message}`);
    res.status(500).json({ error: `Error tracking event: ${err.message}` });
  }
});

// Check uniqueness of username or email
app.post('/check-uniqueness', async (req, res) => {
  const { field, value } = req.body;
  logger.info(`Checking uniqueness for ${field}: ${value}`);
  try {
    const client = await pool.connect();
    logger.debug(`Executing query: SELECT COUNT(*) FROM public.users WHERE ${field} = '${value.toLowerCase()}'`);
    const query = 'SELECT COUNT(*) FROM public.users WHERE $1 = $2';
    const result = await client.query(query, [field, value.toLowerCase()]);
    logger.debug(`Query result: ${JSON.stringify(result.rows)}`);
    const isUnique = result.rows[0].count === '0';
    logger.info(`Uniqueness result for ${field}: ${value} -> ${isUnique}`);
    client.release();
    res.json({ isUnique });
  } catch (err) {
    logger.error(`Uniqueness check error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: `Error checking uniqueness: ${err.message}` });
  }
});

// Create a new user
app.post('/create-user', async (req, res) => {
  const { username, email } = req.body;
  try {
    const client = await pool.connect();
    const query = 'INSERT INTO public.users (username, email) VALUES ($1, $2) RETURNING *';
    const result = await client.query(query, [username.toLowerCase(), email.toLowerCase()]);
    logger.info(`User created: ${JSON.stringify(result.rows[0])}`);
    client.release();
    res.status(201).json({ message: 'User created', user: result.rows[0] });
  } catch (err) {
    logger.error(`User creation error: ${err.message}`);
    if (err.code === '23505') {
      res.status(409).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: `Error creating user: ${err.message}` });
    }
  }
});

app.listen(port, () => {
  logger.info(`Backend server running on port ${port}`);
});