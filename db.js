// Neon Postgres pool.
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3 // keep small: serverless functions each hold their own pool
});

const query = (text, params) => pool.query(text, params);

// Postgres schema. Runs once per cold start, guarded by a module-level promise.
let initPromise = null;

async function initDb() {
  if (!initPromise) {
    initPromise = (async () => {
      await query(`CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        subject VARCHAR(150),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`);
      await query(`CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        technologies VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`);
    })().catch(err => {
      initPromise = null; // allow a retry on the next request
      throw err;
    });
  }
  return initPromise;
}

// Run initDb then the given DB work, mapping any failure to a JSON 500.
// Handlers call this AFTER auth + validation so those still work without a DB.
async function ensureDb(res, fn, failMessage) {
  try {
    await initDb();
    return await fn();
  } catch (err) {
    console.error('db error:', err.message);
    res.status(500).json({
      success: false,
      message: failMessage || 'Database is not available right now.'
    });
    return null;
  }
}

module.exports = { pool, query, initDb, ensureDb };
