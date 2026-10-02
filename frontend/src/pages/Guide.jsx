import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { useTranslation } from '../contexts/LanguageContext';

export const Guide = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentLang } = useTranslation();

  const roleFromUrl = searchParams.get('role');
  const [activeRoleTab, setActiveRoleTab] = useState('member');
  const [activeSectionId, setActiveSectionId] = useState('');

  useEffect(() => {
    if (roleFromUrl === 'admin') {
      setActiveRoleTab('admin');
    } else if (roleFromUrl === 'creator') {
      setActiveRoleTab('creator');
    } else {
      setActiveRoleTab('member');
    }
  }, [roleFromUrl]);

  const handleSwitchTab = (tabKey) => {
    setActiveRoleTab(tabKey);
    setActiveSectionId('');
    if (tabKey === 'member') {
      setSearchParams({});
    } else {
      setSearchParams({ role: tabKey });
    }
  };

  const isEn = currentLang !== 'vi';

  // Tự động theo dõi phần (Section) đang được cuộn tới
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      { rootMargin: '-90px 0px -40% 0px', threshold: 0.15 }
    );

    const sections = document.querySelectorAll('.guide-section');
    sections.forEach((sec) => observer.observe(sec));

    return () => {
      sections.forEach((sec) => observer.unobserve(sec));
    };
  }, [activeRoleTab]);

  // Cuộn mượt tới phần tương ứng khi nhấp vào Menu bên trái
  const scrollToSection = (id) => {
    setActiveSectionId(id);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Nút nhấn Liên kết Tương tác (Link Pill) dành cho từ khóa
  const renderLinkPill = (text, to, icon = "ti-arrow-up-right") => (
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 10px',
        margin: '0 4px',
        borderRadius: '6px',
        background: 'rgba(56, 189, 248, 0.15)',
        color: 'var(--neon-cyan)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        fontSize: '13px',
        fontWeight: 700,
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--neon-cyan)';
        e.currentTarget.style.color = '#0f172a';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
        e.currentTarget.style.color = 'var(--neon-cyan)';
      }}
    >
      {text} <i className={`ti ${icon}`} style={{ fontSize: '12px' }}></i>
    </Link>
  );

  // Danh mục Menu Hướng dẫn cho từng Vai trò
  const memberNavItems = [
    { id: 'sec-member-register', title: isEn ? "1. Member Registration (4 Steps)" : "1. Quy trình Đăng ký (4 Bước)", icon: "ti-user-plus" },
    { id: 'sec-member-login', title: isEn ? "2. Unified Authentication Portal" : "2. Cổng Đăng Nhập Hợp Nhất", icon: "ti-login" },
    { id: 'sec-member-dashboard', title: isEn ? "3. Dashboard & Tier Benefits" : "3. Dashboard & Quyền Lợi Gói", icon: "ti-layout-dashboard" },
    { id: 'sec-member-editor', title: isEn ? "4. SEO Post Editor" : "4. Soạn Bài Viết Chuẩn SEO", icon: "ti-edit" },
    { id: 'sec-member-ai', title: isEn ? "5. AI Business Assistant" : "5. Trợ Lý AI Chuyên Sâu", icon: "ti-robot" },
    { id: 'sec-member-explore', title: isEn ? "6. Posts, Directory & Events" : "6. Bảng Tin, Danh Bạ & Sự Kiện", icon: "ti-news" }
  ];

  const creatorNavItems = [
    { id: 'sec-creator-intro', title: isEn ? "1. Content Creator Role" : "1. Vai Trò Biên Tập Viên", icon: "ti-edit-circle" },
    { id: 'sec-creator-login', title: isEn ? "2. Creator Login Portal" : "2. Đăng Nhập Cổng Hợp Nhất", icon: "ti-login" },
    { id: 'sec-creator-dashboard', title: isEn ? "3. Creator Dashboard & Approval" : "3. Dashboard & Duyệt Bài Tự Động", icon: "ti-layout-dashboard" }
  ];

  const adminNavItems = [
    { id: 'sec-admin-privileges', title: isEn ? "1. Admin Privileges" : "1. Quyền Hạn Quản Trị Viên", icon: "ti-shield-lock" },
    { id: 'sec-admin-login', title: isEn ? "2. Admin Login & Overview" : "2. Đăng Nhập & Admin Overview", icon: "ti-login" },
    { id: 'sec-admin-members', title: isEn ? "3. Member Management & Tiers" : "3. Quản Lý Hồ Sơ Hội Viên", icon: "ti-users" },
    { id: 'sec-admin-posts', title: isEn ? "4. Moderation & Homepage Pinning" : "4. Quản Lý Bài Viết & Ghim Top", icon: "ti-news" },
    { id: 'sec-admin-events-cats', title: isEn ? "5. Events, Categories & Creators" : "5. Sự Kiện, Chuyên Mục & Creators", icon: "ti-settings" },
    { id: 'sec-admin-contacts', title: isEn ? "6. Leads & Homepage Contacts" : "6. Quản Lý Liên Hệ & Đăng Ký", icon: "ti-address-book" }
  ];

  const currentNavItems = activeRoleTab === 'member' ? memberNavItems : activeRoleTab === 'creator' ? creatorNavItems : adminNavItems;

  return (
    <div className="public-body">
      <SEOHead 
        title={isEn ? "System User Guide | DoanhNghiepVN.today" : "Hướng Dẫn Sử Dụng Hệ Thống | DoanhNghiepVN.today"} 
        description={isEn ? "Detailed step-by-step user guide for Business Members, Content Creators, and System Administrators on DoanhNghiepVN.today." : "Tài liệu hướng dẫn sử dụng chi tiết các tính năng dành cho Doanh nghiệp Hội viên, Biên tập viên và Quản trị viên hệ thống DoanhNghiepVN.today."}
      />
      <Navbar />

      <div className="public-container" style={{ paddingBottom: '5rem', paddingTop: '2rem', minHeight: '85vh' }}>
        
        {/* Banner tiêu đề trang */}
        <div className="glass-card" style={{ padding: '2.25rem 2rem', textAlign: 'center', marginBottom: '2rem', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid var(--border-strong)' }}>
          <div style={{ display: 'inline-block', margin: '0 auto 12px', padding: '6px 16px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--neon-cyan)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <i className="ti ti-book" style={{ marginRight: '6px' }}></i> {isEn ? "Help & Support Center" : "Trung tâm Hướng dẫn & Hỗ trợ"}
          </div>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px 0', lineHeight: 1.3 }}>
            {isEn ? (
              <>User Guide for <span style={{ color: 'var(--neon-cyan)' }}>DoanhNghiepVN.today</span> Platform</>
            ) : (
              <>Hướng Dẫn Sử Dụng Nền Tảng <span style={{ color: 'var(--neon-cyan)' }}>DoanhNghiepVN.today</span></>
            )}
          </h1>
          <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', maxWidth: '750px', margin: '0 auto', lineHeight: 1.6 }}>
            {isEn 
              ? "Interactive step-by-step user documentation for trade matching, profile management, media content creation, and full system administration."
              : "Tài liệu hướng dẫn trực quan từng bước cho các tính năng kết nối giao thương, quản lý hồ sơ, sáng tạo nội dung truyền thông và quản trị toàn diện hệ thống."
            }
          </p>

          {/* Thanh chuyển tab vai trò */}
          <div style={{ display: 'inline-flex', gap: '8px', background: 'rgba(15, 23, 42, 0.7)', padding: '6px', borderRadius: '12px', marginTop: '1.5rem', border: '1px solid var(--border)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={() => handleSwitchTab('member')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeRoleTab === 'member' ? 'var(--primary)' : 'transparent',
                color: activeRoleTab === 'member' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <i className="ti ti-building-store"></i> {isEn ? "Business Member" : "Hội viên Doanh nghiệp"}
            </button>
            <button 
              onClick={() => handleSwitchTab('creator')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeRoleTab === 'creator' ? 'var(--neon-cyan)' : 'transparent',
                color: activeRoleTab === 'creator' ? '#0f172a' : 'var(--text-secondary)'
              }}
            >
              <i className="ti ti-edit-circle"></i> {isEn ? "Content Creator" : "Biên tập viên (Creator)"}
            </button>
            <button 
              onClick={() => handleSwitchTab('admin')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeRoleTab === 'admin' ? '#f59e0b' : 'transparent',
                color: activeRoleTab === 'admin' ? '#0f172a' : 'var(--text-secondary)'
              }}
            >
              <i className="ti ti-shield-lock"></i> {isEn ? "System Admin" : "Quản trị viên (Admin)"}
            </button>
          </div>
        </div>

        {/* Khung nội dung chính: Sidebar Menu Trái + Nội dung Hướng dẫn Phải */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 280px) 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* MENU BÊN TRÁI (Sticky Sidebar Table of Contents) */}
          <div className="glass-card" style={{ position: 'sticky', top: '90px', padding: '1.25rem 1rem', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border-strong)', zIndex: 10 }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', paddingLeft: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ti ti-list" style={{ color: 'var(--neon-cyan)' }}></i> {isEn ? "Navigation Menu" : "Danh mục Hướng dẫn"}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {currentNavItems.map((item) => {
                const isActive = activeSectionId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                      background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--neon-cyan)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className={`ti ${item.icon}`} style={{ fontSize: '14px', color: isActive ? 'var(--neon-cyan)' : 'var(--text-muted)' }}></i>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Khung trợ giúp nhanh ở chân sidebar */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {isEn ? "Need instant support?" : "Cần hỗ trợ ngay?"}
              </div>
              {renderLinkPill(isEn ? "Open AI Assistant" : "Mở Trợ lý AI", "/ai-chat", "ti-robot")}
            </div>
          </div>

          {/* NỘI DUNG HƯỚNG DẪN BÊN PHẢI */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: HƯỚNG DẪN DÀNH CHO HỘI VIÊN DOANH NGHIỆP (MEMBER GUIDE) */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeRoleTab === 'member' && (
              <>
                {/* Phần 1: Quy trình Đăng ký tài khoản Hội viên */}
                <div 
                  id="sec-member-register" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: activeSectionId === 'sec-member-register' ? '2px solid var(--neon-cyan)' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-member-register' ? '0 0 25px rgba(56, 189, 248, 0.25)' : 'none'
                  }}
                >
                  {activeSectionId === 'sec-member-register' && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.2)', color: 'var(--neon-cyan)', border: '1px solid rgba(56, 189, 248, 0.4)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)', display: 'inline-block' }}></span>
                      {isEn ? "Viewing" : "Đang xem"}
                    </div>
                  )}

                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: 'var(--primary)', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800 }}>1</span>
                    {isEn ? "4-Step Enterprise Membership Registration" : "Quy trình Đăng ký Tài khoản Hội viên (4 Bước)"}
                  </h2>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {isEn ? (
                      <>Participating businesses simply click {renderLinkPill("Join Now", "/register")} or {renderLinkPill("Register", "/register")} to begin the 4-step registration process:</>
                    ) : (
                      <>Các doanh nghiệp tham gia chỉ cần nhấn vào nút {renderLinkPill("Gia nhập ngay", "/register")} hoặc {renderLinkPill("Đăng ký", "/register")} để bắt đầu quy trình kê khai 4 bước chuẩn hóa:</>
                    )}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1.25rem', background: 'var(--surface-1)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <h4 style={{ color: 'var(--neon-cyan)', margin: '0 0 8px 0', fontSize: '15px' }}>
                        {isEn ? "Step 1: Business Information" : "Bước 1: Thông tin Doanh nghiệp"}
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {isEn ? (
                          <>
                            <li>Official company name per license.</li>
                            <li>Industry sector & Headquarters city.</li>
                            <li>Tax code, scale & address.</li>
                          </>
                        ) : (
                          <>
                            <li>Tên doanh nghiệp chính thức theo GPKD.</li>
                            <li>Lĩnh vực hoạt động & Tỉnh/Thành phố.</li>
                            <li>Mã số thuế, Quy mô nhân sự & Địa chỉ.</li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div style={{ padding: '1.25rem', background: 'var(--surface-1)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <h4 style={{ color: 'var(--neon-cyan)', margin: '0 0 8px 0', fontSize: '15px' }}>
                        {isEn ? "Step 2: Representative Info" : "Bước 2: Người Đại diện"}
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {isEn ? (
                          <>
                            <li>Full name of legal representative.</li>
                            <li>Position/Title at company.</li>
                            <li>Official email or mobile phone login credential.</li>
                          </>
                        ) : (
                          <>
                            <li>Họ và tên người đại diện pháp luật / liên hệ.</li>
                            <li>Chức vụ công tác tại doanh nghiệp.</li>
                            <li>Email hoặc Số điện thoại đăng nhập chính.</li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div style={{ padding: '1.25rem', background: 'var(--surface-1)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <h4 style={{ color: 'var(--neon-cyan)', margin: '0 0 8px 0', fontSize: '15px' }}>
                        {isEn ? "Step 3: Password & Subscription" : "Bước 3: Mật khẩu & Chọn Gói"}
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {isEn ? (
                          <>
                            <li>Confirm login Username (Email/Phone).</li>
                            <li>Personal password (min 8 chars).</li>
                            <li>Select Membership Tier (Silver, Gold, Platinum).</li>
                          </>
                        ) : (
                          <>
                            <li>Xác nhận Tên đăng nhập (Email / SĐT).</li>
                            <li>Mật khẩu bảo mật cá nhân (tối thiểu 8 ký tự).</li>
                            <li>Lựa chọn Gói hội viên (Silver, Gold, Platinum).</li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div style={{ padding: '1.25rem', background: 'var(--surface-1)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <h4 style={{ color: 'var(--amber)', margin: '0 0 8px 0', fontSize: '15px' }}>
                        {isEn ? "Step 4: Application Review" : "Bước 4: Xét duyệt Hồ sơ"}
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {isEn ? (
                          <>
                            <li>Account status is set to Pending.</li>
                            <li>Admin reviews & approves promptly.</li>
                            <li>Immediate login enabled upon approval.</li>
                          </>
                        ) : (
                          <>
                            <li>Hồ sơ chuyển sang trạng thái <strong>Chờ duyệt (Pending)</strong>.</li>
                            <li>Admin kiểm tra và phê duyệt trong thời gian ngắn.</li>
                            <li>Sau khi duyệt, có thể thực hiện {renderLinkPill("Đăng nhập ngay", "/login")}.</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
                    <img src="/img_guide/Members/register page.png" alt="Form Đăng ký Hội viên" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    <div style={{ padding: '10px 16px', background: 'var(--surface-1)', fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                      {isEn 
                        ? "Professional 4-step enterprise membership registration form"
                        : "Form kê khai thông tin Đăng ký Hội viên 4 bước chuyên nghiệp"
                      }
                    </div>
                  </div>
                </div>

                {/* Phần 2: Đăng nhập Hợp nhất */}
                <div 
                  id="sec-member-login" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: activeSectionId === 'sec-member-login' ? '2px solid var(--neon-cyan)' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-member-login' ? '0 0 25px rgba(56, 189, 248, 0.25)' : 'none'
                  }}
                >
                  {activeSectionId === 'sec-member-login' && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.2)', color: 'var(--neon-cyan)', border: '1px solid rgba(56, 189, 248, 0.4)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)', display: 'inline-block' }}></span>
                      {isEn ? "Viewing" : "Đang xem"}
                    </div>
                  )}

                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: 'var(--primary)', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800 }}>2</span>
                    {isEn ? "Unified System Authentication Portal" : "Cổng Đăng Nhập Hợp Nhất Hệ Thống"}
                  </h2>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {isEn ? (
                      <>DoanhNghiepVN.today employs a smart unified authentication mechanism. Whether you are a Business Member, Content Creator, or Admin, simply click {renderLinkPill("Login Portal", "/login")} and enter your credentials to be automatically routed to your respective Dashboard.</>
                    ) : (
                      <>DoanhNghiepVN.today ứng dụng cơ chế đăng nhập hợp nhất thông minh. Cho dù bạn là Hội viên Doanh nghiệp, Biên tập viên hay Admin Quản trị, bạn chỉ cần nhấp vào {renderLinkPill("Đăng nhập", "/login")} và điền Tên đăng nhập (Email / SĐT) và Mật khẩu tại một biểu mẫu duy nhất ➔ Hệ thống tự động chuyển hướng bạn tới Dashboard tương ứng.</>
                    )}
                  </p>
                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-strong)', maxWidth: '800px', margin: '0 auto' }}>
                    <img src="/img_guide/Members/login.png" alt="Form Đăng nhập Hợp nhất" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    <div style={{ padding: '10px 16px', background: 'var(--surface-1)', fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                      {isEn ? "Secure unified login portal interface" : "Giao diện Form đăng nhập hợp nhất bảo mật cao"}
                    </div>
                  </div>
                </div>

                {/* Phần 3: Dashboard Hội viên & Quản lý Phân hạng */}
                <div 
                  id="sec-member-dashboard" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: activeSectionId === 'sec-member-dashboard' ? '2px solid var(--neon-cyan)' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-member-dashboard' ? '0 0 25px rgba(56, 189, 248, 0.25)' : 'none'
                  }}
                >
                  {activeSectionId === 'sec-member-dashboard' && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.2)', color: 'var(--neon-cyan)', border: '1px solid rgba(56, 189, 248, 0.4)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)', display: 'inline-block' }}></span>
                      {isEn ? "Viewing" : "Đang xem"}
                    </div>
                  )}

                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: 'var(--primary)', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800 }}>3</span>
                    {isEn ? "Member Dashboard & Subscription Tier Benefits" : "Quản trị Dashboard Hội viên & Quyền lợi Gói Giao thương"}
                  </h2>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {isEn ? (
                      <>Upon logging in, access your {renderLinkPill("Member Dashboard", "/member-dashboard")} to manage company profiles, track remaining post counts, and request subscription upgrades:</>
                    ) : (
                      <>Sau khi đăng nhập thành công, bạn có thể truy cập {renderLinkPill("Dashboard Hội viên", "/member-dashboard")} để quản lý hồ sơ doanh nghiệp, theo dõi số lượt tin bài còn lại và nâng cấp gói hội viên:</>
                    )}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(148,163,184,0.08)', border: '1px solid var(--border)' }}>
                      <div style={{ color: '#94a3b8', fontWeight: 800, fontSize: '16px', marginBottom: '6px' }}>🥈 {isEn ? "SILVER Tier (Default)" : "Gói SILVER (Mặc định)"}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {isEn ? "Free. Up to 3 posts/month, 5 AI queries/day. Standard directory placement." : "Miễn phí. Đăng tối đa 3 bài viết/tháng, 5 câu hỏi AI/ngày. Thứ hạng danh bạ tiêu chuẩn."}
                      </div>
                    </div>
                    <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
                      <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '16px', marginBottom: '6px' }}>🥇 {isEn ? "GOLD Tier (Advanced)" : "Gói GOLD (Nâng cao)"}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {isEn ? "Paid. 15 posts/month, 50 AI queries/day. Higher placement in the business directory." : "Đăng 15 bài viết/tháng, 50 lượt hỏi AI/ngày. Thứ hạng cao hơn trong danh bạ doanh nghiệp."}
                      </div>
                    </div>
                    <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)' }}>
                      <div style={{ color: 'var(--neon-cyan)', fontWeight: 800, fontSize: '16px', marginBottom: '6px' }}>💎 {isEn ? "PLATINUM Tier (Premium)" : "Gói PLATINUM (Cao cấp)"}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {isEn ? "Unlimited posts & AI chat. Exclusive privilege to request homepage featured pinning and access advanced AI models." : "Không giới hạn tin đăng & AI chat. Độc quyền yêu cầu ghim bài nổi bật ngoài Trang chủ và dùng toàn bộ mô hình AI nâng cao."}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
                    <img src="/img_guide/Members/member dashboard.png" alt="Dashboard Hội viên" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    <div style={{ padding: '10px 16px', background: 'var(--surface-1)', fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                      {isEn ? "Member Dashboard displaying tier status, expiration dates, and post management" : "Giao diện trang Dashboard Hội viên hiển thị phân hạng, hạn sử dụng và quản lý tin bài"}
                    </div>
                  </div>
                </div>

                {/* Phần 4: Soạn & Đăng bài viết chuẩn SEO */}
                <div 
                  id="sec-member-editor" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: activeSectionId === 'sec-member-editor' ? '2px solid var(--neon-cyan)' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-member-editor' ? '0 0 25px rgba(56, 189, 248, 0.25)' : 'none'
                  }}
                >
                  {activeSectionId === 'sec-member-editor' && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.2)', color: 'var(--neon-cyan)', border: '1px solid rgba(56, 189, 248, 0.4)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)', display: 'inline-block' }}></span>
                      {isEn ? "Viewing" : "Đang xem"}
                    </div>
                  )}

                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: 'var(--primary)', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800 }}>4</span>
                    {isEn ? "SEO-Optimized Article Editor (Rich Text Editor)" : "Soạn & Đăng bài viết Chuẩn SEO (Rich Text Editor)"}
                  </h2>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {isEn ? (
                      <>DoanhNghiepVN.today provides a feature-rich WYSIWYG editor to create professional posts optimized for Google Search. Access {renderLinkPill("Post Article", "/member-dashboard")} from your dashboard to begin:</>
                    ) : (
                      <>DoanhNghiepVN.today trang bị công cụ soạn thảo phong phú Rich Text Editor giúp bài viết của doanh nghiệp chuyên nghiệp và tối ưu cho Google Search. Nhấn vào {renderLinkPill("Đăng bài viết mới", "/member-dashboard")} tại Dashboard để trải nghiệm:</>
                    )}
                  </p>
                  
                  <ul style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                    {isEn ? (
                      <>
                        <li><strong>Content Formatting</strong>: Custom font sizes, text highlighting, video embeds (YouTube/Drive), and flexible image scaling up to 50MB.</li>
                        <li><strong>Post Categorization</strong>: Select post types (General News, Partner Search, Buy/Sell, Event Notification, Recruitment, Seafood Market).</li>
                        <li><strong>Full-Screen Editing</strong>: Click full-screen toggle button to edit spacious long-form posts easily.</li>
                        <li><strong>Featured Pin Privilege (Platinum)</strong>: Platinum members can toggle <em>"Request Admin to pin this post on the home page"</em>.</li>
                      </>
                    ) : (
                      <>
                        <li><strong>Định dạng nội dung phong phú</strong>: Thay đổi kích thước chữ, highlight, chèn video (YouTube, Google Drive), tải ảnh 50MB và kéo thu phóng ảnh linh hoạt.</li>
                        <li><strong>Phân loại bài viết</strong>: Chọn Loại tin bài (<em>Tin chung, Tìm kiếm đối tác, Cần mua/Cần bán, Thông báo sự kiện, Tuyển dụng, Chợ Hải Sản</em>).</li>
                        <li><strong>Chế độ Phóng to toàn màn hình</strong>: Nhấn nút phóng to để soạn bài viết trực quan, dễ dàng hơn.</li>
                        <li><strong>Quyền lợi Ghim bài (Platinum)</strong>: Thành viên Platinum được tích chọn <em>"Yêu cầu Ban quản trị ghim nổi bật bài đăng này ngoài trang chủ"</em>.</li>
                      </>
                    )}
                  </ul>

                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
                    <img src="/img_guide/Members/member upload post setting.png" alt="Modal Soạn bài viết" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    <div style={{ padding: '10px 16px', background: 'var(--surface-1)', fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                      {isEn ? "Trade post editor modal with Rich Text formatting tools and SEO Meta Description settings" : "Modal Soạn bài viết giao thương với đầy đủ công cụ Rich Text và thiết lập SEO Meta Description"}
                    </div>
                  </div>
                </div>

                {/* Phần 5: Khai thác Trợ lý AI Chuyên sâu */}
                <div 
                  id="sec-member-ai" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: activeSectionId === 'sec-member-ai' ? '2px solid var(--neon-cyan)' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-member-ai' ? '0 0 25px rgba(56, 189, 248, 0.25)' : 'none'
                  }}
                >
                  {activeSectionId === 'sec-member-ai' && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.2)', color: 'var(--neon-cyan)', border: '1px solid rgba(56, 189, 248, 0.4)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)', display: 'inline-block' }}></span>
                      {isEn ? "Viewing" : "Đang xem"}
                    </div>
                  )}

                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: 'var(--primary)', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800 }}>5</span>
                    {isEn ? "Advanced Business AI Assistant & Model Switching" : "Khai thác Trợ lý AI Chuyên sâu & Chuyển đổi Mô hình"}
                  </h2>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {isEn ? (
                      <>Click {renderLinkPill("AI Assistant", "/ai-chat", "ti-robot")} in the header menu to receive business strategy consultations and market analysis. Gold & Platinum members can switch between cutting-edge LLMs: OpenAI GPT-4o, DeepSeek V3/R1, Claude 4 Opus, and Gemini 3 Flash.</>
                    ) : (
                      <>Nhấn vào mục {renderLinkPill("Trợ lý AI", "/ai-chat", "ti-robot")} trên thanh Header để tư vấn các chiến lược kinh doanh, tra cứu thông tin đối tác và phân tích kinh tế Việt Nam. Thành viên gói Gold & Platinum có quyền chuyển đổi giữa các mô hình AI tiên tiến nhất hiện nay: OpenAI GPT-4o, DeepSeek V3/R1, Claude 4 Opus, Gemini 3 Flash.</>
                    )}
                  </p>
                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
                    <img src="/img_guide/Members/AI assisstant page.png" alt="Trợ lý AI Doanh nghiệp" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    <div style={{ padding: '10px 16px', background: 'var(--surface-1)', fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                      {isEn ? "Business AI Assistant interface integrated with multi-LLM engine" : "Giao diện Trợ lý AI Doanh nghiệp tích hợp đa mô hình ngôn ngữ lớn"}
                    </div>
                  </div>
                </div>

                {/* Phần 6: Khám phá Bảng tin, Danh bạ & Sự kiện */}
                <div 
                  id="sec-member-explore" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: activeSectionId === 'sec-member-explore' ? '2px solid var(--neon-cyan)' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-member-explore' ? '0 0 25px rgba(56, 189, 248, 0.25)' : 'none'
                  }}
                >
                  {activeSectionId === 'sec-member-explore' && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.2)', color: 'var(--neon-cyan)', border: '1px solid rgba(56, 189, 248, 0.4)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)', display: 'inline-block' }}></span>
                      {isEn ? "Viewing" : "Đang xem"}
                    </div>
                  )}

                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: 'var(--primary)', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800 }}>6</span>
                    {isEn ? "Trade Bulletin, Member Directory & B2B Events" : "Bảng tin Giao thương, Danh bạ Doanh nghiệp & Sự kiện B2B"}
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', color: 'var(--neon-cyan)', marginBottom: '8px' }}>
                        {isEn ? "a. Opportunity Feed & Networking Posts" : "a. Bảng tin Bài viết & Cơ hội Kết nối"}
                      </h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '10px' }}>
                        {isEn ? (
                          <>Browse trade opportunities at {renderLinkPill("Posts & Bulletin", "/posts")}. Guests see previews; full contact info is unlocked upon logging in.</>
                        ) : (
                          <>Nơi tổng hợp bài viết giao thương tại {renderLinkPill("Bảng tin Bài viết", "/posts")}. Khách vãng lai xem tóm tắt bài viết; thông tin liên hệ được mở khóa khi {renderLinkPill("Đăng nhập", "/login")}.</>
                        )}
                      </p>
                      <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src="/img_guide/Members/posts page.png" alt="Trang tin tức bài viết" style={{ width: '100%', height: 'auto', display: 'block' }} />
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '16px', color: 'var(--neon-cyan)', marginBottom: '8px' }}>
                        {isEn ? "b. Business Member Directory" : "b. Danh bạ Doanh nghiệp Hội viên"}
                      </h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '10px' }}>
                        {isEn ? (
                          <>Search and filter partners by keyword, industry, and city at {renderLinkPill("Member Directory", "/members")}. Platinum and Gold members enjoy top priority placement.</>
                        ) : (
                          <>Truy cập mục {renderLinkPill("Danh bạ Doanh nghiệp", "/members")} để tìm kiếm và lọc danh sách đối tác theo từ khóa, ngành nghề và tỉnh thành. Các doanh nghiệp Platinum và Gold được ưu tiên sắp xếp ở các vị trí đầu tiên.</>
                        )}
                      </p>
                      <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src="/img_guide/Members/members page.png" alt="Danh bạ Doanh nghiệp" style={{ width: '100%', height: 'auto', display: 'block' }} />
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '16px', color: 'var(--neon-cyan)', marginBottom: '8px' }}>
                        {isEn ? "c. B2B Matchmaking Events" : "c. Sự kiện Kết nối B2B"}
                      </h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '10px' }}>
                        {isEn ? (
                          <>Stay updated on economic forums and tourism fairs in Việt Nam at {renderLinkPill("Events Page", "/events")}. Click 'Interested' to save events to your calendar.</>
                        ) : (
                          <>Cập nhật danh sách các diễn đàn kinh tế, hội chợ du lịch và tọa đàm kết nối tại {renderLinkPill("Trang Sự kiện", "/events")}. Doanh nghiệp có thể nhấn "Quan tâm" để lưu sự kiện vào lịch cá nhân.</>
                        )}
                      </p>
                      <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src="/img_guide/Members/events page.png" alt="Trang Sự kiện" style={{ width: '100%', height: 'auto', display: 'block' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: HƯỚNG DẪN DÀNH CHO BIÊN TẬP VIÊN (CONTENT CREATOR GUIDE) */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeRoleTab === 'creator' && (
              <>
                <div 
                  id="sec-creator-intro" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    borderLeft: '4px solid var(--neon-cyan)',
                    border: activeSectionId === 'sec-creator-intro' ? '2px solid var(--neon-cyan)' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-creator-intro' ? '0 0 25px rgba(56, 189, 248, 0.25)' : 'none'
                  }}
                >
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    <i className="ti ti-edit-circle" style={{ color: 'var(--neon-cyan)' }}></i> {isEn ? "Content Creator Role" : "1. Vai Trò Biên Tập Viên (Content Creator)"}
                  </h2>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    {isEn ? (
                      <>Content Creator accounts are created by Admins to publish official media articles, tourism news, and economic reports for DoanhNghiepVN.today. Access your {renderLinkPill("Creator Dashboard", "/creator-dashboard")} once authenticated.</>
                    ) : (
                      <>Tài khoản Biên tập viên được tạo bởi Ban quản trị Admin, có nhiệm vụ chuyên trách sáng tạo, biên tập và xuất bản các bài viết truyền thông, tin tức du lịch - kinh tế chính thống. Quản lý tác phẩm tại {renderLinkPill("Dashboard Biên tập viên", "/creator-dashboard")}.</>
                    )}
                  </p>
                </div>

                {/* Đăng nhập Creator */}
                <div 
                  id="sec-creator-login" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: activeSectionId === 'sec-creator-login' ? '2px solid var(--neon-cyan)' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-creator-login' ? '0 0 25px rgba(56, 189, 248, 0.25)' : 'none'
                  }}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    {isEn ? "2. Unified Portal Authentication" : "2. Đăng nhập Cổng Hợp Nhất"}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {isEn ? (
                      <>Content Creators log in using credentials provided by the Admin via the main {renderLinkPill("Login Portal", "/login")}.</>
                    ) : (
                      <>Biên tập viên sử dụng Tên đăng nhập (Username) và Mật khẩu được Admin cấp để đăng nhập tại màn hình {renderLinkPill("Đăng nhập chung", "/login")} của hệ thống.</>
                    )}
                  </p>
                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-strong)', maxWidth: '750px', margin: '0 auto' }}>
                    <img src="/img_guide/Creator/login.png" alt="Đăng nhập Biên tập viên" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                </div>

                {/* Dashboard Creator */}
                <div 
                  id="sec-creator-dashboard" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: activeSectionId === 'sec-creator-dashboard' ? '2px solid var(--neon-cyan)' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-creator-dashboard' ? '0 0 25px rgba(56, 189, 248, 0.25)' : 'none'
                  }}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    {isEn ? "3. Creator Dashboard & Approval Status" : "3. Giao diện Dashboard Biên tập viên & Trạng thái Duyệt bài"}
                  </h3>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {isEn ? (
                      <>The {renderLinkPill("Creator Dashboard", "/creator-dashboard")} is streamlined to remove business profile distractions and focus purely on content creation:</>
                    ) : (
                      <>Trang {renderLinkPill("Dashboard Biên tập viên", "/creator-dashboard")} được tối giản hóa toàn bộ các chi tiết doanh nghiệp để giúp người viết tập trung tối đa vào công việc sáng tạo nội dung:</>
                    )}
                  </p>

                  <ul style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                    {isEn ? (
                      <>
                        <li><strong>Approval Status Badge</strong>:
                          <ul style={{ marginTop: '4px' }}>
                            <li><strong style={{ color: '#10b981' }}>⚡ Auto-Approved</strong>: Posts are published immediately on the homepage upon submission.</li>
                            <li><strong style={{ color: '#f59e0b' }}>⏳ Requires Admin Review</strong>: Posts are submitted to Admins for review prior to publishing.</li>
                          </ul>
                        </li>
                        <li><strong>Stats Counters</strong>: Track <em>Total Posts</em>, <em>Published Posts</em>, and <em>Total Views</em>.</li>
                        <li><strong>Post Management</strong>: Edit, Delete, Save Drafts, or Preview live articles on the homepage.</li>
                      </>
                    ) : (
                      <>
                        <li><strong>Thẻ trạng thái Quyền duyệt bài</strong>:
                          <ul style={{ marginTop: '4px' }}>
                            <li><strong style={{ color: '#10b981' }}>⚡ Duyệt bài tự động</strong>: Bài viết do bạn đăng sẽ có ngay trạng thái <em>"Đã duyệt"</em> và phát hành ngay ngoài Trang chủ.</li>
                            <li><strong style={{ color: '#f59e0b' }}>⏳ Cần Admin duyệt</strong>: Bài viết khi đăng sẽ gửi yêu cầu tới Admin để phê duyệt trước khi xuất bản.</li>
                          </ul>
                        </li>
                        <li><strong>Bộ thống kê bài viết</strong>: Theo dõi nhanh <em>Tổng tin bài</em>, <em>Số bài đã xuất bản</em> và <em>Tổng lượt đọc (views)</em>.</li>
                        <li><strong>Danh sách bài đăng</strong>: Quản lý toàn bộ bài viết cá nhân, dễ dàng Chỉnh sửa, Xóa hoặc Xem trực tiếp bài đọc ngoài trang chủ.</li>
                      </>
                    )}
                  </ul>

                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
                    <img src="/img_guide/Creator/creator dashboard.png" alt="Dashboard Biên tập viên" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    <div style={{ padding: '10px 16px', background: 'var(--surface-1)', fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                      {isEn ? "Content Creator Dashboard with post management, draft saving, and view stats" : "Dashboard Biên tập viên với các tính năng đăng bài, lưu nháp và theo dõi thống kê lượt xem"}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 3: HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN (ADMIN GUIDE) */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeRoleTab === 'admin' && (
              <>
                <div 
                  id="sec-admin-privileges" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    borderLeft: '4px solid #f59e0b',
                    border: activeSectionId === 'sec-admin-privileges' ? '2px solid #f59e0b' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-admin-privileges' ? '0 0 25px rgba(245, 158, 11, 0.25)' : 'none'
                  }}
                >
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    <i className="ti ti-shield-lock" style={{ color: '#f59e0b' }}></i> {isEn ? "System Admin Privileges" : "1. Quyền Hạn Quản Trị Viên (System Admin)"}
                  </h2>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    {isEn ? (
                      <>Admins maintain full control over the platform via the {renderLinkPill("Admin Dashboard", "/admin-dashboard", "ti-shield")}, including Member approval, post moderation, homepage pinning, B2B event management, category taxonomy, and Content Creator accounts.</>
                    ) : (
                      <>Admin nắm toàn bộ quyền kiểm soát hệ thống tại {renderLinkPill("Admin Dashboard", "/admin-dashboard", "ti-shield")} bao gồm: Phê duyệt Doanh nghiệp Hội viên, Xét duyệt bài viết, Ghim bài trang chủ, Quản lý Sự kiện B2B, Cấu hình Chuyên mục và Quản lý tài khoản Biên tập viên.</>
                    )}
                  </p>
                </div>

                {/* Admin Login & Dashboard Overview */}
                <div 
                  id="sec-admin-login" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: activeSectionId === 'sec-admin-login' ? '2px solid #f59e0b' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-admin-login' ? '0 0 25px rgba(245, 158, 11, 0.25)' : 'none'
                  }}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    {isEn ? "2. Authentication & Admin Dashboard Overview" : "2. Đăng nhập & Admin Dashboard Tổng quan"}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {isEn ? (
                      <>Log in via the main {renderLinkPill("Login Portal", "/login")} to view instant statistics on Members, Posts, and Events.</>
                    ) : (
                      <>Admin thực hiện {renderLinkPill("Đăng nhập Admin", "/login")} qua Form chung ➔ Được điều hướng đến {renderLinkPill("Admin Dashboard", "/admin-dashboard")} tổng quan thống kê tức thì số lượng Hội viên, Bài viết và Sự kiện.</>
                    )}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src="/img_guide/Admin/login.png" alt="Đăng nhập Admin" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                    <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src="/img_guide/Admin/admin dashboard.png" alt="Admin Dashboard" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                  </div>
                </div>

                {/* Admin Manage Members */}
                <div 
                  id="sec-admin-members" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: activeSectionId === 'sec-admin-members' ? '2px solid #f59e0b' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-admin-members' ? '0 0 25px rgba(245, 158, 11, 0.25)' : 'none'
                  }}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    {isEn ? "3. Member Approval & Tier Management" : "3. Quản lý & Xét Duyệt Hồ Sơ Hội Viên Doanh Nghiệp"}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {isEn ? (
                      <>Access {renderLinkPill("Manage Members", "/admin-dashboard")} tab in Admin Dashboard:</>
                    ) : (
                      <>Truy cập mục {renderLinkPill("Quản lý Hội viên", "/admin-dashboard")} tại Admin Dashboard:</>
                    )}
                  </p>
                  <ul style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                    {isEn ? (
                      <>
                        <li><strong>Review Applications</strong>: Approve or Reject new enterprise registration profiles.</li>
                        <li><strong>Tier Modifications</strong>: Upgrade / downgrade member tiers between <em>Silver, Gold, Platinum</em>.</li>
                        <li><strong>Expiration Dates</strong>: Set tier expiration dates (`tier_expires_at`). Expired subscriptions automatically downgrade to Silver.</li>
                        <li><strong>Account Suspension & Password Resets</strong>: Lock violating accounts or reset passwords securely.</li>
                      </>
                    ) : (
                      <>
                        <li><strong>Xét duyệt Hồ sơ mới</strong>: Phê duyệt (Approve) hoặc Từ chối (Reject) các đăng ký của doanh nghiệp.</li>
                        <li><strong>Thay đổi Phân hạng gói</strong>: Nâng hạng / hạ hạng giữa <em>Silver, Gold, Platinum</em>.</li>
                        <li><strong>Cài đặt Hạn sử dụng gói</strong>: Thiết lập ngày hết hạn gói (`tier_expires_at`). Đơn hàng hết hạn sẽ tự hạ về Silver.</li>
                        <li><strong>Khóa tài khoản (Suspend) & Đổi mật khẩu</strong>: Quản trị an toàn tài khoản hội viên khi phát hiện vi phạm.</li>
                      </>
                    )}
                  </ul>
                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
                    <img src="/img_guide/Admin/admin manage members.png" alt="Quản lý Hội viên" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                </div>

                {/* Admin Manage Posts */}
                <div 
                  id="sec-admin-posts" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: activeSectionId === 'sec-admin-posts' ? '2px solid #f59e0b' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-admin-posts' ? '0 0 25px rgba(245, 158, 11, 0.25)' : 'none'
                  }}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    {isEn ? "4. Post Moderation & Homepage Featured Pinning" : "4. Quản lý Bài Viết & Ghim Nổi Bật Trang Chủ"}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {isEn ? (
                      <>Review posts submitted by Members & Creators at {renderLinkPill("Manage Posts", "/admin-dashboard")}. For Platinum members requesting featured pinning, Admins can toggle 'Featured Pin' to place posts in the top 3 homepage spotlight positions.</>
                    ) : (
                      <>Admin xem danh sách bài viết từ các doanh nghiệp & biên tập viên tại {renderLinkPill("Quản lý Bài viết", "/admin-dashboard")} để kiểm duyệt nội dung. Đối với các bài viết từ tài khoản Platinum gửi yêu cầu ghim bài, Admin có nút "Ghim nổi bật" để đưa bài đăng lên top 3 ô vị trí đặc quyền trên Trang chủ.</>
                    )}
                  </p>
                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
                    <img src="/img_guide/Admin/admin manage posts.png" alt="Quản lý Bài viết" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                </div>

                {/* Admin Manage Events & Categories & Creators */}
                <div 
                  id="sec-admin-events-cats" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: activeSectionId === 'sec-admin-events-cats' ? '2px solid #f59e0b' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-admin-events-cats' ? '0 0 25px rgba(245, 158, 11, 0.25)' : 'none'
                  }}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                    {isEn ? "5. Events, Category Taxonomy & Creator Accounts" : "5. Quản lý Sự Kiện, Chuyên Mục & Tài khoản Biên Tập Viên"}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                      <h4 style={{ color: 'var(--neon-cyan)', marginBottom: '8px' }}>
                        {isEn ? "a. B2B Event Management" : "a. Quản lý Sự kiện B2B"}
                      </h4>
                      <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                        {isEn ? (
                          <>Create new events, set dates, capacity, location, and update event status at {renderLinkPill("Manage Events", "/admin-dashboard")}.</>
                        ) : (
                          <>Tạo sự kiện mới, nhập ngày tổ chức, số lượng tham gia và cập nhật trạng thái sự kiện tại {renderLinkPill("Quản lý Sự kiện", "/admin-dashboard")}.</>
                        )}
                      </p>
                      <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src="/img_guide/Admin/admin manage events.png" alt="Quản lý Sự kiện" style={{ width: '100%', height: 'auto', display: 'block' }} />
                      </div>
                    </div>

                    <div>
                      <h4 style={{ color: 'var(--neon-cyan)', marginBottom: '8px' }}>
                        {isEn ? "b. Category & Sub-Category Taxonomy" : "b. Quản lý Chuyên mục & Lĩnh vực"}
                      </h4>
                      <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                        {isEn ? (
                          <>Add and edit main categories & sub-categories, manage English translations, and adjust display ordering at {renderLinkPill("Manage Categories", "/admin-dashboard")}.</>
                        ) : (
                          <>Thêm mới, chỉnh sửa Chuyên mục chính & các Lĩnh vực con, nhập bản dịch tiếng Anh và thay đổi thứ tự hiển thị tại {renderLinkPill("Quản lý Chuyên mục", "/admin-dashboard")}.</>
                        )}
                      </p>
                      <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src="/img_guide/Admin/admin manage category.png" alt="Quản lý Chuyên mục" style={{ width: '100%', height: 'auto', display: 'block' }} />
                      </div>
                    </div>

                    <div>
                      <h4 style={{ color: 'var(--amber)', marginBottom: '8px' }}>
                        {isEn ? "c. Creator Management & Auto-Approve Toggle" : "c. Quản lý Biên tập viên & Cấu hình Quyền Duyệt tự động"}
                      </h4>
                      <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                        {isEn ? (
                          <>Create Content Creator accounts, reset passwords, and toggle 'Enable Auto-Approve' at {renderLinkPill("Manage Creators", "/admin-dashboard")}.</>
                        ) : (
                          <>Admin tạo tài khoản cho Biên tập viên và cấu hình ô chọn "Cho phép Duyệt bài tự động" tại {renderLinkPill("Quản lý Biên tập viên", "/admin-dashboard")}. Khi tích chọn, bài đăng do Biên tập viên này tạo sẽ tự động xuất bản.</>
                        )}
                      </p>
                      <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src="/img_guide/Admin/admin manage creator.png" alt="Quản lý Biên tập viên" style={{ width: '100%', height: 'auto', display: 'block' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Manage Leads & Homepage Contacts (NEW FUNCTION) */}
                <div 
                  id="sec-admin-contacts" 
                  className="glass-card guide-section" 
                  style={{ 
                    padding: '2rem', 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: activeSectionId === 'sec-admin-contacts' ? '2px solid #f59e0b' : '1px solid var(--border-strong)',
                    boxShadow: activeSectionId === 'sec-admin-contacts' ? '0 0 25px rgba(245, 158, 11, 0.25)' : 'none'
                  }}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                    {isEn ? "6. Leads & Homepage Registration Management" : "6. Quản Lý Tiếp Nhận Liên Hệ / Đăng Ký Từ Trang Chủ"}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {isEn ? (
                      <>Every time a prospective enterprise or traveler submits the "Join the Ecosystem" form on the Homepage, their data is instantly logged into {renderLinkPill("Leads & Contacts", "/admin-dashboard")}. Admin can track status, update contact logs, and add internal notes.</>
                    ) : (
                      <>Khi khách truy cập hoặc doanh nghiệp gửi form "Tham gia Hệ sinh thái DoanhNghiepVN.today" ở trang chủ, toàn bộ thông tin sẽ được tiếp nhận tức thời vào trang {renderLinkPill("Liên hệ / Đăng ký", "/admin-dashboard")}. Ban quản trị có thể dễ dàng quản lý tiến độ liên hệ:</>
                    )}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--amber)', fontSize: '13px', marginBottom: '4px' }}>⏳ Đang chờ (Pending)</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Các yêu cầu mới gửi đến chưa được xử lý liên hệ.</div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--emerald)', fontSize: '13px', marginBottom: '4px' }}>✅ Đã liên hệ (Contacted)</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Đã gọi điện / gửi email tư vấn và hỗ trợ khách hàng.</div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(148, 163, 184, 0.08)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px', marginBottom: '4px' }}>📝 Khác (Other)</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Các trường hợp đặc thù, hợp tác truyền thông riêng có ghi chú chi tiết.</div>
                    </div>
                  </div>

                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
                    <img src="/img_guide/Admin/admin manage contact.png" alt="Quản lý Liên hệ và Đăng ký" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                </div>
              </>
            )}

          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
};

export default Guide;
