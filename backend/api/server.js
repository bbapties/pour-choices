// server.js: The backend API server for POUR CHOICES
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // Add CORS support
const app = express();
const port = 5001; // Backend port

// Configure CORS to allow requests from the Vercel domain with preflight support
const corsOptions = {
  origin: 'https://pourchoicesapp.com', // Allow only this origin
  methods: ['GET', 'POST', 'OPTIONS'], // Explicitly allow OPTIONS for preflight
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow common headers
  credentials: true, // Allow cookies if needed (optional for now)
  optionsSuccessStatus: 200 // Ensure preflight returns 200
};

app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(cors(corsOptions)); // Apply CORS to all routes
app.use(express.json()); // Parse JSON bodies

// PostgreSQL connection pool for Supabase session pooler
const pool = new Pool({
  user: 'postgres.lrvraigdihzkgphjdezk', // Project-specific user from session pooler
  host: 'aws-1-us-east-1.pooler.supabase.com',
  database: 'postgres', // Default database for Supabase
  password: '7pB-32ha.bDZSA_', // Your Supabase database password
  port: 5432, // Session pooler port
  ssl: { rejectUnauthorized: false } // Supabase requires SSL, disable strict checking for now
});

// Test route to check DB connection
app.get('/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    res.send('Database connected successfully!');
    client.release();
  } catch (err) {
    res.status(500).json({ error: `Error connecting to DB: ${err.message}` });
  }
});

// Check uniqueness of username or email
app.post('/check-uniqueness', async (req, res) => {
  const { field, value } = req.body;
  try {
    const client = await pool.connect();
    const query = 'SELECT COUNT(*) FROM public.users WHERE $1 = $2';
    const result = await client.query(query, [field, value.toLowerCase()]);
    const isUnique = result.rows[0].count === '0';
    client.release();
    res.json({ isUnique });
  } catch (err) {
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
    client.release();
    res.status(201).json({ message: 'User created', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: `Error creating user: ${err.message}` });
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});