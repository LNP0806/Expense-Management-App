const { Pool } = require("pg");
let pool;

if (process.env.NODE_ENV === "production") {
  console.log("Connecting to REMOTE Supabase Database...");
  pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    // Cấu hình bảo mật SSL bắt buộc khi kết nối lên Cloud
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
  console.log("Connecting to LOCAL PostgreSQL Database...");
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

// Kiểm tra kết nối thành công hay thất bại ngay khi khởi động server
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err.stack);
  } else {
    console.log("Database connected successfully at:", res.rows[0].now);
  }
});

module.exports = pool;
