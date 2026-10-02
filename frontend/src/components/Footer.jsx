import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import brandConfig from '../brand.config';

export const Footer = () => {
  const { currentLang } = useTranslation();

  return (
    <footer style={{
      backgroundColor: '#111827',
      backgroundImage: 'linear-gradient(180deg, #0b1320 0%, #060c16 100%)',
      color: '#94a3b8',
      padding: '3.5rem 0 1.5rem',
      fontSize: '12.5px',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      lineHeight: '1.65'
    }}>
      <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Main 4-Column Footer Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem'
        }}>
          {/* Column 1: Logo & Brand Title */}
          <div>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
              <img 
                src={brandConfig.logo.primary || "/logo_doanhnghiepvn.png"} 
                alt={brandConfig.logo.alt || `${brandConfig.brandName} Logo`} 
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
                style={{ height: '46px', width: 'auto', maxHeight: '46px', objectFit: 'contain', display: 'block' }} 
              />
            </Link>
            <div style={{
              fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
              fontSize: '12px',
              fontWeight: '800',
              color: '#e2e8f0',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              lineHeight: '1.5',
              marginTop: '0.5rem'
            }}>
              {currentLang === 'en'
                ? `DIGITAL ECOSYSTEM — VIETNAM ENTERPRISE MAGAZINE ${brandConfig.brandShortName.toUpperCase()}`
                : `HỆ SINH THÁI SỐ TẠP CHÍ DOANH NGHIỆP VIỆT NAM — ${brandConfig.brandShortName.toUpperCase()}`}
            </div>
            <div style={{ fontSize: '11px', color: '#14b8a6', fontWeight: '600', marginTop: '4px', letterSpacing: '0.4px' }}>
              {currentLang === 'en' ? `DIGITAL ECOSYSTEM — ${brandConfig.domain.toUpperCase()}` : `KẾT NỐI DOANH NGHIỆP — ${brandConfig.domain.toUpperCase()}`}
            </div>
          </div>

          {/* Column 2: Agency & Platform Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div>
              <span style={{ color: '#64748b' }}>Cơ quan / Đơn vị chủ quản:</span>{' '}
              <strong style={{ color: '#f1f5f9' }}>{brandConfig.companyLegalName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Nền tảng vận hành:</span>{' '}
              <strong style={{ color: '#f1f5f9' }}>{brandConfig.platformName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Định hướng phát triển:</span>{' '}
              <span style={{ color: '#cbd5e1' }}>{brandConfig.slogan}</span>
            </div>
            <div style={{ marginTop: '4px', color: '#cbd5e1', lineHeight: '1.5' }}>
              Giấy phép hoạt động số <strong style={{ color: '#f59e0b' }}>483/GP-BTTTT</strong> do Bộ Thông tin và Truyền thông cấp ngày <strong style={{ color: '#f1f5f9' }}>29/12/2023</strong>
            </div>
          </div>

          {/* Column 3: Editorial Board & Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '12px' }}>
            <div>
              <span style={{ color: '#64748b' }}>Ban Quản trị Nền tảng:</span>{' '}
              <strong style={{ color: '#f1f5f9' }}>Ban Biên Tập {brandConfig.brandShortName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Giờ làm việc:</span>{' '}
              <span style={{ color: '#cbd5e1' }}>{brandConfig.contact.workingHours}</span>
            </div>
            <div style={{ marginTop: '2px' }}>
              <span style={{ color: '#64748b' }}>Hotline hỗ trợ:</span>{' '}
              <span style={{ color: '#cbd5e1' }}>{brandConfig.contact.hotline}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Di động / Zalo:</span>{' '}
              <span style={{ color: '#cbd5e1' }}>{brandConfig.contact.phone}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Email:</span>{' '}
              <a href={`mailto:${brandConfig.contact.email}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>{brandConfig.contact.email}</a>
            </div>
          </div>

          {/* Column 4: Advertising, Office Address & Social Media */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '13px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              {currentLang === 'en' ? 'Advertising & Communications' : 'Liên hệ hợp tác & truyền thông'}
            </div>
            <div style={{ color: '#cbd5e1' }}>
              {brandConfig.companyLegalName}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <i className="ti ti-map-pin" style={{ color: '#eebd44', marginTop: '3px', flexShrink: 0 }}></i>
              <span><strong>Địa chỉ:</strong> {brandConfig.contact.address}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
              <a href={`tel:${brandConfig.contact.phone.replace(/\s+/g, '')}`} style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="ti ti-phone"></i> {brandConfig.contact.phone}
              </a>
              <span style={{ color: '#475569' }}>|</span>
              <a href={`mailto:${brandConfig.contact.supportEmail}`} style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="ti ti-mail"></i> {brandConfig.contact.supportEmail}
              </a>
            </div>

            {/* Social Media Links */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                {currentLang === 'en' ? 'Follow us on platforms:' : 'Theo dõi chúng tôi trên các nền tảng:'}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a 
                  href={brandConfig.socials.facebook} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', textDecoration: 'none', transition: 'transform 0.2s' }}
                  title={`Facebook ${brandConfig.brandShortName}`}
                >
                  <i className="ti ti-brand-facebook" style={{ fontSize: '16px' }}></i>
                </a>
                <a 
                  href={brandConfig.socials.youtube} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ff0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', textDecoration: 'none', transition: 'transform 0.2s' }}
                  title={`YouTube ${brandConfig.brandShortName}`}
                >
                  <i className="ti ti-brand-youtube" style={{ fontSize: '16px' }}></i>
                </a>
                <a 
                  href={brandConfig.socials.tiktok} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', textDecoration: 'none', transition: 'transform 0.2s' }}
                  title={`TikTok ${brandConfig.brandShortName}`}
                >
                  <i className="ti ti-brand-tiktok" style={{ fontSize: '16px' }}></i>
                </a>
                <Link 
                  to="/ai-chat"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', textDecoration: 'none', transition: 'transform 0.2s' }}
                  title={brandConfig.aiAssistant.name}
                >
                  <i className="ti ti-sparkles" style={{ fontSize: '15px' }}></i>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Copyright Sub-bar */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '1.4rem',
          textAlign: 'center',
          fontSize: '11.5px',
          color: '#64748b',
          lineHeight: '1.6'
        }}>
          <div>
            ® Cấm sao chép dưới mọi hình thức nếu không có sự chấp thuận bằng văn bản. Ghi rõ nguồn <strong>"{brandConfig.brandShortName}"</strong> hoặc <strong>"{brandConfig.domain}"</strong> khi phát hành lại thông tin từ website này.
          </div>
          <div style={{ marginTop: '2px', color: '#475569' }}>
            {brandConfig.contact.copyright}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
