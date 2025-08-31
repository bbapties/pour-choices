// server.js: The backend API server for POUR CHOICES
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const winston = require('winston'); // Add Winston for logging
const app = express();
const port = process.env.PORT || 5001;

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info', // Log info and above (info, warn, error)
  format: winston.format.combine(
    winston.format.timestamp(), // Add timestamp
    winston.format.json() // JSON format for easy parsing
  ),
  transports: [
    new winston.transports.Console(), // Log to console during testing
    new winston.transports.File({ filename: 'error.log', level: 'error' }) // Log errors to file for review
  ]
});

app.use(express.json());
app.use(cors());

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
    logger.info('Database connected successfully!'); // Log success
    res.send('Database connected successfully!');
    client.release();
  } catch (err) {
    logger.error(`Error connecting to DB: ${err.message}`); // Log error
    res.status(500).json({ error: `Error connecting to DB: ${err.message}` });
  }
});

// Check uniqueness of username or email
app.post('/check-uniqueness', async (req, res) => {
  const { field, value } = req.body;
  logger.info(`Received request to check uniqueness for ${field}: ${value}`); // Log request
  try {
    const client = await pool.connect();
    const query = 'SELECT COUNT(*) FROM public.users WHERE $1 = $2';
    const result = await client.query(query, [field, value.toLowerCase()]);
    const isUnique = result.rows[0].count === '0';
    logger.info(`Uniqueness result for ${field}: ${isUnique}`); // Log result
    client.release();
    res.json({ isUnique });
  } catch (err) {
    logger.error(`Uniqueness check error: ${err.message}`); // Log error
    res.status(500).json({ error: `Error checking uniqueness: ${err.message}` });
  }
});

// Create a new user
app.post('/create-user', async (req, res) => {
  const { username, email } = req.body;
  logger.info(`Received request to create user: ${username}, ${email}`); // Log request
  try {
    const client = await pool.connect();
    const query = 'INSERT INTO public.users (username, email) VALUES ($1, $2) RETURNING *';
    const result = await client.query(query, [username.toLowerCase(), email.toLowerCase()]);
    logger.info(`User inserted successfully: ${JSON.stringify(result.rows[0])}`); // Log insert
    client.release();
    res.status(201).json({ message: 'User created', user: result.rows[0] });
  } catch (err) {
    logger.error(`User creation error: ${err.message}`); // Log error
    if (err.code === '23505') {
      res.status(409).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: `Error creating user: ${err.message}` });
    }
  }
});

app.listen(port, () => {
  logger.info(`Backend server running on port ${port}`); // Log startup
});