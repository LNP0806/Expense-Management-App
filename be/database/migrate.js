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
    // 1. Tạo bảng theo dõi migration nếu chưa tồn tại
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Lấy danh sách các migration đã được chạy
    const executedRes = await pool.query('SELECT name FROM schema_migrations');
    const executedMigrations = new Set(executedRes.rows.map(row => row.name));

    // Tự động phát hiện nếu cơ sở dữ liệu đã có sẵn bảng từ trước (ví dụ trên Supabase)
    // Nếu bảng 'users' đã tồn tại nhưng lịch sử di trú rỗng, ta đánh dấu tệp 001 đã chạy để bảo vệ dữ liệu cũ.
    const usersExistRes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    const usersExist = usersExistRes.rows[0].exists;

    if (usersExist && executedMigrations.size === 0) {
      console.log('Detected existing database tables. Bootstrapping migration history...');
      const file001 = '001_create_database.sql';
      await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file001]);
      executedMigrations.add(file001);
      console.log(`- Marked ${file001} as already executed to protect existing data.`);
    }

    // 3. Đọc tất cả các file migration
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sắp xếp theo thứ tự số: 001, 002...

    console.log(`Found ${files.length} migration files in directory.`);
    
    let runCount = 0;
    for (const file of files) {
      if (executedMigrations.has(file)) {
        console.log(`- Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`- Running migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Chạy từng file trong 1 TRANSACTION riêng để đảm bảo toàn vẹn dữ liệu
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        runCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
    
    if (runCount === 0) {
      console.log('Database is already up to date. No new migrations executed.');
    } else {
      console.log(`Completed ${runCount} new migration(s) successfully!`);
    }
  } catch (err) {
    console.error('Database migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
