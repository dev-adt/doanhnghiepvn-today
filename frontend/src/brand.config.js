/**
 * BRAND CONFIGURATION (CẤU HÌNH THƯƠNG HIỆU TẬP TRUNG)
 * -------------------------------------------------------------
 * File này quản lý toàn bộ thông tin nhận diện thương hiệu của nền tảng DoanhNghiepVN.today.
 * Đồng bộ theo Hợp đồng cung cấp dịch vụ số 204-100126/ADT-DNVN giữa:
 * - CÔNG TY CỔ PHẦN ADT QUỐC TẾ (Bên A)
 * - TẠP CHÍ DOANH NGHIỆP VIỆT NAM (Bên B)
 */

export const brandConfig = {
  // Thông tin định danh thương hiệu
  brandName: 'DoanhNghiepVN.today', // Tên thương hiệu hiển thị chính
  brandShortName: 'DoanhNghiepVN',  // Tên viết tắt ngắn gọn
  platformName: 'DoanhNghiepVN.today Platform',
  companyLegalName: 'Tạp chí Doanh Nghiệp Việt Nam',
  partnerLegalName: 'Công ty Cổ phần ADT Quốc tế',
  
  // Slogan & Định vị
  slogan: 'Kết nối giao thương — Đồng hành cùng doanh nghiệp Việt',
  tagline: 'Cổng kết nối đa lĩnh vực tích hợp Trí tuệ Nhân tạo AI cho Doanh nghiệp',
  description: 'Hệ sinh thái số Tạp chí Doanh Nghiệp Việt Nam: Tổ chức sự kiện & diễn đàn giao thương, tư vấn tài chính & vay vốn, truyền thông thương hiệu, xúc tiến chuyển đổi số & AI, thực hành phát triển bền vững ESG.',
  
  // Tên miền & Đường dẫn
  domain: 'doanhnghiepvn.today',
  demoDomain: 'demo.edunow.today',
  baseUrl: 'https://doanhnghiepvn.today',
  demoUrl: 'https://demo.edunow.today',
  apiBaseUrl: '/api',

  // Nhận diện hình ảnh & Logo
  logo: {
    primary: '/logo_doanhnghiepvn.png', // Đường dẫn logo chính (trong suốt)
    dark: '/logo_doanhnghiepvn_dark.png', // Logo banner nền tối chuẩn
    icon: '/logo_icon.png', // Biểu tượng icon vuông
    alt: 'DoanhNghiepVN.today Logo',
    favicon: '/favicon.png',
    defaultThumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    fallbackCompanyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80'
  },

  // Hệ màu chủ đạo (CSS Theme Variables - Đồng bộ theo phong cách TECHFEST & Chuyển đổi số)
  colors: {
    primary: '#0F52BA',       // Tech Royal Blue chuẩn Techfest/Doanh nghiệp VN
    primaryHover: '#0A3E9C',  // Deep Royal Blue hover
    primaryDark: '#051336',   // Deep Cosmic Tech Navy
    primaryLight: '#EBF2FF',  // Ice Blue nền phụ thanh lịch
    secondary: '#0A2568',     // Cosmic Navy
    accent: '#00E5FF',        // Electric Neon Cyan điểm nhấn công nghệ & Phù Đổng
    accentGlow: 'rgba(0, 229, 255, 0.35)',
    gold: '#F59E0B',          // Vàng hổ phách rực rỡ "Khởi nghiệp"
    goldLight: '#FBBF24',     // Vàng sáng
    goldGlow: 'rgba(245, 158, 11, 0.35)',
    emerald: '#10B981',       // Xanh chuyển đổi số ESG & Tre Việt Nam
    darkBg: '#051336',
    darkCard: '#0A2568'
  },

  // Trợ lý Trí tuệ Nhân tạo (AI Assistant)
  aiAssistant: {
    name: 'AI Doanh Nghiệp VN',
    shortName: 'DNVN AI',
    title: 'Trợ lý AI Tư vấn Doanh nghiệp & Xúc tiến Giao thương',
    avatar: '/ai_robot_avatar-removebg.png',
    welcomeMessage: 'Xin chào! Tôi là Trợ lý AI của DoanhNghiepVN.today. Tôi có thể hỗ trợ quý doanh nghiệp tìm kiếm cơ hội giao thương, tư vấn hồ sơ vay vốn, truyền thông thương hiệu, chuyển đổi số AI và kết nối đối tác 24/7.',
    systemRole: 'Bạn là trợ lý AI chuyên nghiệp của nền tảng DoanhNghiepVN.today — Hệ sinh thái số Tạp chí Doanh Nghiệp Việt Nam. Tư vấn chuẩn xác, nhiệt tình về phát triển doanh nghiệp, vay vốn tín dụng, truyền thông, thực hành ESG và ứng dụng AI.',
    quickSuggestions: [
      'Tìm hiểu các sự kiện và diễn đàn giao thương sắp diễn ra',
      'Tư vấn gói hỗ trợ vay vốn ngân hàng và quỹ hỗ trợ SME',
      'Cách thức đăng ký thành viên Hiệp hội Doanh nghiệp',
      'Giải pháp ứng dụng Trí tuệ nhân tạo (AI) cho doanh nghiệp'
    ]
  },

  // Thông tin liên hệ & Văn phòng (Theo hợp đồng số 204-100126/ADT-DNVN)
  contact: {
    hotline: '024 2216 9595',
    phone: '0912 480 246',
    techHotline: '0986 354 152',
    email: 'bbt@doanhnghiepvn.today',
    supportEmail: 'contact@doanhnghiepvn.today',
    address: 'A1.4 (A5A) Khu Liền kề 671 Hoàng Hoa Thám, P. Ngọc Hà, TP. Hà Nội',
    techAddress: '26 TT23 Khu đô thị Văn Phú, P. Kiến Hưng, Hà Nội',
    workingHours: '08:00 - 17:30 (Thứ 2 - Thứ 6)',
    copyright: '© 2026 Tạp chí Doanh Nghiệp Việt Nam — Hệ thống xây dựng & chuyển giao bởi ADT Quốc tế.'
  },

  // Thông tin thanh toán / Chuyển khoản sự kiện (Theo Hợp đồng)
  bankAccount: {
    bankName: 'Techcombank',
    bankBranch: 'PGD Văn Quán - Hà Đông - Hà Nội',
    accountNumber: '19036730021017',
    accountHolder: 'CONG TY CO PHAN ADT QUOC TE',
    binCode: '970407' // Mã BIN VietQR của Techcombank
  },

  // Mạng xã hội
  socials: {
    facebook: 'https://facebook.com/doanhnghiepvn.today',
    youtube: 'https://youtube.com/@doanhnghiepvn.today',
    zalo: 'https://zalo.me/doanhnghiepvn',
    linkedin: 'https://linkedin.com/company/doanhnghiepvn'
  },

  // Thông tin Đăng ký Hội viên & Gói dịch vụ
  membership: {
    benefitsTitle: 'Quyền lợi Hội viên DoanhNghiepVN.today',
    badgeText: 'Mạng lưới cộng đồng doanh nghiệp toàn quốc',
    tiers: [
      { id: 'Standard', name: 'Standard Member', badge: 'Hội viên Tiêu chuẩn' },
      { id: 'Silver', name: 'Silver Partner', badge: 'Đối tác Bạc' },
      { id: 'Gold', name: 'Gold Partner', badge: 'Đối tác Vàng' },
      { id: 'Diamond', name: 'Diamond VIP', badge: 'Đối tác Kim Cương' }
    ]
  }
};

export const BRAND_CONFIG = brandConfig;
export default brandConfig;
