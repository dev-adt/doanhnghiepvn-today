import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import brandConfig from '../brand.config';

export const Navbar = () => {
  const { role, user, logout } = useAuth();
  const { currentLang, changeLang, t } = useTranslation();
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
          overflow: visible !important; /* CRITICAL: Must be visible so dropdown floats outside */
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
          overflow: visible !important; /* CRITICAL: Must be visible so dropdown floats outside */
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
          margin: 0 8px 0 12px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 4px !important;
          flex: 1 1 auto !important;
          min-width: 0 !important;
          overflow: visible !important; /* CRITICAL: Never use overflow-x: auto so dropdown is NEVER cut off! */
        }

        @media (max-width: 1024px) {
          .dnvn-nav-center {
            display: none !important;
          }
          .dnvn-mobile-toggle {
            display: flex !important;
          }
        }

        @media (min-width: 1025px) {
          .dnvn-mobile-toggle {
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

        /* Subcategory Dropdown Panel: Floats directly below header with high z-index and bridge */
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

        /* Right side action container: pinned to the far right with margin-left auto */
        .dnvn-nav-right {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          margin-left: auto !important;
          flex-shrink: 0 !important;
          overflow: visible !important;
        }
      `}</style>

      <header className="dnvn-navbar-header">
        <div className="dnvn-navbar-container">
          
          {/* 1. BRAND LOGO */}
          <Link 
            to="/" 
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              textDecoration: 'none', 
              flexShrink: 0,
              marginRight: '6px'
            }}
            title={brandConfig.brandName}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: '900',
              fontSize: '14px',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 10px rgba(13, 148, 136, 0.4)',
              border: '1.5px solid rgba(255,255,255,0.2)'
            }}>
              DN
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: '#ffffff',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.1
                }}>
                  {brandConfig.brandShortName || 'DoanhNghiepVN'}
                  <span style={{ color: '#2DD4BF' }}>.today</span>
                </span>
              </div>
              <span style={{
                fontSize: '8px',
                letterSpacing: '0.6px',
                color: '#2DD4BF',
                fontWeight: '700',
                textTransform: 'uppercase',
                marginTop: '1px'
              }}>
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
          </nav>

          {/* 3. RIGHT ACTIONS: LUÔN NẰM SÁT MÉP PHẢI (MARGIN-LEFT AUTO), KHÔNG BAO GIỜ BỊ KHUẤT */}
          <div className="dnvn-nav-right">
            
            {/* Nút Trợ lý AI (Nằm độc lập trên thanh công cụ bên phải, tên chuẩn "Trợ lý AI", không bao giờ bị khuất) */}
            <Link
              to="/ai-chat"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(13, 148, 136, 0.2)',
                border: '1px solid rgba(45, 212, 191, 0.45)',
                color: '#2DD4BF',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(13, 148, 136, 0.35)';
                e.currentTarget.style.borderColor = '#2DD4BF';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(13, 148, 136, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(45, 212, 191, 0.45)';
                e.currentTarget.style.transform = 'none';
              }}
              title="Trợ lý AI Doanh Nghiệp Việt Nam"
            >
              <i className="ti ti-sparkles" style={{ color: '#F59E0B', fontSize: '13px' }} />
              <span>Trợ lý AI</span>
            </Link>

            {/* Chuyển đổi ngôn ngữ */}
            <div style={{
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

            {/* Nút Đăng ký trải nghiệm / Gia nhập Hội */}
            <Link
              to="/register"
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
                  to={role === 'admin' ? "/admin-dashboard" : role === 'creator' ? "/creator-dashboard" : "/member-dashboard"}
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
