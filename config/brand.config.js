/**
 * BACKEND BRAND CONFIGURATION
 * -------------------------------------------------------------
 * File cấu hình thương hiệu tập trung cho Node.js Express Backend.
 * Tự động đồng bộ với biến môi trường (.env) nếu có.
 */

require('dotenv').config();

const brandConfig = {
  appName: process.env.APP_NAME || 'DoanhNghiepVN.today Platform',
  brandName: process.env.BRAND_NAME || 'DoanhNghiepVN.today',
  brandShortName: process.env.BRAND_SHORT_NAME || 'DoanhNghiepVN',
  siteUrl: process.env.SITE_URL || 'https://doanhnghiepvn.today',
  demoSiteUrl: 'https://demo.edunow.today',
  
  // Nhận diện logo thương hiệu
  logo: {
    primary: '/logo_doanhnghiepvn.png',
    dark: '/logo_doanhnghiepvn_dark.png',
    icon: '/logo_icon.png',
    favicon: '/favicon.png'
  },
  
  // Thông tin thanh toán ngân hàng (Theo hợp đồng số 204-100126/ADT-DNVN)
  bankAccount: {
    bankName: 'Techcombank',
    bankBranch: 'PGD Văn Quán - Hà Đông - Hà Nội',
    accountNumber: '19036730021017',
    accountHolder: 'CONG TY CO PHAN ADT QUOC TE',
    binCode: '970407'
  },

  // AI System Persona Prompt
  ai: {
    agentName: process.env.AI_AGENT_NAME || 'AI Doanh Nghiệp VN',
    systemPrompt: process.env.AI_SYSTEM_PROMPT || 
      "Bạn là trợ lý AI chuyên nghiệp của nền tảng DoanhNghiepVN.today — Hệ sinh thái số Tạp chí Doanh Nghiệp Việt Nam. Kết nối giao thương — Đồng hành cùng doanh nghiệp Việt. Hãy tư vấn chuyên sâu, chuẩn xác, truyền cảm hứng và tận tâm về các giải pháp vay vốn, truyền thông thương hiệu, marketing bán hàng, ứng dụng AI và thực hành ESG."
  },

  // Email Brand Info
  email: {
    fromName: process.env.SMTP_FROM_NAME || 'Ban Biên Tập DoanhNghiepVN.today',
    fromAddress: process.env.SMTP_FROM || `"DoanhNghiepVN.today" <${process.env.SMTP_USER || 'no-reply@doanhnghiepvn.today'}>`,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@doanhnghiepvn.today'
  },

  // Chuyên mục mặc định Doanh Nghiệp Việt Nam theo Hợp đồng
  defaultCategories: [
    { name: 'Sự kiện & Diễn đàn', slug: 'su-kien-dien-dan', icon: '📅', description: 'Hội thảo, diễn đàn kinh tế, xúc tiến thương mại và kết nối B2B' },
    { name: 'Tư vấn Vay vốn & Tài chính', slug: 'tu-van-vay-von', icon: '💰', description: 'Tín dụng ngân hàng, quỹ hỗ trợ SME và cơ cấu tài chính' },
    { name: 'Truyền thông Thương hiệu', slug: 'truyen-thong-thuong-hieu', icon: '📢', description: 'Báo chí, quan hệ công chúng PR và nhận diện thương hiệu' },
    { name: 'Marketing & Bán hàng', slug: 'marketing-ban-hang', icon: '📈', description: 'Chuyển đổi số bán hàng, thương mại điện tử và chuỗi cung ứng' },
    { name: 'Ứng dụng AI & Công nghệ', slug: 'ung-dung-ai-cong-nghe', icon: '🤖', description: 'Trợ lý AI Agent, tự động hóa quy trình và ERP thông minh' },
    { name: 'Thực hành ESG', slug: 'thuc-hanh-esg', icon: '🌱', description: 'Tiêu chuẩn xanh, giảm phát thải Carbon và phát triển bền vững' },
    { name: 'Hiệp hội & Giao thương', slug: 'hiep-hoi-giao-thuong', icon: '🤝', description: 'Hiệp hội doanh nghiệp, danh bạ hội viên và tìm kiếm đối tác' }
  ]
};

module.exports = brandConfig;
