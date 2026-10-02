import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingAIBot from '../components/FloatingAIBot';
import SEOHead from '../components/SEOHead';
import { BRAND_CONFIG } from '../brand.config';

export const Home = () => {
  const { role } = useAuth();
  const { currentLang, t } = useTranslation();
  const navigate = useNavigate();

  // Search & AI State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    serviceNeed: 'Tư vấn vốn & tiếp cận tín dụng',
    companyName: '',
    notes: '',
    agreeTerms: true
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Dynamic Live Posts
  const [latestPosts, setLatestPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Dynamic Live Events
  const [eventsList, setEventsList] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Dynamic Live Members
  const [featuredMembers, setFeaturedMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Live countdown timer for featured event
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    let isMounted = true;
    const fetchHomeData = async () => {
      try {
        // 1. Fetch posts
        const resPosts = await fetch('/api/posts?limit=6');
        if (resPosts.ok) {
          const dataPosts = await resPosts.json();
          if (dataPosts.success && Array.isArray(dataPosts.data) && isMounted) {
            setLatestPosts(dataPosts.data);
          }
        }

        // 2. Fetch events
        const resEvents = await fetch('/api/events?limit=4');
        if (resEvents.ok) {
          const dataEvents = await resEvents.json();
          if (dataEvents.success && Array.isArray(dataEvents.data) && isMounted) {
            setEventsList(dataEvents.data);
          }
        }

        // 3. Fetch top members
        const resMembers = await fetch('/api/members?limit=3');
        if (resMembers.ok) {
          const dataMembers = await resMembers.json();
          if (dataMembers.success && Array.isArray(dataMembers.data) && isMounted) {
            setFeaturedMembers(dataMembers.data);
          }
        }
      } catch (e) {
        console.warn('Could not fetch homepage data:', e);
      } finally {
        if (isMounted) {
          setLoadingPosts(false);
          setLoadingEvents(false);
          setLoadingMembers(false);
        }
      }
    };
    fetchHomeData();
    return () => { isMounted = false; };
  }, []);

  // Safe Date parsing helper for all browsers and MySQL datetime format
  const parseEventDate = (dStr) => {
    if (!dStr) return null;
    if (dStr instanceof Date) return isNaN(dStr.getTime()) ? null : dStr;
    let s = String(dStr).trim();
    if (s.includes(' ') && !s.includes('T')) {
      s = s.replace(' ', 'T');
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatEventDateTime = (dStr) => {
    const d = parseEventDate(dStr);
    if (!d) return 'Đang cập nhật';
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${dayNames[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  // Select top featured event: prioritize upcoming future event, or fallback to first event
  const nowMs = Date.now();
  const topUpcoming = eventsList.find(e => {
    const d = parseEventDate(e.event_date || e.start_time || e.date);
    return d && d.getTime() > nowMs;
  });
  const topEvent = topUpcoming || (eventsList.length > 0 ? eventsList[0] : null);
  const otherEvents = topEvent ? eventsList.filter(e => e.id !== topEvent.id).slice(0, 3) : eventsList.slice(0, 3);

  // Live countdown timer calculation for the top upcoming event
  useEffect(() => {
    if (!topEvent) return;
    const rawDate = topEvent.event_date || topEvent.start_time || topEvent.date;
    const targetDate = parseEventDate(rawDate);
    if (!targetDate) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true, label: 'Đang cập nhật' });
      return;
    }

    const calculateTime = () => {
      const now = Date.now();
      const diff = targetDate.getTime() - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
          isPassed: false,
          label: 'Sự kiện bắt đầu sau'
        });
      } else {
        const endDate = parseEventDate(topEvent.end_date);
        if (endDate && endDate.getTime() > now) {
          const endDiff = endDate.getTime() - now;
          setTimeLeft({
            days: Math.floor(endDiff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((endDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((endDiff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((endDiff % (1000 * 60)) / 1000),
            isPassed: false,
            isOngoing: true,
            label: 'Đang diễn ra • Kết thúc sau'
          });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true, label: 'Sự kiện đã diễn ra' });
        }
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [topEvent]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/posts?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAskAI = () => {
    if (searchQuery.trim()) {
      navigate(`/ai-chat?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/ai-chat');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.companyName) {
      alert('Vui lòng điền họ tên, số điện thoại và tên doanh nghiệp (*).');
      return;
    }
    if (!formData.agreeTerms) {
      alert('Vui lòng đồng ý với điều khoản bảo mật dữ liệu.');
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          memberType: formData.serviceNeed,
          companyName: formData.companyName,
          notes: `Lĩnh vực tư vấn: ${formData.serviceNeed}. Ghi chú: ${formData.notes || 'Không có'}`
        })
      });
      if (res.ok) {
        setFormSubmitted(true);
      } else {
        const errJson = await res.json();
        alert('Lỗi: ' + (errJson.error || 'Không thể gửi form.'));
      }
    } catch (err) {
      console.error('Submit form error:', err);
      alert('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setFormLoading(false);
    }
  };

  // 6 Trụ cột Tư vấn Hỗ trợ Doanh nghiệp
  const CONSULTING_SERVICES = [
    {
      id: 'von',
      title: 'Tư vấn Vốn & Tín dụng',
      desc: 'Hỗ trợ chuẩn bị hồ sơ tài chính, báo cáo dòng tiền và kết nối tiếp cận các gói tín dụng ưu đãi từ các ngân hàng hàng đầu.',
      icon: 'fa-solid fa-vault',
      color: '#0D9488',
      serviceKey: 'Tư vấn vốn & tiếp cận tín dụng'
    },
    {
      id: 'thuong-hieu',
      title: 'Truyền thông & Thương hiệu',
      desc: 'Xây dựng uy tín doanh nghiệp, bảo trợ truyền thông báo chí, xuất bản phóng sự trên Tạp chí Doanh Nghiệp Việt Nam.',
      icon: 'fa-solid fa-bullhorn',
      color: '#0284C7',
      serviceKey: 'Truyền thông & Thương hiệu'
    },
    {
      id: 'marketing',
      title: 'Marketing & Bán hàng',
      desc: 'Chiến lược tiếp thị đa kênh, tối ưu phễu bán hàng B2B, phát triển kênh phân phối nội địa và xúc tiến xuất khẩu.',
      icon: 'fa-solid fa-chart-line',
      color: '#E11D48',
      serviceKey: 'Marketing & Bán hàng'
    },
    {
      id: 'ai-tech',
      title: 'Ứng dụng AI & Chuyển đổi số',
      desc: 'Triển khai Trợ lý AI Agent, tự động hóa quy trình nghiệp vụ, số hóa điều hành doanh nghiệp với hệ thống Orion ERP thông minh.',
      icon: 'fa-solid fa-microchip',
      color: '#7C3AED',
      serviceKey: 'Ứng dụng AI & Chuyển đổi số'
    },
    {
      id: 'esg',
      title: 'Thực hành ESG & Chứng nhận Xanh',
      desc: 'Lộ trình chuyển đổi xanh, kiểm kê khí nhà kính, xây dựng báo cáo phát triển bền vững đạt chuẩn thâm nhập thị trường quốc tế.',
      icon: 'fa-solid fa-leaf',
      color: '#16A34A',
      serviceKey: 'Thực hành ESG'
    },
    {
      id: 'b2b-networking',
      title: 'Kết nối Công nghệ & Đối tác B2B',
      desc: 'Giao thương 1-1, tìm kiếm nhà cung cấp, tham gia các đoàn xúc tiến thương mại và chuỗi cung ứng chiến lược trong và ngoài nước.',
      icon: 'fa-solid fa-handshake',
      color: '#D97706',
      serviceKey: 'Kết nối Công nghệ & Đối tác B2B'
    }
  ];

  // 5 FAQs DoanhNghiepVN
  const FAQS = [
    {
      q: 'DoanhNghiepVN.today là gì và hỗ trợ những gì cho doanh nghiệp?',
      a: 'DoanhNghiepVN.today là kênh thông tin kinh tế và hệ sinh thái số của Tạp chí Doanh Nghiệp Việt Nam. Chúng tôi kết nối cộng đồng doanh nghiệp với các cơ quan quản lý, ngân hàng, chuyên gia đầu ngành trong 6 lĩnh vực trọng điểm: Vốn tín dụng, Truyền thông thương hiệu, Marketing bán hàng, Ứng dụng AI/Chuyển đổi số, Thực hành ESG và Kết nối B2B.'
    },
    {
      q: 'Làm thế nào để đăng ký tham gia các sự kiện, hội thảo và nhận vé QR Code?',
      a: 'Quý vị chỉ cần chọn sự kiện trên website, điền thông tin người tham dự và ấn Đăng ký. Hệ thống sẽ tự động cấp mã vé duy nhất và mã QR Code. Với các sự kiện có phí, hệ thống tích hợp sẵn mã VietQR kèm cú pháp chuyển khoản chính xác để Quý vị hoàn tất trong tích tắc.'
    },
    {
      q: 'Doanh nghiệp có thể đăng ký trang giới thiệu hồ sơ năng lực (Showroom số) không?',
      a: 'Có. Hội viên Doanh nghiệp được cấp trang giới thiệu năng lực (Profile Doanh nghiệp số) trên DoanhNghiepVN.today để quảng bá sản phẩm, dịch vụ, dự án và tìm kiếm đối tác liên kết.'
    },
    {
      q: 'DoanhNghiepVN.today có hỗ trợ cài đặt dạng ứng dụng trên điện thoại (PWA) không?',
      a: 'Có. Trang web được xây dựng theo chuẩn PWA (Progressive Web App). Quý vị có thể cài đặt trực tiếp lên màn hình chính điện thoại (iOS / Android) mà không cần qua App Store hay Google Play, cho phép truy cập nhanh và nhận thông báo sự kiện mượt mà.'
    },
    {
      q: 'Trợ lý AI Doanh Nghiệp VN hoạt động như thế nào?',
      a: 'Trợ lý AI Doanh Nghiệp VN được huấn luyện dựa trên cơ sở dữ liệu pháp lý doanh nghiệp, chính sách thuế, các quy định kinh tế mới nhất kết hợp với mạng lưới thông tin chuyên sâu của Tạp chí Doanh Nghiệp Việt Nam, hỗ trợ giải đáp 24/7 cho các nhà quản trị.'
    }
  ];

  const scrollToConsult = (serviceKey) => {
    setFormData(prev => ({ ...prev, serviceNeed: serviceKey || prev.serviceNeed }));
    const element = document.getElementById('tu-van');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SEOHead
        title="DoanhNghiepVN.today — Tạp chí Doanh Nghiệp Việt Nam | Kết nối & Phát triển"
        description="Không gian kết nối cộng đồng doanh nghiệp, cập nhật chính sách, tham gia sự kiện và tiếp cận các chương trình tư vấn về vốn, marketing, thương hiệu, chuyển đổi số và ESG."
      />
      
      {/* Header with dynamic categories */}
      <Navbar />

      {/* 1. HERO SECTION */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0F172A 0%, #0B132B 50%, #0F2D37 100%)',
        color: '#FFFFFF',
        padding: '5rem 1.5rem 6.5rem',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Pattern backdrop */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.12,
          backgroundImage: 'radial-gradient(#38BDF8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none'
        }} />

        {/* Ambient glow accent */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.25) 0%, rgba(15, 23, 42, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
            
            {/* Left Column: Heading, Subtitle, Search, CTA */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(13, 148, 136, 0.2)',
                border: '1px solid rgba(20, 184, 166, 0.35)',
                color: '#2DD4BF',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1.25rem'
              }}>
                <i className="fa-solid fa-shield-halved" />
                <span>Cộng đồng kết nối chính thống • Tạp chí Doanh Nghiệp Việt Nam</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                fontWeight: 800,
                lineHeight: 1.18,
                letterSpacing: '-0.025em',
                marginBottom: '1.25rem',
                color: '#FFFFFF'
              }}>
                Kết nối doanh nghiệp <br />
                <span style={{
                  background: 'linear-gradient(90deg, #2DD4BF 0%, #38BDF8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Đồng hành cùng sự phát triển
                </span>
              </h1>

              <p style={{
                fontSize: '1.05rem',
                lineHeight: 1.6,
                color: '#94A3B8',
                marginBottom: '2rem',
                maxWidth: '560px'
              }}>
                Không gian kết nối cộng đồng doanh nghiệp, cập nhật chính sách pháp lý, tham gia hội thảo chuyên đề và tiếp cận các giải pháp hỗ trợ về vốn tín dụng, marketing, thương hiệu, chuyển đổi số AI và ESG.
              </p>

              {/* Search & AI Input */}
              <form onSubmit={handleSearchSubmit} style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '14px',
                padding: '6px',
                maxWidth: '560px',
                marginBottom: '1.75rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
              }}>
                <i className="fa-solid fa-magnifying-glass" style={{ marginLeft: '14px', color: '#94A3B8', fontSize: '1rem' }} />
                <input
                  type="text"
                  placeholder="Tìm tin tức, sự kiện, doanh nghiệp, chuyên mục..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    padding: '10px 14px',
                    fontSize: '0.95rem'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAskAI}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#0D9488',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 18px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  title="Tra cứu thông minh bằng AI Doanh Nghiệp VN"
                >
                  <i className="fa-solid fa-wand-magic-sparkles" />
                  <span>Hỏi AI</span>
                </button>
              </form>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <a
                  href="#su-kien"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#0D9488',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)',
                    transition: 'transform 0.2s, background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0F766E'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0D9488'}
                >
                  <span>Xem sự kiện sắp diễn ra</span>
                  <i className="fa-solid fa-arrow-down" style={{ fontSize: '0.8rem' }} />
                </a>

                <button
                  onClick={() => scrollToConsult('Tư vấn vốn & tiếp cận tín dụng')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                >
                  <i className="fa-solid fa-handshake-angle" />
                  <span>Đăng ký tư vấn doanh nghiệp</span>
                </button>
              </div>
            </div>

            {/* Right Column: Hero Visual with Event Preview & Stat Card */}
            <div>
              <div style={{
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: '#1E293B'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=900"
                  alt="Hội thảo kết nối doanh nghiệp"
                  style={{ width: '100%', height: '360px', objectFit: 'cover', display: 'block' }}
                />
                
                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.3) 50%, transparent 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      backgroundColor: '#0D9488',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}>
                      Hoạt động tiêu biểu
                    </span>
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                      <i className="fa-regular fa-calendar-days" style={{ marginRight: '4px' }} />
                      Diễn ra định kỳ
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                    Diễn đàn Xúc tiến Thương mại & Tiếp cận Vốn Doanh nghiệp 2026
                  </h3>
                  <p style={{ color: '#CBD5E1', fontSize: '0.85rem', margin: 0 }}>
                    Quy tụ hơn 300 CEO, chuyên gia kinh tế và đại diện tổ chức tín dụng.
                  </p>
                </div>
              </div>

              {/* Floating Quick Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginTop: '1.25rem'
              }}>
                {[
                  { num: '15.000+', label: 'Doanh nghiệp' },
                  { num: '63', label: 'Tỉnh thành' },
                  { num: '120+', label: 'Sự kiện/năm' },
                  { num: '98%', label: 'Hài lòng' }
                ].map((s, idx) => (
                  <div key={idx} style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '12px 8px',
                    textAlign: 'center',
                    backdropFilter: 'blur(6px)'
                  }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2DD4BF' }}>{s.num}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. SỰ KIỆN SẮP DIỄN RA (FEATURED EVENTS WITH REALTIME COUNTDOWN & REGISTRATION) */}
      <section id="su-kien" style={{ padding: '5rem 1.5rem', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', gap: '1rem' }}>
            <div>
              <span style={{ color: '#0D9488', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Hoạt động trọng điểm
              </span>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0F172A', marginTop: '6px', letterSpacing: '-0.02em' }}>
                SỰ KIỆN SẮP DIỄN RA
              </h2>
              <p style={{ color: '#64748B', fontSize: '1rem', marginTop: '6px', maxWidth: '640px' }}>
                Cập nhật các hội thảo, tọa đàm và chương trình kết nối giúp doanh nghiệp tiếp cận thông tin, chuyên gia và cơ hội hợp tác kinh doanh.
              </p>
            </div>
            <Link
              to="/su-kien"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#0D9488',
                fontWeight: 600,
                fontSize: '0.95rem',
                textDecoration: 'none'
              }}
            >
              <span>Xem tất cả sự kiện</span>
              <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8rem' }} />
            </Link>
          </div>

          {loadingEvents ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
              <div>Đang tải danh sách sự kiện mới nhất...</div>
            </div>
          ) : eventsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#F8FAFC', borderRadius: '16px' }}>
              <p style={{ color: '#64748B', margin: 0 }}>Hiện chưa có sự kiện nào sắp diễn ra.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              
              {/* Highlight Top Upcoming Event Card */}
              {topEvent && (
                <div style={{
                  gridColumn: '1 / -1',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  border: '1px solid #1E293B',
                  boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap'
                }}>
                  {/* Left Side: Information & Live Countdown Timer */}
                  <div style={{
                    flex: '1 1 450px',
                    padding: '2.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minWidth: '320px',
                    boxSizing: 'border-box'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        <span style={{
                          backgroundColor: '#0D9488',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          letterSpacing: '0.04em'
                        }}>
                          Sự kiện nổi bật
                        </span>
                        <span style={{
                          backgroundColor: topEvent.is_paid ? 'rgba(239, 68, 68, 0.2)' : 'rgba(13, 148, 136, 0.2)',
                          color: topEvent.is_paid ? '#FCA5A5' : '#2DD4BF',
                          border: `1px solid ${topEvent.is_paid ? 'rgba(239, 68, 68, 0.4)' : 'rgba(13, 148, 136, 0.4)'}`,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}>
                          {topEvent.is_paid ? `Có phí • ${Number(topEvent.price || 0).toLocaleString('vi-VN')} đ/vé` : 'Miễn phí'}
                        </span>
                        <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                          <i className="fa-regular fa-clock" style={{ marginRight: '6px', color: '#2DD4BF' }} />
                          {formatEventDateTime(topEvent.event_date || topEvent.start_time || topEvent.date)}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, marginBottom: '0.85rem' }}>
                        {topEvent.title}
                      </h3>

                      <p style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                        {topEvent.short_desc || topEvent.description || 'Tham gia để nhận nhiều giá trị thực tiễn và kết nối mạng lưới doanh nghiệp.'}
                      </p>

                      {/* Live Realtime Countdown Boxes */}
                      <div style={{ marginBottom: '1.75rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2DD4BF', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-hourglass-half" />
                          <span>{timeLeft.label || 'Sự kiện bắt đầu sau'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {[
                            { val: timeLeft.days, label: 'NGÀY' },
                            { val: timeLeft.hours, label: 'GIỜ' },
                            { val: timeLeft.minutes, label: 'PHÚT' },
                            { val: timeLeft.seconds, label: 'GIÂY' }
                          ].map((t, idx) => (
                            <div key={idx} style={{
                              backgroundColor: '#1E293B',
                              border: '1px solid #334155',
                              borderRadius: '10px',
                              minWidth: '65px',
                              padding: '10px 12px',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1, fontFamily: 'monospace' }}>
                                {String(t.val || 0).padStart(2, '0')}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '4px', fontWeight: 600 }}>
                                {t.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Venue, Ticket count & Action Button */}
                    <div style={{
                      paddingTop: '1.5rem',
                      borderTop: '1px solid rgba(51, 65, 85, 0.6)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#CBD5E1', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-location-dot" style={{ color: '#2DD4BF' }} />
                          <span>{topEvent.location || 'Trực tuyến / Văn phòng Hội'}</span>
                        </div>
                        {topEvent.capacity > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FCD34D' }}>
                            <i className="fa-solid fa-ticket" />
                            <span>Còn {topEvent.remaining_tickets ?? (topEvent.capacity - (topEvent.registered_count || 0))} / {topEvent.capacity} vé</span>
                          </div>
                        )}
                      </div>

                      <Link
                        to={`/su-kien/${topEvent.slug || topEvent.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: '#0D9488',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          padding: '11px 24px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          boxShadow: '0 4px 14px rgba(13, 148, 136, 0.45)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0F766E'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0D9488'}
                      >
                        <span>Xem chi tiết & Đăng ký</span>
                        <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8rem' }} />
                      </Link>
                    </div>
                  </div>

                  {/* Right Side: Crisp, High-Def Event Cover Image */}
                  <div style={{
                    flex: '1 1 360px',
                    minHeight: '340px',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#1E293B'
                  }}>
                    <img
                      src={topEvent.image_url || topEvent.banner_url || topEvent.image || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80'}
                      alt={topEvent.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to right, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0) 25%)',
                      pointerEvents: 'none'
                    }} />
                  </div>
                </div>
              )}

              {/* Other upcoming events */}
              {otherEvents.map((evt, idx) => {
                const fallbackImages = [
                  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=700',
                  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=700',
                  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=700'
                ];
                const fallbackImg = fallbackImages[idx % fallbackImages.length];

                return (
                  <div key={evt.id} style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}>
                    <div style={{ height: '190px', position: 'relative', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                      <img
                        src={evt.image_url || evt.banner_url || evt.image || fallbackImg}
                        alt={evt.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = fallbackImg;
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(4px)',
                        color: evt.is_paid ? '#B91C1C' : '#0F766E',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)'
                      }}>
                        {evt.is_paid ? `${Number(evt.price || 0).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                      </span>
                    </div>

                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ color: '#0D9488', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                          <i className="fa-regular fa-calendar" style={{ marginRight: '6px' }} />
                          {formatEventDateTime(evt.event_date || evt.start_time || evt.date)}
                        </p>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', lineHeight: 1.4 }}>
                          {evt.title}
                        </h4>
                        <p style={{ color: '#64748B', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                          {evt.short_desc || evt.description || 'Hội thảo chuyên môn chia sẻ kinh nghiệm và giải pháp doanh nghiệp.'}
                        </p>
                      </div>

                      <div style={{ paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          <i className="fa-solid fa-location-dot" style={{ marginRight: '4px', color: '#0D9488' }} />
                          {evt.location || 'Văn phòng Hội'}
                        </span>
                        <Link
                          to={`/su-kien/${evt.slug || evt.id}`}
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#0D9488',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>Chi tiết</span>
                          <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
          )}

        </div>
      </section>

      {/* 3. 6 TRỤ CỘT TƯ VẤN HỖ TRỢ DOANH NGHIỆP (CONTRACT & PBR SPEC) */}
      <section id="tu-van-linh-vuc" style={{ padding: '5rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem' }}>
            <span style={{ color: '#0D9488', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dịch vụ chuyên gia
            </span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
              6 TRỤ CỘT TƯ VẤN DOANH NGHIỆP
            </h2>
            <p style={{ color: '#64748B', fontSize: '1rem', marginTop: '8px' }}>
              Được bảo trợ bởi Tạp chí Doanh Nghiệp Việt Nam và mạng lưới chuyên gia cố vấn chiến lược, ngân hàng và đối tác công nghệ uy tín.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {CONSULTING_SERVICES.map((srv) => (
              <div
                key={srv.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  padding: '2rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 14px 20px -4px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = '#0D9488';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <div>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    backgroundColor: `${srv.color}15`,
                    color: srv.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.35rem',
                    marginBottom: '1.25rem'
                  }}>
                    <i className={srv.icon} />
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.75rem' }}>
                    {srv.title}
                  </h3>

                  <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                    {srv.desc}
                  </p>
                </div>

                <button
                  onClick={() => scrollToConsult(srv.serviceKey)}
                  style={{
                    width: '100%',
                    backgroundColor: '#FFFFFF',
                    color: '#0D9488',
                    border: '1px solid #0D9488',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0D9488';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.color = '#0D9488';
                  }}
                >
                  <span>Đăng ký tư vấn</span>
                  <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }} />
                </button>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. TIN TỨC & BÁO CHÍ DOANH NGHIỆP */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', gap: '1rem' }}>
            <div>
              <span style={{ color: '#0D9488', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tin tức & Phóng sự
              </span>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
                TẠP CHÍ DOANH NGHIỆP VIỆT NAM
              </h2>
              <p style={{ color: '#64748B', fontSize: '1rem', marginTop: '6px' }}>
                Cập nhật thông tin kinh tế, cơ chế chính sách, thị trường và câu chuyện thành công của doanh nhân Việt.
              </p>
            </div>
            <Link
              to="/posts"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#0D9488',
                fontWeight: 600,
                fontSize: '0.95rem',
                textDecoration: 'none'
              }}
            >
              <span>Xem tất cả bài viết</span>
              <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8rem' }} />
            </Link>
          </div>

          {loadingPosts ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
              <div>Đang cập nhật tin tức mới nhất...</div>
            </div>
          ) : latestPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#F8FAFC', borderRadius: '16px' }}>
              <p style={{ color: '#64748B', margin: 0 }}>Chưa có bài viết nào được đăng tải.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              {latestPosts.map((post) => (
                <article
                  key={post.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <div style={{ height: '200px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                    <img
                      src={post.thumbnail || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80'}
                      alt={post.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          backgroundColor: 'rgba(13, 148, 136, 0.1)',
                          color: '#0D9488',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}>
                          {post.category || 'Doanh Nghiệp'}
                        </span>
                        <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                          {post.created_at ? new Date(post.created_at).toLocaleDateString('vi-VN') : ''}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', lineHeight: 1.4 }}>
                        <Link to={`/posts/${post.slug || post.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {post.title}
                        </Link>
                      </h4>

                      <p style={{ color: '#64748B', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                        {post.summary || post.excerpt || 'Xem chi tiết bài viết phân tích từ Ban Biên Tập Tạp chí Doanh Nghiệp Việt Nam...'}
                      </p>
                    </div>

                    <div style={{ paddingTop: '1.25rem', marginTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                      <Link
                        to={`/posts/${post.slug || post.id}`}
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#0D9488',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>Đọc tiếp</span>
                        <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 5. CỘNG ĐỒNG HỘI VIÊN TIÊU BIỂU */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '1rem' }}>
            <div>
              <span style={{ color: '#0D9488', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Hệ sinh thái kết nối
              </span>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
                DOANH NGHIỆP HỘI VIÊN TIÊU BIỂU
              </h2>
              <p style={{ color: '#64748B', fontSize: '1rem', marginTop: '4px' }}>
                Các doanh nghiệp và đối tác đã xác nhận và công bố hồ sơ trên DoanhNghiepVN.today.
              </p>
            </div>

            <button
              onClick={() => scrollToConsult('Hội viên & Trang riêng doanh nghiệp')}
              style={{
                backgroundColor: '#0D9488',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-user-plus" />
              <span>Đăng ký tham gia Hội</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {featuredMembers.length > 0 ? featuredMembers.map((m) => (
              <div key={m.id} style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '1.75rem',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: '#0F172A',
                      border: '1px solid #E2E8F0'
                    }}>
                      {m.company_name ? m.company_name.substring(0, 2).toUpperCase() : 'DN'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                        {m.company_name || m.name}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {m.city || 'Toàn quốc'} • {m.industry || 'Thương mại & Dịch vụ'}
                      </span>
                    </div>
                  </div>
                  <p style={{ color: '#64748B', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                    {m.description || m.bio || 'Hội viên chính thức của Tạp chí Doanh Nghiệp Việt Nam.'}
                  </p>
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                  <Link
                    to={`/members/${m.id}`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '8px',
                      backgroundColor: 'rgba(13, 148, 136, 0.08)',
                      color: '#0D9488',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    Xem hồ sơ doanh nghiệp
                  </Link>
                </div>
              </div>
            )) : (
              // Fallback sample businesses
              [
                { name: 'Công ty Cổ phần ADT Quốc tế', field: 'Công nghệ & AI ERP', city: 'Hà Nội', desc: 'Đơn vị phát triển hệ thống điều hành doanh nghiệp thông minh, AI Agents và nền tảng số DoanhNghiepVN.today.' },
                { name: 'Công ty TNHH Logistics Toàn Cầu', field: 'Vận tải & XNK', city: 'TP. Hồ Chí Minh', desc: 'Cung cấp dịch vụ vận chuyển container quốc tế, kho bãi thông minh và thủ tục thông quan hải quan trọn gói.' },
                { name: 'Tập đoàn Tư vấn & Kiểm toán GreenAudit', field: 'Tài chính & ESG', city: 'Đà Nẵng', desc: 'Cố vấn tài chính doanh nghiệp, lập báo cáo phát triển bền vững và đánh giá tiêu chuẩn kiểm kê khí thải.' }
              ].map((b, i) => (
                <div key={i} style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: '#F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: '#0D9488',
                        border: '1px solid #E2E8F0'
                      }}>
                        {b.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                          {b.name}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {b.city} • {b.field}
                        </span>
                      </div>
                    </div>
                    <p style={{ color: '#64748B', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                      {b.desc}
                    </p>
                  </div>
                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                    <button
                      onClick={() => scrollToConsult('Hội viên & Trang riêng doanh nghiệp')}
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        padding: '8px',
                        backgroundColor: 'rgba(13, 148, 136, 0.08)',
                        color: '#0D9488',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Kết nối giao thương
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </section>

      {/* 6. FORM ĐĂNG KÝ TƯ VẤN & HỢP TÁC DOANH NGHIỆP */}
      <section id="tu-van" style={{ padding: '5rem 1.5rem', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          
          <div style={{
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            borderRadius: '24px',
            padding: '3rem 2.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Ambient pattern */}
            <div style={{
              position: 'absolute',
              top: '-30%',
              right: '-10%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(13, 148, 136, 0.3) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span style={{ color: '#2DD4BF', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Đồng hành phát triển
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '6px', color: '#FFFFFF' }}>
                ĐĂNG KÝ NHẬN TƯ VẤN DOANH NGHIỆP
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginTop: '6px' }}>
                Để lại thông tin để Ban cố vấn Tạp chí Doanh Nghiệp Việt Nam kết nối và hỗ trợ trực tiếp.
              </p>
            </div>

            {formSubmitted ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                backgroundColor: 'rgba(13, 148, 136, 0.15)',
                borderRadius: '16px',
                border: '1px solid #0D9488'
              }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: '3rem', color: '#2DD4BF', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  Gửi yêu cầu thành công!
                </h3>
                <p style={{ color: '#CBD5E1', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                  Cảm ơn Quý doanh nghiệp. Đội ngũ chuyên gia Tạp chí Doanh Nghiệp Việt Nam sẽ liên hệ lại trong vòng 24 giờ làm việc.
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  style={{
                    backgroundColor: '#0D9488',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Gửi thêm yêu cầu khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                      Họ và tên người liên hệ *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={formData.fullName}
                      onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                      style={{
                        width: '100%',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                      Số điện thoại liên hệ *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0912 345 678"
                      value={formData.phone}
                      onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                      style={{
                        width: '100%',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                      Email liên hệ
                    </label>
                    <input
                      type="email"
                      placeholder="contact@company.vn"
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      style={{
                        width: '100%',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                      Tên doanh nghiệp / Đơn vị *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Công ty CP / TNHH..."
                      value={formData.companyName}
                      onChange={(e) => setFormData(p => ({ ...p, companyName: e.target.value }))}
                      style={{
                        width: '100%',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                      Tỉnh / Thành phố
                    </label>
                    <input
                      type="text"
                      placeholder="Hà Nội, TP.HCM, Đà Nẵng..."
                      value={formData.city}
                      onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                      style={{
                        width: '100%',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                      Lĩnh vực cần tư vấn
                    </label>
                    <select
                      value={formData.serviceNeed}
                      onChange={(e) => setFormData(p => ({ ...p, serviceNeed: e.target.value }))}
                      style={{
                        width: '100%',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Tư vấn vốn & tiếp cận tín dụng">Tư vấn Vốn & Tín dụng</option>
                      <option value="Truyền thông & Thương hiệu">Truyền thông & Thương hiệu</option>
                      <option value="Marketing & Bán hàng">Marketing & Bán hàng</option>
                      <option value="Ứng dụng AI & Chuyển đổi số">Ứng dụng AI & Chuyển đổi số</option>
                      <option value="Thực hành ESG">Thực hành ESG & Báo cáo xanh</option>
                      <option value="Kết nối Công nghệ & Đối tác B2B">Kết nối Công nghệ & Đối tác B2B</option>
                      <option value="Hội viên & Trang riêng doanh nghiệp">Hội viên & Trang riêng doanh nghiệp</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                    Nội dung cụ thể / Nhu cầu chi tiết
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả nhu cầu, quy mô doanh nghiệp hoặc câu hỏi cần giải đáp..."
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={(e) => setFormData(p => ({ ...p, agreeTerms: e.target.checked }))}
                    style={{ width: '16px', height: '16px', accentColor: '#0D9488' }}
                  />
                  <label htmlFor="agreeTerms" style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    Tôi đồng ý để Tạp chí Doanh Nghiệp Việt Nam xử lý thông tin và liên hệ phục vụ công tác tư vấn.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    width: '100%',
                    backgroundColor: '#0D9488',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: formLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {formLoading ? 'Đang gửi thông tin...' : 'GỬI YÊU CẦU TƯ VẤN NGAY'}
                </button>
              </form>
            )}

          </div>

        </div>
      </section>

      {/* 7. HỎI ĐÁP THƯỜNG GẶP (FAQ) */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ color: '#0D9488', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hỗ trợ giải đáp
            </span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
              CÂU HỎI THƯỜNG GẶP
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1.25rem 1.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                      {faq.q}
                    </span>
                    <i
                      className={`fa-solid fa-chevron-down`}
                      style={{
                        color: '#64748B',
                        fontSize: '0.85rem',
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s'
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 1.5rem 1.25rem', color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Floating AI Bot Assistant */}
      <FloatingAIBot />
    </div>
  );
};

export default Home;
