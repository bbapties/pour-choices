// server.js: The backend API server for POUR CHOICES
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // Add CORS support
const app = express();
const port = 5001; // Backend port

app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS for all routes

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
    console.error(`DB connection error: ${err.message}`);
    res.status(500).json({ error: `Error connecting to DB: ${err.message}` });
  }
});

// Check uniqueness of username or email
app.post('/check-uniqueness', async (req, res) => {
  const { field, value } = req.body;
  console.log(`Received request to check uniqueness for ${field}: ${value}`); // Debug log for request arrival
  try {
    const client = await pool.connect();
    const query = 'SELECT COUNT(*) FROM public.users WHERE $1 = $2';
    const result = await client.query(query, [field, value.toLowerCase()]);
    const isUnique = result.rows[0].count === '0';
    console.log(`Uniqueness result for ${field}: ${isUnique}`); // Debug log for query result
    client.release();
    res.json({ isUnique });
  } catch (err) {
    console.error(`Uniqueness check error: ${err.message}`); // Debug log for errors
    res.status(500).json({ error: `Error checking uniqueness: ${err.message}` });
  }
});

// Create a new user
app.post('/create-user', async (req, res) => {
  const { username, email } = req.body;
  console.log(`Received request to create user: ${username}, ${email}`); // Debug log for request arrival
  try {
    const client = await pool.connect();
    const query = 'INSERT INTO public.users (username, email) VALUES ($1, $2) RETURNING *';
    const result = await client.query(query, [username.toLowerCase(), email.toLowerCase()]);
    console.log(`User inserted successfully: ${JSON.stringify(result.rows[0])}`); // Debug log for insert result
    client.release();
    res.status(201).json({ message: 'User created', user: result.rows[0] });
  } catch (err) {
    console.error(`User creation error: ${err.message}`); // Debug log for errors
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