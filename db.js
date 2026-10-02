/**
 * BizHub — Database Module (MySQL)
 * File: db.js
 */

process.env.TZ = 'Asia/Ho_Chi_Minh';
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host     : process.env.DB_HOST     || 'localhost',
  port     : process.env.DB_PORT     || 3306,
  user     : process.env.DB_USER     || 'bizhub_user',
  password : process.env.DB_PASSWORD || '',
  database : process.env.DB_NAME     || 'bizhub',
  charset  : 'utf8mb4',
  waitForConnections: true,
  connectionLimit   : 10,
  timezone          : '+07:00',
});

// Test kết nối khi khởi động và thiết lập múi giờ phiên làm việc
pool.getConnection()
  .then(async conn => {
    console.log('✅ MySQL kết nối thành công — database:', process.env.DB_NAME || 'bizhub');
    try {
      await conn.query("SET time_zone = '+07:00'");
    } catch (_) {}
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL lỗi kết nối:', err.message);
    console.error('   Kiểm tra DB_HOST, DB_USER, DB_PASSWORD, DB_NAME trong file .env');
  });

module.exports = pool;
