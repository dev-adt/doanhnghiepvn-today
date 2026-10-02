# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG DOANHNGHIEPVN.TODAY

Tài liệu hướng dẫn triển khai nền tảng **DoanhNghiepVN.today** (Tạp chí Doanh Nghiệp Việt Nam) lên môi trường thử nghiệm **`demo.edunow.today`**, sau đó chuyển đổi sang tên miền chính thức **`https://doanhnghiepvn.today/`**.

---

## 1. TỔNG QUAN KIẾN TRÚC & YÊU CẦU HỆ THỐNG

- **Backend**: Node.js (v18+) + Express REST API (Cổng mặc định: `3024`).
- **Frontend**: Single Page Application (React 19 + Vite), đã được build sẵn vào thư mục `public/` (Express trực tiếp phục vụ static files).
- **Cơ sở dữ liệu**: MySQL 8.0+ (hoặc MariaDB 10.5+), có cơ chế tự động migration & seeding dữ liệu mẫu.
- **Tiến trình chạy nền**: PM2 process manager (`ecosystem.config.js`).
- **Web Server / Reverse Proxy**: Nginx (hoặc aaPanel Nginx / OpenResty).
- **Tính năng đặc biệt**: 
  - Progressive Web App (PWA) có Service Worker (`sw.js`) & `manifest.json`.
  - Quản lý sự kiện, vé điện tử QR Code, quét check-in và thanh toán tự động VietQR (Techcombank 19036730021017).
  - Điều hướng Header 100% động từ cơ sở dữ liệu phân cấp Admin.

---

## 2. BƯỚC 1: TRIỂN KHAI LÊN TÊN MIỀN TEST (demo.edunow.today)

### 2.1. Cấu hình bản ghi DNS tên miền
Trên trang quản lý DNS của `edunow.today`, thêm bản ghi:
```text
Loại bản ghi: A
Tên host: demo
Giá trị trỏ về: <Địa_chỉ_IP_Server_VPS>
TTL: Mặc định (300 hoặc Tự động)
```

---

### 2.2. Kéo mã nguồn về Server
Đăng nhập SSH vào server VPS (hoặc mở Terminal trên aaPanel):

```bash
# Di chuyển vào thư mục chứa web (ví dụ: /www/wwwroot trên aaPanel)
cd /www/wwwroot

# Clone mã nguồn từ repository chính thức
git clone https://github.com/dev-adt/doanhnghiepvn-today.git demo.edunow.today

# Đi vào thư mục dự án
cd demo.edunow.today
```

---

### 2.3. Cài đặt thư viện dependencies
```bash
# Cài đặt các gói phụ thuộc Backend
npm install --production

# (Tùy chọn) Nếu sau này muốn build lại frontend trực tiếp trên server:
# npm --prefix frontend install
# npm --prefix frontend run build
```
*(Lưu ý: Toàn bộ frontend đã được build sẵn vào thư mục `public/`, bạn không bắt buộc phải cài node_modules của frontend nếu chỉ chạy production).*

---

### 2.4. Cấu hình biến môi trường `.env`
Tạo file `.env` từ file mẫu:
```bash
cp .env.example .env
nano .env
```
Nội dung file `.env` cấu hình cho domain demo:
```ini
PORT=3024
NODE_ENV=production
APP_NAME=doanhnghiepvn-today
DOMAIN=demo.edunow.today

# Cấu hình Cơ sở dữ liệu MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=doanhnghiep_user
DB_PASSWORD=MatKhauBaoMatCuaBan_2026
DB_NAME=doanhnghiepvn_db

# Bảo mật JWT
JWT_SECRET=dvn_super_secret_jwt_key_2026_adt_group

# Thông tin tài khoản ngân hàng nhận thanh toán vé sự kiện
BANK_ID=970407
BANK_NAME=Techcombank
BANK_ACCOUNT_NO=19036730021017
BANK_ACCOUNT_NAME=CONG TY CO PHAN ADT QUOC TE
```

---

### 2.5. Khởi tạo Cơ sở dữ liệu MySQL
Tạo Database trên MySQL (hoặc thông qua giao diện aaPanel Database):
```bash
mysql -u root -p
```
```sql
CREATE DATABASE doanhnghiepvn_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'doanhnghiep_user'@'localhost' IDENTIFIED BY 'MatKhauBaoMatCuaBan_2026';
GRANT ALL PRIVILEGES ON doanhnghiepvn_db.* TO 'doanhnghiep_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
Import cấu trúc bảng và dữ liệu mẫu ban đầu:
```bash
mysql -u doanhnghiep_user -p doanhnghiepvn_db < schema.sql
```
*(Hệ thống đã có sẵn lệnh INSERT các chuyên mục chuẩn theo hợp đồng và sự kiện demo).*

---

### 2.6. Khởi chạy ứng dụng với PM2
```bash
# Khởi động ứng dụng bằng PM2
pm2 start ecosystem.config.js

# Hoặc khởi động trực tiếp:
# pm2 start server.js --name doanhnghiepvn-today

