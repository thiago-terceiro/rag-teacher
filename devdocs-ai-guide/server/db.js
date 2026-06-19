require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const checkDbConnection = async () => {
  try {
    await pool.query('SELECT NOW()');
    return { connected: true };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { connected: false, error };
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  checkDbConnection,
  pool,
};
