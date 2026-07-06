const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');

async function runMigration() {
  console.log('Starting database migration...');
  
  let pool;
  if (process.env.NODE_ENV === 'production') {
    console.log('Connecting to REMOTE Supabase Database for migration...');
    pool = new Pool({
      connectionString: process.env.SUPABASE_DB_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  } else {
    console.log('Connecting to LOCAL PostgreSQL Database for migration...');
    pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  }

  try {
    const migrationPath = path.join(__dirname, 'migrations', '001_create_database.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing SQL migration script...');
    await pool.query(sql);
    console.log('✅ Database migration completed successfully!');
  } catch (err) {
    console.error('❌ Database migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
