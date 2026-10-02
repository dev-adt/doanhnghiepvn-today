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

  // Handle dropdown hover with slight debounce (Chuột)
  const handleMouseEnter = (catId) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdownId(catId);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdownId(null);
    }, 180);
  };

  // Toggle Dropdown cho Touchscreen & Keyboard
  const handleToggleDropdown = (catId, e) => {
    e.stopPropagation();
    setActiveDropdownId(prev => (prev === catId ? null : catId));
  };

  // Keyboard navigation (Enter / Space / Escape)
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
    <header className="dnvn-navbar-header" style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: '#091524',
      backgroundImage: 'linear-gradient(to right, #091524 0%, #0d2238 50%, #091524 100%)',
      borderBottom: '1px solid rgba(20, 184, 166, 0.25)',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
      width: '100%',
      overflow: 'visible'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.45rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'clamp(0.5rem, 1vw, 1.25rem)',
        flexWrap: 'nowrap',
        overflow: 'visible'
      }}>
        {/* 1. BRAND LOGO (HỆ SINH THÁI .TODAY) */}
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
            flexShrink: 0 
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
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                fontSize: '20px',
                fontWeight: '900',
                color: '#ffffff',
                letterSpacing: '-0.3px',
                lineHeight: 1.1
              }}>
                {brandConfig.brandShortName || 'DoanhNghiepVN'}
                <span style={{ color: '#0D9488' }}>.today</span>
              </span>
            </div>
            <span style={{
              fontSize: '8px',
              letterSpacing: '0.6px',
              color: '#5eead4',
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
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(0.2rem, 0.4vw, 0.55rem)',
            flexWrap: 'nowrap',
            flex: 1,
            margin: '0 0.5rem',
            overflow: 'visible'
          }}
        >
          {/* Danh mục cấp 1 & Lĩnh vực con lấy động từ Admin */}
          {categoriesList.map((cat) => {
            const subs = getSubList(cat);
            const hasSubs = subs.length > 0;
            const isOpen = activeDropdownId === (cat.id || cat.name);
            const isCatActive = location.pathname === '/posts' && location.search.includes(encodeURIComponent(cat.name));
            const catDisplayName = getCategoryName(cat);

            return (
              <div
                key={cat.id || cat.name}
                style={{ position: 'relative', flexShrink: 0 }}
                onMouseEnter={() => handleMouseEnter(cat.id || cat.name)}
                onMouseLeave={handleMouseLeave}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Link
                    to={`/posts?category=${encodeURIComponent(cat.name)}`}
                    className={`dnvn-nav-link ${isCatActive ? 'active' : ''}`}
                    style={{
                      color: isCatActive ? '#5eead4' : '#f1f5f9',
                      backgroundColor: isOpen || isCatActive ? 'rgba(13, 148, 136, 0.22)' : 'transparent',
                      fontWeight: isCatActive ? '700' : '600',
                      fontSize: '12.5px',
                      textDecoration: 'none',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      transition: 'all 0.18s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCatActive) e.currentTarget.style.color = '#5eead4';
                      e.currentTarget.style.backgroundColor = 'rgba(13, 148, 136, 0.18)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCatActive) e.currentTarget.style.color = '#f1f5f9';
                      if (!isOpen && !isCatActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>{catDisplayName}</span>
                  </Link>

                  {/* Nút dropdown cho cảm ứng và bàn phím */}
                  {hasSubs && (
                    <button
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                      onClick={(e) => handleToggleDropdown(cat.id || cat.name, e)}
                      onKeyDown={(e) => handleKeyDown(cat.id || cat.name, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isOpen ? '#5eead4' : '#94a3b8',
                        padding: '6px 4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none'
                      }}
                      title="Mở menu con"
                    >
                      <i className="ti ti-chevron-down" style={{
                        fontSize: '11px',
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.18s ease'
                      }}></i>
                    </button>
                  )}
                </div>

                {/* Subcategory Dropdown Panel (Multi-level popup) */}
                {hasSubs && isOpen && (
                  <div 
                    role="menu"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      minWidth: '250px',
                      backgroundColor: '#0a192c',
                      backgroundImage: 'linear-gradient(180deg, #0e233c 0%, #081525 100%)',
                      border: '1px solid rgba(20, 184, 166, 0.4)',
                      borderRadius: '8px',
                      padding: '6px 0',
                      boxShadow: '0 16px 36px rgba(0, 0, 0, 0.8)',
                      zIndex: 2000,
                      animation: 'fadeInDown 0.15s ease-out'
                    }}
                  >
                    {/* Header chuyên mục cha */}
                    <Link
                      to={`/posts?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setActiveDropdownId(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 14px',
                        color: '#f59e0b',
                        fontWeight: '700',
                        fontSize: '12px',
                        textDecoration: 'none',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        marginBottom: '4px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <span>{catDisplayName} (Tất cả)</span>
                      <i className="ti ti-arrow-right" style={{ fontSize: '11px' }}></i>
                    </Link>

                    {/* Danh sách các lĩnh vực/chuyên mục con */}
                    {subs.map((sub, idx) => {
                      const subName = typeof sub === 'object' ? sub.name : sub;
                      const subLabel = getSubName(sub);
                      return (
                        <Link
                          key={idx}
                          to={`/posts?category=${encodeURIComponent(cat.name)}&subCategory=${encodeURIComponent(subName)}`}
                          onClick={() => setActiveDropdownId(null)}
                          style={{
                            display: 'block',
                            padding: '7px 14px',
                            color: '#e2e8f0',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: '500',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(13, 148, 136, 0.2)';
                            e.currentTarget.style.color = '#5eead4';
                            e.currentTarget.style.paddingLeft = '18px';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#e2e8f0';
                            e.currentTarget.style.paddingLeft = '14px';
                          }}
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

          {/* Sự kiện (Trọng tâm) */}
          <Link
            to="/events"
            className={`dnvn-nav-link ${location.pathname === '/events' ? 'active' : ''}`}
            style={{
              color: location.pathname === '/events' ? '#5eead4' : '#f1f5f9',
              backgroundColor: location.pathname === '/events' ? 'rgba(13, 148, 136, 0.25)' : 'transparent',
              fontWeight: location.pathname === '/events' ? '700' : '600',
              fontSize: '12.5px',
              textDecoration: 'none',
              padding: '6px 8px',
              borderRadius: '6px',
              transition: 'all 0.18s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <i className="ti ti-calendar-event" style={{ color: '#f59e0b', fontSize: '13px' }}></i>
            <span>Sự kiện</span>
          </Link>

          {/* Doanh nghiệp & Hội viên */}
          <Link
            to="/members"
            className={`dnvn-nav-link ${location.pathname === '/members' ? 'active' : ''}`}
            style={{
              color: location.pathname === '/members' ? '#5eead4' : '#f1f5f9',
              backgroundColor: location.pathname === '/members' ? 'rgba(13, 148, 136, 0.25)' : 'transparent',
              fontWeight: location.pathname === '/members' ? '700' : '600',
              fontSize: '12.5px',
              textDecoration: 'none',
              padding: '6px 8px',
              borderRadius: '6px',
              transition: 'all 0.18s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <span>Hội viên</span>
          </Link>

          {/* AI Trợ lý Doanh nghiệp */}
          <Link
            to="/ai-chat"
            style={{
              color: '#5eead4',
              fontWeight: '700',
              fontSize: '11.5px',
              textDecoration: 'none',
              backgroundColor: 'rgba(13, 148, 136, 0.2)',
              border: '1px solid rgba(20, 184, 166, 0.45)',
              padding: '4px 10px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.18s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(13, 148, 136, 0.35)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(13, 148, 136, 0.2)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <i className="ti ti-sparkles" style={{ fontSize: '12px', color: '#f59e0b' }}></i>
            <span>AI Bot</span>
          </Link>
        </nav>

        {/* 3. RIGHT ACTIONS: LANGUAGE SWITCHER + REGISTER + LOGIN/PROFILE */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0
        }}>
          {/* Chuyển đổi ngôn ngữ */}
          <div style={{
            display: 'flex',
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
                padding: '2px 7px',
                fontSize: '10.5px',
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
                padding: '2px 7px',
                fontSize: '10.5px',
                fontWeight: currentLang === 'en' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              EN
            </button>
          </div>

          {/* Nút Đăng ký gia nhập Hội */}
          <Link
            to="/register"
            style={{
              backgroundColor: '#0D9488',
              backgroundImage: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: '700',
              padding: '6px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(13, 148, 136, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              transition: 'transform 0.18s, box-shadow 0.18s'
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
                color: '#ffffff',
                fontSize: '12px',
                textDecoration: 'none',
                fontWeight: '600',
                padding: '5px 8px',
                borderRadius: '6px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#5eead4'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#ffffff'; }}
            >
              {currentLang === 'en' ? 'Login' : 'Đăng nhập'}
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link
                to={role === 'admin' ? "/admin-dashboard" : role === 'creator' ? "/creator-dashboard" : "/member-dashboard"}
                style={{
                  width: '30px',
                  height: '30px',
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
                  color: '#f87171',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '3px'
                }}
                title={currentLang === 'en' ? "Logout" : "Đăng xuất"}
              >
                <i className="ti ti-logout"></i>
              </button>
            </div>
          )}

          {/* Nút Toggle Mobile Drawer */}
          <button
            className="dnvn-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '2px 4px'
            }}
            aria-label="Mở menu di động"
          >
            <i className={mobileMenuOpen ? "ti ti-x" : "ti ti-menu-2"}></i>
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER: DÙNG CHUNG CÙNG NGUỒN DỮ LIỆU ĐỘNG TỪ ADMIN CHO TẤT CẢ CÁC CẤP */}
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
                    style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '600', fontSize: '13.5px', flex: 1, padding: '5px 0' }}
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
                      style={{ color: '#f59e0b', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}
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
                          style={{ color: '#cbd5e1', fontSize: '12px', textDecoration: 'none', padding: '3px 0' }}
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

          {/* Mục Sự kiện */}
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: '600', fontSize: '13.5px', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="ti ti-calendar-event"></i>
            <span>Sự kiện & Diễn đàn</span>
          </Link>

          {/* Mục Hội viên */}
          <Link
            to="/members"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '600', fontSize: '13.5px', padding: '6px 0' }}
          >
            Danh bạ Hội viên Doanh nghiệp
          </Link>

          {/* Mục AI Bot */}
          <Link
            to="/ai-chat"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#5eead4', textDecoration: 'none', fontWeight: '700', fontSize: '13.5px', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="ti ti-sparkles" style={{ color: '#f59e0b' }}></i>
            <span>Trợ lý AI Doanh nghiệp</span>
          </Link>

          {/* Actions trên mobile */}
          <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                backgroundColor: '#0D9488',
                color: '#ffffff',
                textAlign: 'center',
                padding: '8px',
                borderRadius: '6px',
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
                  borderRadius: '6px',
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
                  borderRadius: '6px',
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
  );
};

export default Navbar;
