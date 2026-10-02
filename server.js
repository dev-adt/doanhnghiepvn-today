/**
 * BizHub AI — Backend Server (MySQL version)
 * Node.js + Express + MySQL2
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const fetch   = (...a) => import('node-fetch').then(({ default: f }) => f(...a));
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const db      = require('./db');
const nodemailer = require('nodemailer');
const brandConfig = require('./config/brand.config');

// Cấu hình SMTP gửi Mail
let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: parseInt(process.env.SMTP_PORT || '465') === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  // Kiểm tra kết nối SMTP khi khởi động
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Lỗi kết nối SMTP Mail:', error.message);
    } else {
      console.log('✅ Kết nối SMTP Mail thành công! Sẵn sàng gửi thư.');
    }
  });
} else {
  console.warn('⚠️ SMTP_HOST chưa được cấu hình. Các tính năng gửi mail thông báo sẽ bị bỏ qua.');
}

const app  = express();
const PORT = process.env.PORT || 3000;

// Helper tạo URL slug chuẩn SEO từ chuỗi tiếng Việt
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Helper sinh URL slug duy nhất cho bài viết
async function generateUniquePostSlug(title, postId = null) {
  let baseSlug = slugify(title) || 'bai-viet';
  let slug = baseSlug;
  let count = 1;
  while (true) {
    let query = 'SELECT id FROM posts WHERE slug = ?';
    let params = [slug];
    if (postId) {
      query += ' AND id != ?';
      params.push(postId);
    }
    const [rows] = await db.query(query, params);
    if (!rows.length) break;
    count++;
    slug = `${baseSlug}-${count}`;
  }
  return slug;
}

// Helper sinh URL slug duy nhất cho chuyên mục
async function generateUniqueCategorySlug(name, catId = null) {
  let baseSlug = slugify(name) || 'chuyen-muc';
  let slug = baseSlug;
  let count = 1;
  while (true) {
    let query = 'SELECT id FROM categories WHERE slug = ?';
    let params = [slug];
    if (catId) {
      query += ' AND id != ?';
      params.push(catId);
    }
    const [rows] = await db.query(query, params);
    if (!rows.length) break;
    count++;
    slug = `${baseSlug}-${count}`;
  }
  return slug;
}

// Helper sinh URL slug duy nhất cho lĩnh vực con
async function generateUniqueSubCategorySlug(name, subId = null) {
  let baseSlug = slugify(name) || 'linh-vuc';
  let slug = baseSlug;
  let count = 1;
  while (true) {
    let query = 'SELECT id FROM sub_categories WHERE slug = ?';
    let params = [slug];
    if (subId) {
      query += ' AND id != ?';
      params.push(subId);
    }
    const [rows] = await db.query(query, params);
    if (!rows.length) break;
    count++;
    slug = `${baseSlug}-${count}`;
  }
  return slug;
}

// Helper đọc API key động từ config.json hoặc file .env
function getAPIKey(provider) {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg[provider + '_API_KEY']) {
        return cfg[provider + '_API_KEY'];
      }
    } catch (e) {
      console.error('Lỗi đọc config.json:', e.message);
    }
  }
  // Fallback về process.env
  const keys = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
  };
  return keys[provider] || '';
}

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Helper sinh tệp sitemap.xml và robots.txt thực tế vào thư mục public/
async function generateSitemapFiles() {
  try {
    const baseUrl = process.env.SITE_URL || 'https://doanhnghiepvn.today';
    const staticPages = ['', '/posts', '/members', '/events', '/guide', '/register'];

    const [approvedPosts] = await db.query(
      "SELECT id, slug, updated_at, created_at FROM posts WHERE status = 'approved' ORDER BY updated_at DESC"
    );

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    }

    for (const p of approvedPosts) {
      const lastMod = (p.updated_at || p.created_at || new Date()).toISOString().split('T')[0];
      const postSlug = p.slug || p.id;
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/posts/${postSlug}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');

    const robotsTxt = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
    fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf8');

    return xml;
  } catch (err) {
    console.error('Lỗi sinh file sitemap.xml:', err.message);
    return null;
  }
}

// SEO Endpoints (đặt TRƯỚC express.static và SPA Fallback)
app.get('/sitemap.xml', async (req, res) => {
  try {
    const xml = await generateSitemapFiles();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});

app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.SITE_URL || 'https://doanhnghiepvn.today';
  const content = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(content);
});

app.use('/img_guide', express.static(path.join(__dirname, 'img_guide')));
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (filePath.includes('/assets/') || filePath.includes('\\assets\\')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// Tự động tạo bảng admin_sessions nếu chưa có
db.query(`
  CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
  ) ENGINE=InnoDB COMMENT='Phiên đăng nhập admin'
`).then(() => {
  console.log('✅ Bảng admin_sessions đã sẵn sàng');
}).catch(err => {
  console.error('❌ Lỗi tạo bảng admin_sessions:', err.message);
});

// Tự động nâng cấp bảng members và tạo bảng member_sessions
(async () => {
  try {
    const [cols] = await db.query("SHOW COLUMNS FROM members LIKE 'username'");
    if (!cols.length) {
      await db.query("ALTER TABLE members ADD COLUMN username VARCHAR(100) UNIQUE AFTER email");
      await db.query("ALTER TABLE members ADD COLUMN password_hash VARCHAR(255) AFTER username");
      console.log('✅ Đã nâng cấp bảng members (thêm cột username, password_hash)');
    }
    
    // Đảm bảo cột email cho phép NULL nếu hội viên đăng ký bằng số điện thoại
    try {
      await db.query("ALTER TABLE members MODIFY COLUMN email VARCHAR(255) NULL DEFAULT NULL");
    } catch (e) {
      // Ignored if already nullable
    }
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS member_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      ) ENGINE=InnoDB COMMENT='Phiên đăng nhập hội viên'
    `);
    console.log('✅ Bảng member_sessions đã sẵn sàng');

    // Tự động kiểm tra và thêm cột last_login vào bảng admins
    try {
      const [adminCols] = await db.query("SHOW COLUMNS FROM admins LIKE 'last_login'");
      if (!adminCols.length) {
        await db.query("ALTER TABLE admins ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL");
        console.log('✅ Đã thêm cột last_login vào bảng admins');
      }
    } catch (e) {
      console.warn('Cảnh báo kiểm tra cột last_login trong admins:', e.message);
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        city VARCHAR(100) DEFAULT NULL,
        member_type VARCHAR(100) DEFAULT 'member_personal',
        company_name VARCHAR(255) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        status ENUM('pending', 'contacted', 'other') DEFAULT 'pending',
        admin_notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB COMMENT='Danh sách liên hệ / Đăng ký từ trang chủ'
    `);
    console.log('✅ Bảng leads đã sẵn sàng');

    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        member_id INT DEFAULT NULL,
        role VARCHAR(20) NOT NULL,
        content LONGTEXT NOT NULL,
        provider VARCHAR(50),
        model VARCHAR(100),
        tokens_in INT DEFAULT 0,
        tokens_out INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session (session_id),
        INDEX idx_member (member_id)
      ) ENGINE=InnoDB COMMENT='Lịch sử chat AI'
    `);

    // Thêm cột member_id vào chat_logs để phân tách lịch sử chat theo tài khoản
    const [chatCols] = await db.query("SHOW COLUMNS FROM chat_logs LIKE 'member_id'");
    if (!chatCols.length) {
      await db.query("ALTER TABLE chat_logs ADD COLUMN member_id INT DEFAULT NULL AFTER session_id");
      await db.query("ALTER TABLE chat_logs ADD INDEX idx_member (member_id)");
      console.log('✅ Đã thêm cột member_id vào bảng chat_logs');
    }

    const [deadlineCols] = await db.query("SHOW COLUMNS FROM posts LIKE 'deadline'");
    if (!deadlineCols.length) {
      await db.query("ALTER TABLE posts ADD COLUMN deadline VARCHAR(50) DEFAULT NULL AFTER contact_info");
      console.log('✅ Đã thêm cột deadline vào bảng posts');
    }

    // Thêm cột image_url vào bảng posts để hội viên tự tải ảnh minh họa bài viết
    const [postCols] = await db.query("SHOW COLUMNS FROM posts LIKE 'image_url'");
    if (!postCols.length) {
      await db.query("ALTER TABLE posts ADD COLUMN image_url VARCHAR(1000) DEFAULT NULL");
      console.log('✅ Đã thêm cột image_url vào bảng posts');
    }

    // Thêm cột is_featured vào bảng posts để ghim bài nổi bật
    const [isFeaturedCols] = await db.query("SHOW COLUMNS FROM posts LIKE 'is_featured'");
    if (!isFeaturedCols.length) {
      await db.query("ALTER TABLE posts ADD COLUMN is_featured TINYINT(1) DEFAULT 0");
      console.log('✅ Đã thêm cột is_featured vào bảng posts');
    }

    // Thêm cột sub_category vào bảng posts để lưu Lĩnh vực con
    const [subCatCols] = await db.query("SHOW COLUMNS FROM posts LIKE 'sub_category'");
    if (!subCatCols.length) {
      await db.query("ALTER TABLE posts ADD COLUMN sub_category VARCHAR(100) DEFAULT NULL AFTER category");
      console.log('✅ Đã thêm cột sub_category vào bảng posts');
    }

    // Thêm cột source_url vào bảng posts để lưu nguồn bài viết
    const [sourceUrlCols] = await db.query("SHOW COLUMNS FROM posts LIKE 'source_url'");
    if (!sourceUrlCols.length) {
      await db.query("ALTER TABLE posts ADD COLUMN source_url VARCHAR(500) DEFAULT NULL AFTER sub_category");
      console.log('✅ Đã thêm cột source_url vào bảng posts');
    }

    // Migration bổ sung cột slug vào bảng posts và tự động backfill slug cho bài viết đã có
    const [slugCols] = await db.query("SHOW COLUMNS FROM posts LIKE 'slug'");
    if (!slugCols.length) {
      await db.query("ALTER TABLE posts ADD COLUMN slug VARCHAR(550) DEFAULT NULL AFTER title, ADD INDEX idx_slug (slug)");
      console.log('✅ Đã thêm cột slug và index idx_slug vào bảng posts');
    }

    // Tự động tạo URL slug SEO cho bài viết hiện chưa có slug
    const [missingSlugPosts] = await db.query("SELECT id, title FROM posts WHERE slug IS NULL OR slug = ''");
    if (missingSlugPosts && missingSlugPosts.length > 0) {
      for (const p of missingSlugPosts) {
        let baseSlug = slugify(p.title) || `post-${p.id}`;
        let uniqueSlug = `${baseSlug}-${p.id}`;
        await db.query("UPDATE posts SET slug = ? WHERE id = ?", [uniqueSlug, p.id]);
      }
      console.log(`✅ Đã tự động tạo URL slug SEO cho ${missingSlugPosts.length} bài viết hiện có.`);
    }

    // Tự động sinh tệp sitemap.xml & robots.txt thực tế vào thư mục public/
    await generateSitemapFiles();
    console.log('✅ Đã tự động khởi tạo tệp sitemap.xml và robots.txt chuẩn SEO trong public/.');

    // Thêm cột featured_requested vào bảng posts để Platinum yêu cầu ghim bài nổi bật
    const [featuredRequestedCols] = await db.query("SHOW COLUMNS FROM posts LIKE 'featured_requested'");
    if (!featuredRequestedCols.length) {
      await db.query("ALTER TABLE posts ADD COLUMN featured_requested TINYINT(1) DEFAULT 0");
      console.log('✅ Đã thêm cột featured_requested vào bảng posts');
    }

    // Thêm cột tier_expires_at và pending_tier_upgrade vào bảng members
    const [memberCols] = await db.query("SHOW COLUMNS FROM members");
    const memberColNames = memberCols.map(c => c.Field);
    if (!memberColNames.includes('tier_expires_at')) {
      await db.query("ALTER TABLE members ADD COLUMN tier_expires_at TIMESTAMP NULL DEFAULT NULL AFTER tier");
      console.log('✅ Đã thêm cột tier_expires_at vào bảng members');
    }
    if (!memberColNames.includes('pending_tier_upgrade')) {
      await db.query("ALTER TABLE members ADD COLUMN pending_tier_upgrade ENUM('Silver','Gold','Platinum') DEFAULT NULL AFTER tier_expires_at");
      console.log('✅ Đã thêm cột pending_tier_upgrade vào bảng members');
    }
    if (!memberColNames.includes('is_featured')) {
      await db.query("ALTER TABLE members ADD COLUMN is_featured TINYINT(1) DEFAULT 0");
      console.log('✅ Đã thêm cột is_featured vào bảng members');
    }
    if (!memberColNames.includes('city')) {
      await db.query("ALTER TABLE members ADD COLUMN city VARCHAR(100) DEFAULT NULL AFTER address");
      console.log('✅ Đã thêm cột city vào bảng members');
    }

    // Tự động tạo bảng content_creators và creator_sessions cho vai trò Biên tập viên
    await db.query(`
      CREATE TABLE IF NOT EXISTS content_creators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        requires_approval TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB COMMENT='Tài khoản Biên tập viên / Content Creator'
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS creator_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        creator_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES content_creators(id) ON DELETE CASCADE
      ) ENGINE=InnoDB COMMENT='Phiên đăng nhập Biên tập viên'
    `);
    console.log('✅ Bảng content_creators và creator_sessions đã sẵn sàng');

    // Tự động tạo bảng event_organizers và organizer_sessions cho vai trò Ban tổ chức sự kiện
    await db.query(`
      CREATE TABLE IF NOT EXISTS event_organizers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        email VARCHAR(191) DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB COMMENT='Tài khoản Ban tổ chức Sự kiện'
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS organizer_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        organizer_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES event_organizers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB COMMENT='Phiên đăng nhập Ban tổ chức Sự kiện'
    `);
    console.log('✅ Bảng event_organizers và organizer_sessions đã sẵn sàng');

    // Đảm bảo bảng posts có đầy đủ các cột mới
    const [existingPostCols] = await db.query("SHOW COLUMNS FROM posts");
    const postColNames = existingPostCols.map(c => c.Field);

    if (!postColNames.includes('creator_id')) {
      await db.query("ALTER TABLE posts ADD COLUMN creator_id INT DEFAULT NULL AFTER member_id, ADD INDEX idx_creator (creator_id)");
      console.log('✅ Đã thêm cột creator_id vào bảng posts');
    }
    if (!postColNames.includes('slug')) {
      await db.query("ALTER TABLE posts ADD COLUMN slug VARCHAR(255) DEFAULT NULL AFTER title");
      console.log('✅ Đã thêm cột slug vào bảng posts');
    }
    if (!postColNames.includes('sub_category')) {
      await db.query("ALTER TABLE posts ADD COLUMN sub_category VARCHAR(100) DEFAULT NULL AFTER category");
      console.log('✅ Đã thêm cột sub_category vào bảng posts');
    }
    if (!postColNames.includes('source_url')) {
      await db.query("ALTER TABLE posts ADD COLUMN source_url VARCHAR(500) DEFAULT NULL AFTER body");
      console.log('✅ Đã thêm cột source_url vào bảng posts');
    }
    if (!postColNames.includes('tags')) {
      await db.query("ALTER TABLE posts ADD COLUMN tags JSON DEFAULT NULL AFTER source_url");
      console.log('✅ Đã thêm cột tags vào bảng posts');
    }
    if (!postColNames.includes('deadline')) {
      await db.query("ALTER TABLE posts ADD COLUMN deadline DATE DEFAULT NULL AFTER contact_info");
      console.log('✅ Đã thêm cột deadline vào bảng posts');
    }
    if (!postColNames.includes('featured_requested')) {
      await db.query("ALTER TABLE posts ADD COLUMN featured_requested TINYINT(1) DEFAULT 0 AFTER is_featured");
      console.log('✅ Đã thêm cột featured_requested vào bảng posts');
    }
    if (!postColNames.includes('reject_reason')) {
      await db.query("ALTER TABLE posts ADD COLUMN reject_reason TEXT DEFAULT NULL AFTER featured_requested");
      console.log('✅ Đã thêm cột reject_reason vào bảng posts');
    }
    if (!postColNames.includes('published_at')) {
      await db.query("ALTER TABLE posts ADD COLUMN published_at TIMESTAMP NULL DEFAULT NULL AFTER reject_reason");
      console.log('✅ Đã thêm cột published_at vào bảng posts');
    }

    try {
      await db.query("ALTER TABLE posts MODIFY COLUMN member_id INT DEFAULT NULL");
    } catch (e) {
      // Ignored if already nullable
    }

    // Cập nhật ENUM cho status cột của bảng members để hỗ trợ 'suspended'
    await db.query("ALTER TABLE members MODIFY COLUMN status ENUM('pending','approved','rejected','suspended') DEFAULT 'pending'");
    console.log("✅ Cập nhật ENUM cột status bảng members thành công");

    // Cập nhật ENUM cho status cột của bảng posts để hỗ trợ 'hidden' (Ẩn bài / bài quá hạn)
    try {
      await db.query("ALTER TABLE posts MODIFY COLUMN status ENUM('draft','pending','approved','rejected','hidden') DEFAULT 'pending'");
      console.log("✅ Cập nhật ENUM cột status bảng posts thành công");
    } catch (e) {
      console.warn("⚠️ Cảnh báo cập nhật status bảng posts:", e.message);
    }

    // Đảm bảo bảng events và event_registrations có đầy đủ cột và cấu trúc
    try {
      const [eventsCols] = await db.query("SHOW COLUMNS FROM events LIKE 'capacity'");
      if (!eventsCols.length) {
        await db.query("ALTER TABLE events ADD COLUMN capacity INT DEFAULT 0 AFTER organizer");
      }
      const [eventsImgCols] = await db.query("SHOW COLUMNS FROM events LIKE 'image_url'");
      if (!eventsImgCols.length) {
        await db.query("ALTER TABLE events ADD COLUMN image_url VARCHAR(500) DEFAULT NULL AFTER capacity");
      }
      const [eventsShortDescCols] = await db.query("SHOW COLUMNS FROM events LIKE 'short_desc'");
      if (!eventsShortDescCols.length) {
        await db.query("ALTER TABLE events ADD COLUMN short_desc TEXT DEFAULT NULL AFTER title");
      }
      const [eventsContentCols] = await db.query("SHOW COLUMNS FROM events LIKE 'content'");
      if (!eventsContentCols.length) {
        await db.query("ALTER TABLE events ADD COLUMN content LONGTEXT DEFAULT NULL AFTER description");
      }
      const [eventsSlugCols] = await db.query("SHOW COLUMNS FROM events LIKE 'slug'");
      if (!eventsSlugCols.length) {
        await db.query("ALTER TABLE events ADD COLUMN slug VARCHAR(255) DEFAULT NULL AFTER title");
      }
      const [eventsPaidCols] = await db.query("SHOW COLUMNS FROM events LIKE 'is_paid'");
      if (!eventsPaidCols.length) {
        await db.query("ALTER TABLE events ADD COLUMN is_paid TINYINT(1) DEFAULT 0 AFTER image_url");
      }
      const [eventsPriceCols] = await db.query("SHOW COLUMNS FROM events LIKE 'price'");
      if (!eventsPriceCols.length) {
        await db.query("ALTER TABLE events ADD COLUMN price DECIMAL(15,2) DEFAULT 0 AFTER is_paid");
      }
      const [eventsPublishedCols] = await db.query("SHOW COLUMNS FROM events LIKE 'is_published'");
      if (!eventsPublishedCols.length) {
        await db.query("ALTER TABLE events ADD COLUMN is_published TINYINT(1) DEFAULT 1 AFTER price");
      }

      // Tạo bảng event_registrations quản lý vé QR và thanh toán chuyển khoản
      await db.query(`
        CREATE TABLE IF NOT EXISTS event_registrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_id INT NOT NULL,
          ticket_code VARCHAR(50) NOT NULL UNIQUE,
          full_name VARCHAR(150) NOT NULL,
          phone VARCHAR(30) NOT NULL,
          email VARCHAR(255) DEFAULT NULL,
          company VARCHAR(255) DEFAULT NULL,
          quantity INT DEFAULT 1,
          total_amount DECIMAL(15,2) DEFAULT 0,
          payment_status ENUM('free','pending','paid','cancelled') DEFAULT 'free',
          payment_note VARCHAR(255) DEFAULT NULL,
          checkin_status ENUM('not_checked_in','checked_in') DEFAULT 'not_checked_in',
          checkin_time DATETIME DEFAULT NULL,
          create_account TINYINT(1) DEFAULT 0,
          notes TEXT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
          INDEX idx_event (event_id),
          INDEX idx_ticket (ticket_code),
          INDEX idx_phone (phone)
        ) ENGINE=InnoDB COMMENT='Đăng ký sự kiện và cấp mã QR'
      `);

      const [interestMemberCols] = await db.query("SHOW COLUMNS FROM event_interests LIKE 'member_id'");
      if (!interestMemberCols.length) {
        await db.query("ALTER TABLE event_interests ADD COLUMN member_id INT DEFAULT NULL AFTER event_id, ADD INDEX idx_member (member_id)");
      }

      const [regMemberCols] = await db.query("SHOW COLUMNS FROM event_registrations LIKE 'member_id'");
      if (!regMemberCols.length) {
        await db.query("ALTER TABLE event_registrations ADD COLUMN member_id INT DEFAULT NULL AFTER event_id, ADD INDEX idx_reg_member (member_id)");
      }

      // Khởi tạo sự kiện mẫu chuẩn theo mockup giao diện DoanhNghiepVN.today
      const [existingEvents] = await db.query("SELECT id FROM events WHERE slug = 'su-kien-demo' OR title LIKE '%Sự kiện demo%' LIMIT 1");
      if (!existingEvents.length) {
        // Xóa sự kiện mẫu cũ nếu có
        await db.query("DELETE FROM events WHERE title LIKE '%Festival Văn hóa%' OR title LIKE '%Cồng chiêng Tây Nguyên%'");
        
        await db.query(`
          INSERT INTO events (title, slug, short_desc, description, content, event_date, end_date, location, organizer, capacity, is_paid, price, is_published, status, image_url) VALUES
          (
            'Sự kiện demo',
            'su-kien-demo',
            'Sự kiện demo kết nối giao thương và trải nghiệm công nghệ AI dành cho doanh nghiệp thành viên.',
            'Sự kiện giao lưu, kết nối các doanh nghiệp thành viên Tạp chí Doanh Nghiệp Việt Nam.',
            '<p><strong>Sự kiện demo</strong> là chương trình kết nối giao thương đặc biệt do <em>Tạp chí Doanh Nghiệp Việt Nam</em> phối hợp cùng <em>Công ty Cổ phần ADT Quốc tế</em> tổ chức.</p><p>Tại sự kiện, các doanh nghiệp sẽ được:</p><ul><li>Gặp gỡ trực tiếp các chuyên gia tài chính và ngân hàng đối tác hỗ trợ các gói vay vốn ưu đãi.</li><li>Trải nghiệm giải pháp Trợ lý AI và nền tảng quản trị thông minh cho SME.</li><li>Nhận mã QR check-in tiện lợi, tra cứu và kết nối trực tiếp với hơn 200 doanh nghiệp hội viên tham gia.</li></ul><p>Kính mời quý đại diện doanh nghiệp hoàn tất đăng ký để nhận mã QR tham gia sự kiện!</p>',
            '2026-10-30 15:24:00',
            '2026-10-30 16:10:00',
            '36 Hùng vương',
            'Tạp chí Doanh Nghiệp Việt Nam',
            100,
            0,
            0,
            1,
            'upcoming',
            'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80'
          ),
          (
            'Diễn đàn Doanh nghiệp Việt Nam 2026: Đổi mới sáng tạo & Ứng dụng AI',
            'dien-dan-doanh-nghiep-vn-2026',
            'Diễn đàn quy mô toàn quốc tập hợp hơn 500 lãnh đạo doanh nghiệp, chuyên gia kinh tế và công nghệ.',
            'Ứng dụng Trí tuệ nhân tạo và chuyển đổi số trong tái cấu trúc chuỗi cung ứng doanh nghiệp Việt Nam.',
            '<p>Diễn đàn tập trung thảo luận về các chủ đề cấp thiết: Tự động hóa quy trình với AI Agent, Tối ưu chi phí vận hành bằng giải pháp ERP Cloud, và Chiến lược tiếp cận các quỹ đầu tư mạo hiểm giai đoạn 2026 - 2030.</p>',
            '2026-11-15 08:30:00',
            '2026-11-15 17:30:00',
            'Trung tâm Hội nghị Quốc tế, Hà Nội',
            'Tạp chí Doanh Nghiệp Việt Nam & ADT Group',
            300,
            0,
            0,
            1,
            'upcoming',
            'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'
          ),
          (
            'Hội nghị Xúc tiến Giao thương Doanh nghiệp SME & Vay vốn Xanh',
            'xuc-tien-giao-thuong-sme-von-xanh',
            'Kết nối ngân hàng thương mại, quỹ tín dụng quốc tế và các doanh nghiệp thực hành ESG.',
            'Cơ hội tiếp cận các gói tín dụng xanh lãi suất ưu đãi lên tới 500 tỷ đồng.',
            '<p>Hội nghị có sự tham gia của hơn 20 tổ chức tài chính hàng đầu và các hiệp hội doanh nghiệp ngành nghề, mang lại giải pháp tài chính thiết thực cho quá trình chuyển đổi xanh của doanh nghiệp.</p>',
            '2026-12-05 09:00:00',
            '2026-12-05 12:00:00',
            'Khách sạn Daewoo, Ba Đình, Hà Nội',
            'Hiệp hội Doanh nghiệp & Tạp chí Doanh Nghiệp VN',
            200,
            1,
            200000,
            1,
            'upcoming',
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
          )
        `);

        // Tạo 2 đăng ký mẫu cho sự kiện demo để hiển thị: "Đăng ký: 2 / 100 | Còn: 98 vé" đúng chuẩn ảnh người dùng cung cấp!
        const [demoEvt] = await db.query("SELECT id FROM events WHERE slug = 'su-kien-demo' LIMIT 1");
        if (demoEvt.length) {
          const dId = demoEvt[0].id;
          await db.query(`
            INSERT INTO event_registrations (event_id, ticket_code, full_name, phone, email, company, quantity, total_amount, payment_status, checkin_status)
            VALUES 
            (?, 'DNVN-DEMO-001', 'Nguyễn Văn Minh', '0912345678', 'minh.nguyen@techcorp.vn', 'Công ty Cổ phần TechCorp', 1, 0, 'free', 'not_checked_in'),
            (?, 'DNVN-DEMO-002', 'Trần Thị Thu Trang', '0987654321', 'trang.tran@vinabiz.com', 'Tập đoàn VinaBiz', 1, 0, 'free', 'not_checked_in')
          `, [dId, dId]);
        }
        console.log('✅ Đã khởi tạo 3 sự kiện chuẩn DoanhNghiepVN và vé mẫu!');
      }
    } catch (e) {
      console.warn('Cảnh báo kiểm tra bảng events & event_registrations:', e.message);
    }

    // Thêm cột system_instruction vào bảng ai_config
    const [aiCols] = await db.query("SHOW COLUMNS FROM ai_config LIKE 'system_instruction'");
    if (!aiCols.length) {
      await db.query("ALTER TABLE ai_config ADD COLUMN system_instruction TEXT DEFAULT NULL");
      console.log('✅ Đã thêm cột system_instruction vào bảng ai_config');
    }

    // Tự động tạo bảng categories và sub_categories và seed dữ liệu nếu trống
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        name_en VARCHAR(255) DEFAULT NULL,
        slug VARCHAR(255),
        order_index INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB COMMENT='Danh mục chuyên mục chính'
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS sub_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) DEFAULT NULL,
        slug VARCHAR(255),
        order_index INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        INDEX idx_category (category_id)
      ) ENGINE=InnoDB COMMENT='Danh mục lĩnh vực con'
    `);

    // Migration bổ sung cột name_en nếu bảng đã tồn tại từ trước
    const [catCols] = await db.query("SHOW COLUMNS FROM categories LIKE 'name_en'");
    if (!catCols.length) {
      await db.query("ALTER TABLE categories ADD COLUMN name_en VARCHAR(255) DEFAULT NULL AFTER name");
      console.log('✅ Đã thêm cột name_en vào bảng categories');
    }
    const [subCategoryTableCols] = await db.query("SHOW COLUMNS FROM sub_categories LIKE 'name_en'");
    if (!subCategoryTableCols.length) {
      await db.query("ALTER TABLE sub_categories ADD COLUMN name_en VARCHAR(255) DEFAULT NULL AFTER name");
      console.log('✅ Đã thêm cột name_en vào bảng sub_categories');
    }

    const [catCount] = await db.query('SELECT COUNT(*) as count FROM categories');
    const [hasOldCategories] = await db.query("SELECT COUNT(*) as count FROM categories WHERE name LIKE '%Đồ Sơn%' OR name LIKE '%Văn hóa – Du lịch%'");

    if (catCount[0].count === 0 || hasOldCategories[0].count > 0) {
      console.log('🌱 Đang khởi tạo/đồng bộ dữ liệu Chuyên mục & Lĩnh vực DoanhNghiepVN.today...');
      if (hasOldCategories[0].count > 0) {
        await db.query('DELETE FROM categories WHERE name LIKE "%Đồ Sơn%" OR name LIKE "%Văn hóa – Du lịch%"');
      }

      const defaultCategories = [
        {
          name: 'Sự kiện & Diễn đàn', name_en: 'Events & Forums', order: 1,
          subs: [
            { vi: 'Hội thảo & Tọa đàm', en: 'Conferences & Seminars' },
            { vi: 'Diễn đàn kinh tế', en: 'Economic Forums' },
            { vi: 'Xúc tiến thương mại', en: 'Trade Promotion' },
            { vi: 'Giao thương B2B', en: 'B2B Networking' }
          ]
        },
        {
          name: 'Tư vấn Vay vốn & Tài chính', name_en: 'Loan & Financial Consulting', order: 2,
          subs: [
            { vi: 'Tín dụng ngân hàng', en: 'Bank Credits' },
            { vi: 'Quỹ hỗ trợ SME', en: 'SME Support Funds' },
            { vi: 'Vốn đầu tư khởi nghiệp', en: 'Startup Investment Capital' },
            { vi: 'Cơ cấu tài chính doanh nghiệp', en: 'Corporate Financial Restructuring' }
          ]
        },
        {
          name: 'Truyền thông Thương hiệu', name_en: 'Brand & Communication', order: 3,
          subs: [
            { vi: 'Báo chí & Truyền thông', en: 'Press & Media' },
            { vi: 'Nhận diện thương hiệu', en: 'Brand Identity' },
            { vi: 'Chiến dịch PR', en: 'PR Campaigns' },
            { vi: 'Quản trị khủng hoảng truyền thông', en: 'Crisis Management' }
          ]
        },
        {
          name: 'Marketing & Bán hàng', name_en: 'Marketing & Sales', order: 4,
          subs: [
            { vi: 'Digital Marketing & SEO', en: 'Digital Marketing & SEO' },
            { vi: 'Thương mại điện tử', en: 'E-Commerce' },
            { vi: 'Kênh phân phối & Chuỗi cung ứng', en: 'Distribution & Supply Chain' },
            { vi: 'Tối ưu chuyển đổi', en: 'Conversion Optimization' }
          ]
        },
        {
          name: 'Ứng dụng AI & Công nghệ', name_en: 'AI & Technology Application', order: 5,
          subs: [
            { vi: 'Trợ lý AI & Multi-Agent', en: 'AI Assistants & Multi-Agent' },
            { vi: 'Tự động hóa doanh nghiệp', en: 'Business Automation' },
            { vi: 'ERP & CRM thông minh', en: 'Smart ERP & CRM' },
            { vi: 'Chuyển đổi số doanh nghiệp', en: 'Digital Transformation' }
          ]
        },
        {
          name: 'Thực hành ESG & Phát triển bền vững', name_en: 'ESG & Sustainable Development', order: 6,
          subs: [
            { vi: 'Chuyển đổi xanh & Năng lượng sạch', en: 'Green Transition & Clean Energy' },
            { vi: 'Tiêu chuẩn & Báo cáo ESG', en: 'ESG Standards & Reporting' },
            { vi: 'Giảm phát thải Carbon', en: 'Carbon Footprint Reduction' },
            { vi: 'Trách nhiệm xã hội CSR', en: 'Corporate Social Responsibility' }
          ]
        },
        {
          name: 'Hiệp hội & Giao thương', name_en: 'Business Association & Networking', order: 7,
          subs: [
            { vi: 'Hiệp hội Doanh nghiệp', en: 'Business Associations' },
            { vi: 'Danh bạ Hội viên', en: 'Member Directory' },
            { vi: 'Tìm kiếm đối tác', en: 'Partner Search' },
            { vi: 'Cơ hội đầu tư & Hợp tác', en: 'Partnership Opportunities' }
          ]
        }
      ];

      for (const cat of defaultCategories) {
        const [existing] = await db.query('SELECT id FROM categories WHERE name = ?', [cat.name]);
        let catId;
        if (existing.length > 0) {
          catId = existing[0].id;
        } else {
          const [res] = await db.query(
            'INSERT INTO categories (name, name_en, slug, order_index, status) VALUES (?, ?, ?, ?, "active")',
            [cat.name, cat.name_en, slugify(cat.name), cat.order]
          );
          catId = res.insertId;
        }

        for (let i = 0; i < cat.subs.length; i++) {
          const [subExisting] = await db.query(
            'SELECT id FROM sub_categories WHERE category_id = ? AND name = ?',
            [catId, cat.subs[i].vi]
          );
          if (subExisting.length === 0) {
            await db.query(
              'INSERT INTO sub_categories (category_id, name, name_en, slug, order_index, status) VALUES (?, ?, ?, ?, ?, "active")',
              [catId, cat.subs[i].vi, cat.subs[i].en, slugify(cat.subs[i].vi), i + 1]
            );
          }
        }
      }
      console.log('✅ Khởi tạo/đồng bộ 7 Chuyên mục & Lĩnh vực DoanhNghiepVN.today hoàn tất!');
    }

    // Tạo thư mục kiến thức
    const KB_DIR = path.join(__dirname, 'knowledge_base');
    if (!fs.existsSync(KB_DIR)) {
      fs.mkdirSync(KB_DIR, { recursive: true });
      console.log('✅ Đã tạo thư mục knowledge_base');
    }

    // Tạo bảng events nếu chưa có
    await db.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT DEFAULT NULL,
        event_date DATE NOT NULL,
        location VARCHAR(255) DEFAULT NULL,
        organizer VARCHAR(255) DEFAULT NULL,
        capacity INT DEFAULT NULL,
        status ENUM('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB COMMENT='Sự kiện của hội'
    `);
    console.log("✅ Bảng events đã sẵn sàng");

    // Tạo bảng event_interests nếu chưa có
    await db.query(`
      CREATE TABLE IF NOT EXISTS event_interests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        member_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY idx_event_member (event_id, member_id),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      ) ENGINE=InnoDB COMMENT='Thành viên quan tâm sự kiện'
    `);
    console.log("✅ Bảng event_interests đã sẵn sàng");
  } catch (err) {
    console.error('❌ Lỗi khởi tạo DB hội viên:', err.message);
  }
})();

// Tự động gia hạn/giảm hạng gói khi hết hạn (chuyển về Silver)
async function cleanupExpiredTiers() {
  try {
    await db.query(`
      UPDATE members 
      SET tier = 'Silver', tier_expires_at = NULL, pending_tier_upgrade = NULL 
      WHERE tier_expires_at IS NOT NULL AND tier_expires_at < NOW()
    `);
  } catch (err) {
    console.error('❌ Lỗi tự động dọn dẹp gói hết hạn:', err.message);
  }
}

// Chạy bảo trì dữ liệu định kỳ mỗi 30 phút ở chế độ nền (không làm chậm các request đọc bài viết)
async function runBackgroundMaintenance() {
  await cleanupExpiredTiers();
  try {
    const todayStr = new Date().toISOString().substring(0, 10);
    await db.query(
      "UPDATE posts SET status = 'hidden' WHERE deadline IS NOT NULL AND deadline != '' AND deadline != '0000-00-00' AND status = 'approved' AND deadline < ?",
      [todayStr]
    );
  } catch (e) {
    // Silent in background
  }
}

// Khởi chạy ngay khi khởi động và lập lịch định kỳ mỗi 30 phút
runBackgroundMaintenance();
setInterval(runBackgroundMaintenance, 30 * 60 * 1000);

// Giới hạn phân hạng Tier
const TIER_LIMITS = {
  Silver:   { posts_per_month: 3,  chats_per_day: 5 },
  Gold:     { posts_per_month: 15, chats_per_day: 50 },
  Platinum: { posts_per_month: Infinity, chats_per_day: Infinity }
};

// Middleware xác thực Admin bằng token
async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc thiếu token.' });
  }

  const token = authHeader.substring(7);
  try {
    const [sessions] = await db.query(
      `SELECT s.*, a.username, a.name, a.role 
       FROM admin_sessions s 
       JOIN admins a ON s.admin_id = a.id 
       WHERE s.token = ? AND s.expires_at > NOW()`, 
      [token]
    );

    if (!sessions.length) {
      return res.status(401).json({ success: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
    }

    req.admin = {
      id: sessions[0].admin_id,
      username: sessions[0].username,
      name: sessions[0].name,
      role: sessions[0].role,
      token: token
    };
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Lỗi xác thực: ' + err.message });
  }
}

// Middleware xác thực Hội viên bằng token
async function memberAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc thiếu token hội viên.' });
  }

  const token = authHeader.substring(7);
  try {
    // Dọn dẹp trước khi query thông tin phiên làm việc
    await cleanupExpiredTiers();

    const [sessions] = await db.query(
      `SELECT s.*, m.name, m.email, m.status, m.tier, m.tier_expires_at, m.pending_tier_upgrade
       FROM member_sessions s 
       JOIN members m ON s.member_id = m.id 
       WHERE s.token = ? AND s.expires_at > NOW()`, 
      [token]
    );

    if (!sessions.length) {
      return res.status(401).json({ success: false, error: 'Phiên đăng nhập hội viên không hợp lệ hoặc đã hết hạn.' });
    }

    if (sessions[0].status !== 'approved') {
      return res.status(403).json({ success: false, error: 'Tài khoản của bạn đã bị tạm khóa hoặc chưa được phê duyệt.' });
    }

    req.member = {
      id: sessions[0].member_id,
      name: sessions[0].name,
      email: sessions[0].email,
      status: sessions[0].status,
      tier: sessions[0].tier,
      tier_expires_at: sessions[0].tier_expires_at,
      pending_tier_upgrade: sessions[0].pending_tier_upgrade,
      token: token
    };
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Lỗi xác thực hội viên: ' + err.message });
  }
}

// Middleware xác thực Content Creator bằng token
async function creatorAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc thiếu token Biên tập viên.' });
  }

  const token = authHeader.substring(7);
  try {
    const [sessions] = await db.query(
      `SELECT s.*, c.name, c.username, c.requires_approval
       FROM creator_sessions s 
       JOIN content_creators c ON s.creator_id = c.id 
       WHERE s.token = ? AND (s.expires_at > NOW() OR s.expires_at > UTC_TIMESTAMP())`, 
      [token]
    );

    if (!sessions.length) {
      return res.status(401).json({ success: false, error: 'Phiên đăng nhập Biên tập viên không hợp lệ hoặc đã hết hạn.' });
    }

    req.creator = {
      id: sessions[0].creator_id,
      name: sessions[0].name,
      username: sessions[0].username,
      requires_approval: Number(sessions[0].requires_approval),
      token: token
    };
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Lỗi xác thực Biên tập viên: ' + err.message });
  }
}

// Middleware xác thực Ban tổ chức Sự kiện (Organizer) bằng token
async function organizerAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc thiếu token Ban tổ chức.' });
  }

  const token = authHeader.substring(7);
  try {
    const [sessions] = await db.query(
      `SELECT s.*, o.name, o.username, o.phone, o.email, o.status
       FROM organizer_sessions s 
       JOIN event_organizers o ON s.organizer_id = o.id 
       WHERE s.token = ? AND (s.expires_at > NOW() OR s.expires_at > UTC_TIMESTAMP())`, 
      [token]
    );

    if (!sessions.length) {
      return res.status(401).json({ success: false, error: 'Phiên đăng nhập Ban tổ chức không hợp lệ hoặc đã hết hạn.' });
    }

    if (sessions[0].status === 'inactive' || sessions[0].status === 'suspended') {
      return res.status(403).json({ success: false, error: 'Tài khoản Ban tổ chức này đã bị tạm khóa.' });
    }

    req.organizer = {
      id: sessions[0].organizer_id,
      name: sessions[0].name,
      username: sessions[0].username,
      phone: sessions[0].phone,
      email: sessions[0].email,
      token: token
    };
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Lỗi xác thực Ban tổ chức: ' + err.message });
  }
}

// Middleware xác thực Quản lý Sự kiện (Admin HOẶC Ban tổ chức / Organizer)
async function eventManagerAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc thiếu token quản lý sự kiện.' });
  }

  const token = authHeader.substring(7);
  try {
    // 1. Thử xác thực Admin
    const [adminSessions] = await db.query(
      `SELECT s.*, a.username, a.name, a.role 
       FROM admin_sessions s JOIN admins a ON s.admin_id = a.id 
       WHERE s.token = ? AND s.expires_at > NOW()`, 
      [token]
    );
    if (adminSessions.length) {
      req.admin = {
        id: adminSessions[0].admin_id,
        username: adminSessions[0].username,
        name: adminSessions[0].name,
        role: adminSessions[0].role,
        token: token
      };
      req.authRole = 'admin';
      return next();
    }

    // 2. Thử xác thực Ban tổ chức (Organizer)
    const [orgSessions] = await db.query(
      `SELECT s.*, o.name, o.username, o.phone, o.email, o.status
       FROM organizer_sessions s 
       JOIN event_organizers o ON s.organizer_id = o.id 
       WHERE s.token = ? AND (s.expires_at > NOW() OR s.expires_at > UTC_TIMESTAMP())`, 
      [token]
    );
    if (orgSessions.length) {
      if (orgSessions[0].status === 'inactive' || orgSessions[0].status === 'suspended') {
        return res.status(403).json({ success: false, error: 'Tài khoản Ban tổ chức này đã bị tạm khóa.' });
      }
      req.organizer = {
        id: orgSessions[0].organizer_id,
        name: orgSessions[0].name,
        username: orgSessions[0].username,
        phone: orgSessions[0].phone,
        email: orgSessions[0].email,
        token: token
      };
      req.authRole = 'organizer';
      return next();
    }

    return res.status(401).json({ success: false, error: 'Phiên đăng nhập quản lý sự kiện không hợp lệ hoặc đã hết hạn.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Lỗi xác thực quản lý sự kiện: ' + err.message });
  }
}

// Middleware xác thực hỗn hợp (Admin HOẶC Member HOẶC Creator HOẶC Organizer)
async function anyAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập để sử dụng tính năng này.' });
  }

  const token = authHeader.substring(7);
  try {
    // Thử xác thực Member trước
    const [memberSessions] = await db.query(
      `SELECT s.*, m.name, m.email, m.status, m.tier, m.id as mid
       FROM member_sessions s JOIN members m ON s.member_id = m.id
       WHERE s.token = ? AND (s.expires_at > NOW() OR s.expires_at > UTC_TIMESTAMP())`, [token]
    );
    if (memberSessions.length) {
      req.authUser = {
        type: 'member',
        id: memberSessions[0].mid,
        name: memberSessions[0].name,
        email: memberSessions[0].email,
        status: memberSessions[0].status,
        tier: memberSessions[0].tier
      };
      return next();
    }

    // Fallback 1: thử xác thực Admin
    const [adminSessions] = await db.query(
      `SELECT s.*, a.username, a.name, a.role
       FROM admin_sessions s JOIN admins a ON s.admin_id = a.id
       WHERE s.token = ? AND (s.expires_at > NOW() OR s.expires_at > UTC_TIMESTAMP())`, [token]
    );
    if (adminSessions.length) {
      req.authUser = {
        type: 'admin',
        id: adminSessions[0].admin_id,
        name: adminSessions[0].name,
        tier: 'Platinum'
      };
      return next();
    }

    // Fallback 2: thử xác thực Creator
    const [creatorSessions] = await db.query(
      `SELECT s.*, c.name, c.username, c.requires_approval
       FROM creator_sessions s JOIN content_creators c ON s.creator_id = c.id
       WHERE s.token = ? AND (s.expires_at > NOW() OR s.expires_at > UTC_TIMESTAMP())`, [token]
    );
    if (creatorSessions.length) {
      req.authUser = {
        type: 'creator',
        id: creatorSessions[0].creator_id,
        name: creatorSessions[0].name,
        username: creatorSessions[0].username,
        tier: 'Platinum'
      };
      return next();
    }

    // Fallback 3: thử xác thực Organizer
    const [organizerSessions] = await db.query(
      `SELECT s.*, o.name, o.username
       FROM organizer_sessions s JOIN event_organizers o ON s.organizer_id = o.id
       WHERE s.token = ? AND (s.expires_at > NOW() OR s.expires_at > UTC_TIMESTAMP())`, [token]
    );
    if (organizerSessions.length) {
      req.authUser = {
        type: 'organizer',
        id: organizerSessions[0].organizer_id,
        name: organizerSessions[0].name,
        username: organizerSessions[0].username,
        tier: 'Platinum'
      };
      return next();
    }

    return res.status(401).json({ success: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Lỗi xác thực: ' + err.message });
  }
}


// ════════════════════════════════════════════
// UNIFIED AUTH API
// ════════════════════════════════════════════

// Đăng nhập Hợp nhất (Unified Login for Admin, Organizer, Creator & Member)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp tài khoản và mật khẩu.' });
    }

    // 1. Thử tìm trong bảng admins trước
    const [adminRows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (adminRows.length > 0) {
      const admin = adminRows[0];
      const match = await bcrypt.compare(password, admin.password_hash);
      if (match) {
        // Cấp token Admin
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ
        await db.query(
          'INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES (?, ?, ?)',
          [admin.id, token, expiresAt]
        );
        try {
          await db.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);
        } catch (e) {
          // Bỏ qua nếu cột chưa tồn tại
        }
        return res.json({
          success: true,
          role: 'admin',
          token,
          user: {
            username: admin.username,
            name: admin.name,
            role: admin.role
          }
        });
      }
    }

    // 2. Thử tìm trong bảng event_organizers (Ban tổ chức Sự kiện)
    const [organizerRows] = await db.query('SELECT * FROM event_organizers WHERE username = ?', [username]);
    if (organizerRows.length > 0) {
      const org = organizerRows[0];
      if (org.status === 'inactive' || org.status === 'suspended') {
        return res.status(403).json({ success: false, error: 'Tài khoản Ban tổ chức này đã bị tạm khóa.' });
      }
      const match = await bcrypt.compare(password, org.password_hash);
      if (match) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ngày
        await db.query(
          'INSERT INTO organizer_sessions (organizer_id, token, expires_at) VALUES (?, ?, ?)',
          [org.id, token, expiresAt]
        );
        const orgData = {
          id: org.id,
          name: org.name,
          username: org.username,
          phone: org.phone,
          email: org.email,
          role: 'organizer'
        };
        return res.json({
          success: true,
          role: 'organizer',
          token,
          user: orgData,
          organizer: orgData
        });
      }
    }

    // 3. Thử tìm trong bảng content_creators
    const [creatorRows] = await db.query('SELECT * FROM content_creators WHERE username = ?', [username]);
    if (creatorRows.length > 0) {
      const creator = creatorRows[0];
      const match = await bcrypt.compare(password, creator.password_hash);
      if (match) {
        // Cấp token Creator (30 ngày)
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ngày
        await db.query(
          'INSERT INTO creator_sessions (creator_id, token, expires_at) VALUES (?, ?, ?)',
          [creator.id, token, expiresAt]
        );
        const creatorData = {
          id: creator.id,
          name: creator.name,
          username: creator.username,
          requires_approval: Number(creator.requires_approval)
        };
        return res.json({
          success: true,
          role: 'creator',
          token,
          user: creatorData,
          creator: creatorData
        });
      }
    }

    // 4. Thử tìm trong bảng members nếu không khớp (Hỗ trợ Đăng nhập bằng Username, Email hoặc SĐT)
    const [memberRows] = await db.query('SELECT * FROM members WHERE username = ? OR email = ? OR phone = ?', [username, username, username]);
    if (memberRows.length > 0) {
      const member = memberRows[0];
      if (!member.password_hash) {
        return res.status(401).json({ success: false, error: 'Tài khoản chưa được kích hoạt mật khẩu. Vui lòng liên hệ ban quản trị.' });
      }
      const match = await bcrypt.compare(password, member.password_hash);
      if (match) {
        // Cấp token Member
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ngày
        await db.query(
          'INSERT INTO member_sessions (member_id, token, expires_at) VALUES (?, ?, ?)',
          [member.id, token, expiresAt]
        );
        return res.json({
          success: true,
          role: 'member',
          token,
          user: {
            id: member.id,
            name: member.name,
            email: member.email,
            status: member.status,
            tier: member.tier
          }
        });
      }
    }

    // 4. Không tìm thấy hoặc mật khẩu không chính xác
    return res.status(401).json({ success: false, error: 'Tài khoản hoặc mật khẩu không chính xác.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ════════════════════════════════════════════
// ADMIN AUTH API
// ════════════════════════════════════════════

// Đăng nhập Admin
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp username và password.' });
    }

    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (!rows.length) {
      return res.status(401).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    // Tạo token ngẫu nhiên và lưu phiên làm việc
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

    await db.query(
      'INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES (?, ?, ?)',
      [admin.id, token, expiresAt]
    );

    // Cập nhật last_login
    try {
      await db.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);
    } catch (e) {
      // Bỏ qua nếu cột chưa tồn tại
    }

    res.json({
      success: true,
      token,
      admin: {
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Đăng xuất Admin
app.post('/api/admin/logout', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM admin_sessions WHERE token = ?', [req.admin.token]);
    res.json({ success: true, message: 'Đăng xuất thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Kiểm tra trạng thái Auth
app.get('/api/admin/check-auth', authMiddleware, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// ════════════════════════════════════════════
// MEMBER AUTH & PROFILE API
// ════════════════════════════════════════════

// Đăng nhập Hội viên
app.post('/api/member/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp tài khoản và mật khẩu.' });
    }

    const [rows] = await db.query('SELECT * FROM members WHERE username = ? OR email = ? OR phone = ?', [username, username, username]);
    if (!rows.length) {
      return res.status(401).json({ success: false, error: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const member = rows[0];

    // Kiểm tra phê duyệt trước khi cho phép đăng nhập
    if (member.status === 'pending') {
      return res.status(403).json({ success: false, error: 'Tài khoản của bạn đang chờ phê duyệt. Vui lòng đợi Ban quản trị duyệt hồ sơ.' });
    }
    if (member.status === 'rejected') {
      return res.status(403).json({ success: false, error: 'Tài khoản của bạn đã bị từ chối phê duyệt. Lý do: ' + (member.reject_reason || 'Không rõ') });
    }
    if (member.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Ban quản trị để biết thêm chi tiết.' });
    }
    
    if (!member.password_hash) {
      return res.status(401).json({ success: false, error: 'Tài khoản chưa được kích hoạt mật khẩu. Vui lòng liên hệ ban quản trị.' });
    }

    const match = await bcrypt.compare(password, member.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ngày

    await db.query(
      'INSERT INTO member_sessions (member_id, token, expires_at) VALUES (?, ?, ?)',
      [member.id, token, expiresAt]
    );

    res.json({
      success: true,
      token,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        status: member.status,
        tier: member.tier,
        tier_expires_at: member.tier_expires_at,
        pending_tier_upgrade: member.pending_tier_upgrade
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Quên mật khẩu Hội viên (cấp mật khẩu mới ngẫu nhiên và gửi mail)
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp email hoặc tài khoản đăng nhập.' });
    }

    const [rows] = await db.query('SELECT id, name, email FROM members WHERE email = ? OR username = ? OR phone = ?', [email, email, email]);
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản hội viên nào phù hợp.' });
    }

    const member = rows[0];
    if (!member.email) {
      return res.status(400).json({ success: false, error: 'Tài khoản này chưa đăng ký email để nhận mật khẩu khôi phục. Vui lòng liên hệ Admin.' });
    }

    // Tạo mật khẩu ngẫu nhiên 10 ký tự chữ và số
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newPassword = '';
    for (let i = 0; i < 10; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE members SET password_hash = ? WHERE id = ?', [hash, member.id]);

    // Gửi mail thông báo mật khẩu mới
    if (transporter) {
      const mailOptions = {
        from: brandConfig.email.fromAddress,
        to: email,
        bcc: process.env.SMTP_BCC || undefined,
        subject: `[${brandConfig.brandShortName}] Khôi phục mật khẩu tài khoản`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1E88E5; border-bottom: 2px solid #1E88E5; padding-bottom: 10px;">Cấp lại mật khẩu thành công!</h2>
            <p>Xin chào <strong>${member.name}</strong>,</p>
            <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu của bạn cho tài khoản kết nối doanh nghiệp trên <strong>${brandConfig.brandName}</strong>.</p>
            <p>Mật khẩu mới của bạn đã được khởi tạo ngẫu nhiên như sau:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
              <span style="font-family: monospace; font-size: 20px; font-weight: bold; color: #1E88E5; letter-spacing: 2px;">${newPassword}</span>
            </div>
            <p style="color: #d32f2f;"><strong>Khuyến cáo bảo mật:</strong> Vui lòng đăng nhập ngay bằng mật khẩu tạm thời này và truy cập vào Dashboard thành viên để đổi lại mật khẩu cá nhân của bạn.</p>
            <p>Trân trọng,<br/>${brandConfig.email.fromName}</p>
            <p style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 15px; font-size: 12px; color: #999;">Đây là email tự động từ hệ thống ${brandConfig.brandName}. Vui lòng không trả lời thư này.</p>
          </div>
        `
      };
      transporter.sendMail(mailOptions, (mailErr, info) => {
        if (mailErr) {
          console.error("❌ Lỗi gửi email khôi phục mật khẩu:", mailErr);
        } else {
          console.log("✅ Đã gửi email cấp lại mật khẩu cho:", email);
        }
      });
    }

    // Chế độ DEV local: Trả về mật khẩu trực tiếp nếu chưa cấu hình SMTP để dễ dàng test
    if (!process.env.SMTP_HOST) {
      return res.json({ 
        success: true, 
        message: `[DEV MODE] SMTP chưa được cấu hình. Mật khẩu mới được tạo là: ${newPassword} (Vui lòng điền biến SMTP vào .env ở production)` 
      });
    }

    res.json({ success: true, message: 'Mật khẩu mới đã được gửi về email của bạn.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Đăng xuất Hội viên
app.post('/api/member/logout', memberAuthMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM member_sessions WHERE token = ?', [req.member.token]);
    res.json({ success: true, message: 'Đăng xuất thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Kiểm tra trạng thái Auth Hội viên
app.get('/api/member/check-auth', memberAuthMiddleware, (req, res) => {
  res.json({ success: true, member: req.member });
});

// Xem Hồ sơ Hội viên đang đăng nhập
app.get('/api/member/profile', memberAuthMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM members WHERE id = ?', [req.member.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cập nhật Hồ sơ Hội viên (Không thay đổi mật khẩu trực tiếp ở đây)
app.put('/api/member/profile', memberAuthMiddleware, async (req, res) => {
  try {
    const {
      name, tax_code, license, industry, size, address, city, website, social,
      description, contact_name, contact_pos, phone, goal
    } = req.body;

    if (!name) return res.status(400).json({ success: false, error: 'Tên doanh nghiệp không được trống.' });

    let sql = `UPDATE members SET 
      name=?, tax_code=?, license=?, industry=?, size=?, address=?, city=?, website=?, social=?, 
      description=?, contact_name=?, contact_pos=?, phone=?, goal=?`;
    const params = [
      name, tax_code || '', license || '', industry || '', size || '', address || '', city || null, website || '', social || '',
      description || '', contact_name || '', contact_pos || '', phone || '', goal || ''
    ];

    sql += ` WHERE id=?`;
    params.push(req.member.id);

    await db.query(sql, params);
    res.json({ success: true, message: 'Đã cập nhật hồ sơ doanh nghiệp thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Đổi mật khẩu Hội viên
app.post('/api/member/change-password', memberAuthMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Mật khẩu mới phải tối thiểu 8 ký tự.' });
    }

    const [rows] = await db.query('SELECT password_hash FROM members WHERE id = ?', [req.member.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });
    }

    const match = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!match) {
      return res.status(400).json({ success: false, error: 'Mật khẩu hiện tại (cũ) không chính xác.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE members SET password_hash = ? WHERE id = ?', [hash, req.member.id]);

    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Xem thông tin Dashboard và tin đăng của Hội viên
app.get('/api/member/dashboard', memberAuthMiddleware, async (req, res) => {
  try {
    const memberId = req.member.id;
    const [memberRows] = await db.query('SELECT * FROM members WHERE id = ?', [memberId]);
    if (!memberRows.length) return res.status(404).json({ success: false, error: 'Không tìm thấy dữ liệu hội viên.' });

    const [postRows] = await db.query(
      'SELECT id, title, type, status, views, created_at FROM posts WHERE member_id = ? ORDER BY created_at DESC',
      [memberId]
    );

    const [[viewsStats]] = await db.query('SELECT SUM(views) AS total_views FROM posts WHERE member_id = ?', [memberId]);

    res.json({
      success: true,
      member: memberRows[0],
      posts: postRows,
      stats: {
        total_posts: postRows.length,
        approved_posts: postRows.filter(p => p.status === 'approved').length,
        pending_posts: postRows.filter(p => p.status === 'pending').length,
        total_views: viewsStats.total_views || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Gửi yêu cầu nâng cấp gói hội viên
app.post('/api/member/upgrade', memberAuthMiddleware, async (req, res) => {
  const { tier } = req.body;
  if (!tier || !['Silver', 'Gold', 'Platinum'].includes(tier)) {
    return res.status(400).json({ success: false, error: 'Gói hội viên yêu cầu nâng cấp không hợp lệ.' });
  }

  try {
    const memberId = req.member.id;
    // Kiểm tra xem gói yêu cầu có cao hơn gói hiện tại không
    const [memberRows] = await db.query('SELECT tier FROM members WHERE id = ?', [memberId]);
    if (!memberRows.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thông tin hội viên.' });
    }

    const currentTier = memberRows[0].tier;
    const tierPriority = { Silver: 1, Gold: 2, Platinum: 3 };
    if (tierPriority[tier] <= tierPriority[currentTier]) {
      return res.status(400).json({ success: false, error: 'Gói yêu cầu nâng cấp phải cao hơn gói hiện tại của bạn.' });
    }

    await db.query('UPDATE members SET pending_tier_upgrade = ? WHERE id = ?', [tier, memberId]);
    res.json({ success: true, message: `Đã gửi yêu cầu nâng cấp lên gói ${tier} đang chờ admin phê duyệt.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// Lưu cấu hình và API key của AI Provider
app.post('/api/admin/save-config', authMiddleware, async (req, res) => {
  const { provider, model, apiKey, system_instruction } = req.body;
  if (!provider || !model) {
    return res.status(400).json({ error: 'Thiếu thông tin provider hoặc model.' });
  }

  try {
    // 1. Lưu provider/model/system_instruction vào bảng ai_config trong DB
    await db.query('DELETE FROM ai_config'); // chỉ lưu 1 dòng hoạt động duy nhất
    await db.query('INSERT INTO ai_config (provider, model, system_instruction, is_active) VALUES (?, ?, ?, 1)', [provider, model, system_instruction || null]);

    // 2. Nếu có nhập apiKey, lưu đè vào file config.json
    if (apiKey && apiKey !== '(key đã lưu)' && apiKey !== '**************************************' && apiKey.trim() !== '') {
      const configPath = path.join(__dirname, 'config.json');
      let cfg = {};
      if (fs.existsSync(configPath)) {
        try {
          cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch {}
      }
      cfg[provider + '_API_KEY'] = apiKey.trim();
      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
    }

    res.json({ success: true, message: 'Đã lưu cấu hình và API key thành công.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy cấu hình AI hiện tại
app.get('/api/admin/get-config', anyAuthMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT provider, model, system_instruction FROM ai_config WHERE is_active = 1 LIMIT 1');
    const config = rows[0] || { provider: 'anthropic', model: 'claude-sonnet-4-6', system_instruction: null };

    let hasKey = false;
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (cfg[config.provider + '_API_KEY']) {
          hasKey = true;
        }
      } catch {}
    }
    // Check fallback process.env
    if (!hasKey) {
      const key = getAPIKey(config.provider);
      if (key) hasKey = true;
    }

    res.json({ provider: config.provider, model: config.model, system_instruction: config.system_instruction || '', hasKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── QUẢN LÝ TÀI LIỆU KIẾN THỨC (KNOWLEDGE BASE) ────────────────────
const KB_DIR = path.join(__dirname, 'knowledge_base');

// Lấy danh sách tệp kiến thức
app.get('/api/admin/knowledge-files', authMiddleware, async (req, res) => {
  try {
    if (!fs.existsSync(KB_DIR)) {
      fs.mkdirSync(KB_DIR, { recursive: true });
    }
    const files = fs.readdirSync(KB_DIR);
    const list = files.map(file => {
      const stats = fs.statSync(path.join(KB_DIR, file));
      return {
        filename: file,
        size: stats.size,
        updated_at: stats.mtime
      };
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tải lên tài liệu kiến thức (nhận text)
app.post('/api/admin/upload-knowledge', authMiddleware, async (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) {
    return res.status(400).json({ error: 'Thiếu tên tệp hoặc nội dung.' });
  }

  // Chống ghi file ngoài thư mục (Directory Traversal)
  const safeFilename = path.basename(filename);
  const filepath = path.join(KB_DIR, safeFilename);

  try {
    fs.writeFileSync(filepath, content, 'utf8');
    res.json({ success: true, message: 'Đã lưu tài liệu kiến thức.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa tệp tài liệu kiến thức
app.delete('/api/admin/knowledge-file/:filename', authMiddleware, async (req, res) => {
  const filename = req.params.filename;
  const safeFilename = path.basename(filename);
  const filepath = path.join(KB_DIR, safeFilename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Không tìm thấy tài liệu kiến thức.' });
  }

  try {
    fs.unlinkSync(filepath);
    res.json({ success: true, message: 'Đã xóa tài liệu kiến thức thành công.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════
app.get('/api/health', async (req, res) => {
  let dbOk = false;
  try { await db.query('SELECT 1'); dbOk = true; } catch {}
  res.json({
    status   : 'ok',
    time     : new Date().toISOString(),
    database : dbOk ? 'connected' : 'error',
    providers: {
      anthropic  : !!process.env.ANTHROPIC_API_KEY,
      openai     : !!process.env.OPENAI_API_KEY,
      gemini     : !!process.env.GEMINI_API_KEY,
      deepseek   : !!process.env.DEEPSEEK_API_KEY,
      openrouter : !!process.env.OPENROUTER_API_KEY,
      ollama     : !!process.env.OLLAMA_BASE_URL,
    },
  });
});

// ════════════════════════════════════════════
// MEMBERS API
// ════════════════════════════════════════════

// Lấy danh sách hội viên
app.get('/api/members', async (req, res) => {
  try {
    await cleanupExpiredTiers();
    const { status, tier, industry, search, limit } = req.query;

    // Kiểm tra quyền truy cập nâng cao
    let isAuthenticated = false;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const [adminSess] = await db.query('SELECT id FROM admin_sessions WHERE token = ? AND expires_at > NOW()', [token]);
      if (adminSess.length) { isAuthenticated = true; }
      else {
        const [memberSess] = await db.query(
          `SELECT s.id FROM member_sessions s JOIN members m ON s.member_id = m.id WHERE s.token = ? AND s.expires_at > NOW() AND m.status = 'approved'`, [token]
        );
        if (memberSess.length) { isAuthenticated = true; }
      }
    }

    // Nếu muốn xem danh sách chưa duyệt/tất cả -> Chỉ cho phép admin đã xác thực
    if (status && status !== 'approved' && !isAuthenticated) {
      return res.status(401).json({ success: false, error: 'Cần quyền Admin để xem danh sách này.' });
    }

    let sql = 'SELECT * FROM members WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    } else if (!isAuthenticated) {
      // Mặc định công khai chỉ lấy các hội viên đã được duyệt
      sql += " AND status = 'approved'";
    }

    if (tier)     { sql += ' AND tier = ?';     params.push(tier); }
    if (industry) { sql += ' AND industry = ?'; params.push(industry); }
    if (search)   {
      sql += ' AND (name LIKE ? OR email LIKE ? OR tax_code LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    // Ưu tiên: 1. Hội viên ghim nổi bật (is_featured = 1) -> 2. Hạng gói cao (Platinum > Gold > Silver) -> 3. Mới nhất
    sql += `
      ORDER BY 
        is_featured DESC,
        CASE tier
          WHEN 'Platinum' THEN 1
          WHEN 'Gold' THEN 2
          WHEN 'Silver' THEN 3
          ELSE 4
        END ASC,
        created_at DESC
    `;

    if (limit && Number(limit) > 0) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
    }

    const [rows] = await db.query(sql, params);

    // Ẩn thông tin liên hệ nhạy cảm cho khách vãng lai
    const safeRows = isAuthenticated ? rows : rows.map(m => {
      const { email, phone, contact_name, contact_pos, password_hash, username, ...safe } = m;
      return { ...safe, email: '***@***.***', phone: '09** *** ***', contact_name: '***', contact_pos: '***' };
    });

    res.json({ success: true, data: safeRows, total: safeRows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy 1 hội viên
app.get('/api/members/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM members WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Không tìm thấy hội viên.' });

    const m = rows[0];

    // Nếu hội viên chưa được duyệt, chỉ cho phép admin đã đăng nhập xem
    if (m.status !== 'approved') {
      const authHeader = req.headers['authorization'];
      let isAdmin = false;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const [sessions] = await db.query('SELECT id FROM admin_sessions WHERE token = ? AND expires_at > NOW()', [token]);
        if (sessions.length) isAdmin = true;
      }
      if (!isAdmin) {
        return res.status(401).json({ success: false, error: 'Chưa đăng ký hoặc không có quyền xem thông tin này.' });
      }
    }

    // Kiểm tra xem người gọi có đăng nhập hội viên/admin hay không để ẩn thông tin liên hệ
    let isAuthenticated = false;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const [adminSess] = await db.query('SELECT id FROM admin_sessions WHERE token = ? AND expires_at > NOW()', [token]);
      if (adminSess.length) {
        isAuthenticated = true;
      } else {
        const [memberSess] = await db.query(
          `SELECT s.id FROM member_sessions s JOIN members m ON s.member_id = m.id WHERE s.token = ? AND s.expires_at > NOW() AND m.status = 'approved'`,
          [token]
        );
        if (memberSess.length) {
          isAuthenticated = true;
        }
      }
    }

    if (!isAuthenticated) {
      // Ẩn thông tin liên hệ nhạy cảm của hội viên đối với khách vãng lai
      m.email = m.email ? '***@***.***' : null;
      m.phone = '09** *** ***';
      m.contact_name = '***';
      m.contact_pos = '***';
    }

    res.json({ success: true, data: m });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Đăng ký hội viên mới
app.post('/api/members', async (req, res) => {
  try {
    const {
      name, tax_code, license, industry, size, address, city, website, social,
      description, tier, contact_name, contact_pos, email, phone, preferred_login, goal, referral, password
    } = req.body;

    const cleanEmail = (email && email.trim()) ? email.trim() : null;
    const cleanPhone = (phone && phone.trim()) ? phone.trim() : null;
    
    // Mặc định ưu tiên Email làm tài khoản đăng nhập nếu có nhập Email, trừ khi người dùng chọn Phone
    let loginCredential = cleanEmail || cleanPhone;
    if (preferred_login === 'phone' && cleanPhone) {
      loginCredential = cleanPhone;
    } else if (cleanEmail) {
      loginCredential = cleanEmail;
    }

    if (!name || !loginCredential) {
      return res.status(400).json({ success: false, error: 'Thiếu tên doanh nghiệp hoặc tài khoản đăng nhập (Email / SĐT).' });
    }

    // Kiểm tra trùng lặp Email nếu có nhập email
    if (cleanEmail) {
      const [existingEmail] = await db.query('SELECT id FROM members WHERE email = ? OR username = ?', [cleanEmail, cleanEmail]);
      if (existingEmail.length) return res.status(409).json({ success: false, error: 'Email này đã được đăng ký cho tài khoản khác.' });
    }

    // Kiểm tra trùng lặp Tên đăng nhập (Username / Phone)
    if (loginCredential) {
      const [existingUser] = await db.query('SELECT id FROM members WHERE username = ? OR (phone = ? AND phone IS NOT NULL AND phone != "")', [loginCredential, loginCredential]);
      if (existingUser.length) return res.status(409).json({ success: false, error: 'Tài khoản đăng nhập hoặc Số điện thoại này đã được đăng ký.' });
    }

    let hash = null;
    if (password && password.trim() !== '') {
      hash = await bcrypt.hash(password, 10);
    }

    const [result] = await db.query(
      `INSERT INTO members (name, tax_code, license, industry, size, address, city, website, social,
        description, tier, status, contact_name, contact_pos, email, username, password_hash, phone, goal, referral)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending',?,?,?,?,?,?,?,?)`,
      [name, tax_code, license, industry, size, address, city || null, website, social,
       description, tier || 'Silver', contact_name, contact_pos, cleanEmail, loginCredential, hash, cleanPhone, goal, referral]
    );

    // Gửi email thông báo đăng ký (nếu có nhập email)
    if (transporter && cleanEmail) {
      const mailOptions = {
        from: brandConfig.email.fromAddress,
        to: cleanEmail,
        bcc: process.env.SMTP_BCC || undefined,
        subject: `[${brandConfig.brandShortName}] Đăng ký tài khoản thành công`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1E88E5; border-bottom: 2px solid #1E88E5; padding-bottom: 10px;">Gia nhập Hệ sinh thái ${brandConfig.brandName} thành công!</h2>
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Cảm ơn doanh nghiệp của bạn đã đăng ký tài khoản hội viên trên nền tảng kết nối <strong>${brandConfig.brandName}</strong>.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h4 style="margin-top: 0; color: #333;">Thông tin đăng ký của bạn:</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: #666; width: 150px;"><strong>Doanh nghiệp:</strong></td>
                  <td style="padding: 4px 0; color: #333;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #666;"><strong>Tài khoản đăng nhập:</strong></td>
                  <td style="padding: 4px 0; color: #333;">${loginCredential}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #666;"><strong>Gói hội viên:</strong></td>
                  <td style="padding: 4px 0; color: #333;">${tier || 'Silver'}</td>
                </tr>
              </table>
            </div>
            <p>Hồ sơ đăng ký của bạn hiện đang ở trạng thái <strong>Chờ duyệt (Pending)</strong>. Ban quản trị sẽ nhanh chóng kiểm tra thông tin và phê duyệt tài khoản của bạn trong thời gian sớm nhất.</p>
            <p>Khi hồ sơ được phê duyệt, bạn sẽ nhận được thông báo tiếp theo và có thể đăng nhập để sử dụng đầy đủ các tính năng giao thương và trợ lý AI.</p>
            <p style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 15px; font-size: 12px; color: #999;">Đây là email tự động từ hệ thống ${brandConfig.brandName}. Vui lòng không trả lời thư này.</p>
          </div>
        `
      };
      transporter.sendMail(mailOptions, (mailErr, info) => {
        if (mailErr) {
          console.error("❌ Lỗi gửi email đăng ký:", mailErr);
        } else {
          console.log("✅ Đã gửi email xác nhận đăng ký thành công:", info.response);
        }
      });
    }

    res.json({ success: true, id: result.insertId, message: 'Đăng ký thành công! Chờ admin xét duyệt.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Duyệt hội viên
app.patch('/api/members/:id/approve', authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.id;
    const [rows] = await db.query('SELECT tier FROM members WHERE id = ?', [memberId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hội viên.' });
    }

    const memberTier = rows[0].tier;
    if (memberTier === 'Gold' || memberTier === 'Platinum') {
      await db.query("UPDATE members SET status='approved', tier_expires_at = DATE_ADD(NOW(), INTERVAL 1 YEAR) WHERE id=?", [memberId]);
    } else {
      await db.query("UPDATE members SET status='approved', tier_expires_at = NULL WHERE id=?", [memberId]);
    }

    res.json({ success: true, message: 'Đã duyệt hội viên.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Từ chối hội viên
app.patch('/api/members/:id/reject', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    await db.query("UPDATE members SET status='rejected', reject_reason=? WHERE id=?", [reason || '', req.params.id]);
    res.json({ success: true, message: 'Đã từ chối hội viên.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Duyệt yêu cầu nâng cấp gói hội viên
app.patch('/api/admin/members/:id/approve-upgrade', authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.id;
    const [rows] = await db.query('SELECT pending_tier_upgrade FROM members WHERE id = ?', [memberId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thông tin hội viên.' });
    }

    const pendingUpgrade = rows[0].pending_tier_upgrade;
    if (!pendingUpgrade) {
      return res.status(400).json({ success: false, error: 'Hội viên này không có yêu cầu nâng cấp gói nào đang chờ phê duyệt.' });
    }

    // Thời hạn gói là 1 năm từ ngày phê duyệt
    await db.query(
      `UPDATE members SET 
        tier = ?, 
        tier_expires_at = DATE_ADD(NOW(), INTERVAL 1 YEAR), 
        pending_tier_upgrade = NULL 
       WHERE id = ?`,
      [pendingUpgrade, memberId]
    );

    res.json({ success: true, message: `Phê duyệt nâng cấp hội viên lên gói ${pendingUpgrade} thành công.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Từ chối yêu cầu nâng cấp gói hội viên
app.patch('/api/admin/members/:id/reject-upgrade', authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.id;
    await db.query('UPDATE members SET pending_tier_upgrade = NULL WHERE id = ?', [memberId]);
    res.json({ success: true, message: 'Đã từ chối và hủy bỏ yêu cầu nâng cấp gói.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Khóa tài khoản hội viên
app.patch('/api/admin/members/:id/lock', authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.id;
    await db.query("UPDATE members SET status='suspended' WHERE id=?", [memberId]);
    res.json({ success: true, message: 'Đã tạm khóa tài khoản hội viên.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mở khóa tài khoản hội viên
app.patch('/api/admin/members/:id/unlock', authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.id;
    await db.query("UPDATE members SET status='approved' WHERE id=?", [memberId]);
    res.json({ success: true, message: 'Đã mở khóa tài khoản hội viên.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Thay đổi cấp hạng và thời hạn hội viên linh hoạt (Admin)
app.patch('/api/admin/members/:id/tier', authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.id;
    const { tier, tier_expires_at } = req.body;

    if (!['Silver', 'Gold', 'Platinum'].includes(tier)) {
      return res.status(400).json({ success: false, error: 'Hạng thành viên không hợp lệ.' });
    }

    const expiration = (tier === 'Silver' || !tier_expires_at) ? null : tier_expires_at;

    await db.query(
      "UPDATE members SET tier = ?, tier_expires_at = ?, pending_tier_upgrade = NULL WHERE id = ?",
      [tier, expiration, memberId]
    );

    res.json({ success: true, message: `Đã cập nhật thành viên thành gói ${tier} thành công.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ghim/bỏ ghim nổi bật hội viên (Admin)
app.patch('/api/admin/members/:id/featured', authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.id;
    const { is_featured } = req.body; // 0 hoặc 1

    if (is_featured) {
      // Giới hạn tối đa 3 hội viên nổi bật
      const [existing] = await db.query("SELECT id FROM members WHERE is_featured = 1 AND status = 'approved'");
      if (existing.length >= 3) {
        return res.status(400).json({ success: false, error: 'Đã có tối đa 3 hội viên nổi bật được ghim. Vui lòng bỏ ghim bớt trước khi ghim thêm.' });
      }
    }

    await db.query("UPDATE members SET is_featured = ? WHERE id = ?", [is_featured ? 1 : 0, memberId]);
    res.json({ success: true, message: is_featured ? 'Đã ghim hội viên nổi bật.' : 'Đã bỏ ghim hội viên nổi bật.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Xóa vĩnh viễn tài khoản hội viên
app.delete('/api/admin/members/:id', authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.id;
    // Xóa chat logs liên quan
    await db.query("DELETE FROM chat_logs WHERE member_id=?", [memberId]);
    // Xóa hội viên (các bảng posts, member_sessions tự động CASCADE)
    await db.query("DELETE FROM members WHERE id=?", [memberId]);
    res.json({ success: true, message: 'Đã xóa vĩnh viễn tài khoản hội viên.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════
// POSTS API
// ════════════════════════════════════════════

// Lấy danh sách bài viết (Truy vấn tối ưu hóa hiệu năng cao)
app.get('/api/posts', async (req, res) => {
  try {
    const { status, member_id, search, category, sub_category } = req.query;

    // Kiểm tra quyền truy cập
    let isAuthenticated = false;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const [adminSess] = await db.query('SELECT id FROM admin_sessions WHERE token = ? AND expires_at > NOW()', [token]);
      if (adminSess.length) { isAuthenticated = true; }
      else {
        const [memberSess] = await db.query(
          `SELECT s.id FROM member_sessions s JOIN members m ON s.member_id = m.id WHERE s.token = ? AND s.expires_at > NOW() AND m.status = 'approved'`, [token]
        );
        if (memberSess.length) { isAuthenticated = true; }
        else {
          const [creatorSess] = await db.query(
            `SELECT s.id FROM creator_sessions s JOIN content_creators c ON s.creator_id = c.id WHERE s.token = ? AND s.expires_at > NOW()`, [token]
          );
          if (creatorSess.length) { isAuthenticated = true; }
        }
      }
    }

    let sql = `SELECT p.*, COALESCE(c.name, m.name, p.author_name, 'Ban Biên tập DoanhNghiepVN.today') AS company_name, COALESCE(m.tier, 'Standard') AS company_tier
               FROM posts p 
               LEFT JOIN members m ON p.member_id = m.id 
               LEFT JOIN content_creators c ON p.creator_id = c.id
               WHERE 1=1`;
    const params = [];

    // Bộ lọc trạng thái bài viết
    if (status && status === 'all') {
      // Lấy tất cả trạng thái (dành cho trang chủ hiển thị chuyên đề AI hoặc admin)
    } else if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    } else if (!isAuthenticated) {
      // Mặc định công khai: lấy bài đã duyệt
      sql += " AND (p.status = 'approved' OR p.status = 'pending')";
    }

    if (member_id)    { sql += ' AND p.member_id = ?';    params.push(member_id); }
    if (category) {
      if (category.includes('Làm chủ AI') || category.includes('AI')) {
        sql += ' AND (p.category LIKE "%Làm chủ AI%" OR p.category LIKE "%AI%")';
      } else {
        sql += ' AND p.category = ?';
        params.push(category);
      }
    }
    if (sub_category) {
      sql += ' AND (p.sub_category = ? OR p.sub_category LIKE ?)';
      params.push(sub_category, `%${sub_category}%`);
    }
    if (search)       { 
      sql += ' AND (p.title LIKE ? OR p.summary LIKE ? OR p.body LIKE ?)'; 
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    // Sắp xếp: Ưu tiên bài nổi bật trước, sau đó tới bài mới nhất
    sql += ' ORDER BY p.is_featured DESC, p.created_at DESC';

    const { limit } = req.query;
    if (limit && Number(limit) > 0) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
    }

    const [rows] = await db.query(sql, params);

    // Ẩn contact_info cho khách vãng lai — chỉ trả về thông tin thật khi đã xác thực
    const safeRows = isAuthenticated ? rows : rows.map(p => ({
      ...p,
      contact_info: p.contact_info ? 'Đăng nhập hội viên để xem thông tin liên hệ' : ''
    }));

    res.json({ success: true, count: safeRows.length, data: safeRows, total: safeRows.length });
  } catch (err) {
    console.error('Lỗi tải bài viết GET /api/posts:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Đăng bài mới — yêu cầu hội viên đã được duyệt
app.post('/api/posts', memberAuthMiddleware, async (req, res) => {
  try {
    if (req.member.status !== 'approved') {
      return res.status(403).json({ success: false, error: 'Hồ sơ hội viên chưa được phê duyệt. Vui lòng chờ admin duyệt trước khi đăng tin.' });
    }

    // Kiểm tra giới hạn số bài đăng trong tháng theo tier
    const tierLimit = TIER_LIMITS[req.member.tier] || TIER_LIMITS.Silver;
    if (tierLimit.posts_per_month !== Infinity) {
      const [[countRow]] = await db.query(
        `SELECT COUNT(*) AS cnt FROM posts WHERE member_id = ? AND YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())`,
        [req.member.id]
      );
      if (countRow.cnt >= tierLimit.posts_per_month) {
        return res.status(429).json({
          success: false,
          error: `Gói ${req.member.tier} chỉ được đăng tối đa ${tierLimit.posts_per_month} bài/tháng. Nâng cấp gói để đăng thêm.`
        });
      }
    }

    const { title, summary, body, type, category, sub_category, source_url, tags, contact_info, deadline, image_url, isDraft, featured_requested } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Tiêu đề bài đăng không được trống.' });
    if (!category) return res.status(400).json({ success: false, error: 'Vui lòng chọn Chuyên mục cho bài viết.' });
    if (!sub_category) return res.status(400).json({ success: false, error: 'Vui lòng chọn Lĩnh vực cho bài viết.' });

    // Chỉ hội viên Platinum mới được phép gửi yêu cầu ghim bài nổi bật ngoài trang chủ
    const isPlatinum = req.member.tier === 'Platinum';
    const isFeaturedRequested = isPlatinum ? (featured_requested ? 1 : 0) : 0;

    const finalStatus = isDraft ? 'draft' : 'pending';
    const slug = await generateUniquePostSlug(title);

    const [result] = await db.query(
      `INSERT INTO posts (member_id, title, slug, summary, body, type, category, sub_category, source_url, tags, contact_info, deadline, image_url, status, featured_requested)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.member.id, title, slug, summary, body, type || 'Tin chung', category, sub_category, source_url || null, JSON.stringify(tags || []), contact_info, deadline || null, image_url || null, finalStatus, isFeaturedRequested]
    );
    res.json({ success: true, id: result.insertId, slug, message: isDraft ? 'Đã lưu bản nháp.' : 'Bài viết đã gửi để admin duyệt.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy chi tiết 1 bài đăng (hỗ trợ truy vấn theo ID hoặc Slug)
app.get('/api/posts/:id', async (req, res) => {
  try {
    const identifier = req.params.id;
    const isNumeric = /^\d+$/.test(identifier);

    // Tự động tăng lượt xem thêm 1
    if (isNumeric) {
      await db.query("UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE id = ?", [identifier]);
    } else {
      await db.query("UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE slug = ?", [identifier]);
    }

    const [rows] = await db.query(
      `SELECT p.*, 
              COALESCE(c.name, m.name, 'Ban Biên tập Đồ Sơn Today') AS company_name, 
              COALESCE(m.tier, 'Standard') AS company_tier 
       FROM posts p 
       LEFT JOIN members m ON p.member_id = m.id 
       LEFT JOIN content_creators c ON p.creator_id = c.id
       WHERE p.id = ? OR p.slug = ?`,
      [identifier, identifier]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Chỉnh sửa bài đăng — chỉ cho phép chính chủ sở hữu bài đăng chỉnh sửa
app.put('/api/posts/:id', memberAuthMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const memberId = req.member.id;

    // Kiểm tra xem bài đăng có thuộc về hội viên này không
    const [posts] = await db.query('SELECT member_id, status FROM posts WHERE id = ?', [postId]);
    if (!posts.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài đăng.' });
    }
    if (posts[0].member_id !== memberId) {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền chỉnh sửa bài đăng này.' });
    }

    const { title, summary, body, type, category, sub_category, source_url, tags, contact_info, deadline, image_url, isDraft, featured_requested } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Tiêu đề bài đăng không được trống.' });
    if (!category) return res.status(400).json({ success: false, error: 'Vui lòng chọn Chuyên mục cho bài viết.' });
    if (!sub_category) return res.status(400).json({ success: false, error: 'Vui lòng chọn Lĩnh vực cho bài viết.' });

    // Chỉ hội viên Platinum mới được phép gửi yêu cầu ghim bài nổi bật ngoài trang chủ
    const isPlatinum = req.member.tier === 'Platinum';
    const isFeaturedRequested = isPlatinum ? (featured_requested ? 1 : 0) : 0;

    // Trạng thái sau chỉnh sửa: lưu nháp -> 'draft', đăng tin -> 'pending' (yêu cầu duyệt lại)
    const finalStatus = isDraft ? 'draft' : 'pending';
    const slug = await generateUniquePostSlug(title, postId);

    await db.query(
      `UPDATE posts SET 
        title = ?, slug = ?, summary = ?, body = ?, type = ?, category = ?, sub_category = ?, source_url = ?,
        tags = ?, contact_info = ?, deadline = ?, image_url = ?, status = ?,
        featured_requested = ?
       WHERE id = ?`,
      [
        title, slug, summary || '', body || '', type || 'Tin chung', category || '', sub_category || '', source_url || null,
        JSON.stringify(tags || []), contact_info || '', deadline || null, image_url || null, 
        finalStatus, isFeaturedRequested, postId
      ]
    );

    res.json({ success: true, slug, message: 'Cập nhật bài viết thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════
// CONTENT CREATOR API ENDPOINTS
// ════════════════════════════════════════════

// 1. Biên tập viên Đăng nhập
app.post('/api/creator/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM content_creators WHERE username = ?', [username]);
    if (!rows.length) {
      return res.status(401).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }
    const creator = rows[0];
    const match = await bcrypt.compare(password, creator.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

    await db.query(
      'INSERT INTO creator_sessions (creator_id, token, expires_at) VALUES (?, ?, ?)',
      [creator.id, token, expiresAt]
    );

    res.json({
      success: true,
      token,
      role: 'creator',
      creator: {
        id: creator.id,
        name: creator.name,
        username: creator.username,
        requires_approval: Number(creator.requires_approval)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy thông tin profile Biên tập viên (Profile check auth)
app.get(['/api/creator/profile', '/api/creator/check-auth'], creatorAuthMiddleware, async (req, res) => {
  res.json({
    success: true,
    creator: req.creator
  });
});

// Biên tập viên Đăng xuất
app.post('/api/creator/logout', creatorAuthMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM creator_sessions WHERE token = ?', [req.creator.token]);
    res.json({ success: true, message: 'Đã đăng xuất tài khoản Biên tập viên.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Admin: Lấy danh sách Biên tập viên
app.get('/api/admin/creators', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.id, c.name, c.username, c.requires_approval, c.created_at,
             COUNT(p.id) AS post_count
      FROM content_creators c
      LEFT JOIN posts p ON p.creator_id = c.id
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Thêm Biên tập viên mới
app.post('/api/admin/creators', authMiddleware, async (req, res) => {
  const { name, username, password, requires_approval } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ Tên, Tên đăng nhập và Mật khẩu.' });
  }
  try {
    const [existing] = await db.query('SELECT id FROM content_creators WHERE username = ?', [username]);
    if (existing.length) {
      return res.status(400).json({ success: false, error: 'Tên đăng nhập này đã được sử dụng.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const approvalFlag = (requires_approval === 0 || requires_approval === false || requires_approval === '0') ? 0 : 1;

    const [result] = await db.query(
      'INSERT INTO content_creators (name, username, password_hash, requires_approval) VALUES (?, ?, ?, ?)',
      [name, username, hash, approvalFlag]
    );

    res.json({ success: true, id: result.insertId, message: 'Thêm tài khoản Biên tập viên thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Chỉnh sửa tài khoản Biên tập viên
app.put('/api/admin/creators/:id', authMiddleware, async (req, res) => {
  const { name, username, password, requires_approval } = req.body;
  const creatorId = req.params.id;
  if (!name || !username) {
    return res.status(400).json({ success: false, error: 'Vui lòng điền Tên và Tên đăng nhập.' });
  }
  try {
    const [existing] = await db.query('SELECT id FROM content_creators WHERE username = ? AND id != ?', [username, creatorId]);
    if (existing.length) {
      return res.status(400).json({ success: false, error: 'Tên đăng nhập này đã được tài khoản khác sử dụng.' });
    }

    const approvalFlag = (requires_approval === 0 || requires_approval === false || requires_approval === '0') ? 0 : 1;

    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE content_creators SET name = ?, username = ?, password_hash = ?, requires_approval = ? WHERE id = ?',
        [name, username, hash, approvalFlag, creatorId]
      );
    } else {
      await db.query(
        'UPDATE content_creators SET name = ?, username = ?, requires_approval = ? WHERE id = ?',
        [name, username, approvalFlag, creatorId]
      );
    }

    res.json({ success: true, message: 'Cập nhật tài khoản Biên tập viên thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Xóa Biên tập viên
app.delete('/api/admin/creators/:id', authMiddleware, async (req, res) => {
  try {
    const creatorId = req.params.id;
    await db.query('DELETE FROM content_creators WHERE id = ?', [creatorId]);
    res.json({ success: true, message: 'Đã xóa tài khoản Biên tập viên.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Creator Posts Management API
app.get('/api/creator/posts', creatorAuthMiddleware, async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const [posts] = await db.query(
      `SELECT p.*, c.name AS author_name
       FROM posts p 
       LEFT JOIN content_creators c ON p.creator_id = c.id
       WHERE p.creator_id = ?
       ORDER BY p.id DESC`,
      [creatorId]
    );

    const totalPosts = posts.length;
    const approvedPosts = posts.filter(p => p.status === 'approved').length;
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

    res.json({
      success: true,
      creator: req.creator,
      data: posts,
      stats: { totalPosts, approvedPosts, totalViews }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/creator/posts', creatorAuthMiddleware, async (req, res) => {
  try {
    const { title, summary, body, type, category, sub_category, source_url, tags, contact_info, deadline, image_url, isDraft } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Tiêu đề bài đăng không được trống.' });
    if (!category) return res.status(400).json({ success: false, error: 'Vui lòng chọn Chuyên mục cho bài viết.' });
    if (!sub_category) return res.status(400).json({ success: false, error: 'Vui lòng chọn Lĩnh vực cho bài viết.' });

    let finalStatus = 'pending';
    if (isDraft) {
      finalStatus = 'draft';
    } else if (Number(req.creator.requires_approval) === 0) {
      finalStatus = 'approved';
    }

    const slug = await generateUniquePostSlug(title);

    const [result] = await db.query(
      `INSERT INTO posts (creator_id, member_id, title, slug, summary, body, type, category, sub_category, source_url, tags, contact_info, deadline, image_url, status, featured_requested)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.creator.id, title, slug, summary || '', body || '', type || 'Tin chung', category, sub_category, source_url || null, JSON.stringify(tags || []), contact_info || req.creator.name, deadline || null, image_url || null, finalStatus, 0]
    );

    const successMsg = isDraft 
      ? 'Đã lưu bản nháp.' 
      : (finalStatus === 'approved' ? 'Bài viết đã xuất bản thành công!' : 'Bài viết đã gửi để admin duyệt.');

    res.json({ success: true, id: result.insertId, slug, status: finalStatus, message: successMsg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/creator/posts/:id', creatorAuthMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const creatorId = req.creator.id;

    const [existing] = await db.query('SELECT creator_id, status FROM posts WHERE id = ?', [postId]);
    if (!existing.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết.' });
    }
    if (existing[0].creator_id !== creatorId) {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền chỉnh sửa bài viết này.' });
    }

    const { title, summary, body, type, category, sub_category, source_url, tags, contact_info, deadline, image_url, isDraft } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Tiêu đề bài đăng không được trống.' });

    let finalStatus = 'pending';
    if (isDraft) {
      finalStatus = 'draft';
    } else if (Number(req.creator.requires_approval) === 0) {
      finalStatus = 'approved';
    }

    const slug = await generateUniquePostSlug(title, postId);

    await db.query(
      `UPDATE posts SET 
        title = ?, slug = ?, summary = ?, body = ?, type = ?, category = ?, sub_category = ?, source_url = ?,
        tags = ?, contact_info = ?, deadline = ?, image_url = ?, status = ?
       WHERE id = ?`,
      [
        title, slug, summary || '', body || '', type || 'Tin chung', category || '', sub_category || '', source_url || null,
        JSON.stringify(tags || []), contact_info || req.creator.name, deadline || null, image_url || null, 
        finalStatus, postId
      ]
    );

    res.json({ success: true, slug, status: finalStatus, message: 'Cập nhật bài viết thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/creator/posts/:id', creatorAuthMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const creatorId = req.creator.id;
    const [existing] = await db.query('SELECT creator_id FROM posts WHERE id = ?', [postId]);
    if (!existing.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết.' });
    }
    if (existing[0].creator_id !== creatorId) {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa bài viết này.' });
    }
    await db.query('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ success: true, message: 'Đã xóa bài viết thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════
// EVENT ORGANIZER (BAN TỔ CHỨC) API ENDPOINTS
// ════════════════════════════════════════════

// 1. Ban tổ chức: Profile / Check auth
app.get(['/api/organizer/profile', '/api/organizer/check-auth'], organizerAuthMiddleware, async (req, res) => {
  res.json({
    success: true,
    organizer: req.organizer
  });
});

// Ban tổ chức: Đăng xuất
app.post('/api/organizer/logout', organizerAuthMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM organizer_sessions WHERE token = ?', [req.organizer.token]);
    res.json({ success: true, message: 'Đã đăng xuất tài khoản Ban tổ chức.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Admin: Danh sách tài khoản Ban tổ chức
app.get('/api/admin/organizers', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.id, o.name, o.username, o.phone, o.email, o.status, o.created_at, o.updated_at
      FROM event_organizers o
      ORDER BY o.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Thêm tài khoản Ban tổ chức mới
app.post('/api/admin/organizers', authMiddleware, async (req, res) => {
  const { name, username, password, phone, email, status } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ Tên, Tên đăng nhập và Mật khẩu.' });
  }
  try {
    const [existing] = await db.query('SELECT id FROM event_organizers WHERE username = ?', [username]);
    if (existing.length) {
      return res.status(400).json({ success: false, error: 'Tên đăng nhập này đã được sử dụng.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const orgStatus = status === 'inactive' ? 'inactive' : 'active';

    const [result] = await db.query(
      'INSERT INTO event_organizers (name, username, password_hash, phone, email, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), username.trim(), hash, phone ? phone.trim() : null, email ? email.trim() : null, orgStatus]
    );

    res.json({ success: true, id: result.insertId, message: 'Thêm tài khoản Ban tổ chức thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Cập nhật tài khoản Ban tổ chức
app.put('/api/admin/organizers/:id', authMiddleware, async (req, res) => {
  const { name, username, password, phone, email, status } = req.body;
  const organizerId = req.params.id;

  if (!name || !username) {
    return res.status(400).json({ success: false, error: 'Tên và Tên đăng nhập không được để trống.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM event_organizers WHERE username = ? AND id != ?', [username, organizerId]);
    if (existing.length) {
      return res.status(400).json({ success: false, error: 'Tên đăng nhập này đã được tài khoản khác sử dụng.' });
    }

    const orgStatus = status === 'inactive' ? 'inactive' : 'active';

    if (password && password.trim()) {
      const hash = await bcrypt.hash(password.trim(), 10);
      await db.query(
        'UPDATE event_organizers SET name = ?, username = ?, password_hash = ?, phone = ?, email = ?, status = ? WHERE id = ?',
        [name.trim(), username.trim(), hash, phone ? phone.trim() : null, email ? email.trim() : null, orgStatus, organizerId]
      );
    } else {
      await db.query(
        'UPDATE event_organizers SET name = ?, username = ?, phone = ?, email = ?, status = ? WHERE id = ?',
        [name.trim(), username.trim(), phone ? phone.trim() : null, email ? email.trim() : null, orgStatus, organizerId]
      );
    }

    res.json({ success: true, message: 'Cập nhật tài khoản Ban tổ chức thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Xóa tài khoản Ban tổ chức
app.delete('/api/admin/organizers/:id', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM event_organizers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa tài khoản Ban tổ chức.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════
// SEO ENDPOINTS (Sitemap.xml & Robots.txt)
// ════════════════════════════════════════════
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.SITE_URL || 'https://doanhnghiepvn.today';
    const staticPages = ['', '/posts', '/members', '/events', '/guide', '/register'];

    const [approvedPosts] = await db.query(
      "SELECT id, slug, updated_at, created_at FROM posts WHERE status = 'approved' ORDER BY updated_at DESC"
    );

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    }

    for (const p of approvedPosts) {
      const lastMod = (p.updated_at || p.created_at || new Date()).toISOString().split('T')[0];
      const postSlug = p.slug || p.id;
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/posts/${postSlug}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});

app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.SITE_URL || 'https://doanhnghiepvn.today';
  const content = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
  res.header('Content-Type', 'text/plain');
  res.send(content);
});

// Hội viên tự xóa bài đăng của mình (Member)
app.delete('/api/posts/:id', memberAuthMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const memberId = req.member.id;

    // Xác minh quyền sở hữu bài đăng
    const [posts] = await db.query("SELECT id FROM posts WHERE id = ? AND member_id = ?", [postId, memberId]);
    if (posts.length === 0) {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa bài viết này.' });
    }

    await db.query("DELETE FROM posts WHERE id = ?", [postId]);
    res.json({ success: true, message: 'Đã xóa bài viết thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upload tệp tin ảnh dạng Base64 (Hỗ trợ Member, Admin, Creator)
app.post('/api/upload', anyAuthMiddleware, async (req, res) => {
  try {
    const { fileName, fileType, base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ success: false, error: 'Thiếu dữ liệu tệp tin.' });
    }

    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const ext = path.extname(fileName) || '.jpg';
    const uniqueName = crypto.randomBytes(16).toString('hex') + ext;
    const filePath = path.join(uploadDir, uniqueName);

    fs.writeFileSync(filePath, buffer);

    res.json({
      success: true,
      url: `/uploads/${uniqueName}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Lỗi tải tệp: ' + err.message });
  }
});

// Duyệt bài viết
app.patch('/api/posts/:id/approve', authMiddleware, async (req, res) => {
  try {
    await db.query("UPDATE posts SET status='approved', published_at=NOW() WHERE id=?", [req.params.id]);
    res.json({ success: true, message: 'Đã xuất bản bài viết.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Từ chối bài viết
app.patch('/api/posts/:id/reject', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    await db.query("UPDATE posts SET status='rejected', reject_reason=? WHERE id=?", [reason || '', req.params.id]);
    res.json({ success: true, message: 'Đã từ chối bài viết.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ghim/bỏ ghim nổi bật bài viết (Admin)
app.patch('/api/posts/:id/featured', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const { is_featured } = req.body; // 0 hoặc 1

    if (is_featured) {
      // Giới hạn tối đa 3 bài viết nổi bật
      const [existing] = await db.query("SELECT id FROM posts WHERE is_featured = 1 AND status = 'approved'");
      if (existing.length >= 3) {
        return res.status(400).json({ success: false, error: 'Đã có tối đa 3 bài viết nổi bật được ghim. Vui lòng bỏ ghim bớt trước khi ghim thêm.' });
      }
    }

    await db.query("UPDATE posts SET is_featured = ? WHERE id = ?", [is_featured ? 1 : 0, postId]);
    res.json({ success: true, message: is_featured ? 'Đã ghim bài viết nổi bật.' : 'Đã bỏ ghim bài viết nổi bật.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Xóa bài viết vĩnh viễn (Admin)
app.delete('/api/admin/posts/:id', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    await db.query("DELETE FROM posts WHERE id = ?", [postId]);
    res.json({ success: true, message: 'Đã xóa bài viết vĩnh viễn.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════
// CATEGORIES & SUB-CATEGORIES API
// ════════════════════════════════════════════

// Public API: Lấy danh sách Chuyên mục & Lĩnh vực đang hoạt động (active)
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await db.query(
      "SELECT * FROM categories WHERE status = 'active' ORDER BY order_index ASC, id ASC"
    );

    const [subCategories] = await db.query(
      "SELECT * FROM sub_categories WHERE status = 'active' ORDER BY order_index ASC, id ASC"
    );

    const data = categories.map(cat => {
      const subs = subCategories.filter(sub => sub.category_id === cat.id);
      return {
        id: cat.id,
        name: cat.name,
        name_en: cat.name_en,
        slug: cat.slug,
        order_index: cat.order_index,
        status: cat.status,
        subcategories: subs.map(sub => sub.name),
        sub_categories: subs,
        sub_objects: subs
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin API: Lấy tất cả Chuyên mục & Lĩnh vực (gồm cả active và inactive)
app.get('/api/admin/categories', authMiddleware, async (req, res) => {
  try {
    const [categories] = await db.query(
      "SELECT * FROM categories ORDER BY order_index ASC, id ASC"
    );

    const [subCategories] = await db.query(
      "SELECT * FROM sub_categories ORDER BY order_index ASC, id ASC"
    );

    const data = categories.map(cat => ({
      ...cat,
      subcategories: subCategories.filter(sub => sub.category_id === cat.id)
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin API: Thêm Chuyên mục mới
app.post('/api/admin/categories', authMiddleware, async (req, res) => {
  try {
    const { name, name_en, order_index, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Tên chuyên mục không được trống.' });
    }

    const slug = await generateUniqueCategorySlug(name.trim());
    const [result] = await db.query(
      'INSERT INTO categories (name, name_en, slug, order_index, status) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), name_en ? name_en.trim() : null, slug, parseInt(order_index) || 0, status === 'inactive' ? 'inactive' : 'active']
    );

    res.json({ success: true, id: result.insertId, message: 'Thêm Chuyên mục thành công.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Chuyên mục này đã tồn tại.' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin API: Cập nhật Chuyên mục
app.put('/api/admin/categories/:id', authMiddleware, async (req, res) => {
  try {
    const { name, name_en, order_index, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Tên chuyên mục không được trống.' });
    }

    const slug = await generateUniqueCategorySlug(name.trim(), req.params.id);
    await db.query(
      'UPDATE categories SET name = ?, name_en = ?, slug = ?, order_index = ?, status = ? WHERE id = ?',
      [name.trim(), name_en ? name_en.trim() : null, slug, parseInt(order_index) || 0, status === 'inactive' ? 'inactive' : 'active', req.params.id]
    );

    res.json({ success: true, message: 'Cập nhật Chuyên mục thành công.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Tên chuyên mục bị trùng với chuyên mục khác.' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin API: Đổi trạng thái (Tạm khóa / Kích hoạt) Chuyên mục
app.patch('/api/admin/categories/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const newStatus = status === 'inactive' ? 'inactive' : 'active';
    await db.query('UPDATE categories SET status = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({ success: true, message: `Đã ${newStatus === 'active' ? 'kích hoạt' : 'tạm khóa'} Chuyên mục.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin API: Xóa Chuyên mục
app.delete('/api/admin/categories/:id', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa Chuyên mục.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin API: Thêm Lĩnh vực con mới
app.post('/api/admin/sub-categories', authMiddleware, async (req, res) => {
  try {
    const { category_id, name, name_en, order_index, status } = req.body;
    if (!category_id) {
      return res.status(400).json({ success: false, error: 'Thiếu ID chuyên mục cha.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Tên lĩnh vực con không được trống.' });
    }

    const slug = await generateUniqueSubCategorySlug(name.trim());
    const [result] = await db.query(
      'INSERT INTO sub_categories (category_id, name, name_en, slug, order_index, status) VALUES (?, ?, ?, ?, ?, ?)',
      [category_id, name.trim(), name_en ? name_en.trim() : null, slug, parseInt(order_index) || 0, status === 'inactive' ? 'inactive' : 'active']
    );

    res.json({ success: true, id: result.insertId, message: 'Thêm Lĩnh vực con thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin API: Cập nhật Lĩnh vực con
app.put('/api/admin/sub-categories/:id', authMiddleware, async (req, res) => {
  try {
    const { name, name_en, order_index, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Tên lĩnh vực con không được trống.' });
    }

    const slug = await generateUniqueSubCategorySlug(name.trim(), req.params.id);
    await db.query(
      'UPDATE sub_categories SET name = ?, name_en = ?, slug = ?, order_index = ?, status = ? WHERE id = ?',
      [name.trim(), name_en ? name_en.trim() : null, slug, parseInt(order_index) || 0, status === 'inactive' ? 'inactive' : 'active', req.params.id]
    );

    res.json({ success: true, message: 'Cập nhật Lĩnh vực con thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin API: Đổi trạng thái Lĩnh vực con
app.patch('/api/admin/sub-categories/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const newStatus = status === 'inactive' ? 'inactive' : 'active';
    await db.query('UPDATE sub_categories SET status = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({ success: true, message: `Đã ${newStatus === 'active' ? 'kích hoạt' : 'tạm khóa'} Lĩnh vực con.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin API: Xóa Lĩnh vực con
app.delete('/api/admin/sub-categories/:id', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM sub_categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa Lĩnh vực con.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Tìm kiếm toàn diện trên website (Bài viết, Hội viên, Sự kiện)
app.get('/api/public-search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) {
      return res.json({ success: true, posts: [], members: [], events: [] });
    }
    const searchPattern = `%${q}%`;

    // 1. Tìm tin đăng giao thương (Approved)
    const [posts] = await db.query(
      `SELECT p.*, m.name as company_name, m.tier as company_tier 
       FROM posts p LEFT JOIN members m ON p.member_id = m.id 
       WHERE p.status = 'approved' AND (p.title LIKE ? OR p.summary LIKE ? OR p.body LIKE ?)
       ORDER BY p.is_featured DESC, p.id DESC LIMIT 15`,
      [searchPattern, searchPattern, searchPattern]
    );

    // 2. Tìm doanh nghiệp hội viên (Approved)
    const authHeader = req.headers['authorization'];
    let isAuthenticated = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const [adminSess] = await db.query('SELECT id FROM admin_sessions WHERE token = ? AND expires_at > NOW()', [token]);
        if (adminSess.length) {
          isAuthenticated = true;
        } else {
          const [memberSess] = await db.query(
            `SELECT s.id FROM member_sessions s JOIN members m ON s.member_id = m.id WHERE s.token = ? AND s.expires_at > NOW() AND m.status = 'approved'`,
            [token]
          );
          if (memberSess.length) {
            isAuthenticated = true;
          }
        }
      } catch (e) {}
    }

    const [members] = await db.query(
      `SELECT id, name, industry, city, description, email, phone, contact_name, tier, is_featured
       FROM members 
       WHERE status = 'approved' AND (name LIKE ? OR industry LIKE ? OR city LIKE ? OR description LIKE ?)
       ORDER BY is_featured DESC, tier = 'Platinum' DESC, tier = 'Gold' DESC, id DESC LIMIT 15`,
      [searchPattern, searchPattern, searchPattern, searchPattern]
    );

    const processedMembers = members.map(m => {
      if (isAuthenticated) return m;
      return {
        ...m,
        email: '***@***.***',
        phone: '09** *** ***',
        contact_name: '***'
      };
    });

    // 3. Tìm sự kiện
    const [events] = await db.query(
      `SELECT * FROM events 
       WHERE title LIKE ? OR organizer LIKE ? OR description LIKE ? OR location LIKE ?
       ORDER BY event_date DESC LIMIT 15`,
      [searchPattern, searchPattern, searchPattern, searchPattern]
    );

    res.json({
      success: true,
      posts,
      members: processedMembers,
      events
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



// Lấy số liệu công khai cho trang chủ
app.get('/api/public-stats', async (req, res) => {
  try {
    const [[memberStats]] = await db.query("SELECT COUNT(*) AS total FROM members WHERE status='approved'");
    const [[postStats]]   = await db.query("SELECT COUNT(*) AS total FROM posts WHERE status='approved'");
    const [[eventStats]]  = await db.query("SELECT COUNT(*) AS total FROM events WHERE status='upcoming' AND event_date >= CURDATE()");

    res.json({
      members: memberStats.total,
      posts: postStats.total,
      events: eventStats.total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════
// STATS API (Dashboard)
// ════════════════════════════════════════════
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const [[memberStats]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status='approved') AS approved,
        SUM(status='pending') AS pending,
        SUM(status='rejected') AS rejected
      FROM members`);
    const [[postStats]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status='approved') AS published,
        SUM(status='pending') AS pending
      FROM posts`);
    const [[eventStats]] = await db.query(`
      SELECT COUNT(*) AS upcoming FROM events WHERE status='upcoming' AND event_date >= CURDATE()`);

    res.json({
      success: true,
      members: memberStats,
      posts  : postStats,
      events : eventStats,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy danh sách hoạt động gần đây của hệ thống
app.get('/api/admin/recent-activity', authMiddleware, async (req, res) => {
  try {
    const [members] = await db.query(
      "SELECT id, name, created_at, 'member' as type FROM members ORDER BY created_at DESC LIMIT 5"
    );
    const [posts] = await db.query(
      "SELECT id, title, created_at, 'post' as type FROM posts ORDER BY created_at DESC LIMIT 5"
    );

    const combined = [
      ...members.map(m => ({ id: m.id, title: m.name, type: m.type, created_at: m.created_at })),
      ...posts.map(p => ({ id: p.id, title: p.title, type: p.type, created_at: p.created_at }))
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    res.json({ success: true, data: combined });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════
// AI CHAT API
// ════════════════════════════════════════════

// Lấy danh sách các phiên chat — chỉ hiển thị phiên của người dùng đang đăng nhập
app.get('/api/chat/sessions', anyAuthMiddleware, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const userType = req.authUser.type;
    const [rows] = await db.query(`
      SELECT 
        session_id, 
        MAX(created_at) as last_activity, 
        (SELECT content FROM chat_logs WHERE session_id = t.session_id ORDER BY id ASC LIMIT 1) as title
      FROM chat_logs t
      WHERE session_id != 'anonymous' AND member_id = ?
      GROUP BY session_id
      ORDER BY last_activity DESC
      LIMIT 50
    `, [userId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy toàn bộ lịch sử tin nhắn của một phiên chat — kiểm tra quyền sở hữu
app.get('/api/chat/history/:sessionId', anyAuthMiddleware, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const [rows] = await db.query(
      'SELECT role, content, created_at FROM chat_logs WHERE session_id = ? AND member_id = ? ORDER BY id ASC',
      [req.params.sessionId, userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Xóa một phiên chat — chỉ cho phép xóa phiên thuộc sở hữu
app.delete('/api/chat/session/:sessionId', anyAuthMiddleware, async (req, res) => {
  try {
    const userId = req.authUser.id;
    await db.query('DELETE FROM chat_logs WHERE session_id = ? AND member_id = ?', [req.params.sessionId, userId]);
    res.json({ success: true, message: 'Đã xóa lịch sử trò chuyện thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/chat', anyAuthMiddleware, async (req, res) => {
  // Kiểm tra hội viên phải được phê duyệt
  if (req.authUser.type === 'member' && req.authUser.status !== 'approved') {
    return res.status(403).json({ error: 'Hồ sơ hội viên chưa được phê duyệt. Vui lòng chờ admin duyệt trước khi sử dụng Trợ lý AI.' });
  }

  // Kiểm tra giới hạn chat theo tier
  const tierLimit = TIER_LIMITS[req.authUser.tier] || TIER_LIMITS.Silver;
  if (tierLimit.chats_per_day !== Infinity) {
    const [[countRow]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM chat_logs WHERE member_id = ? AND role = 'user' AND DATE(created_at) = CURDATE()`,
      [req.authUser.id]
    );
    if (countRow.cnt >= tierLimit.chats_per_day) {
      return res.status(429).json({
        error: `Gói ${req.authUser.tier} chỉ được hỏi tối đa ${tierLimit.chats_per_day} câu/ngày. Nâng cấp gói để sử dụng thêm.`
      });
    }
  }

  const { provider, model, messages, system, apiKey } = req.body;
  if (!provider || !model || !messages) {
    return res.status(400).json({ error: 'Thiếu provider, model hoặc messages.' });
  }

  const getRequestKey = (prov) => {
    if (apiKey && apiKey !== '(key đã lưu)' && apiKey !== '**************************************' && apiKey.trim() !== '') {
      return apiKey.trim();
    }
    return getAPIKey(prov);
  };

  // Lấy context hội viên từ DB cho AI
  let memberContext = system || '';
  if (!system) {
    try {
      // Đọc system_instruction từ ai_config
      const [aiConfigs] = await db.query("SELECT system_instruction FROM ai_config WHERE is_active = 1 LIMIT 1");
      const systemInstruction = (aiConfigs[0] && aiConfigs[0].system_instruction) || brandConfig.ai.systemPrompt;

      const [members] = await db.query("SELECT name,tier,industry,description,email,phone FROM members WHERE status='approved'");
      const [posts]   = await db.query("SELECT p.title,p.type,p.contact_info,m.name AS company FROM posts p JOIN members m ON p.member_id=m.id WHERE p.status='approved' ORDER BY p.created_at DESC LIMIT 10");
      const [events]  = await db.query("SELECT title,event_date,location,organizer FROM events WHERE status='upcoming' ORDER BY event_date ASC LIMIT 5");

      // Đọc các tệp dữ liệu kiến thức lơ lửng trong thư mục knowledge_base
      let knowledgeText = '';
      const KB_DIR = path.join(__dirname, 'knowledge_base');
      if (fs.existsSync(KB_DIR)) {
        const files = fs.readdirSync(KB_DIR);
        for (const file of files) {
          const filepath = path.join(KB_DIR, file);
          if (fs.statSync(filepath).isFile()) {
            const content = fs.readFileSync(filepath, 'utf8');
            knowledgeText += `\nTÀI LIỆU KIẾN THỨC BỔ SUNG (${file}):\n${content}\n`;
          }
        }
      }

      memberContext = `${systemInstruction}

HỘI VIÊN (${members.length} thành viên):
${members.map(m => `• ${m.name} [${m.tier}] — ${m.industry}: ${m.description} Liên hệ: ${m.email} | ${m.phone}`).join('\n')}

BÀI VIẾT MỚI:
${posts.map(p => `• [${p.type}] "${p.title}" — ${p.company} (${p.contact_info})`).join('\n')}

SỰ KIỆN SẮP TỚI:
${events.map(e => `• ${e.title} — ${new Date(e.event_date).toLocaleDateString('vi-VN')} tại ${e.location}`).join('\n')}
${knowledgeText ? `\n${knowledgeText}` : ''}`;
    } catch (dbErr) {
      console.error('DB error building context:', dbErr.message);
    }
  }

  try {
    let result;

    if (provider === 'anthropic') {
      const activeKey = getRequestKey('anthropic');
      if (!activeKey) throw new Error('Chưa cấu hình API Key cho Anthropic.');
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': activeKey, 'anthropic-version': '2023-06-01' },
        body   : JSON.stringify({ model, max_tokens: 1024, system: memberContext, messages }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      result = { text: d.content?.[0]?.text || '', usage: { input: d.usage?.input_tokens, output: d.usage?.output_tokens } };
    }
    else if (provider === 'openai') {
      const activeKey = getRequestKey('openai');
      if (!activeKey) throw new Error('Chưa cấu hình API Key cho OpenAI.');
      const msgs = [{ role: 'system', content: memberContext }, ...messages];
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + activeKey },
        body   : JSON.stringify({ model, max_tokens: 1024, messages: msgs }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      result = { text: d.choices?.[0]?.message?.content || '', usage: { input: d.usage?.prompt_tokens, output: d.usage?.completion_tokens } };
    }
    else if (provider === 'gemini') {
      const activeKey = getRequestKey('gemini');
      if (!activeKey) throw new Error('Chưa cấu hình API Key cho Gemini.');
      const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ system_instruction: { parts: [{ text: memberContext }] }, contents, generationConfig: { maxOutputTokens: 1024 } }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      result = { text: d.candidates?.[0]?.content?.parts?.[0]?.text || '', usage: { input: d.usageMetadata?.promptTokenCount, output: d.usageMetadata?.candidatesTokenCount } };
    }
    else if (provider === 'deepseek') {
      const activeKey = getRequestKey('deepseek');
      if (!activeKey) throw new Error('Chưa cấu hình API Key cho DeepSeek.');
      const msgs = [{ role: 'system', content: memberContext }, ...messages];
      const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + activeKey },
        body   : JSON.stringify({ model, max_tokens: 1024, messages: msgs }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      result = { text: d.choices?.[0]?.message?.content || '', usage: { input: d.usage?.prompt_tokens, output: d.usage?.completion_tokens } };
    }
    else if (provider === 'openrouter') {
      const activeKey = getRequestKey('openrouter');
      if (!activeKey) throw new Error('Chưa cấu hình API Key cho OpenRouter.');
      const msgs = [{ role: 'system', content: memberContext }, ...messages];
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + activeKey, 'HTTP-Referer': process.env.SITE_URL || 'https://bizhub.vn', 'X-Title': 'BizHub AI' },
        body   : JSON.stringify({ model, max_tokens: 1024, messages: msgs }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      result = { text: d.choices?.[0]?.message?.content || '', usage: { input: d.usage?.prompt_tokens, output: d.usage?.completion_tokens } };
    }
    else if (provider === 'ollama') {
      const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const msgs = [{ role: 'system', content: memberContext }, ...messages];
      const r = await fetch(`${base}/api/chat`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ model, stream: false, messages: msgs }),
      });
      const d = await r.json();
      result = { text: d.message?.content || '', usage: { input: d.prompt_eval_count, output: d.eval_count } };
    }
    else {
      return res.status(400).json({ error: `Provider "${provider}" không hỗ trợ.` });
    }

    // Lưu chat log kèm member_id để phân tách lịch sử
    try {
      const sessionId = req.headers['x-session-id'] || 'anonymous';
      const userId = req.authUser.id;
      const lastMsg = messages[messages.length - 1];
      await db.query('INSERT INTO chat_logs (session_id,member_id,role,content,provider,model,tokens_in,tokens_out) VALUES (?,?,?,?,?,?,?,?)',
        [sessionId, userId, 'user', lastMsg?.content || '', provider, model, 0, 0]);
      await db.query('INSERT INTO chat_logs (session_id,member_id,role,content,provider,model,tokens_in,tokens_out) VALUES (?,?,?,?,?,?,?,?)',
        [sessionId, userId, 'assistant', result.text, provider, model, result.usage?.input || 0, result.usage?.output || 0]);
    } catch {}

    res.json(result);
  } catch (err) {
    console.error(`[${provider}] Error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// API dịch thuật động sử dụng AI
app.post('/api/translate', async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Thiếu nội dung cần dịch.' });
  }

  // Mặc định ngôn ngữ dịch là Tiếng Anh nếu không truyền hoặc không hợp lệ
  let langName = 'English';
  if (targetLang === 'vi') langName = 'Vietnamese';
  else if (targetLang === 'ja') langName = 'Japanese';
  else if (targetLang === 'zh') langName = 'Chinese';

  // Lấy cấu hình AI đang hoạt động từ DB
  let provider = 'openrouter';
  let model = 'google/gemini-3-flash-preview';
  try {
    const [rows] = await db.query('SELECT provider, model FROM ai_config WHERE is_active = 1 LIMIT 1');
    if (rows[0]) {
      provider = rows[0].provider;
      model = rows[0].model;
    }
  } catch (dbErr) {
    console.error('Error fetching AI config for translation:', dbErr.message);
  }

  const apiKey = getAPIKey(provider);
  if (!apiKey && provider !== 'ollama') {
    return res.status(400).json({ error: `API Key cho ${provider} chưa được cấu hình.` });
  }

  const systemInstruction = `You are a professional translator. Translate the given text to ${langName}. 
Preserve all HTML tags, line breaks, formatting, and markdown if present. Do not add any conversational text or explanations. Output ONLY the direct translation.`;

  try {
    let translatedText = '';
    
    if (provider === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ 
          system_instruction: { parts: [{ text: systemInstruction }] }, 
          contents: [{ role: 'user', parts: [{ text: text }] }],
          generationConfig: { maxOutputTokens: 2048 } 
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      translatedText = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    else if (provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body   : JSON.stringify({ 
          model, 
          max_tokens: 2048, 
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: text }
          ] 
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      translatedText = d.choices?.[0]?.message?.content || '';
    }
    else if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body   : JSON.stringify({ 
          model, 
          max_tokens: 2048, 
          system: systemInstruction, 
          messages: [{ role: 'user', content: text }] 
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      translatedText = d.content?.[0]?.text || '';
    }
    else if (provider === 'deepseek') {
      const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body   : JSON.stringify({ 
          model, 
          max_tokens: 2048, 
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: text }
          ] 
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      translatedText = d.choices?.[0]?.message?.content || '';
    }
    else if (provider === 'openrouter') {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey, 'HTTP-Referer': process.env.SITE_URL || 'https://bizhub.vn', 'X-Title': 'BizHub AI' },
        body   : JSON.stringify({ 
          model, 
          max_tokens: 2048, 
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: text }
          ] 
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      translatedText = d.choices?.[0]?.message?.content || '';
    }
    else if (provider === 'ollama') {
      const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const r = await fetch(`${base}/api/chat`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ 
          model, 
          stream: false, 
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: text }
          ] 
        }),
      });
      const d = await r.json();
      translatedText = d.message?.content || '';
    }
    else {
      return res.status(400).json({ error: `Provider "${provider}" không hỗ trợ.` });
    }

    res.json({ success: true, translatedText: translatedText.trim() });
  } catch (err) {
    console.error(`[Translate Error - ${provider}]:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════
// EVENTS API
// ════════════════════════════════════════════

// ════════════════════════════════════════════
// EVENTS API
// ════════════════════════════════════════════

// ════════════════════════════════════════════
// EVENTS API (SỰ KIỆN, ĐĂNG KÝ VÉ QR & CHECK-IN)
// ════════════════════════════════════════════

// Lấy danh sách sự kiện (Công khai & Quản trị)
app.get('/api/events', async (req, res) => {
  try {
    const { status, search, limit, all } = req.query;

    let isAdmin = false;
    let memberId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const [adminSess] = await db.query('SELECT id FROM admin_sessions WHERE token = ? AND expires_at > NOW()', [token]);
      if (adminSess.length) {
        isAdmin = true;
      } else {
        const [orgSess] = await db.query('SELECT id FROM organizer_sessions WHERE token = ? AND expires_at > NOW()', [token]);
        if (orgSess.length) {
          isAdmin = true;
        } else {
          const [memberSess] = await db.query('SELECT member_id FROM member_sessions WHERE token = ? AND expires_at > NOW()', [token]);
          if (memberSess.length) {
            memberId = memberSess[0].member_id;
          }
        }
      }
    }

    // Tự động cập nhật trạng thái sự kiện dựa trên thời gian thực
    try {
      await db.query(`
        UPDATE events 
        SET status = CASE 
          WHEN (end_date IS NOT NULL AND end_date < NOW()) OR (end_date IS NULL AND event_date < NOW()) THEN 'completed'
          WHEN event_date <= NOW() AND (end_date IS NULL OR end_date >= NOW()) THEN 'ongoing'
          ELSE status
        END
        WHERE status != 'cancelled'
      `);
    } catch (e) {
      console.warn('Lỗi tự động cập nhật trạng thái sự kiện:', e.message);
    }

    let sql = `
      SELECT e.*,
             COALESCE((SELECT SUM(quantity) FROM event_registrations WHERE event_id = e.id AND payment_status != 'cancelled'), 0) AS registered_count,
             COALESCE((SELECT SUM(quantity) FROM event_registrations WHERE event_id = e.id AND checkin_status = 'checked_in'), 0) AS checked_in_count,
             CASE 
               WHEN e.capacity > 0 THEN GREATEST(0, e.capacity - COALESCE((SELECT SUM(quantity) FROM event_registrations WHERE event_id = e.id AND payment_status != 'cancelled'), 0))
               ELSE 999999
             END AS remaining_tickets,
             COALESCE((SELECT COUNT(*) FROM event_interests WHERE event_id = e.id), 0) AS interest_count,
             ${memberId ? `(SELECT COUNT(*) FROM event_interests WHERE event_id = e.id AND member_id = ?) > 0` : '0'} AS is_interested
      FROM events e
      WHERE 1=1
    `;
    const params = [];
    if (memberId) {
      params.push(memberId);
    }

    // Nếu không phải admin hoặc không yêu cầu lấy tất cả, chỉ lấy sự kiện công khai
    if (!isAdmin && all !== 'true') {
      sql += ' AND (e.is_published = 1 OR e.is_published IS NULL)';
    }

    if (status && status !== 'all') {
      sql += ' AND e.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (e.title LIKE ? OR e.organizer LIKE ? OR e.location LIKE ? OR e.description LIKE ? OR e.short_desc LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    sql += `
      ORDER BY 
        CASE e.status
          WHEN 'ongoing' THEN 1
          WHEN 'upcoming' THEN 2
          WHEN 'completed' THEN 3
          WHEN 'cancelled' THEN 4
          ELSE 5
        END ASC,
        e.event_date ASC
    `;

    if (limit && Number(limit) > 0) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
    }

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi GET /api/events:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy chi tiết sự kiện theo ID hoặc Slug
app.get('/api/events/:id', async (req, res) => {
  try {
    const param = req.params.id;
    const isNumeric = /^\d+$/.test(param);

    const sql = `
      SELECT e.*,
             COALESCE((SELECT SUM(quantity) FROM event_registrations WHERE event_id = e.id AND payment_status != 'cancelled'), 0) AS registered_count,
             COALESCE((SELECT SUM(quantity) FROM event_registrations WHERE event_id = e.id AND checkin_status = 'checked_in'), 0) AS checked_in_count,
             CASE 
               WHEN e.capacity > 0 THEN GREATEST(0, e.capacity - COALESCE((SELECT SUM(quantity) FROM event_registrations WHERE event_id = e.id AND payment_status != 'cancelled'), 0))
               ELSE 999999
             END AS remaining_tickets
      FROM events e
      WHERE ${isNumeric ? 'e.id = ? OR e.slug = ?' : 'e.slug = ?'}
      LIMIT 1
    `;
    const params = isNumeric ? [param, param] : [param];
    const [rows] = await db.query(sql, params);
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sự kiện.' });
    }

    const event = rows[0];

    // Cung cấp thông tin tài khoản chuyển khoản từ cấu hình thương hiệu
    const bankInfo = {
      bank_name: 'Techcombank',
      bank_branch: 'PGD Văn Quán - Hà Đông - Hà Nội',
      account_number: '19036730021017',
      account_holder: 'CONG TY CO PHAN ADT QUOC TE',
      bin_code: '970407'
    };

    res.json({ success: true, data: event, bank_info: bankInfo });
  } catch (err) {
    console.error('Lỗi GET /api/events/:id:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Đăng ký tham gia sự kiện & Cấp mã vé QR
app.post('/api/events/:id/register', async (req, res) => {
  try {
    const eventParam = req.params.id;
    const isNumeric = /^\d+$/.test(eventParam);

    const [events] = await db.query(
      `SELECT * FROM events WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`,
      isNumeric ? [eventParam, eventParam] : [eventParam]
    );

    if (!events.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sự kiện cần đăng ký.' });
    }

    const event = events[0];
    const { 
      full_name, 
      phone, 
      email, 
      company, 
      quantity = 1, 
      create_account = false, 
      account_login, 
      account_password, 
      account_confirm_password, 
      notes = '' 
    } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập Họ và tên.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập Số điện thoại.' });
    }

    const qty = Math.max(1, parseInt(quantity) || 1);
    const eventCapacity = Number(event.capacity) || 0;

    // Kiểm tra số lượng vé còn lại (ép kiểu Number chính xác)
    if (eventCapacity > 0) {
      const [sumRows] = await db.query(
        "SELECT COALESCE(SUM(quantity), 0) as registered FROM event_registrations WHERE event_id = ? AND payment_status != 'cancelled'",
        [event.id]
      );
      const currentRegistered = Number(sumRows[0]?.registered) || 0;
      if (currentRegistered + qty > eventCapacity) {
        const remaining = Math.max(0, eventCapacity - currentRegistered);
        return res.status(400).json({
          success: false,
          error: remaining > 0 ? `Chỉ còn ${remaining} vé, không đủ số lượng ${qty} bạn yêu cầu.` : 'Sự kiện này đã hết vé.'
        });
      }
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanEmail = (email && email.trim()) ? email.trim() : null;

    // Xử lý tài khoản: Nếu đã đăng nhập thì tự động gán vé vào tài khoản
    let createdMemberId = null;
    let accountCreated = false;
    let accountMsg = '';

    // 1. Kiểm tra session đăng nhập nếu có Authorization header
    const regAuthHeader = req.headers['authorization'];
    if (regAuthHeader && regAuthHeader.startsWith('Bearer ')) {
      const regToken = regAuthHeader.substring(7);
      const [mSess] = await db.query(
        'SELECT member_id FROM member_sessions WHERE token = ? AND expires_at > NOW()',
        [regToken]
      );
      if (mSess.length > 0) {
        createdMemberId = mSess[0].member_id;
      }
    }

    // 2. Kiểm tra nếu có truyền member_id trong body
    if (!createdMemberId && req.body.member_id) {
      const [mCheck] = await db.query('SELECT id FROM members WHERE id = ?', [req.body.member_id]);
      if (mCheck.length > 0) {
        createdMemberId = mCheck[0].id;
      }
    }

    // 3. Nếu chưa xác định, thử tìm theo phone hoặc email đã đăng ký thành viên
    if (!createdMemberId && (cleanEmail || cleanPhone)) {
      const [matchedMems] = await db.query(
        'SELECT id FROM members WHERE (phone IS NOT NULL AND phone != "" AND phone = ?) OR (email IS NOT NULL AND email != "" AND email = ?)',
        [cleanPhone, cleanEmail]
      );
      if (matchedMems.length > 0) {
        createdMemberId = matchedMems[0].id;
      }
    }

    // 4. Nếu chưa có tài khoản và khách tích chọn tạo tài khoản mới:
    const willCreateAccount = !createdMemberId && (create_account === true || create_account === 'true' || create_account === 1 || create_account === '1');

    if (willCreateAccount) {
      const loginUser = (account_login && account_login.trim()) ? account_login.trim() : (cleanPhone || cleanEmail || '');
      const pass = account_password ? account_password.trim() : '';
      const passConfirm = account_confirm_password ? account_confirm_password.trim() : '';

      if (!loginUser) {
        return res.status(400).json({ success: false, error: 'Vui lòng nhập tài khoản (Email hoặc Số điện thoại) để tạo tài khoản theo dõi vé.' });
      }
      if (!pass) {
        return res.status(400).json({ success: false, error: 'Vui lòng nhập mật khẩu cho tài khoản theo dõi vé.' });
      }
      if (pass.length < 6) {
        return res.status(400).json({ success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      }
      if (passConfirm && pass !== passConfirm) {
        return res.status(400).json({ success: false, error: 'Mật khẩu xác nhận không khớp.' });
      }

      // Kiểm tra xem username/email/phone này đã tồn tại trong bảng members chưa
      const [existingMem] = await db.query(
        'SELECT id, username, email, phone FROM members WHERE username = ? OR (email IS NOT NULL AND email != "" AND email = ?) OR (phone IS NOT NULL AND phone != "" AND phone = ?)',
        [loginUser, loginUser, loginUser]
      );

      if (existingMem.length > 0) {
        // Đã có tài khoản
        createdMemberId = existingMem[0].id;
        accountCreated = false;
        accountMsg = 'Tài khoản đã tồn tại trên hệ thống, vé đã được liên kết với tài khoản này.';
      } else {
        // Tạo tài khoản mới
        const hash = await bcrypt.hash(pass, 10);
        const isEmail = loginUser.includes('@');
        const regEmail = isEmail ? loginUser : (cleanEmail || `${cleanPhone}@doanhnghiepvn.today`);
        const regPhone = !isEmail ? loginUser : cleanPhone;
        const orgName = (company && company.trim()) ? company.trim() : (full_name.trim() || 'Hội viên mới');

        const [insertMem] = await db.query(
          `INSERT INTO members (name, tax_code, license, industry, size, address, city, website, social,
            description, tier, status, contact_name, contact_pos, email, username, password_hash, phone, goal, referral)
           VALUES (?, 'Cần bổ sung', 'Cần bổ sung', 'Cần bổ sung', 'Cần bổ sung', 'Cần bổ sung', 'Cần bổ sung', NULL, NULL,
            'Tài khoản đăng ký qua vé sự kiện', 'Silver', 'pending', ?, 'Cần bổ sung', ?, ?, ?, ?, 'Theo dõi vé sự kiện và kết nối', 'Đăng ký vé sự kiện')`,
          [
            orgName,
            full_name.trim(),
            regEmail,
            loginUser,
            hash,
            regPhone
          ]
        );
        createdMemberId = insertMem.insertId;
        accountCreated = true;
        accountMsg = 'Đã tạo tài khoản thành viên (hồ sơ đang ở trạng thái Chờ duyệt bởi Ban quản trị).';
      }
    }

    // Tạo mã vé duy nhất: DNVN-[EventID]-[Random4]-[Timestamp3]
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timeSuffix = Date.now().toString(36).slice(-3).toUpperCase();
    const ticketCode = `DNVN-${event.id}-${randomCode}${timeSuffix}`;

    const isPaid = Number(event.is_paid) === 1 && Number(event.price) > 0;
    const unitPrice = isPaid ? Number(event.price) : 0;
    const totalAmount = unitPrice * qty;
    const paymentStatus = isPaid ? 'pending' : 'free';
    const paymentNote = `VE ${ticketCode} ${cleanPhone}`;

    const [result] = await db.query(
      `INSERT INTO event_registrations 
       (event_id, member_id, ticket_code, full_name, phone, email, company, quantity, total_amount, payment_status, payment_note, checkin_status, create_account, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_checked_in', ?, ?)`,
      [
        event.id,
        createdMemberId,
        ticketCode,
        full_name.trim(),
        cleanPhone,
        cleanEmail,
        company ? company.trim() : null,
        qty,
        totalAmount,
        paymentStatus,
        paymentNote,
        willCreateAccount ? 1 : 0,
        notes || null
      ]
    );

    // URL mã QR check-in tiện lợi
    const qrData = `https://doanhnghiepvn.today/checkin?code=${encodeURIComponent(ticketCode)}`;
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ticketCode)}`;

    // Tạo mã VietQR chuẩn nếu có thu phí
    let vietqrUrl = null;
    const bankInfo = {
      bank_name: 'Techcombank',
      bank_branch: 'PGD Văn Quán - Hà Đông - Hà Nội',
      account_number: '19036730021017',
      account_holder: 'CONG TY CO PHAN ADT QUOC TE',
      bin_code: '970407',
      transfer_amount: totalAmount,
      transfer_syntax: paymentNote
    };

    if (isPaid && totalAmount > 0) {
      vietqrUrl = `https://img.vietqr.io/image/970407-19036730021017-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(paymentNote)}&accountName=${encodeURIComponent('CONG TY CO PHAN ADT QUOC TE')}`;
    }

    res.json({
      success: true,
      message: 'Đăng ký vé tham gia sự kiện thành công!' + (accountMsg ? ` (${accountMsg})` : ''),
      account_created: accountCreated,
      account_message: accountMsg,
      registration: {
        id: result.insertId,
        member_id: createdMemberId,
        event_id: event.id,
        event_title: event.title,
        ticket_code: ticketCode,
        full_name: full_name.trim(),
        phone: cleanPhone,
        email: cleanEmail || '',
        company: company || '',
        quantity: qty,
        total_amount: totalAmount,
        payment_status: paymentStatus,
        payment_note: paymentNote,
        qr_data: qrData,
        qr_image: qrImage,
        vietqr_url: vietqrUrl,
        bank_info: bankInfo
      }
    });
  } catch (err) {
    console.error('Lỗi POST /api/events/:id/register:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Hội viên: Xem lịch sử đăng ký sự kiện & vé điện tử
app.get('/api/member/events', memberAuthMiddleware, async (req, res) => {
  try {
    const memberId = req.member.id;
    const [mRows] = await db.query('SELECT id, email, phone, username FROM members WHERE id = ?', [memberId]);
    const mem = mRows[0] || req.member;

    const [rows] = await db.query(
      `SELECT r.*, e.title as event_title, e.start_time, e.end_time, e.event_date, e.end_date, e.location, e.address as event_address, e.image_url, e.slug as event_slug, e.is_paid, e.price
       FROM event_registrations r
       JOIN events e ON r.event_id = e.id
       WHERE (r.member_id = ? 
              OR (r.email IS NOT NULL AND r.email != '' AND r.email = ?) 
              OR (r.phone IS NOT NULL AND r.phone != '' AND r.phone = ?)
              OR (r.phone IS NOT NULL AND r.phone != '' AND r.phone = ?))
       ORDER BY r.created_at DESC`,
      [memberId, mem.email || '', mem.phone || '', mem.username || '']
    );

    const formatted = rows.map(item => {
      const qrData = `https://doanhnghiepvn.today/checkin?code=${encodeURIComponent(item.ticket_code)}`;
      const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(item.ticket_code)}`;
      let vietqrUrl = null;
      if (item.payment_status === 'pending' && Number(item.total_amount) > 0) {
        vietqrUrl = `https://img.vietqr.io/image/970407-19036730021017-compact2.png?amount=${item.total_amount}&addInfo=${encodeURIComponent(item.payment_note || ('VE ' + item.ticket_code))}&accountName=${encodeURIComponent('CONG TY CO PHAN ADT QUOC TE')}`;
      }
      return {
        ...item,
        qr_data: qrData,
        qr_image: qrImage,
        vietqr_url: vietqrUrl
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Lỗi GET /api/member/events:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin & Ban tổ chức: Lấy danh sách người đăng ký vé của sự kiện
app.get('/api/admin/events/:id/registrations', eventManagerAuthMiddleware, async (req, res) => {
  try {
    const eventId = req.params.id;
    const [rows] = await db.query(
      `SELECT r.*, e.title as event_title 
       FROM event_registrations r 
       JOIN events e ON r.event_id = e.id 
       WHERE r.event_id = ? 
       ORDER BY r.created_at DESC`,
      [eventId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi GET /api/admin/events/:id/registrations:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin & Ban tổ chức: Tìm khách tham dự theo SĐT / email / tên / mã vé (Chuẩn Ảnh 3)
app.get('/api/admin/events/registrations/search', eventManagerAuthMiddleware, async (req, res) => {
  try {
    const { q, event_id } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = `%${q.trim()}%`;
    let sql = `
      SELECT r.*, e.title as event_title, e.event_date
      FROM event_registrations r
      JOIN events e ON r.event_id = e.id
      WHERE (r.full_name LIKE ? OR r.phone LIKE ? OR r.email LIKE ? OR r.ticket_code LIKE ? OR r.company LIKE ?)
    `;
    const params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

    if (event_id) {
      sql += ' AND r.event_id = ?';
      params.push(event_id);
    }

    sql += ' ORDER BY r.id DESC LIMIT 30';

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi GET /api/admin/events/registrations/search:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin & Ban tổ chức: Cập nhật trạng thái thanh toán vé
app.patch('/api/admin/events/registrations/:regId/payment', eventManagerAuthMiddleware, async (req, res) => {
  try {
    const { regId } = req.params;
    const { payment_status } = req.body;
    if (!['free', 'pending', 'paid', 'cancelled'].includes(payment_status)) {
      return res.status(400).json({ success: false, error: 'Trạng thái thanh toán không hợp lệ.' });
    }

    await db.query('UPDATE event_registrations SET payment_status = ? WHERE id = ?', [payment_status, regId]);
    res.json({ success: true, message: 'Đã cập nhật trạng thái thanh toán vé.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin & Ban tổ chức: Điểm danh / Check-in vé sự kiện bằng mã QR, camera hoặc mã vé (Chuẩn Ảnh 3)
app.post('/api/admin/events/checkin', eventManagerAuthMiddleware, async (req, res) => {
  try {
    const { ticket_code, registration_id, event_id } = req.body;
    if (!ticket_code && !registration_id) {
      return res.status(400).json({ success: false, error: 'Thiếu mã vé hoặc ID lượt đăng ký cần check-in.' });
    }

    let sql = 'SELECT r.*, e.title as event_title FROM event_registrations r JOIN events e ON r.event_id = e.id WHERE ';
    const params = [];
    if (registration_id) {
      sql += 'r.id = ?';
      params.push(registration_id);
    } else {
      sql += 'r.ticket_code = ?';
      params.push(ticket_code.trim());
    }

    if (event_id) {
      sql += ' AND r.event_id = ?';
      params.push(event_id);
    }

    const [rows] = await db.query(sql, params);
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy vé hợp lệ với mã: ' + (ticket_code || registration_id) });
    }

    const reg = rows[0];

    if (reg.checkin_status === 'checked_in') {
      return res.json({
        success: true,
        already_checked_in: true,
        message: `Vé này ĐÃ CHECK-IN lúc ${new Date(reg.checkin_time).toLocaleString('vi-VN')}!`,
        registration: reg
      });
    }

    await db.query(
      "UPDATE event_registrations SET checkin_status = 'checked_in', checkin_time = NOW() WHERE id = ?",
      [reg.id]
    );

    const [updatedRows] = await db.query(
      'SELECT r.*, e.title as event_title FROM event_registrations r JOIN events e ON r.event_id = e.id WHERE r.id = ?',
      [reg.id]
    );

    res.json({
      success: true,
      already_checked_in: false,
      message: '✅ Check-in thành công cho khách tham dự!',
      registration: updatedRows[0]
    });
  } catch (err) {
    console.error('Lỗi POST /api/admin/events/checkin:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin & Ban tổ chức: Thêm sự kiện mới (Đầy đủ trường theo mockup Image 2)
app.post('/api/admin/events', eventManagerAuthMiddleware, async (req, res) => {
  const {
    title,
    slug,
    short_desc,
    description,
    content,
    event_date,
    end_date,
    location,
    organizer,
    capacity,
    is_paid,
    price,
    is_published,
    status,
    image_url
  } = req.body;

  if (!title || !title.trim() || !event_date) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập Tiêu đề và Thời gian bắt đầu.' });
  }

  try {
    const finalSlug = slug && slug.trim() ? slug.trim() : slugify(title.trim());
    const finalCapacity = capacity !== undefined && capacity !== '' ? parseInt(capacity, 10) : 0;
    const finalIsPaid = is_paid === true || is_paid === 1 || is_paid === '1' ? 1 : 0;
    const finalPrice = finalIsPaid ? (parseFloat(price) || 0) : 0;
    const finalIsPublished = is_published === false || is_published === 0 || is_published === '0' ? 0 : 1;

    const [result] = await db.query(
      `INSERT INTO events 
       (title, slug, short_desc, description, content, event_date, end_date, location, organizer, capacity, is_paid, price, is_published, status, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        finalSlug,
        short_desc || null,
        description || short_desc || null,
        content || null,
        event_date,
        end_date || null,
        location || null,
        organizer || 'Tạp chí Doanh Nghiệp Việt Nam',
        finalCapacity,
        finalIsPaid,
        finalPrice,
        finalIsPublished,
        status || 'upcoming',
        image_url || null
      ]
    );

    res.json({ success: true, id: result.insertId, message: 'Tạo sự kiện mới thành công.' });
  } catch (err) {
    console.error('Lỗi POST /api/admin/events:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin & Ban tổ chức: Sửa sự kiện
app.put('/api/admin/events/:id', eventManagerAuthMiddleware, async (req, res) => {
  const eventId = req.params.id;
  const {
    title,
    slug,
    short_desc,
    description,
    content,
    event_date,
    end_date,
    location,
    organizer,
    capacity,
    is_paid,
    price,
    is_published,
    status,
    image_url
  } = req.body;

  if (!title || !title.trim() || !event_date) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập Tiêu đề và Thời gian bắt đầu.' });
  }

  try {
    const finalSlug = slug && slug.trim() ? slug.trim() : slugify(title.trim());
    const finalCapacity = capacity !== undefined && capacity !== '' ? parseInt(capacity, 10) : 0;
    const finalIsPaid = is_paid === true || is_paid === 1 || is_paid === '1' ? 1 : 0;
    const finalPrice = finalIsPaid ? (parseFloat(price) || 0) : 0;
    const finalIsPublished = is_published === false || is_published === 0 || is_published === '0' ? 0 : 1;

    await db.query(
      `UPDATE events 
       SET title = ?, slug = ?, short_desc = ?, description = ?, content = ?, event_date = ?, end_date = ?, 
           location = ?, organizer = ?, capacity = ?, is_paid = ?, price = ?, is_published = ?, status = ?, image_url = ?
       WHERE id = ?`,
      [
        title.trim(),
        finalSlug,
        short_desc || null,
        description || short_desc || null,
        content || null,
        event_date,
        end_date || null,
        location || null,
        organizer || 'Tạp chí Doanh Nghiệp Việt Nam',
        finalCapacity,
        finalIsPaid,
        finalPrice,
        finalIsPublished,
        status || 'upcoming',
        image_url || null,
        eventId
      ]
    );

    res.json({ success: true, message: 'Cập nhật thông tin sự kiện thành công.' });
  } catch (err) {
    console.error('Lỗi PUT /api/admin/events/:id:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin & Ban tổ chức: Xóa sự kiện
app.delete('/api/admin/events/:id', eventManagerAuthMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa sự kiện thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════
// LEADS / TIẾP NHẬN ĐĂNG KÝ TRANG CHỦ API
// ════════════════════════════════════════════

// Public: Gửi form đăng ký từ trang chủ
app.post('/api/leads', async (req, res) => {
  const { fullName, phone, email, city, memberType, companyName, notes } = req.body;
  if (!fullName || !phone || !email) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc: Họ tên, Số điện thoại hoặc Email.' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO leads (full_name, phone, email, city, member_type, company_name, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [fullName, phone, email, city || null, memberType || 'member_personal', companyName || null, notes || null]
    );

    res.json({
      success: true,
      id: result.insertId,
      message: 'Đăng ký thành công! Đội ngũ phát triển DoanhNghiepVN.today sẽ liên hệ với bạn trong thời gian sớm nhất.'
    });
  } catch (err) {
    console.error('Lỗi lưu lead /api/leads:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Lấy danh sách Leads
app.get('/api/admin/leads', authMiddleware, async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ? OR company_name LIKE ? OR city LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Cập nhật trạng thái và ghi chú cho Lead
app.put('/api/admin/leads/:id', authMiddleware, async (req, res) => {
  const { status, admin_notes } = req.body;
  const leadId = req.params.id;
  try {
    await db.query(
      'UPDATE leads SET status = ?, admin_notes = ? WHERE id = ?',
      [status || 'pending', admin_notes || null, leadId]
    );
    res.json({ success: true, message: 'Cập nhật thông tin liên hệ thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Xóa Lead
app.delete('/api/admin/leads/:id', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM leads WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa thông tin liên hệ.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Debug environment info to resolve directory pathing
app.get('/api/debug-env', (req, res) => {
  res.json({
    success: true,
    directory: __dirname,
    port: PORT,
    database: process.env.DB_NAME || 'bizhub',
    timezone: process.env.TZ || 'N/A',
    time: new Date().toISOString()
  });
});

// ════════════════════════════════════════════
// SPA Fallback (Anti-cache headers cho index.html)
// ════════════════════════════════════════════
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ ${brandConfig.appName} server đang chạy tại http://localhost:${PORT}`);
});