# Lưu trạng thái để tự động khởi động khi reboot server
pm2 save
pm2 startup
```
Kiểm tra trạng thái:
```bash
pm2 status
pm2 logs doanhnghiepvn-today --lines 20
```

---

### 2.7. Cấu hình Nginx Reverse Proxy (Có hỗ trợ PWA & WebSockets)

Tạo file cấu hình vhost Nginx (hoặc dán vào phần cấu hình của Site trên aaPanel):

```nginx
server {
    listen 80;
    server_name demo.edunow.today;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name demo.edunow.today;

    # Đường dẫn SSL Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/demo.edunow.today/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/demo.edunow.today/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip nén dữ liệu tối ưu tốc độ
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Cấu hình cache đặc biệt cho PWA Service Worker & Manifest (Bắt buộc không cache lâu)
    location ~* ^/(sw\.js|manifest\.json)$ {
        proxy_pass http://127.0.0.1:3024;
        proxy_set_header Host $host;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
    }

    # Proxy toàn bộ request vào Node.js Backend
    location / {
        proxy_pass http://127.0.0.1:3024;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    # Cache tài nguyên tĩnh (ảnh, font, css, js)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2|woff|ttf|svg)$ {
        proxy_pass http://127.0.0.1:3024;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```
*Lưu ý: Bắt buộc phải cài đặt SSL (HTTPS) vì trình duyệt chỉ cho phép kích hoạt tính năng **PWA Service Worker** và **Quét Camera QR Code** trên giao thức HTTPS an toàn.*

---

## 3. BẢNG KIỂM TRA TÍNH NĂNG (TEST CHECKLIST) TRÊN DEMO

Sau khi deploy xong lên `https://demo.edunow.today`, thực hiện kiểm tra các hạng mục sau:

| STT | Hạng mục kiểm tra | Cách thực hiện | Kết quả mong đợi |
| :---: | :--- | :--- | :--- |
| **1** | **Điều hướng Menu Động** | Đăng nhập Admin -> vào Quản lý chuyên mục -> Thêm/sửa thứ tự chuyên mục | Menu trên Header cập nhật theo đúng thứ tự và danh mục con phân cấp mà không bị cố định. |
| **2** | **Trang chủ DoanhNghiepVN** | Truy cập `https://demo.edunow.today/` | Hiển thị nhận diện thương hiệu mới, 6 trụ cột tư vấn, tin bài mới, sự kiện nổi bật có đếm ngược. |
| **3** | **Sự kiện & Đếm ngược** | Xem chi tiết sự kiện `https://demo.edunow.today/su-kien/su-kien-demo` | Bộ đếm thời gian nhảy từng giây (NGÀY - GIỜ - PHÚT - GIÂY), hiển thị số vé còn lại chính xác (98/100). |
| **4** | **Đăng ký nhận vé QR** | Điền form đăng ký tham gia sự kiện | Cấp mã vé dạng `DNVN-XXXXXX`, hiển thị Popup mã QR Code vé và mã VietQR Techcombank (nếu có phí). |
| **5** | **Check-in Admin** | Vào `admin?tab=events`, bấm nút `# Check-in` | Quét mã QR bằng camera điện thoại/webcam hoặc nhập thủ công mã vé -> Báo Check-in thành công. |
| **6** | **Tạo sự kiện trong Admin** | Bấm `+ Tạo sự kiện`, điền thông tin, ảnh, bật toggle "Có thu phí", "Công khai" | Sự kiện mới lưu vào DB và xuất hiện tức thì ngoài trang chủ. |
| **7** | **PWA (Progressive Web App)** | Mở bằng Chrome / Safari trên Mobile | Xuất hiện nút "Cài đặt ứng dụng" / "Thêm vào MH chính", mở độc lập như App native. |

---

## 4. HƯỚNG DẪN CHUYỂN ĐỔI SANG TÊN MIỀN CHÍNH (https://doanhnghiepvn.today/)

Khi quá trình kiểm thử trên `demo.edunow.today` hoàn tất và nghiệm thu xong, bạn chỉ cần thực hiện 4 bước đơn giản để trỏ sang domain chính thức:

### Bước 1: Trỏ DNS tên miền chính
Trên trang quản lý DNS của domain `doanhnghiepvn.today`:
- Thêm bản ghi **A** cho `@` trỏ về `<Địa_chỉ_IP_Server>`.
- Thêm bản ghi **A** hoặc **CNAME** cho `www` trỏ về `doanhnghiepvn.today`.

### Bước 2: Cập nhật file `.env`
Mở file `.env` trên server và cập nhật lại:
```ini
DOMAIN=doanhnghiepvn.today
```

### Bước 3: Cập nhật cấu hình Nginx & Cấp SSL
Trong cấu hình Nginx của site:
- Đổi `server_name demo.edunow.today;` thành:
  ```nginx
  server_name doanhnghiepvn.today www.doanhnghiepvn.today;
  ```
- Cấp mới chứng chỉ SSL cho domain mới:
  ```bash
  certbot --nginx -d doanhnghiepvn.today -d www.doanhnghiepvn.today
  ```
- Kiểm tra cú pháp và reload lại Nginx:
  ```bash
  nginx -t && systemctl reload nginx
  ```

### Bước 4: Khởi động lại ứng dụng
```bash
pm2 reload doanhnghiepvn-today
```

---

## 5. THÔNG TIN HỖ TRỢ KỸ THUẬT

- **Đơn vị phát triển & chuyển giao**: Công ty Cổ phần ADT Quốc tế
- **Hotline kỹ thuật**: 098.123.4567 / 091.234.5678
- **Email hỗ trợ**: contact@adtgroup.today
