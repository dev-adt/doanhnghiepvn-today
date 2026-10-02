-- ============================================
-- DoanhNghiepVN.today — MySQL Database Schema
-- Hệ sinh thái số Tạp chí Doanh Nghiệp Việt Nam
-- Database: doanhnghiepvn_db | User: dnvn_user
-- ============================================

-- ── Bảng hội viên ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL COMMENT 'Tên doanh nghiệp / Đơn vị',
  tax_code      VARCHAR(20)  COMMENT 'Mã số thuế',
  license       VARCHAR(50)  COMMENT 'Số giấy phép kinh doanh',
  industry      VARCHAR(100) COMMENT 'Ngành nghề / Lĩnh vực',
  size          VARCHAR(50)  COMMENT 'Quy mô nhân sự',
  address       TEXT         COMMENT 'Địa chỉ',
  website       VARCHAR(255) COMMENT 'Website',
  social        VARCHAR(255) COMMENT 'Fanpage / LinkedIn',
  description   TEXT         COMMENT 'Mô tả hoạt động',
  tier          ENUM('Silver','Gold','Platinum') DEFAULT 'Silver' COMMENT 'Gói hội viên',
  status        ENUM('pending','approved','rejected') DEFAULT 'pending',
  contact_name  VARCHAR(100) COMMENT 'Tên người đại diện',
  contact_pos   VARCHAR(100) COMMENT 'Chức vụ',
  email         VARCHAR(255) NOT NULL COMMENT 'Email liên hệ',
  phone         VARCHAR(20)  COMMENT 'Số điện thoại',
  goal          TEXT         COMMENT 'Mục tiêu tham gia',
  referral      VARCHAR(100) COMMENT 'Biết đến qua kênh nào',
  reject_reason TEXT         COMMENT 'Lý do từ chối',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_tier (tier),
  INDEX idx_industry (industry)
) ENGINE=InnoDB COMMENT='Danh sách hội viên doanh nghiệp';

-- ── Bảng bài viết ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  member_id           INT          DEFAULT NULL COMMENT 'NULL nếu là bài từ ban biên tập/creator',
  creator_id          INT          DEFAULT NULL COMMENT 'NULL nếu là bài từ hội viên',
  title               VARCHAR(255) NOT NULL,
  slug                VARCHAR(255),
  category            VARCHAR(100) DEFAULT 'Tin tức',
  sub_category        VARCHAR(100) DEFAULT NULL,
  summary             TEXT,
  body                LONGTEXT     NOT NULL,
  image_url           VARCHAR(500),
  author_name         VARCHAR(100),
  author_pos          VARCHAR(100),
  contact_info        VARCHAR(255),
  source_url          VARCHAR(500) DEFAULT NULL,
  tags                JSON         DEFAULT NULL,
  deadline            DATE         DEFAULT NULL,
  type                VARCHAR(50)  DEFAULT 'Tin tức' COMMENT 'Tìm đối tác, Cần mua, Cần bán, Tin tức...',
  status              ENUM('draft','pending','approved','rejected','hidden') DEFAULT 'pending',
  is_featured         TINYINT(1)   DEFAULT 0,
  featured_requested  TINYINT(1)   DEFAULT 0,
  reject_reason       TEXT         DEFAULT NULL,
  published_at        TIMESTAMP    NULL DEFAULT NULL,
  views               INT          DEFAULT 0,
  likes               INT          DEFAULT 0,
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_featured (is_featured),
  INDEX idx_created (created_at),
  INDEX idx_category (category),
  INDEX idx_creator (creator_id)
) ENGINE=InnoDB COMMENT='Bài viết và tin đăng doanh nghiệp';

-- ── Bảng sự kiện (Mở rộng theo Hợp đồng và thiết kế UI) ──────
CREATE TABLE IF NOT EXISTS events (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255) NOT NULL COMMENT 'Tiêu đề sự kiện',
  slug          VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn thân thiện',
  short_desc    TEXT         DEFAULT NULL COMMENT 'Mô tả ngắn',
  description   TEXT         DEFAULT NULL COMMENT 'Tóm tắt sự kiện',
  content       LONGTEXT     DEFAULT NULL COMMENT 'Nội dung chi tiết (Rich Text HTML)',
  event_date    DATETIME     NOT NULL     COMMENT 'Thời gian bắt đầu',
  end_date      DATETIME     DEFAULT NULL COMMENT 'Thời gian kết thúc',
  location      VARCHAR(255) DEFAULT NULL COMMENT 'Địa điểm tổ chức',
  organizer     VARCHAR(100) DEFAULT 'Tạp chí Doanh Nghiệp Việt Nam',
  capacity      INT          DEFAULT 0    COMMENT 'Giới hạn số lượng vé (0 = không giới hạn)',
  image_url     VARCHAR(500) DEFAULT NULL COMMENT 'Ảnh đại diện sự kiện',
  is_paid       TINYINT(1)   DEFAULT 0    COMMENT '0: Miễn phí, 1: Có thu phí',
  price         DECIMAL(15,2) DEFAULT 0   COMMENT 'Mức phí (đ/vé)',
  is_published  TINYINT(1)   DEFAULT 1    COMMENT '1: Công khai lên website, 0: Ẩn',
  status        ENUM('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_event_date (event_date),
  INDEX idx_status (status),
  INDEX idx_published (is_published)
) ENGINE=InnoDB COMMENT='Quản lý sự kiện và hội thảo doanh nghiệp';

