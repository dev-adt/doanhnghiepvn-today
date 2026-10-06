import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { getCategoryLabel } from '../constants/categories';

export const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, token } = useAuth();
  const { currentLang, t } = useTranslation();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Xem chi tiết hội viên đăng tải
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberDetails, setMemberDetails] = useState(null);
  const [loadingMember, setLoadingMember] = useState(false);

  // Trạng thái dịch bài viết
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedSummary, setTranslatedSummary] = useState('');
  const [translatedBody, setTranslatedBody] = useState('');
  const [isTranslated, setIsTranslated] = useState(false);
  const [loadingTranslate, setLoadingTranslate] = useState(false);
  const [translateTargetLang, setTranslateTargetLang] = useState(currentLang === 'vi' ? 'en' : currentLang);
  
  // Trạng thái dịch mô tả hội viên trong Modal
  const [translatedMemberDesc, setTranslatedMemberDesc] = useState('');
  const [isMemberDescTranslated, setIsMemberDescTranslated] = useState(false);
  const [loadingMemberDescTranslate, setLoadingMemberDescTranslate] = useState(false);
  const [memberTranslateTargetLang, setMemberTranslateTargetLang] = useState(currentLang === 'vi' ? 'en' : currentLang);

  useEffect(() => {
    setIsTranslated(false);
    setTranslatedTitle('');
    setTranslatedSummary('');
    setTranslatedBody('');
  }, [translateTargetLang]);

  useEffect(() => {
    setIsMemberDescTranslated(false);
    setTranslatedMemberDesc('');
  }, [memberTranslateTargetLang]);

  useEffect(() => {
    const target = currentLang === 'vi' ? 'en' : currentLang;
    setTranslateTargetLang(target);
    setMemberTranslateTargetLang(target);
  }, [currentLang]);

  const handleTranslatePost = async () => {
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }
    if (translatedTitle && translatedBody) {
      setIsTranslated(true);
      return;
    }
    setLoadingTranslate(true);
    try {
      const resTitle = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: post.title, targetLang: translateTargetLang })
      });
      const dataTitle = await resTitle.json();

      let tSummary = '';
      if (post.summary) {
        const resSum = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: post.summary, targetLang: translateTargetLang })
        });
        const dataSum = await resSum.json();
        tSummary = dataSum.translatedText || '';
      }

      const resBody = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: post.body, targetLang: translateTargetLang })
      });
      const dataBody = await resBody.json();

      if (dataTitle.success && dataBody.success) {
        setTranslatedTitle(dataTitle.translatedText);
        setTranslatedSummary(tSummary);
        setTranslatedBody(dataBody.translatedText);
        setIsTranslated(true);
      } else {
        alert('Lỗi dịch thuật: ' + (dataTitle.error || dataBody.error || 'Lỗi không xác định'));
      }
    } catch (err) {
      alert('Không thể thực hiện dịch: ' + err.message);
    } finally {
      setLoadingTranslate(false);
    }
  };

  const handleTranslateMemberDesc = async () => {
    if (isMemberDescTranslated) {
      setIsMemberDescTranslated(false);
      return;
    }
    if (translatedMemberDesc) {
      setIsMemberDescTranslated(true);
      return;
    }
    if (!memberDetails || !memberDetails.description) return;

    setLoadingMemberDescTranslate(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: memberDetails.description, targetLang: memberTranslateTargetLang })
      });
      const data = await res.json();
      if (data.success) {
        setTranslatedMemberDesc(data.translatedText);
        setIsMemberDescTranslated(true);
      } else {
        alert('Lỗi dịch thuật: ' + (data.error || 'Lỗi không xác định'));
      }
    } catch (err) {
      alert('Không thể thực hiện dịch: ' + err.message);
    } finally {
      setLoadingMemberDescTranslate(false);
    }
  };

  const handleViewMemberDetails = async (memberId) => {
    if (!memberId) return;
    setTranslatedMemberDesc('');
    setIsMemberDescTranslated(false);
    setLoadingMember(true);
    setShowMemberModal(true);
    try {
      const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
      const res = await fetch(`/api/members/${memberId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMemberDetails(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching member details', err);
    } finally {
      setLoadingMember(false);
    }
  };

  const demoImages = [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80'
  ];

  // Ngăn chặn hiện tượng tự động cuộn (giật trang) khi click chuyển Slide trong iframe
  useEffect(() => {
    let savedScrollY = 0;
    const handleScroll = () => {
      savedScrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleBlur = () => {
      if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
        const targetY = savedScrollY;
        requestAnimationFrame(() => {
          window.scrollTo(0, targetY);
        });
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      setTranslatedTitle('');
      setTranslatedSummary('');
      setTranslatedBody('');
      setIsTranslated(false);
      setLoading(true);
      try {
        const activeToken = token || localStorage.getItem('doson_creator_token') || localStorage.getItem('doson_member_token') || localStorage.getItem('doson_admin_token');
        const headers = activeToken ? { 'Authorization': 'Bearer ' + activeToken } : {};
        const res = await fetch(`/api/posts/${id}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setPost(data.data);
          } else {
            setError('Không tìm thấy bài viết.');
          }
        } else {
          setError('Không tìm thấy bài viết hoặc bạn không có quyền xem.');
        }
      } catch (err) {
        setError('Có lỗi xảy ra: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, token]);

  if (loading) {
    return (
      <div className="public-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <i className="ti ti-loader animate-spin" style={{ fontSize: '32px', display: 'block', margin: '0 auto 15px' }}></i>
            {currentLang === 'en' ? 'Loading post details...' : 'Đang tải chi tiết bài viết...'}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="public-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }} className="glass-card">
            <i className="ti ti-alert-triangle" style={{ fontSize: '48px', color: '#EF4444', display: 'block', marginBottom: '1rem' }}></i>
            <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '10px' }}>{currentLang === 'en' ? 'An error occurred' : 'Đã xảy ra lỗi'}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '1.5rem' }}>{error || (currentLang === 'en' ? 'Information not found.' : 'Không tìm thấy thông tin.')}</p>
            <button onClick={() => navigate('/posts')} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>{currentLang === 'en' ? 'Back to Feed' : 'Quay lại Bảng tin'}</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString('vi-VN') : '11/06/2026';
  const hasValidImg = post.image_url && post.image_url !== 'null' && post.image_url !== 'undefined' && post.image_url.trim() !== '';
  const imgUrl = hasValidImg ? post.image_url : demoImages[post.id % demoImages.length];
  const isGuest = role === 'guest';
  const isPlatinum = post.company_tier === 'Platinum';
  const isGold = post.company_tier === 'Gold';

  const plainBodyText = post.body ? post.body.replace(/<[^>]+>/g, '').substring(0, 160) : '';
  const rawDesc = isTranslated ? (translatedSummary || plainBodyText) : (post.summary || plainBodyText || post.title);
  const metaDescription = rawDesc.length > 160 ? rawDesc.substring(0, 157) + '...' : rawDesc;

  // Parse Tags từ khoá SEO
  let parsedTagsStr = '';
  if (post.tags) {
    try {
      const arr = typeof post.tags === 'string' && post.tags.startsWith('[') ? JSON.parse(post.tags) : post.tags;
      parsedTagsStr = Array.isArray(arr) ? arr.join(', ') : String(arr);
    } catch(e) {
      parsedTagsStr = String(post.tags);
    }
  }
  const metaKeywords = [parsedTagsStr, post.category, post.sub_category, 'DoanhNghiepVN.today', 'Tạp chí Doanh Nghiệp Việt Nam', post.title].filter(Boolean).join(', ');

  // Generate NewsArticle JSON-LD schema
  const newsSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": isTranslated ? translatedTitle : post.title,
    "image": [imgUrl],
    "datePublished": post.created_at || post.published_at,
    "dateModified": post.updated_at || post.created_at,
    "author": [{
      "@type": "Organization",
      "name": post.company_name || "Hội viên DoanhNghiepVN.today"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "Tạp chí Doanh Nghiệp Việt Nam",
      "logo": {
        "@type": "ImageObject",
        "url": "https://doanhnghiepvn.today/logo_doanhnghiepvn.png"
      }
    },
    "description": metaDescription
  };

  return (
    <div className="public-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEOHead 
        title={isTranslated ? translatedTitle : post.title}
        description={metaDescription}
        keywords={metaKeywords}
        image={imgUrl}
        url={`/posts/${post.slug || post.id}`}
        type="article"
        publishedAt={post.created_at}
        updatedAt={post.updated_at}
        author={post.company_name}
        schemaData={newsSchema}
      />

      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
          
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'left' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>{currentLang === 'en' ? 'Home' : 'Trang chủ'}</Link>
            <i className="ti ti-chevron-right" style={{ fontSize: '10px' }}></i>
            <Link to="/posts" style={{ color: 'inherit', textDecoration: 'none' }}>{currentLang === 'en' ? 'Business Opportunities' : 'Bảng tin cơ hội'}</Link>
            <i className="ti ti-chevron-right" style={{ fontSize: '10px' }}></i>
            <span style={{ color: 'var(--text-primary)' }}>{post.title}</span>
          </div>

          {/* Full Width Single Column Layout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
            
            {/* Cover Image */}
            <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={imgUrl} alt={post.title} style={{ width: '100%', height: 'auto', maxHeight: '720px', objectFit: 'contain', display: 'block' }} />
            </div>

            {/* Title & Meta Info */}
            <div className="glass-card" style={{ padding: '28px 32px', position: 'relative' }}>
              {post.is_featured === 1 && (
                <span style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '10.5px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.3)', padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                  {t('badge_featured')} <i className="ti ti-star-filled"></i>
                </span>
              )}
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', background: 'rgba(2, 132, 199, 0.08)', color: 'var(--primary-dark)', border: '1px solid rgba(2, 132, 199, 0.15)', padding: '3px 10px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                  {post.type === 'offer' ? t('type_offer') : post.type === 'demand' ? t('type_demand') : post.type === 'cooperate' ? t('type_cooperate') : (post.type || t('type_general_news'))}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{getCategoryLabel(post.category, currentLang) || t('category_default')}</span>
              </div>

              <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '32px', color: 'var(--text-primary)', fontWeight: 700, lineHeight: '1.4', margin: '0 0 14px' }}>
                {isTranslated ? translatedTitle : post.title}
              </h1>
              
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {t('date_posted_label')}: <strong style={{ color: 'var(--text-primary)' }}>{dateStr}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '18px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('translate_select_lang')}:</span>
                  <select
                    value={translateTargetLang}
                    onChange={(e) => setTranslateTargetLang(e.target.value)}
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      padding: '5px 10px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="en">🇬🇧 Tiếng Anh (English)</option>
                    <option value="vi">🇻🇳 Tiếng Việt (Vietnamese)</option>
                    <option value="ja">🇯🇵 Tiếng Nhật (Japanese)</option>
                    <option value="zh">🇨🇳 Tiếng Trung (Chinese)</option>
                  </select>
                </div>

                <button
                  onClick={handleTranslatePost}
                  disabled={loadingTranslate}
                  style={{
                    background: isTranslated ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 136, 229, 0.1)',
                    border: `1px solid ${isTranslated ? 'rgba(16, 185, 129, 0.3)' : 'rgba(30, 136, 229, 0.3)'}`,
                    color: isTranslated ? 'var(--emerald)' : 'var(--primary-light)',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                    outline: 'none',
                    transition: 'var(--transition)'
                  }}
                >
                  <i className={loadingTranslate ? "ti ti-loader animate-spin" : "ti ti-language"}></i>
                  {loadingTranslate ? '...' : isTranslated ? t('translate_view_original') : t('translate_button')}
                </button>
              </div>
            </div>

            {/* Summary / Lead Paragraph */}
            {post.summary && (
              <div className="glass-card" style={{ padding: '24px 32px', background: 'var(--surface-0)', borderColor: 'var(--border-strong)' }}>
                <p style={{ fontSize: '15.5px', fontWeight: 500, color: 'var(--primary-dark)', margin: 0, lineHeight: '1.7' }}>
                  {isTranslated ? translatedSummary : post.summary}
                </p>
              </div>
            )}

            {/* Main Content Body */}
            <div className="glass-card" style={{ padding: '36px 32px' }}>
              <div 
                className="post-html-body"
                dangerouslySetInnerHTML={{ 
                  __html: (() => {
                    let raw = isTranslated ? translatedBody : post.body;
                    if (!raw) return '';
                    if (raw.includes('&lt;iframe') || raw.includes('&lt;div')) {
                      const txt = document.createElement('textarea');
                      txt.innerHTML = raw;
                      raw = txt.value;
                    }
                    return raw;
                  })()
                }}
                style={{
                  fontSize: '16px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.8',
                  textAlign: 'left',
                }}
              />
              <style>{`
                .post-html-body iframe {
                  width: 100% !important;
                  max-width: 100% !important;
                  aspect-ratio: 16 / 9;
                  min-height: 480px;
                  height: auto;
                  border-radius: 12px;
                  border: none;
                  margin: 20px 0;
                  box-shadow: 0 12px 30px -5px rgba(0,0,0,0.12);
                  display: block;
                }
                .post-html-body video {
                  width: 100% !important;
                  max-width: 100% !important;
                  max-height: 520px;
                  border-radius: 12px;
                  margin: 20px 0;
                  box-shadow: 0 12px 30px -5px rgba(0,0,0,0.15);
                  background: #000;
                  display: block;
                }
                .post-html-body img {
                  max-width: 100% !important;
                  border-radius: 8px;
                  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                }
                @media (max-width: 1024px) {
                  .post-html-body iframe {
                    min-height: 380px;
                  }
                }
                @media (max-width: 640px) {
                  .post-html-body iframe {
                    min-height: 260px;
                  }
                }
              `}</style>

              {/* Hashtags / Từ khóa hiển thị đẹp mắt cuối bài viết */}
              {post.tags && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '24px', paddingTop: '18px', borderTop: '1px dashed var(--border)' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <i className="ti ti-tags"></i> {currentLang === 'en' ? 'Keywords:' : 'Từ khóa:'}
                  </span>
                  {(Array.isArray(post.tags) ? post.tags : (typeof post.tags === 'string' && post.tags.startsWith('[') ? (function(){ try { return JSON.parse(post.tags); } catch(e) { return post.tags.split(','); } })() : post.tags.split(','))).map((tag, idx) => {
                    const cleanTag = typeof tag === 'string' ? tag.trim() : String(tag);
                    if (!cleanTag) return null;
                    return (
                      <span 
                        key={idx}
                        style={{
                          fontSize: '12px',
                          color: '#0284c7',
                          background: 'rgba(2, 132, 199, 0.08)',
                          border: '1px solid rgba(2, 132, 199, 0.2)',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontWeight: 600
                        }}
                      >
                        #{cleanTag.replace(/^#/, '')}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Horizontal Card: Author & Contact Details */}
            <div className="glass-card" style={{ padding: '28px 32px', marginTop: '10px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                
                {/* Left: Author Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="av-circle" style={{ width: '56px', height: '56px', fontSize: '20px', background: isPlatinum ? 'linear-gradient(135deg, #FFD700, #FFA500)' : isGold ? 'var(--amber-glow)' : 'var(--primary-glow)', color: '#fff', fontWeight: '700', flexShrink: 0 }}>
                    {post.company_name ? post.company_name.substring(0, 2).toUpperCase() : 'DN'}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                      {t('sidebar_author')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '17px', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>{post.company_name || (currentLang === 'en' ? 'Anonymous Member' : 'Hội viên ẩn danh')}</h3>
                      <span style={{ 
                        fontSize: '9.5px',
                        background: isPlatinum ? 'rgba(245,158,11,0.15)' : isGold ? 'rgba(245,158,11,0.1)' : 'var(--surface-0)',
                        color: isPlatinum || isGold ? 'var(--amber-dark)' : 'var(--text-muted)',
                        border: `1px solid ${isPlatinum || isGold ? 'rgba(245,158,11,0.3)' : 'var(--border-strong)'}`,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {post.company_tier || 'Silver'}
                      </span>
                    </div>
                    {post.member_id && (
                      <button 
                        onClick={() => handleViewMemberDetails(post.member_id)}
                        style={{
                          marginTop: '6px',
                          background: 'rgba(2, 132, 199, 0.08)',
                          border: '1px solid rgba(2, 132, 199, 0.2)',
                          color: 'var(--primary-dark)',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          outline: 'none',
                          fontWeight: 600
                        }}
                      >
                        <i className="ti ti-info-circle"></i> {t('btn_view_details')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Middle: Contact Info */}
                <div style={{ flex: '1 1 300px', padding: '0 10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    {t('contact_info_label')}
                  </div>
                  {isGuest ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        <i className="ti ti-lock" style={{ color: 'var(--primary)', marginRight: '4px' }}></i>
                        {t('login_required_desc')}
                      </span>
                      <Link to="/login" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '11.5px', textDecoration: 'none' }}>
                        {t('login_now')}
                      </Link>
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="ti ti-info-square" style={{ color: 'var(--primary-dark)' }}></i>
                      {post.contact_info || t('contact_info_label')}
                    </div>
                  )}
                </div>

                {/* Right: Back Button */}
                <div>
                  <Link to="/posts" className="btn" style={{ padding: '10px 20px', fontSize: '13px', textDecoration: 'none', background: 'rgba(12,35,64,0.06)', borderColor: 'var(--border-strong)', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <i className="ti ti-arrow-left"></i> {t('btn_back_to_feed')}
                  </Link>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />

      {showMemberModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowMemberModal(false)}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button onClick={() => setShowMemberModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', padding: '4px' }} className="hover-highlight">
              <i className="ti ti-x"></i>
            </button>

            {loadingMember ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                <i className="ti ti-loader animate-spin" style={{ fontSize: '28px', display: 'block', margin: '0 auto 10px' }}></i>
                {currentLang === 'en' ? 'Loading member information...' : 'Đang tải thông tin hội viên...'}
              </div>
            ) : memberDetails ? (
              <div>
                {/* Header Profile */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                  <div className="av-circle" style={{ width: '56px', height: '56px', fontSize: '22px', background: memberDetails.tier === 'Platinum' ? 'linear-gradient(135deg, #FFD700, #FFA500)' : memberDetails.tier === 'Gold' ? 'var(--amber-glow)' : 'var(--primary-glow)', color: '#fff', fontWeight: 600 }}>
                    {memberDetails.name ? memberDetails.name.substring(0, 2).toUpperCase() : 'DN'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>{memberDetails.name}</h2>
                    <span style={{ 
                      display: 'inline-block',
                      marginTop: '4px',
                      fontSize: '9px',
                      background: memberDetails.tier === 'Platinum' ? 'rgba(245,158,11,0.15)' : memberDetails.tier === 'Gold' ? 'rgba(245,158,11,0.1)' : 'var(--surface-0)',
                      color: memberDetails.tier === 'Platinum' || memberDetails.tier === 'Gold' ? 'var(--amber-dark)' : 'var(--text-muted)',
                      border: `1px solid ${memberDetails.tier === 'Platinum' || memberDetails.tier === 'Gold' ? 'rgba(245,158,11,0.3)' : 'var(--border-strong)'}`,
                      padding: '1px 6px',
                      borderRadius: '3px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {currentLang === 'en' ? 'Tier:' : 'Hạng:'} {memberDetails.tier || 'Silver'}
                    </span>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border)', marginBottom: '15px' }} />

                {/* Main Information */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{currentLang === 'en' ? 'Industry' : 'Lĩnh vực hoạt động'}</div>
                    <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '2px' }}>{memberDetails.industry || (currentLang === 'en' ? 'Not specified' : 'Chưa cập nhật')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{currentLang === 'en' ? 'Scale' : 'Quy mô'}</div>
                    <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '2px' }}>{memberDetails.size || (currentLang === 'en' ? 'Not specified' : 'Chưa cập nhật')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{currentLang === 'en' ? 'Province / City' : 'Tỉnh/Thành phố'}</div>
                    <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '2px' }}>{memberDetails.city || (currentLang === 'en' ? 'Not specified' : 'Chưa cập nhật')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{currentLang === 'en' ? 'Address' : 'Địa chỉ'}</div>
                    <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '2px' }}>{memberDetails.address || (currentLang === 'en' ? 'Not specified' : 'Chưa cập nhật')}</div>
                  </div>
                  {memberDetails.website && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Website</div>
                      <a href={memberDetails.website.startsWith('http') ? memberDetails.website : `https://${memberDetails.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <i className="ti ti-world"></i> {memberDetails.website}
                      </a>
                    </div>
                  )}
                </div>

                {memberDetails.description && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('label_desc')}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          value={memberTranslateTargetLang}
                          onChange={(e) => setMemberTranslateTargetLang(e.target.value)}
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            fontSize: '10.5px',
                            padding: '2px 4px',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="en">🇬🇧 EN</option>
                          <option value="vi">🇻🇳 VI</option>
                          <option value="ja">🇯🇵 JA</option>
                          <option value="zh">🇨🇳 ZH</option>
                        </select>
                        <button
                          onClick={handleTranslateMemberDesc}
                          disabled={loadingMemberDescTranslate}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: isMemberDescTranslated ? 'var(--emerald)' : 'var(--primary-dark)',
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                            padding: 0,
                            outline: 'none'
                          }}
                        >
                          <i className={loadingMemberDescTranslate ? "ti ti-loader animate-spin" : "ti ti-language"}></i>
                          {loadingMemberDescTranslate ? '...' : isMemberDescTranslated ? t('translate_view_original_short') : (currentLang === 'en' ? 'AI Translate' : 'Dịch AI')}
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6', background: 'var(--surface-0)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      {isMemberDescTranslated ? translatedMemberDesc : memberDetails.description}
                    </div>
                  </div>
                )}

                {/* Contact wall check */}
                <div style={{ height: '1px', background: 'var(--border)', marginBottom: '15px' }} />
                
                <h3 style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 10px' }}>{t('contact_info_label')}</h3>
                {isGuest ? (
                  <div style={{ padding: '15px', background: 'var(--surface-0)', border: '1px dashed var(--border-strong)', borderRadius: '8px', textAlign: 'center' }}>
                    <i className="ti ti-lock" style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '6px', display: 'block' }}></i>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: '1.4' }}>
                      {t('login_required_desc')}
                    </p>
                    <Link to="/login" className="btn btn-primary" style={{ padding: '4px 15px', fontSize: '11px' }}>{t('login_now')}</Link>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currentLang === 'en' ? 'Contact Person' : 'Người liên hệ'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{memberDetails.contact_name || (currentLang === 'en' ? 'Not specified' : 'Chưa cập nhật')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currentLang === 'en' ? 'Position' : 'Chức vụ'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{memberDetails.contact_pos || (currentLang === 'en' ? 'Not specified' : 'Chưa cập nhật')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{memberDetails.email || (currentLang === 'en' ? 'Not specified' : 'Chưa cập nhật')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currentLang === 'en' ? 'Phone Number' : 'Số điện thoại'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{memberDetails.phone || (currentLang === 'en' ? 'Not specified' : 'Chưa cập nhật')}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                {currentLang === 'en' ? 'Member details not found.' : 'Không tìm thấy thông tin hội viên này.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
