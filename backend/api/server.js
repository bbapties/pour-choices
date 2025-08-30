// server.js: The backend API server for POUR CHOICES
const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 5001; // Backend port (changed to avoid conflict)

app.use(express.json()); // Parse JSON bodies

const cors = require('cors');
app.use(cors());

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres', // Default superuser
  host: 'localhost',
  database: 'pc-db', // Your database name
  password: 'Bapties54', // Replace with your superuser password
  port: 5432, // Default PostgreSQL port
});

// Test route to check DB connection
app.get('/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    res.send('Database connected successfully!');
    client.release();
  } catch (err) {
    res.send(`Error connecting to DB: ${err.message}`);
  }
});

// Check uniqueness of username or email
app.post('/check-uniqueness', async (req, res) => {
  const { field, value } = req.body; // Expect { field: 'username'|'email', value: string }
  try {
    const client = await pool.connect();
    const query = 'SELECT COUNT(*) FROM users WHERE $1 = $2';
    const result = await client.query(query, [field, value.toLowerCase()]);
    const isUnique = result.rows[0].count === '0';
    client.release();
    res.json({ isUnique });
  } catch (err) {
    res.status(500).send(`Error checking uniqueness: ${err.message}`);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});