-- ── Bảng đăng ký tham gia sự kiện & cấp vé QR ─────────────────
CREATE TABLE IF NOT EXISTS event_registrations (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  event_id        INT          NOT NULL,
  ticket_code     VARCHAR(50)  NOT NULL UNIQUE COMMENT 'Mã vé / Mã QR check-in',
  full_name       VARCHAR(150) NOT NULL COMMENT 'Họ và tên người đăng ký',
  phone           VARCHAR(30)  NOT NULL COMMENT 'Số điện thoại',
  email           VARCHAR(255) DEFAULT NULL COMMENT 'Email nhận thông tin',
  company         VARCHAR(255) DEFAULT NULL COMMENT 'Đơn vị / Công ty',
  quantity        INT          DEFAULT 1    COMMENT 'Số lượng vé đăng ký',
  total_amount    DECIMAL(15,2) DEFAULT 0   COMMENT 'Tổng tiền thanh toán (VNĐ)',
  payment_status  ENUM('free','pending','paid','cancelled') DEFAULT 'free' COMMENT 'Trạng thái thanh toán',
  payment_note    VARCHAR(255) DEFAULT NULL COMMENT 'Ghi chú / Cú pháp chuyển khoản',
  checkin_status  ENUM('not_checked_in','checked_in') DEFAULT 'not_checked_in' COMMENT 'Trạng thái điểm danh',
  checkin_time    DATETIME     DEFAULT NULL COMMENT 'Thời gian quét mã QR check-in',
  create_account  TINYINT(1)   DEFAULT 0    COMMENT 'Yêu cầu tạo tài khoản theo dõi',
  notes           TEXT         DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event (event_id),
  INDEX idx_ticket (ticket_code),
  INDEX idx_phone (phone),
  INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB COMMENT='Danh sách đăng ký tham gia sự kiện và vé QR';

-- ── Bảng quan tâm sự kiện (Tương thích ngược) ─────────────────
CREATE TABLE IF NOT EXISTS event_interests (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  event_id      INT NOT NULL,
  member_id     INT DEFAULT NULL,
  name          VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  email         VARCHAR(255),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event (event_id),
  INDEX idx_member (member_id)
) ENGINE=InnoDB COMMENT='Đăng ký quan tâm sự kiện';

-- ── Bảng quản trị viên & tài khoản hệ thống ───────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  role          ENUM('superadmin','admin','editor','creator','member') DEFAULT 'admin',
  last_login    TIMESTAMP NULL DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Tài khoản quản trị và biên tập viên';

-- ── Bảng cấu hình AI ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_config (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  provider      VARCHAR(50)  NOT NULL DEFAULT 'openrouter',
  model         VARCHAR(100) NOT NULL,
  system_prompt TEXT,
  is_active     TINYINT(1)   DEFAULT 1,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Cấu hình AI Proxy';

-- ── Bảng phiên đăng nhập hội viên ─────────────────────────────
CREATE TABLE IF NOT EXISTS member_sessions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  member_id     INT NOT NULL,
  token         VARCHAR(255) NOT NULL UNIQUE,
  expires_at    TIMESTAMP NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  INDEX idx_token (token)
) ENGINE=InnoDB COMMENT='Token phiên đăng nhập hội viên';

-- ── Bảng chuyên mục & lĩnh vực (Admin quản lý động) ───────────
CREATE TABLE IF NOT EXISTS categories (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  name_en       VARCHAR(255) DEFAULT NULL,
  slug          VARCHAR(255) NOT NULL UNIQUE,
  order_index   INT DEFAULT 0,
  status        ENUM('active', 'inactive') DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Chuyên mục chính';

CREATE TABLE IF NOT EXISTS sub_categories (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  category_id   INT NOT NULL,
  name          VARCHAR(255) NOT NULL,
  name_en       VARCHAR(255) DEFAULT NULL,
  slug          VARCHAR(255),
  order_index   INT DEFAULT 0,
  status        ENUM('active', 'inactive') DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category (category_id)
) ENGINE=InnoDB COMMENT='Lĩnh vực con';

-- ============================================
-- DỮ LIỆU KHỞI TẠO MẪU (DoanhNghiepVN.today)
-- ============================================

-- Admin mặc định (Username: admin | Password: Admin@123)
INSERT INTO admins (username, password_hash, name, email, role) VALUES
('admin', '$2b$10$3luJFH.EMVPnxeH8BdXn9.5tnCQ9huv13yzOzHrwYGiRhgV7dcufq', 'Ban Biên Tập DoanhNghiepVN.today', 'admin@doanhnghiepvn.today', 'superadmin')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Cấu hình AI mặc định
INSERT INTO ai_config (provider, model, is_active) VALUES ('openrouter', 'google/gemini-2.5-flash', 1)
ON DUPLICATE KEY UPDATE model=VALUES(model);
