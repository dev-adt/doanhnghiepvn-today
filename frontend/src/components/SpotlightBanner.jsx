import React from 'react';

/**
 * High-Impact Spotlight Banner
 * Styled with TECHFEST Vietnam 2025 Royal Tech Blue, Electric Cyan, and Gold theme.
 */
export const SpotlightBanner = ({
  badgeText = 'SỨ MỆNH CHIẾN LƯỢC • TẠP CHÍ DOANH NGHIỆP VIỆT NAM',
  title = 'Tạp chí Doanh nghiệp Việt Nam — Sứ mệnh: Đồng hành cùng doanh nghiệp',
  subtitle = 'Thúc đẩy kết nối, xây dựng năng lực tiếp cận vốn tín dụng cho SME và hộ kinh doanh trong kỷ nguyên số.',
  buttonText = 'Xem chuyên đề & Khám phá ngay',
  link = 'https://doanhnghiepvn.vn/doanh-nghiep/thuc-day-ket-noi-xay-dung-nang-luc-tiep-can-von-tin-dung-cho-sme-va-ho-kinh-doanh/20260721095902983',
  variant = 'primary'
}) => {
  return (
    <div style={{
      width: '100%',
      position: 'relative',
      background: 'linear-gradient(135deg, #0B2F7E 0%, #1449BA 50%, #1E63E9 100%)',
      color: '#FFFFFF',
      borderBottom: '2px solid rgba(147, 197, 253, 0.4)',
      boxShadow: '0 8px 30px rgba(11, 47, 126, 0.35), inset 0 1px 0 rgba(147, 197, 253, 0.25)',
      overflow: 'hidden',
      zIndex: 10
    }}>
      {/* Background Cyber Tech Grid Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(0, 229, 255, 0.18) 1.2px, transparent 1.2px)',
        backgroundSize: '20px 20px',
        opacity: 0.6,
        pointerEvents: 'none'
      }} />

      {/* Cyber Glow Orbs */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '15%',
        width: '400px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(0, 229, 255, 0.22) 0%, rgba(5, 19, 54, 0) 70%)',
        pointerEvents: 'none',
        filter: 'blur(30px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-40%',
        right: '10%',
        width: '350px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(5, 19, 54, 0) 70%)',
        pointerEvents: 'none',
        filter: 'blur(35px)'
      }} />

      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '1.25rem 1.5rem',
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        {/* Left Side: Badge + Title + Subtitle */}
        <div style={{ flex: '1 1 540px', minWidth: '280px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(0, 229, 255, 0.12)',
            border: '1px solid rgba(0, 229, 255, 0.45)',
            borderRadius: '9999px',
            padding: '3px 12px',
            marginBottom: '8px',
            boxShadow: '0 0 12px rgba(0, 229, 255, 0.2)'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#00E5FF',
              boxShadow: '0 0 8px #00E5FF',
              display: 'inline-block'
            }} />
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#00E5FF',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}>
              {badgeText}
            </span>
          </div>

          <h2 style={{
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(1.1rem, 2.2vw, 1.45rem)',
            fontWeight: '800',
            lineHeight: 1.3,
            color: '#FFFFFF',
            marginBottom: '4px',
            letterSpacing: '-0.02em',
            textShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}>
            {title}
          </h2>

          <p style={{
            fontSize: 'clamp(12px, 1.4vw, 13.5px)',
            color: '#E0F2FE',
            lineHeight: 1.45,
            margin: 0,
            opacity: 0.95
          }}>
            {subtitle}
          </p>
        </div>

        {/* Right Side: CTA Button */}
        <div style={{ flexShrink: 0 }}>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              padding: '11px 24px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #F59E0B 100%)',
              color: '#051336',
              fontWeight: '800',
              fontSize: '13.5px',
              borderRadius: '10px',
              textDecoration: 'none',
              boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              transition: 'all 0.22s ease',
              letterSpacing: '0.01em',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.55), 0 0 15px rgba(0, 229, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 18px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
            }}
          >
            <span>{buttonText}</span>
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '12px' }} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default SpotlightBanner;
