const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Helper to run parameterized queries.
 * @param {string} sql - SQL query string with placeholders.
 * @param {Array} [params] - Values for the placeholders.
 * @returns {Promise<any[]>} - Result rows.
 */
const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

module.exports = {
  pool,
  query,
};

