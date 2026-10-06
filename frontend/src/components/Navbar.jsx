import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { usePWA } from '../contexts/PWAContext';
import brandConfig from '../brand.config';

export const Navbar = () => {
  const { role, user, logout } = useAuth();
  const { currentLang, changeLang, t } = useTranslation();
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [mobileExpandedCatId, setMobileExpandedCatId] = useState(null);
  const dropdownTimeoutRef = useRef(null);
  const navRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load dynamic categories & subcategories from Backend / Database (Quản lý chuyên mục trong Admin)
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && isMounted) {
            // Sắp xếp theo order_index tăng dần do admin thiết lập
            const sorted = [...json.data].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
            setCategoriesList(sorted);
          }
        }
      } catch (err) {
        console.warn('Navbar: Không thể tải danh mục từ API.', err.message);
      }
    };
    fetchCategories();
    return () => { isMounted = false; };
  }, []);

  // Xử lý đóng dropdown khi click bên ngoài (hỗ trợ Touch & Click)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Handle dropdown hover with debounce
  const handleMouseEnter = (catId) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdownId(catId);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdownId(null);
    }, 220);
  };

  // Toggle Dropdown cho Touchscreen & Keyboard
  const handleToggleDropdown = (catId, e) => {
    e.stopPropagation();
    setActiveDropdownId(prev => (prev === catId ? null : catId));
  };

  const handleKeyDown = (catId, e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveDropdownId(prev => (prev === catId ? null : catId));
    } else if (e.key === 'Escape') {
      setActiveDropdownId(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'DN';
    return name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  // Tên hiển thị đầy đủ trực tiếp từ Admin thiết lập
  const getCategoryName = (cat) => {
    if (currentLang === 'en' && cat.name_en) {
      return cat.name_en;
    }
    return cat.name;
  };

  const getSubName = (sub) => {
    if (typeof sub === 'object' && sub !== null) {
      if (currentLang === 'en' && sub.name_en) {
        return sub.name_en;
      }
      return sub.name;
    }
    return sub;
  };

  // Lấy danh sách chuyên mục con an toàn từ dữ liệu động
  const getSubList = (cat) => {
    if (!cat) return [];
    if (Array.isArray(cat.sub_categories) && cat.sub_categories.length > 0) {
      return cat.sub_categories;
    }
    if (Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
      return cat.subcategories;
    }
    if (typeof cat.subcategories === 'string') {
      try {
        const parsed = JSON.parse(cat.subcategories);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  return (
    <>
      <style>{`
        /* Reset and enforce immunity from any external styles */
        .dnvn-navbar-header {
          position: sticky !important;
          top: 0 !important;
          z-index: 9999 !important;
          background: #08101E !important;
          background-image: linear-gradient(135deg, #070D18 0%, #0D1B2A 50%, #070D18 100%) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45) !important;
          width: 100% !important;
          max-width: 100vw !important;
          overflow-x: clip !important;
          box-sizing: border-box !important;
        }

        .dnvn-navbar-container {
          width: 100% !important;
          max-width: 1600px !important;
          margin: 0 auto !important;
          padding: 0 1rem !important;
          min-height: 68px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          position: relative !important;
          box-sizing: border-box !important;
          overflow: visible !important;
        }

        /* Center Nav: Always visible, never clips dropdown menus */
        .dnvn-nav-center {
          position: static !important;
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border: none !important;
          box-shadow: none !important;
          height: auto !important;
          padding: 0 !important;
          margin: 0 4px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 4px !important;
          flex: 0 0 auto !important;
          min-width: 0 !important;
          overflow: visible !important;
        }

        @media (max-width: 1200px) {
          .dnvn-navbar-container {
            justify-content: space-between !important;
            padding: 0 12px !important;
            min-height: 60px !important;
          }
          .dnvn-nav-center {
            display: none !important;
          }
          .dnvn-mobile-toggle {
            display: flex !important;
          }
          .dnvn-nav-right {
            margin-left: auto !important;
            gap: 6px !important;
          }
        }

        @media (min-width: 1201px) {
          .dnvn-mobile-toggle {
            display: none !important;
          }
        }

        /* Compact scaling for 1366x768 laptops and narrow desktop viewports (1201px - 1400px) */
        @media (min-width: 1201px) and (max-width: 1400px) {
          .dnvn-brand-title {
            font-size: 15.5px !important;
          }
          .dnvn-brand-subtitle {
            font-size: 7px !important;
          }
          .dnvn-nav-item-btn {
            font-size: 11px !important;
            padding: 4px 5px !important;
            max-width: 95px !important;
            min-height: 36px !important;
            gap: 2px !important;
          }
          .dnvn-nav-center {
            gap: 2px !important;
            margin: 0 2px !important;
          }
          .dnvn-nav-right {
            gap: 4px !important;
            margin-left: 4px !important;
          }
          .dnvn-btn-join-desktop {
            padding: 6px 10px !important;
            font-size: 11px !important;
          }
        }

        /* Brand logo container & text scaling (Never shrink, never wrap vertically) */
        .dnvn-brand-link {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          text-decoration: none !important;
          flex: 0 0 auto !important;
          flex-shrink: 0 !important;
          min-width: max-content !important;
          white-space: nowrap !important;
          margin-right: 8px !important;
        }

        .dnvn-brand-icon {
          width: 38px !important;
          height: 38px !important;
          border-radius: 10px !important;
          overflow: hidden !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: #ffffff !important;
          font-weight: 900 !important;
          box-shadow: 0 2px 12px rgba(13, 148, 136, 0.45) !important;
          border: 1.5px solid rgba(45, 212, 191, 0.4) !important;
          flex-shrink: 0 !important;
          background: #08101E !important;
        }

        .dnvn-brand-icon-img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }

        .dnvn-brand-text-box {
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
          white-space: nowrap !important;
        }

        .dnvn-brand-title {
          font-size: 18px !important;
          font-weight: 800 !important;
          color: #ffffff !important;
          letter-spacing: -0.3px !important;
          line-height: 1.15 !important;
          white-space: nowrap !important;
          word-break: keep-all !important;
        }

        .dnvn-brand-subtitle {
          font-size: 8px !important;
          letter-spacing: 0.6px !important;
          color: #2DD4BF !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          margin-top: 2px !important;
          white-space: nowrap !important;
          word-break: keep-all !important;
          line-height: 1.2 !important;
        }

        /* Mobile specific fluid text scaling (Keep horizontal, never break into vertical letters) */
        @media (max-width: 768px) {
          .dnvn-brand-link {
            gap: 8px !important;
            flex-shrink: 0 !important;
            white-space: nowrap !important;
          }
          .dnvn-brand-icon {
            width: 32px !important;
            height: 32px !important;
            font-size: 12px !important;
            border-radius: 8px !important;
          }
          .dnvn-brand-title {
            font-size: clamp(13px, 3.8vw, 16px) !important;
            line-height: 1.2 !important;
            white-space: nowrap !important;
            word-break: keep-all !important;
          }
          .dnvn-brand-subtitle {
            font-size: clamp(6.5px, 1.8vw, 7.5px) !important;
            letter-spacing: 0.3px !important;
            white-space: nowrap !important;
            word-break: keep-all !important;
          }
          .dnvn-btn-join-desktop {
            display: none !important;
          }
          .dnvn-lang-switcher button {
            padding: 2px 6px !important;
            font-size: 10px !important;
          }
        }

        @media (max-width: 420px) {
          .dnvn-brand-title {
            font-size: 13px !important;
            white-space: nowrap !important;
          }
          .dnvn-brand-subtitle {
            font-size: 6.5px !important;
            letter-spacing: 0.2px !important;
            white-space: nowrap !important;
          }
          .dnvn-lang-switcher {
            display: none !important;
          }
        }

        .dnvn-cat-wrapper {
          position: relative !important;
          flex-shrink: 0 !important;
          overflow: visible !important;
        }

        /* 2-line flexible item: user explicitly requested text can wrap onto 2 lines to never overlap */
        .dnvn-nav-item-btn {
          color: #E2E8F0 !important;
          font-size: 11.5px !important;
          line-height: 1.25 !important;
          font-weight: 600 !important;
          padding: 6px 7px !important;
          border-radius: 8px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 3px !important;
          text-decoration: none !important;
          text-align: center !important;
          max-width: 115px !important;
          white-space: normal !important;
          word-break: break-word !important;
          transition: all 0.18s ease !important;
          flex-shrink: 0 !important;
          min-height: 40px !important;
          border: 1px solid transparent !important;
        }

        .dnvn-nav-item-btn:hover {
          color: #2DD4BF !important;
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(45, 212, 191, 0.25) !important;
        }

        .dnvn-nav-item-btn.active {
          color: #2DD4BF !important;
          background-color: rgba(13, 148, 136, 0.22) !important;
          border-bottom: 2px solid #2DD4BF !important;
        }

        .dnvn-nav-text {
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
          text-align: center !important;
        }

        .dnvn-dropdown-panel {
          position: absolute !important;
          top: calc(100% + 4px) !important;
          left: 0 !important;
          min-width: 250px !important;
          background-color: #0D1B2A !important;
          background-image: linear-gradient(180deg, #0F2033 0%, #0A1420 100%) !important;
          border: 1px solid rgba(45, 212, 191, 0.4) !important;
          border-radius: 10px !important;
          padding: 8px 0 !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.85), 0 0 15px rgba(13, 148, 136, 0.2) !important;
          z-index: 999999 !important;
          animation: dnvnFadeIn 0.15s ease-out !important;
        }

        /* Invisible bridge to prevent mouse leaving between trigger and panel */
        .dnvn-dropdown-panel::before {
          content: '' !important;
          position: absolute !important;
          top: -8px !important;
          left: 0 !important;
          right: 0 !important;
          height: 8px !important;
          background: transparent !important;
        }

        @keyframes dnvnFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dnvn-dropdown-item {
          display: block !important;
          padding: 8px 16px !important;
          color: #E2E8F0 !important;
          font-size: 12.5px !important;
          font-weight: 500 !important;
          text-decoration: none !important;
          transition: all 0.15s ease !important;
          text-align: left !important;
        }

        .dnvn-dropdown-item:hover {
          background-color: rgba(13, 148, 136, 0.28) !important;
          color: #2DD4BF !important;
          padding-left: 20px !important;
        }

        /* Right side action container: sits seamlessly next to Trợ lý AI with no artificial gap */
        .dnvn-nav-right {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          margin-left: 8px !important;
          flex-shrink: 0 !important;
          overflow: visible !important;
        }
      `}</style>

      <header className="dnvn-navbar-header">
        <div className="dnvn-navbar-container">
          
          {/* 1. BRAND LOGO */}
          <Link 
            to="/" 
            className="dnvn-brand-link"
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            title={brandConfig.brandName}
          >
            <div className="dnvn-brand-icon">
              <img 
                src="/logo_icon.png" 
                alt="DN Logo" 
                className="dnvn-brand-icon-img"
                onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerText = 'DN'; }}
              />
            </div>
            <div className="dnvn-brand-text-box">
              <span className="dnvn-brand-title">
                {brandConfig.brandShortName || 'DoanhNghiepVN'}
                <span style={{ color: '#2DD4BF' }}>.today</span>
              </span>
              <span className="dnvn-brand-subtitle">
                TẠP CHÍ DOANH NGHIỆP VIỆT NAM
              </span>
            </div>
          </Link>

          {/* 2. DYNAMIC CENTER NAVIGATION (LẤY TỪ ADMIN "QUẢN LÝ CHUYÊN MỤC & LĨNH VỰC") */}
          <nav 
            ref={navRef}
            className="dnvn-nav-center" 
            aria-label="Menu chính"
          >
            {/* Hiển thị tất cả danh mục động với định dạng 2 dòng co giãn thông minh */}
            {categoriesList.map((cat) => {
              const subs = getSubList(cat);
              const hasSubs = subs.length > 0;
              const isOpen = activeDropdownId === (cat.id || cat.name);
              const isCatActive = location.pathname === '/posts' && location.search.includes(encodeURIComponent(cat.name));
              const catDisplayName = getCategoryName(cat);

              return (
                <div
                  key={cat.id || cat.name}
                  className="dnvn-cat-wrapper"
                  onMouseEnter={() => handleMouseEnter(cat.id || cat.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Link
                      to={`/posts?category=${encodeURIComponent(cat.name)}`}
                      className={`dnvn-nav-item-btn ${isCatActive ? 'active' : ''}`}
                    >
                      <span className="dnvn-nav-text">{catDisplayName}</span>
                      {hasSubs && (
                        <i 
                          className="ti ti-chevron-down" 
                          style={{
                            fontSize: '10px',
                            color: isOpen ? '#2DD4BF' : '#94A3B8',
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.18s ease',
                            flexShrink: 0
                          }} 
                        />
                      )}
                    </Link>
                  </div>

                  {/* Subcategory Dropdown Panel (HIỂN THỊ ĐẦY ĐỦ KHI DI CHUỘT, KHÔNG BỊ KHUẤT) */}
                  {hasSubs && isOpen && (
                    <div 
                      role="menu"
                      className="dnvn-dropdown-panel"
                    >
                      <Link
                        to={`/posts?category=${encodeURIComponent(cat.name)}`}
                        onClick={() => setActiveDropdownId(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 16px',
                          color: '#F59E0B',
                          fontWeight: '700',
                          fontSize: '12px',
                          textDecoration: 'none',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          marginBottom: '4px'
                        }}
                      >
                        <span>{catDisplayName} (Tất cả bài viết)</span>
                        <i className="ti ti-arrow-right" style={{ fontSize: '11px' }}></i>
                      </Link>

                      {subs.map((sub, idx) => {
                        const subName = typeof sub === 'object' ? sub.name : sub;
                        const subLabel = getSubName(sub);
                        return (
                          <Link
                            key={idx}
                            to={`/posts?category=${encodeURIComponent(cat.name)}&subCategory=${encodeURIComponent(subName)}`}
                            onClick={() => setActiveDropdownId(null)}
                            className="dnvn-dropdown-item"
                          >
                            • {subLabel}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Nút Trợ lý AI: Đặt sát ngay sau danh mục cuối cùng theo yêu cầu của user */}
            <Link
              to="/ai-chat"
              className="dnvn-nav-item-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(13, 148, 136, 0.22)',
                border: '1px solid rgba(45, 212, 191, 0.5)',
                color: '#2DD4BF',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
                flexShrink: 0,
                minHeight: '38px',
                marginLeft: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(13, 148, 136, 0.38)';
                e.currentTarget.style.borderColor = '#2DD4BF';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(13, 148, 136, 0.22)';
                e.currentTarget.style.borderColor = 'rgba(45, 212, 191, 0.5)';
                e.currentTarget.style.transform = 'none';
              }}
              title="Trợ lý AI Doanh Nghiệp Việt Nam"
            >
              <i className="ti ti-sparkles" style={{ color: '#F59E0B', fontSize: '13px' }} />
              <span>Trợ lý AI</span>
            </Link>
          </nav>

          {/* 3. RIGHT ACTIONS: LUÔN NẰM SÁT MÉP PHẢI (MARGIN-LEFT AUTO), KHÔNG BAO GIỜ BỊ KHUẤT */}
          <div className="dnvn-nav-right">
            {/* Chuyển đổi ngôn ngữ */}
            <div className="dnvn-lang-switcher" style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '2px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              flexShrink: 0
            }}>
              <button
                onClick={() => changeLang('vi')}
                style={{
                  background: currentLang === 'vi' ? '#0D9488' : 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: currentLang === 'vi' ? '700' : '500',
                  cursor: 'pointer'
                }}
              >
                VI
              </button>
              <button
                onClick={() => changeLang('en')}
                style={{
                  background: currentLang === 'en' ? '#0D9488' : 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: currentLang === 'en' ? '700' : '500',
                  cursor: 'pointer'
                }}
              >
                EN
              </button>
            </div>

            {/* Nút Cài đặt PWA Desktop */}
            {isInstallable && !isInstalled && (
              <button
                onClick={installApp}
                className="dnvn-btn-pwa-install"
                title="Cài đặt ứng dụng DoanhNghiepVN.today (PWA)"
                style={{
                  backgroundColor: 'rgba(13, 148, 136, 0.15)',
                  border: '1px solid rgba(45, 212, 191, 0.5)',
                  color: '#2DD4BF',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  padding: '6px 11px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(13, 148, 136, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(45, 212, 191, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(13, 148, 136, 0.15)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <i className="ti ti-device-mobile-down" style={{ fontSize: '13.5px' }}></i>
                <span>Cài App</span>
              </button>
            )}

            {/* Nút Đăng ký trải nghiệm / Gia nhập Hội (Chỉ hiện khi chưa đăng nhập và trên desktop) */}
            {role === 'guest' && (
              <Link
                to="/register"
                className="dnvn-btn-join-desktop"
                style={{
                  backgroundColor: '#0D9488',
                  backgroundImage: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(13, 148, 136, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(13, 148, 136, 0.4)';
                }}
              >
                <i className="ti ti-user-plus" style={{ fontSize: '13px' }}></i>
                <span>{currentLang === 'en' ? 'Join' : 'Gia nhập Hội'}</span>
              </Link>
            )}

            {/* Trạng thái Người dùng / Đăng nhập */}
            {role === 'guest' ? (
              <Link
                to="/login"
                style={{
                  color: '#E2E8F0',
                  fontSize: '12.5px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.18s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#2DD4BF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#E2E8F0'; }}
              >
                {currentLang === 'en' ? 'Login' : 'Đăng nhập'}
              </Link>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <Link
                  to={role === 'admin' ? "/admin-dashboard" : role === 'creator' ? "/creator-dashboard" : role === 'organizer' ? "/organizer-dashboard" : "/member-dashboard"}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#0D9488',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    border: '1.5px solid #ffffff'
                  }}
                  title={user?.name || 'Dashboard'}
                >
                  {getInitials(user?.name)}
                </Link>
                <button
                  onClick={() => logout()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#F87171',
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title={currentLang === 'en' ? "Logout" : "Đăng xuất"}
                >
                  <i className="ti ti-logout"></i>
                </button>
              </div>
            )}

            {/* Nút Toggle Mobile Drawer (chỉ hiện trên màn hình < 1024px) */}
            <button
              className="dnvn-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Mở menu di động"
            >
              <i className={mobileMenuOpen ? "ti ti-x" : "ti ti-menu-2"}></i>
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER: DÙNG CHUNG CÙNG NGUỒN DỮ LIỆU ĐỘNG TỪ ADMIN */}
        {mobileMenuOpen && (
          <div style={{
            backgroundColor: '#071524',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            {/* Chuyển ngôn ngữ & Trạng thái trong Drawer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>Ngôn ngữ / Language:</div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '2px',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <button
                  onClick={() => changeLang('vi')}
                  style={{
                    background: currentLang === 'vi' ? '#0D9488' : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: currentLang === 'vi' ? '700' : '500',
                    cursor: 'pointer'
                  }}
                >
                  VI
                </button>
                <button
                  onClick={() => changeLang('en')}
                  style={{
                    background: currentLang === 'en' ? '#0D9488' : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: currentLang === 'en' ? '700' : '500',
                    cursor: 'pointer'
                  }}
                >
                  EN
                </button>
              </div>
            </div>
            {/* Nút Trợ lý AI trên Mobile */}
            <Link
              to="/ai-chat"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                backgroundColor: 'rgba(13, 148, 136, 0.25)',
                border: '1px solid #2DD4BF',
                color: '#2DD4BF',
                padding: '10px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}
            >
              <i className="ti ti-sparkles" style={{ color: '#F59E0B', fontSize: '16px' }} />
              <span>Trợ lý AI Doanh Nghiệp</span>
            </Link>

            {/* Danh mục cấp 1 & con động trên mobile */}
            {categoriesList.map((cat) => {
              const subs = getSubList(cat);
              const isExpanded = mobileExpandedCatId === (cat.id || cat.name);
              const catDisplayName = getCategoryName(cat);

              return (
                <div key={cat.id || cat.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link
                      to={`/posts?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '600', fontSize: '13.5px', flex: 1, padding: '6px 0' }}
                    >
                      {catDisplayName}
                    </Link>
                    {subs.length > 0 && (
                      <button
                        onClick={() => setMobileExpandedCatId(isExpanded ? null : (cat.id || cat.name))}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '4px 8px', fontSize: '14px', cursor: 'pointer' }}
                        aria-label="Mở danh mục con"
                      >
                        <i className={isExpanded ? "ti ti-chevron-up" : "ti ti-chevron-down"}></i>
                      </button>
                    )}
                  </div>

                  {subs.length > 0 && isExpanded && (
                    <div style={{ paddingLeft: '14px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <Link
                        to={`/posts?category=${encodeURIComponent(cat.name)}`}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ color: '#F59E0B', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}
                      >
                        👉 {catDisplayName} ({currentLang === 'en' ? 'All' : 'Xem tất cả'})
                      </Link>
                      {subs.map((sub, idx) => {
                        const subName = typeof sub === 'object' ? sub.name : sub;
                        const subLabel = getSubName(sub);
                        return (
                          <Link
                            key={idx}
                            to={`/posts?category=${encodeURIComponent(cat.name)}&subCategory=${encodeURIComponent(subName)}`}
                            onClick={() => setMobileMenuOpen(false)}
                            style={{ color: '#cbd5e1', fontSize: '12px', textDecoration: 'none', padding: '4px 0' }}
                          >
                            • {subLabel}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Actions trên mobile */}
            <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Cài đặt Ứng dụng PWA trên Mobile */}
              {isInstallable && !isInstalled && (
                <button
                  onClick={() => { installApp(); setMobileMenuOpen(false); }}
                  style={{
                    backgroundColor: 'rgba(13, 148, 136, 0.2)',
                    border: '1px solid #2DD4BF',
                    color: '#2DD4BF',
                    textAlign: 'center',
                    padding: '9px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <i className="ti ti-device-mobile-down" style={{ fontSize: '16px' }}></i>
                  <span>Cài đặt Ứng dụng PWA</span>
                </button>
              )}

              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  backgroundColor: '#0D9488',
                  color: '#ffffff',
                  textAlign: 'center',
                  padding: '9px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '13px'
                }}
              >
                Gia nhập Hội Doanh Nghiệp
              </Link>
              {role === 'guest' ? (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    color: '#ffffff',
                    textAlign: 'center',
                    padding: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '13px'
                  }}
                >
                  Đăng nhập Hội viên
                </Link>
              ) : (
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  style={{
                    color: '#f87171',
                    background: 'none',
                    border: '1px solid #f87171',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Đăng xuất
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
