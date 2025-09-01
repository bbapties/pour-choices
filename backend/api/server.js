// server.js: The backend API server for POUR CHOICES
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const winston = require('winston');
const app = express();
const port = process.env.PORT || 5001;
const multer = require('multer');

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
    timestamp: new Date().toISOString()
  });
  next();
});

// Dynamic CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = ['https://pourchoicesapp.com', 'http://localhost:5000'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, origin || '*'); // Return the origin or * if none, allowing GET
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

// Multer configuration for file uploads
const storage = multer.memoryStorage(); // Store file in memory for Supabase upload
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Test route to check DB connection
app.get('/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    logger.info('Received test-db ping from origin: ' + (req.get('origin') || 'unknown')); // Log origin
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
    const result = await client.query(query, [eventType, page, element, null, new Date()]);
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

// Upload profile picture
app.post('/upload-profile', upload.single('profileImage'), async (req, res) => {
  const { userId } = req.body; // Expect userId from frontend to associate with user
  if (!req.file || !userId) {
    return res.status(400).json({ error: 'Profile image and userId are required' });
  }
  try {
    const client = await pool.connect();
    const bucketName = 'profile-pics'; // Match your Supabase bucket name
    const fileName = `${userId}-${Date.now()}-${req.file.originalname}`; // Unique filename
    const { data, error } = await client.storage
      .from(bucketName)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });
    if (error) throw error;
    const imageUrl = `${client.storage.from(bucketName).getPublicUrl(fileName).publicURL}`;
    const query = 'UPDATE public.users SET profile_image_url = $1 WHERE id = $2 RETURNING *';
    const result = await client.query(query, [imageUrl, userId]);
    logger.info(`Profile image uploaded for user ${userId}: ${imageUrl}`);
    client.release();
    res.status(201).json({ message: 'Profile image uploaded', imageUrl, user: result.rows[0] });
  } catch (err) {
    logger.error(`Profile upload error: ${err.message}`);
    res.status(500).json({ error: `Error uploading profile image: ${err.message}` });
  }
});

app.listen(port, () => {
  logger.info(`Backend server running on port ${port}`);
});