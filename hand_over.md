# 📋 TÀI LIỆU BÀN GIAO KỸ THUẬT & HƯỚNG DẪN TÁI SỬ DỤNG CODEBASE
# (TECHNICAL HANDOVER & REBRANDING / REDESIGN MANUAL)

> **Dự án gốc**: Nền tảng Cổng thông tin & Hệ sinh thái số Doanh nghiệp (`doanhnghiepvn.today`)  
> **Đơn vị phát triển & bàn giao**: ADT Quốc tế  
> **Đối tượng sử dụng**: Lập trình viên Fullstack / Frontend / AI Coding Assistant (Antigravity, Cursor, Windsurf, Claude Code...) tiếp nhận phát triển phiên bản mới.  
> **Mục tiêu tài liệu**: Hướng dẫn toàn diện cách **tái sử dụng 100% logic backend & tính năng nghiệp vụ có sẵn**, chỉ thay đổi **Tên thương hiệu, Màu sắc nhận diện và Thiết kế lại toàn bộ Giao diện Trang chủ (`Home.jsx`)**.

---

## 📑 MỤC LỤC
1. [Tổng quan Kiến trúc & Triết lý Thiết kế](#1-tổng-quan-kiến-trúc--triết-lý-thiết-kế)
2. [Cấu trúc Thư mục & Trọng tâm Cần Lưu Ý](#2-cấu-trúc-thư-mục--trọng-tâm-cần-lưu-ý)
3. [Quy trình 5 Bước Đổi Thương hiệu & Màu sắc (Rebranding)](#3-quy-trình-5-bước-đổi-thương-hiệu--màu-sắc-rebranding)
4. [Bản đồ Dữ liệu & Tính năng Trang chủ (`Home.jsx`)](#4-bản-đồ-dữ-liệu--tính-năng-trang-chủ-homejsx)
5. [Hướng dẫn Chi tiết Thiết kế lại Giao diện Trang chủ](#5-hướng-dẫn-chi-tiết-thiết-kế-lại-giao-diện-trang-chủ)
6. [Khung Code Mẫu (Clean Skeleton) cho `Home.jsx`](#6-khung-code-mẫu-clean-skeleton-cho-homejsx)
7. [Danh mục API Backend Phục vụ Trang chủ](#7-danh-mục-api-backend-phục-vụ-trang-chủ)
8. [Checklist Kiểm thử & Quy trình Triển khai (Deploy)](#8-checklist-kiểm-thử--quy-trình-triển-khai-deploy)
9. [Các Lỗi Thường Gặp & Cách Khắc Phục (Troubleshooting)](#9-các-lỗi-thường-gặp--cách-khắc-phục-troubleshooting)

---

## 🏛️ 1. TỔNG QUAN KIẾN TRÚC & TRIẾT LÝ THIẾT KẾ

Codebase được thiết kế theo mô hình **Monorepo thu gọn (All-in-one)** tối ưu cho việc vận hành độc lập, tải nhanh và dễ dàng chuyển giao:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT / BROWSER                              │
│         React 18 SPA (Vite) + Vanilla CSS Tokens + Service Worker (PWA) │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ REST API (/api/*)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        NODE.JS / EXPRESS BACKEND                       │
│  - Phân quyền (Admin, Member, Guest)          - API Vé & Sự kiện       │
│  - JWT & Session Auth                        - API Bài viết & Tin tức │
│  - Tích hợp AI Gemini 2.5 Flash              - Form Tư vấn & Hội viên │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ Pool Connection                 │ Google SDK
                   ▼                                 ▼
      ┌─────────────────────────┐       ┌────────────────────────┐
      │     MySQL 8.0 / MariaDB │       │ Google Gemini AI Flash │
      │   (schema.sql, db.js)   │       │   (RAG Knowledge Base) │
      └─────────────────────────┘       └────────────────────────┘
```

### Điểm mạnh cốt lõi cần duy trì:
- **Tập trung hóa cấu hình thương hiệu**: Toàn bộ tên gọi, slogan, logo, hotline, mạng xã hội, màu sắc được quy tụ tại `frontend/src/brand.config.js` và `config/brand.config.js`. Không rải rác hardcode trong component.
- **Độc lập Styling**: Sử dụng **Vanilla CSS và Design Tokens** (`index.css`), không phụ thuộc TailwindCSS, giúp lập trình viên thoải mái sáng tạo lại giao diện mà không sợ xung đột class.
- **Hỗ trợ Song ngữ tức thì**: Cơ chế `useTranslation()` (`LanguageContext.jsx`) chuyển đổi mượt mà giữa Tiếng Việt và Tiếng Anh không cần reload trang.
- **Trợ lý AI Gemini tích hợp sẵn**: Hệ thống RAG tự động học dữ liệu hội viên và sự kiện từ DB để trả lời người dùng 24/7.

---

## 📂 2. CẤU TRÚC THƯ MỤC & TRỌNG TÂM CẦN LƯU Ý

```plaintext
doanhnghiepvn-today/
├── config/
│   └── brand.config.js          ⭐ Cấu hình thương hiệu Backend & AI Prompt
├── frontend/
│   ├── public/                  ⭐ Chứa ảnh Logo, Favicon, PWA icons, Avatar AI
│   │   ├── images/              ⭐ Chứa banner, ảnh đối tác (VIB Card, v.v.)
│   │   └── img_guide/           ⭐ Ảnh hướng dẫn sử dụng hệ thống
│   ├── src/
│   │   ├── brand.config.js      ⭐⭐ TRỌNG TÂM: File cấu hình thương hiệu Frontend
│   │   ├── components/          ⭐ Navbar, Footer, FloatingAIBot, SEOHead...
│   │   ├── contexts/            ⭐ AuthContext (xác thực), LanguageContext (đa ngôn ngữ)
│   │   ├── pages/
│   │   │   ├── Home.jsx         ⭐⭐ TRỌNG TÂM: Trang chủ cần thiết kế lại
│   │   │   ├── Events.jsx       (Sự kiện & đăng ký vé)
│   │   │   ├── Posts.jsx        (Tin tức & bảng tin cơ hội)
│   │   │   ├── Members.jsx      (Danh bạ doanh nghiệp hội viên)
│   │   │   ├── Guide.jsx        (Hướng dẫn sử dụng)
│   │   │   └── ... (Admin & Member Dashboards)
│   │   ├── index.css            ⭐⭐ TRỌNG TÂM: Hệ thống biến màu (Tokens) & CSS toàn cục
│   │   ├── App.jsx              (Routing hệ thống)
│   │   └── main.jsx
│   ├── index.html               ⭐ Header SEO, Meta tags, Font Google
│   └── vite.config.js           (Cấu hình build ra thư mục root /public)
├── public/                      (Thư mục chứa bundle production do Vite build ra)
├── scripts/
│   └── rebrand.js               (CLI Script tự động đổi tên thương hiệu)
├── .env.example                 ⭐ Mẫu biến môi trường
├── db.js                        (Kết nối MySQL Connection Pool)
├── ecosystem.config.js          (Cấu hình chạy PM2 Cluster trên VPS)
├── schema.sql                   ⭐ Cấu trúc CSDL chuẩn
├── server.js                    ⭐⭐ Backend Express: Cung cấp toàn bộ REST API
└── hand_over.md                 (Tài liệu này)
```

---

## 🎨 3. QUY TRÌNH 5 BƯỚC ĐỔI THƯƠNG HIỆU & MÀU SẮC (REBRANDING)

Khi bạn muốn biến mã nguồn này thành cổng thông tin của một **Tỉnh thành** (VD: *Đà Nẵng Today*), một **Hiệp hội** (VD: *Hiệp hội Du lịch Việt Nam*) hay một **Tập đoàn**, hãy thực hiện đúng 5 bước sau:

### Bước 1: Khai báo lại cấu hình Frontend (`frontend/src/brand.config.js`)
Mở file [frontend/src/brand.config.js](file:///frontend/src/brand.config.js) và thay đổi các trường dữ liệu:
```javascript
export const brandConfig = {
  // 1. Tên thương hiệu
  brandName: 'DaNang.today',            // Tên đầy đủ
  brandShortName: 'DaNang Today',       // Tên viết tắt
  platformName: 'DaNang Digital Hub',   // Nền tảng
  companyLegalName: 'Hiệp hội Phát triển Kinh tế & Du lịch Đà Nẵng',

  // 2. Định vị & Slogan
  slogan: 'Khám phá thành phố đáng sống — Kết nối giao thương số 1',
  tagline: 'Cổng thông tin & Xúc tiến Đầu tư TP. Đà Nẵng',
  domain: 'danang.today',
  baseUrl: 'https://danang.today',

  // 3. Logo & Hình ảnh
  logo: {
    primary: '/logo_danang.png',         // Đặt ảnh vào frontend/public/
    dark: '/logo_danang_dark.png',
    icon: '/logo_icon.png',
    favicon: '/favicon.png',
  },

  // 4. Bảng màu chủ đạo (Design Tokens)
  colors: {
    primary: '#0284C7',        // Màu chủ đạo mới (VD: Xanh biển)
    primaryHover: '#0369A1',
    primaryDark: '#0C2340',
    primaryLight: '#E0F2FE',
    secondary: '#0F172A',
    accent: '#F59E0B'          // Màu nhấn (VD: Vàng hổ phách)
  },

  // 5. Trợ lý Trí tuệ Nhân tạo AI
  aiAssistant: {
    name: 'AI Danang Assistant',
    title: 'Trợ lý AI Cố vấn Đầu tư & Điểm đến Đà Nẵng',
    welcomeMessage: 'Xin chào! Tôi là Trợ lý AI của DaNang.today...',
    systemRole: 'Bạn là trợ lý AI chuyên nghiệp về thành phố Đà Nẵng...'
  },

  // 6. Liên hệ & Chân trang
  contact: {
    hotline: '0236 3888 999',
    phone: '0905 123 456',
    email: 'contact@danang.today',
    address: '123 Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng',
    copyright: '© 2026 Danang.today — Nền tảng phát triển bởi ADT Quốc tế.'
  }
};
```

### Bước 2: Đồng bộ cấu hình Backend (`config/brand.config.js` & `.env`)
1. Mở file [config/brand.config.js](file:///config/brand.config.js) cập nhật các giá trị tương ứng (`appName`, `brandName`, `ai.systemPrompt`).
2. Mở file `.env` (tạo từ `.env.example`):
```env
PORT=5000
SITE_URL=https://danang.today
BRAND_NAME=DaNang.today
AI_AGENT_NAME=AI Danang Assistant
GEMINI_API_KEY=your_gemini_api_key_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=danang_today_db
```

### Bước 3: Thay thế các tài nguyên ảnh trong `frontend/public/`
Đặt các file hình ảnh mới trùng tên (hoặc đổi tên và cập nhật lại đường dẫn trong `brand.config.js`):
- `logo_doanhnghiepvn.png` ➔ Logo nền sáng của thương hiệu mới.
- `logo_doanhnghiepvn_dark.png` ➔ Logo nền tối (dùng trong Navbar / Banner tối).
- `favicon.png` / `favicon.ico` ➔ Biểu tượng Tab trình duyệt.
- `ai_robot_avatar-removebg.png` ➔ Ảnh đại diện trợ lý ảo AI.

### Bước 4: Tùy biến mã màu toàn cục trong `frontend/src/index.css`
Mở [frontend/src/index.css](file:///frontend/src/index.css), chỉnh sửa nhóm biến `:root`:
```css
:root {
  /* Thay đổi màu chủ đạo (Primary Color) */
  --primary: #0284C7;                      /* Mã màu chính */
  --primary-glow: rgba(2, 132, 199, 0.25);
  --primary-dark: #0369A1;
  --primary-light: #38BDF8;

  /* Font chữ thương hiệu (Nếu muốn đổi font) */
  --font-title: 'Outfit', sans-serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
}
```

### Bước 5: Build và Kiểm tra
```bash
cd frontend
npm run build
cd ..
node server.js
```

---

## 🗺️ 4. BẢN ĐỒ DỮ LIỆU & TÍNH NĂNG TRANG CHỦ (`Home.jsx`)

Trang chủ hiện tại ([frontend/src/pages/Home.jsx](file:///frontend/src/pages/Home.jsx)) chứa **8 phân khu chức năng (Sections)**. Khi thiết kế lại giao diện, bạn chỉ cần thay đổi cấu trúc JSX và style, **giữ nguyên phần state và xử lý logic**:

| STT | Tên Khối (Section) | Dữ liệu / State phụ trách | Logic & Hành vi bắt buộc giữ |
| :---: | :--- | :--- | :--- |
| **1** | **Hero Banner & Search** | `searchQuery`<br>`brandConfig.slogan` | Ô tìm kiếm khi nhấn Enter hoặc bấm icon kính lúp sẽ điều hướng sang `/posts?search=...`<br>Nút CTA cuộn mượt xuống form tư vấn qua hàm `scrollToConsult()`. |
| **2** | **Sự kiện nổi bật & Countdown** | `eventsList` (từ `/api/events`)<br>`timeLeft` (Days, Hours, Min, Sec)<br>`loadingEvents` | Đồng hồ đếm ngược thời gian thực cho sự kiện sắp diễn ra gần nhất.<br>Nút bấm dẫn vào chi tiết `/events/:id` hoặc mở trang sự kiện `/events`. |
| **3** | **Lĩnh vực / Trụ cột Tư vấn** | Danh sách 6 trụ cột (Mảng dữ liệu) | Khi click vào từng trụ cột, gọi `scrollToConsult(pillarTitle)` để tự động cuộn xuống form và điền sẵn trường `serviceNeed`. |
| **4** | **Bảng tin & Cơ hội mới nhất** | `latestPosts` (từ `/api/posts?limit=6`)<br>`loadingPosts` | Hiển thị tin tức động từ CSDL kèm ảnh bìa, chuyên mục, ngày đăng.<br>Click vào bài mở `/posts/:id`. |
| **5** | **Cộng đồng Hội viên tiêu biểu** | `featuredMembers` (từ `/api/members`)<br>`loadingMembers` | Hiển thị các doanh nghiệp hội viên nổi bật.<br>Có cơ chế Fallback mảng tĩnh nếu DB chưa có dữ liệu.<br>Nút mở danh bạ `/members`. |
| **6** | **Khối Đối tác chiến lược (Partner)** | Ảnh `vib-business-card.webp`<br>Link ngoài | Khối giới thiệu đối tác tài chính / ngân hàng.<br>Click mở link ngoài sang tab mới (`target="_blank"`). |
| **7** | **Form Đăng ký Tư vấn & Hợp tác** | `formData`<br>`formSubmitted`<br>`formLoading` | Form thu thập thông tin doanh nghiệp (Tên, SĐT, Email, Tỉnh thành, Nhu cầu).<br>Gửi dữ liệu qua hàm `handleConsultSubmit()` và hiển thị thông báo thành công. |
| **8** | **Hỏi đáp thường gặp (FAQ)** | `activeFaq` (ID đang mở)<br>Mảng câu hỏi/trả lời | Accordion đóng/mở câu hỏi thường gặp.<br>Gợi ý câu hỏi nhanh mở Trợ lý AI `/ai-chat`. |

---

## 🎨 5. HƯỚNG DẪN CHI TIẾT THIẾT KẾ LẠI GIAO DIỆN TRANG CHỦ

Khi bạn muốn vẽ một giao diện Trang chủ hoàn toàn mới (VD: Phong cách Bento Grid, Minimalism, Dark Theme, hoặc Phong cách Tạp chí số), hãy tuân thủ các nguyên tắc sau:

### ✅ NGUYÊN TẮC VÀNG (CÁI CẦN GIỮ NGUYÊN):
1. **Giữ nguyên khối Khởi tạo (Header hooks)**:
   ```javascript
   const { role, user } = useAuth();
   const { currentLang, t } = useTranslation();
   const navigate = useNavigate();
   ```
2. **Giữ nguyên hàm tải dữ liệu `useEffect`**:
   Đoạn code gọi `fetch('/api/posts?limit=6')`, `fetch('/api/events?limit=4')`, `fetch('/api/members?limit=3')` và tính toán `timeLeft` đếm ngược.
3. **Giữ nguyên các Anchor ID**:
   - `id="tu-van"` (dành cho Form đăng ký tư vấn).
   - `id="su-kien"` (dành cho Khối sự kiện).
   *(Bởi vì Navbar và các nút CTA ở các trang khác có thể sử dụng các anchor link này để cuộn màn hình).*
4. **Giữ nguyên cơ chế đa ngôn ngữ**:
   Mọi tiêu đề và văn bản hiển thị nên viết dưới dạng:
   `currentLang === 'en' ? 'English Text' : 'Văn bản Tiếng Việt'`

### 💡 CÁI BẠN ĐƯỢC TỰ DO SÁNG TẠO:
- **Bố cục (Layout)**: Bạn có thể đổi từ dạng dọc truyền thống sang dạng **Bento Grid**, bố trí thẻ bài viết dạng **Carousel (Slider)**, hoặc đổi thẻ sự kiện thành dạng **Timeline**.
- **Hero Banner**: Thay vì banner tĩnh, bạn có thể thiết kế dạng Video background, dạng 3D Canvas, hoặc dạng 2 cột (Trái text & form nhanh, Phải là mô hình đồ họa).
- **Style & Animation**: Bạn có thể viết CSS trực tiếp inline (`style={{...}}`) hoặc tạo thêm file `frontend/src/pages/HomeCustom.css` và import vào `Home.jsx`.
- **Thứ tự các Sections**: Bạn hoàn toàn có thể đảo thứ tự (VD: đưa Khối Tin tức lên trước Sự kiện, hoặc đưa Khối Đối tác lên gần Hero).

---

## 💻 6. KHUNG CODE MẪU (CLEAN SKELETON) CHO `Home.jsx`

Dưới đây là khung code tinh gọn mẫu đã đấu nối sẵn 100% logic, state, và API. Bạn có thể sao chép đoạn này để bắt đầu thiết kế giao diện mới mà không lo lỗi cú pháp:

```jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingAIBot from '../components/FloatingAIBot';
import SEOHead from '../components/SEOHead';
import { brandConfig } from '../brand.config';

export const Home = () => {
  const { currentLang } = useTranslation();
  const navigate = useNavigate();

  // 1. STATE DỮ LIỆU ĐỘNG TỪ BACKEND
  const [latestPosts, setLatestPosts] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [featuredMembers, setFeaturedMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. STATE TÌM KIẾM & FORM TƯ VẤN
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', city: '', serviceNeed: 'Tư vấn chung', notes: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // 3. FETCH DỮ LIỆU TỪ CÁC API CÓ SẴN
  useEffect(() => {
    let isMounted = true;
    const loadHomeData = async () => {
      try {
        const [resPosts, resEvents, resMembers] = await Promise.all([
          fetch('/api/posts?limit=6'),
          fetch('/api/events?limit=4'),
          fetch('/api/members?limit=3')
        ]);
        if (resPosts.ok) {
          const d = await resPosts.json();
          if (d.success && isMounted) setLatestPosts(d.data || []);
        }
        if (resEvents.ok) {
          const d = await resEvents.json();
          if (d.success && isMounted) setEventsList(d.data || []);
        }
        if (resMembers.ok) {
          const d = await resMembers.json();
          if (d.success && isMounted) setFeaturedMembers(d.data || []);
        }
      } catch (err) {
        console.warn('Lỗi tải dữ liệu trang chủ:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadHomeData();
    return () => { isMounted = false; };
  }, []);

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/posts?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Cuộn mượt xuống form tư vấn
  const scrollToConsult = (serviceName = '') => {
    if (serviceName) setFormData(prev => ({ ...prev, serviceNeed: serviceName }));
    const el = document.getElementById('tu-van');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEOHead 
        title={`${brandConfig.brandName} — ${brandConfig.slogan}`}
        description={brandConfig.description}
      />
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* ========================================================
            BẮT ĐẦU VÙNG THIẾT KẾ GIAO DIỆN MỚI CỦA BẠN TẠI ĐÂY
            ======================================================== */}

        {/* SECTION 1: HERO BANNER MỚI */}
        <section className="custom-hero-section">
          <h1>{brandConfig.brandName}</h1>
          <p>{brandConfig.slogan}</p>
          <form onSubmit={handleSearch}>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLang === 'en' ? 'Search topics...' : 'Tìm kiếm nội dung...'}
            />
            <button type="submit">{currentLang === 'en' ? 'Search' : 'Tìm kiếm'}</button>
          </form>
        </section>

        {/* SECTION 2: SỰ KIỆN NỔI BẬT */}
        <section id="su-kien" className="custom-events-section">
          <h2>{currentLang === 'en' ? 'Upcoming Events' : 'Sự kiện sắp diễn ra'}</h2>
          <div className="events-grid">
            {eventsList.map(item => (
              <div key={item.id} className="event-card">
                <h3>{item.title}</h3>
                <Link to={`/events/${item.id}`}>Chi tiết</Link>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: BÀI VIẾT & TIN TỨC */}
        <section className="custom-posts-section">
          <h2>{currentLang === 'en' ? 'Latest Opportunities' : 'Cơ hội giao thương mới'}</h2>
          <div className="posts-grid">
            {latestPosts.map(post => (
              <div key={post.id} className="post-card">
                <h3>{post.title}</h3>
                <Link to={`/posts/${post.id}`}>Xem bài</Link>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: HỘI VIÊN TIÊU BIỂU */}
        <section className="custom-members-section">
          <h2>{currentLang === 'en' ? 'Featured Members' : 'Hội viên tiêu biểu'}</h2>
          <div className="members-grid">
            {featuredMembers.map(m => (
              <div key={m.id} className="member-card">
                <h4>{m.company_name || m.name}</h4>
                <Link to="/members">Xem hồ sơ</Link>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: FORM ĐĂNG KÝ TƯ VẤN (BẮT BUỘC CÓ ID "tu-van") */}
        <section id="tu-van" className="custom-consult-section">
          <h2>{currentLang === 'en' ? 'Register for Consultation' : 'Đăng ký tư vấn doanh nghiệp'}</h2>
          {/* Render form ở đây */}
        </section>

        {/* ========================================================
            KẾT THÚC VÙNG THIẾT KẾ GIAO DIỆN
            ======================================================== */}
      </main>

      <Footer />
      <FloatingAIBot />
    </div>
  );
};

export default Home;
```

---

## 🔌 7. DANH MỤC API BACKEND PHỤC VỤ TRANG CHỦ

Khi cần mở rộng thêm tính năng hoặc tùy biến dữ liệu trên Trang chủ, bạn có thể gọi trực tiếp các Endpoint REST API sau:

| Endpoint | Method | Tham số (Query / Body) | Dữ liệu trả về (JSON) | Mục đích sử dụng |
| :--- | :---: | :--- | :--- | :--- |
| `/api/posts` | `GET` | `limit=6`, `category`, `search` | `{ success: true, data: [...] }` | Lấy danh sách tin tức / bài viết mới nhất |
| `/api/events` | `GET` | `limit=4`, `status=upcoming` | `{ success: true, data: [...] }` | Lấy danh sách sự kiện sắp diễn ra kèm ngày giờ |
| `/api/events/:id` | `GET` | `id` (Param) | `{ success: true, data: {...} }` | Lấy chi tiết 1 sự kiện để hiển thị Modal đăng ký |
| `/api/members` | `GET` | `limit=3`, `featured=true` | `{ success: true, data: [...] }` | Lấy danh sách doanh nghiệp hội viên đã xác thực |
| `/api/consultations` | `POST` | `{ fullName, phone, email, city, serviceNeed, notes }` | `{ success: true, message: "..." }` | Gửi dữ liệu đăng ký form tư vấn vào CSDL |
| `/api/chat` | `POST` | `{ message, history }` | `{ success: true, reply: "..." }` | Gửi câu hỏi đến Trợ lý AI Gemini Flash |
| `/api/brand-config` | `GET` | Không | `{ success: true, config: {...} }` | Lấy cấu hình thương hiệu động từ Backend |

---

## 🚀 8. CHECKLIST KIỂM THỬ & QUY TRÌNH TRIỂN KHAI (DEPLOY)

Sau khi hoàn tất chỉnh sửa thương hiệu hoặc thiết kế lại trang chủ, hãy thực hiện kiểm thử theo checklist 6 bước sau:

### ✅ Checklist Kiểm tra Chức năng:
1. **Kiểm tra Tìm kiếm**: Nhập từ khóa vào ô search ở Hero section ➔ Xác nhận điều hướng sang `/posts?search=...` chính xác.
2. **Kiểm tra Đếm ngược Sự kiện**: Xác nhận bộ đếm ngày / giờ / phút / giây chạy đúng thời gian thực và không bị lỗi `NaN` trên trình duyệt điện thoại (iOS Safari/Android).
3. **Kiểm tra Danh sách Bài viết & Hội viên**: Xác nhận dữ liệu load mượt mà, không bị giật layout khi đang tải (`loading = true`).
4. **Kiểm tra Form Đăng ký Tư vấn**: Điền thử thông tin và bấm Gửi ➔ Kiểm tra hiển thị thông báo thành công và kiểm tra bản ghi được lưu vào bảng trong MySQL.
5. **Kiểm tra Chuyển đổi Ngôn ngữ**: Bấm nút cờ Anh/Việt trên Navbar ➔ Xác nhận toàn bộ tiêu đề trang chủ đổi ngữ nghĩa tức thì.
6. **Kiểm tra Nút Hướng dẫn & Liên kết Footer**: Kiểm tra nút `Hướng dẫn sử dụng` ở Footer mở đúng trang `/guide`.

### 📦 Quy trình Build & Khởi động:
```bash
# 1. Di chuyển vào thư mục frontend và build production
cd frontend
npm run build
cd ..

# 2. Kiểm tra xem file index.html và assets mới đã sinh ra trong thư mục /public hay chưa
ls public/assets

# 3. Chạy kiểm tra local
node server.js
# Truy cập http://localhost:5000 để nghiệm thu

# 4. Khi deploy lên VPS (Production):
pm2 restart ecosystem.config.js --env production
# hoặc
pm2 restart doanhnghiepvn-today
```

---

## 🛠️ 9. CÁC LỖI THƯỜNG GẶP & CÁCH KHẮC PHỤC (TROUBLESHOOTING)

### 1. Màn hình trắng sau khi sửa `Home.jsx`
- **Nguyên nhân**: Lỗi cú pháp JSX (chưa đóng thẻ, thiếu dấu ngoặc nhọn, hoặc truy cập thuộc tính của biến `undefined`).
- **Cách xử lý**: Mở F12 Console trên trình duyệt để đọc dòng báo lỗi cụ thể. Kiểm tra xem các biến như `item.title`, `m.company_name` có được dùng toán tử an toàn chưa (VD: `m?.company_name || ''`).

### 2. Sự kiện Countdown hiển thị `00 Ngày 00 Giờ` hoặc `NaN`
- **Nguyên nhân**: Chuỗi ngày tháng từ MySQL trả về định dạng `YYYY-MM-DD HH:mm:ss` có khoảng trắng khiến hàm `new Date()` trên iOS Safari bị lỗi.
- **Cách xử lý**: Luôn dùng hàm bọc chuyển đổi `parseEventDate(dStr)` có sẵn trong `Home.jsx` để tự động đổi khoảng trắng thành ký tự `T` chuẩn ISO 8601 trước khi parse.

### 3. Đã sửa ảnh Logo trong `public/` nhưng web vẫn hiện ảnh cũ
- **Nguyên nhân**: Trình duyệt hoặc Service Worker (PWA) lưu cache ảnh tĩnh.
- **Cách xử lý**: Nhấn `Ctrl + F5` (hoặc `Cmd + Shift + R`) để Hard Refresh. Nếu vẫn chưa đổi, vào F12 ➔ Tab **Application** ➔ **Storage** ➔ Bấm **Clear site data**.

### 4. Lỗi kết nối Database khi chạy trên môi trường mới
- **Nguyên nhân**: File `.env` chưa có hoặc thông số `DB_HOST`, `DB_USER`, `DB_PASSWORD` chưa khớp với MySQL trên máy chủ mới.
- **Cách xử lý**: Kiểm tra lại file `.env`, chắc chắn đã chạy lệnh `mysql -u root -p < schema.sql` để khởi tạo cấu trúc bảng.

---

*Tài liệu này được tạo tự động và chuẩn hóa bởi ADT Quốc tế. Vui lòng lưu trữ tệp tin này tại thư mục gốc của repository để phục vụ các đợt bàn giao và phát triển tiếp theo.*
