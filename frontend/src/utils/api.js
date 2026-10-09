/**
 * Fast & Resilient API Client with strict timeouts & fallbacks
 * Prevents endless loading spinners when backend/network is slow or recovering.
 */

export const DEFAULT_TIMEOUT_MS = 10000;

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Yêu cầu mạng hết thời gian chờ (${timeoutMs}ms): ${url}`);
    }
    throw error;
  }
}

export async function fetchJsonWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const res = await fetchWithTimeout(url, options, timeoutMs);
  if (!res.ok) {
    let errMsg = `HTTP Error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.error) errMsg = errJson.error;
    } catch (_) {}
    throw new Error(errMsg);
  }
  return await res.json();
}

/**
 * Fallback data so the site immediately displays rich content even if DB is loading or empty
 */
export const FALLBACK_POSTS = [
  {
    id: 'fb-post-1',
    title: 'Thúc đẩy kết nối, xây dựng năng lực tiếp cận vốn tín dụng cho SME và hộ kinh doanh',
    slug: 'thuc-day-ket-noi-xay-dung-nang-luc-tiep-can-von-tin-dung-cho-sme-va-ho-kinh-doanh-20260721095902983',
    category: 'Tư vấn Vay vốn & Tài chính',
    sub_category: 'Tín dụng Doanh nghiệp',
    summary: 'Chương trình hợp tác thúc đẩy kết nối các tổ chức tài chính, ngân hàng thương mại và cộng đồng SME nhằm tháo gỡ điểm nghẽn nguồn vốn tín dụng năm 2026.',
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    author_name: 'Ban Biên tập DoanhNghiepVN.today',
    company_name: 'Tạp chí Doanh Nghiệp Việt Nam',
    company_tier: 'Diamond',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    views: 1240,
    is_featured: 1
  },
  {
    id: 'fb-post-2',
    title: 'Hệ sinh thái kết nối các nguồn lực hỗ trợ doanh nghiệp ứng dụng AI & công nghệ',
    slug: 'ho-tro-doanh-nghiep-ung-dung-cong-nghe-tang-kha-nang-tiep-can-von-20260911105032450',
    category: 'Ứng dụng AI & Công nghệ',
    sub_category: 'Chuyển đổi số',
    summary: 'Giải pháp toàn diện giúp doanh nghiệp vừa và nhỏ tích hợp trí tuệ nhân tạo, tối ưu hóa quy trình quản trị và nâng cao xếp hạng tín nhiệm tài chính.',
    image_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
    author_name: 'Viện Đổi mới Sáng tạo & AI',
    company_name: 'Công ty Cổ phần ADT Quốc tế',
    company_tier: 'Diamond',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    views: 980,
    is_featured: 1
  },
  {
    id: 'fb-post-3',
    title: 'Diễn đàn Doanh nghiệp Việt Nam: Nâng cao năng lực cạnh tranh trong kỷ nguyên số',
    slug: 'dien-dan-doanh-nghiep-viet-nam-nang-cao-nang-luc-canh-tranh',
    category: 'Sự kiện & Diễn đàn',
    sub_category: 'Xúc tiến Thương mại',
    summary: 'Tập hợp hơn 500 lãnh đạo doanh nghiệp hàng đầu cả nước thảo luận về chiến lược mở rộng thị trường xuất khẩu và chuỗi cung ứng bền vững.',
    image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    author_name: 'Ban Thư ký Diễn đàn',
    company_name: 'Tạp chí Doanh Nghiệp Việt Nam',
    company_tier: 'Gold',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    views: 750,
    is_featured: 0
  },
  {
    id: 'fb-post-4',
    title: 'Hướng dẫn thực hành bộ chỉ số ESG dành cho doanh nghiệp sản xuất và thương mại',
    slug: 'huong-dan-thuc-hanh-bo-chi-so-esg-danh-cho-doanh-nghiep',
    category: 'Thực hành ESG',
    sub_category: 'Tiêu chuẩn Xanh',
    summary: 'Bộ cẩm nang thực hành phát triển bền vững, tối ưu hóa năng lượng tái tạo và giảm phát thải carbon theo định hướng Net-Zero 2050.',
    image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    author_name: 'Hội đồng Cố vấn ESG',
    company_name: 'Liên minh Doanh nghiệp Bền vững',
    company_tier: 'Gold',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    views: 610,
    is_featured: 0
  }
];

export const FALLBACK_EVENTS = [
  {
    id: 'fb-evt-1',
    title: 'Diễn đàn Xúc tiến Giao thương Doanh nghiệp Việt Nam & Quốc tế 2026',
    slug: 'dien-dan-xuc-tien-giao-thuong-doanh-nghiep-viet-nam-2026',
    short_desc: 'Sự kiện kết nối 300+ doanh nghiệp hàng đầu, quỹ đầu tư và ngân hàng thương mại.',
    event_date: new Date(Date.now() + 86400000 * 15).toISOString(),
    location: 'Trung tâm Hội nghị Quốc tế ICC, Ba Đình, Hà Nội',
    organizer: 'Tạp chí Doanh Nghiệp Việt Nam & ADT Group',
    image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    is_paid: 0,
    price: 0,
    remaining_tickets: 180,
    registered_count: 120
  },
  {
    id: 'fb-evt-2',
    title: 'Hội thảo: Giải pháp Tiếp cận Vốn Tín dụng và Bảo lãnh Vay vốn SME',
    slug: 'hoi-thao-giai-phap-tiep-can-von-tin-dung-sme',
    short_desc: 'Tư vấn trực tiếp hồ sơ vay vốn, giải ngân nhanh và hỗ trợ lãi suất từ các ngân hàng đối tác.',
    event_date: new Date(Date.now() + 86400000 * 22).toISOString(),
    location: 'Hội trường Tầng 5, Khách sạn Daewoo Hà Nội',
    organizer: 'Ban Tư vấn Tài chính & Tiếp cận Vốn Doanh Nghiệp',
    image_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    is_paid: 0,
    price: 0,
    remaining_tickets: 95,
    registered_count: 55
  }
];

export const FALLBACK_MEMBERS = [
  {
    id: 1,
    name: 'Công ty Cổ phần Công nghệ & Dữ liệu ADT Quốc tế',
    tier: 'Diamond',
    industry: 'Công nghệ thông tin & Trí tuệ nhân tạo',
    email: 'contact@adt.vn',
    description: 'Đơn vị tiên phong chuyển giao giải pháp chuyển đổi số, nền tảng AI Agent và hệ sinh thái số doanh nghiệp.',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Ngân hàng Thương mại Cổ phần Ngoại thương Việt Nam',
    tier: 'Diamond',
    industry: 'Tài chính — Ngân hàng',
    email: 'sme-support@bank.vn',
    description: 'Đối tác chiến lược cung ứng các gói tín dụng ưu đãi, thanh toán số và bảo lãnh vay vốn cho doanh nghiệp SME.',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Tập đoàn Nông nghiệp Công nghệ cao & Xuất khẩu Xanh',
    tier: 'Gold',
    industry: 'Nông nghiệp & Chế biến thực phẩm',
    email: 'info@agritech.vn',
    description: 'Đơn vị xuất khẩu nông sản đạt chuẩn ESG quốc tế, mở rộng kết nối giao thương chuỗi cung ứng toàn cầu.',
    created_at: new Date().toISOString()
  }
];
