// backend/api/api.js: Serverless function for uniqueness check
const { Pool } = require('pg');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { field, value } = req.body; // Expect { field: 'username'|'email', value: string }

    // PostgreSQL connection pool (use Vercel Postgres or your config)
    const pool = new Pool({
      user: 'postgres', // Replace with Vercel Postgres user
      host: 'localhost', // Replace with Vercel Postgres host
      database: 'pc-db', // Your database name
      password: 'Bapties54', // Replace with your password
      port: 5432, // Default PostgreSQL port
    });

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
  } else {
    res.status(405).send('Method Not Allowed');
  }
}