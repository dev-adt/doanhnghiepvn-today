/**
 * Cấu hình Chuyên mục chính và Lĩnh vực con mặc định cho DoanhNghiepVN.today
 * (Đồng bộ theo Hạng mục triển khai Hợp đồng ADT - Tạp chí Doanh Nghiệp VN)
 * Lưu ý: Trong ứng dụng thực tế, dữ liệu được tải động từ API /api/categories (Quản lý chuyên mục trong Admin).
 */

export const CATEGORIES_DATA = [
  {
    id: 'su-kien-dien-dan',
    name: 'Sự kiện & Diễn đàn',
    name_en: 'Events & Forums',
    order_index: 1,
    subcategories: [
      'Hội thảo & Tọa đàm',
      'Diễn đàn kinh tế',
      'Xúc tiến thương mại',
      'Giao thương B2B'
    ]
  },
  {
    id: 'tu-van-vay-von',
    name: 'Tư vấn Vay vốn & Tài chính',
    name_en: 'Loan & Financial Consulting',
    order_index: 2,
    subcategories: [
      'Tín dụng ngân hàng',
      'Quỹ hỗ trợ SME',
      'Vốn đầu tư khởi nghiệp',
      'Cơ cấu tài chính doanh nghiệp'
    ]
  },
  {
    id: 'truyen-thong-thuong-hieu',
    name: 'Truyền thông Thương hiệu',
    name_en: 'Brand & Communication',
    order_index: 3,
    subcategories: [
      'Báo chí & Truyền thông',
      'Nhận diện thương hiệu',
      'Chiến dịch PR',
      'Quản trị khủng hoảng truyền thông'
    ]
  },
  {
    id: 'marketing-ban-hang',
    name: 'Marketing & Bán hàng',
    name_en: 'Marketing & Sales',
    order_index: 4,
    subcategories: [
      'Digital Marketing & SEO',
      'Thương mại điện tử',
      'Kênh phân phối & Chuỗi cung ứng',
      'Tối ưu chuyển đổi'
    ]
  },
  {
    id: 'ung-dung-ai-cong-nghe',
    name: 'Ứng dụng AI & Công nghệ',
    name_en: 'AI & Technology Application',
    order_index: 5,
    subcategories: [
      'Trợ lý AI & Multi-Agent',
      'Tự động hóa doanh nghiệp',
      'ERP & CRM thông minh',
      'Chuyển đổi số doanh nghiệp'
    ]
  },
  {
    id: 'thuc-hanh-esg',
    name: 'Thực hành ESG & Phát triển bền vững',
    name_en: 'ESG & Sustainable Development',
    order_index: 6,
    subcategories: [
      'Chuyển đổi xanh & Năng lượng sạch',
      'Tiêu chuẩn & Báo cáo ESG',
      'Giảm phát thải Carbon',
      'Trách nhiệm xã hội CSR'
    ]
  },
  {
    id: 'hiep-hoi-giao-thuong',
    name: 'Hiệp hội & Giao thương',
    name_en: 'Business Association & Networking',
    order_index: 7,
    subcategories: [
      'Hiệp hội Doanh nghiệp',
      'Danh bạ Hội viên',
      'Tìm kiếm đối tác',
      'Cơ hội đầu tư & Hợp tác'
    ]
  }
];

export const ALL_CATEGORIES = CATEGORIES_DATA.map(c => c.name);

export const getSubcategoriesByCategory = (categoryName) => {
  const cat = CATEGORIES_DATA.find(c => c.name === categoryName);
  return cat ? cat.subcategories : [];
};

export const CATEGORY_LABELS = {
  'Sự kiện & Diễn đàn': { vi: 'Sự kiện & Diễn đàn', en: 'Events & Forums' },
  'Tư vấn Vay vốn & Tài chính': { vi: 'Tư vấn Vay vốn', en: 'Loan & Finance' },
  'Truyền thông Thương hiệu': { vi: 'Truyền thông', en: 'Brand & PR' },
  'Marketing & Bán hàng': { vi: 'Marketing & Bán hàng', en: 'Marketing & Sales' },
  'Ứng dụng AI & Công nghệ': { vi: 'Ứng dụng AI', en: 'AI & Tech' },
  'Thực hành ESG & Phát triển bền vững': { vi: 'Thực hành ESG', en: 'ESG Practice' },
  'Hiệp hội & Giao thương': { vi: 'Hiệp hội & Đối tác', en: 'Associations' }
};

export const getCategoryLabel = (cat, lang = 'vi') => {
  if (!cat) return '';
  if (typeof cat === 'object') {
    if (lang === 'en' && cat.name_en) return String(cat.name_en);
    if (cat.name) {
      if (lang === 'en' && CATEGORY_LABELS[cat.name]?.en) {
        return CATEGORY_LABELS[cat.name].en;
      }
      return String(cat.name);
    }
    return '';
  }
  if (typeof cat === 'string') {
    if (lang === 'en' && CATEGORY_LABELS[cat]?.en) {
      return CATEGORY_LABELS[cat].en;
    }
    return cat;
  }
  return String(cat);
};

export const getSubCategoryLabel = (sub, lang = 'vi') => {
  if (!sub) return '';
  if (typeof sub === 'object') {
    if (lang === 'en' && sub.name_en) return String(sub.name_en);
    if (sub.name) return String(sub.name);
    return '';
  }
  return String(sub);
};

export default CATEGORIES_DATA;
