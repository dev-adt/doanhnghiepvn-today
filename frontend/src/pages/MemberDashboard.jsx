import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import RichTextEditor from '../components/RichTextEditor';
import { useTranslation } from '../contexts/LanguageContext';
import { CATEGORIES_DATA, ALL_CATEGORIES, getSubcategoriesByCategory, getCategoryLabel } from '../constants/categories';
import { formatVNDateTime } from '../utils/dateUtils';

export const MemberDashboard = () => {
  const { user, token, getAuthHeaders, logout } = useAuth();
  const { currentLang, t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [profileData, setProfileData] = useState({
    name: '', tax_code: '', license: '', industry: '', size: '', address: '', city: '',
    website: '', social: '', description: '', contact_name: '', contact_pos: '',
    phone: '', goal: '', password: '',
    status: '', tier: '', tier_expires_at: null, pending_tier_upgrade: null
  });
  
  const [dbStats, setDbStats] = useState({
    total_posts: 0,
    approved_posts: 0,
    pending_posts: 0,
    total_views: 0
  });

  const [memberPosts, setMemberPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPostId, setEditingPostId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showPassMap, setShowPassMap] = useState({
    old: false,
    new: false,
    confirm: false
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passMessage, setPassMessage] = useState({ text: '', type: '' });

  // Event Registrations & Tickets State
  const [memberEvents, setMemberEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [copiedTicketField, setCopiedTicketField] = useState('');

  // Modal State for new Post
  const [modalOpen, setModalOpen] = useState(false);
  const [newPostData, setNewPostData] = useState({
    title: '', summary: '', body: '', type: 'Tin chung',
    category: '', sub_category: '', source_url: '', tags: '', contact_info: '', deadline: '',
    image_url: '', featured_requested: 0
  });
  const [creatingPost, setCreatingPost] = useState(false);
  const [categoriesList, setCategoriesList] = useState(CATEGORIES_DATA);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setCategoriesList(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic categories in MemberDashboard", err);
      }
    };
    fetchCategories();
  }, []);

  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/member/dashboard', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const m = data.member;
          setProfileData({
            name: m.name || '',
            tax_code: m.tax_code || '',
            license: m.license || '',
            industry: m.industry || '',
            size: m.size || '',
            address: m.address || '',
            city: m.city || '',
            website: m.website || '',
            social: m.social || '',
            description: m.description || '',
            contact_name: m.contact_name || '',
            contact_pos: m.contact_pos || '',
            phone: m.phone || '',
            goal: m.goal || '',
            password: '',
            status: m.status || 'pending',
            tier: m.tier || 'Silver',
            tier_expires_at: m.tier_expires_at || null,
            pending_tier_upgrade: m.pending_tier_upgrade || null
          });
          setDbStats(data.stats);
          setMemberPosts(data.posts || []);
        }
      }
    } catch (e) {
      console.error("Error loading member dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await fetch('/api/member/events', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMemberEvents(json.data);
        } else {
          setMemberEvents([]);
        }
      } else {
        setMemberEvents([]);
      }
    } catch (e) {
      console.warn("Lỗi tải lịch sử vé sự kiện:", e);
      setMemberEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadMemberEvents();
  }, [token]);

  const handleProfileChange = (e) => {
    const { id, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/member/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('error_occurred'));
      }
      setMessage({ text: t('profile_update_success'), type: 'success' });
      // Clear password input
      setProfileData(prev => ({ ...prev, password: '' }));
      loadDashboardData();
    } catch (err) {
      setMessage({ text: err.message, type: 'danger' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassMessage({ text: '', type: '' });

    if (passwordForm.newPassword.length < 8) {
      setPassMessage({ text: 'Mật khẩu mới phải từ 8 ký tự trở lên.', type: 'danger' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPassMessage({ text: 'Mật khẩu mới và mật khẩu xác nhận không khớp.', type: 'danger' });
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch('/api/member/change-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra.');
      }
      setPassMessage({ text: 'Thay đổi mật khẩu thành công!', type: 'success' });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setPassMessage({ text: err.message, type: 'danger' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleRequestUpgrade = async (targetTier) => {
    if (!confirm(t('upgrade_confirm_msg')(targetTier))) return;

    try {
      const res = await fetch('/api/member/upgrade', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ tier: targetTier })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(t('upgrade_request_success'));
        loadDashboardData();
      } else {
        alert(data.error || t('upgrade_request_fail'));
      }
    } catch (err) {
      alert(t('error_occurred') + ': ' + err.message);
    }
  };

  const handleDeletePost = async (id, title) => {
    if (!confirm(t('delete_post_confirm')(title))) return;
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        alert(t('delete_post_success'));
        loadDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || t('error_occurred'));
      }
    } catch (err) {
      alert(t('error_occurred') + ': ' + err.message);
    }
  };

  const handleNewPostChange = (e) => {
    const { id, value } = e.target;
    setNewPostData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert(t('err_image_size'));
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result.split(',')[1];
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64Data
          })
        });

        const responseText = await res.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error('Máy chủ phản hồi lỗi. Vui lòng chọn tệp ảnh có dung lượng nhỏ hơn (dưới 50MB).');
        }

        if (res.ok && data.success) {
          setNewPostData(prev => ({ ...prev, image_url: data.url }));
        } else {
          alert(data.error || t('error_occurred'));
        }
      } catch (err) {
        alert(t('error_occurred') + ': ' + err.message);
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartEditPost = async (id) => {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const p = data.data;
          let parsedTags = '';
          if (p.tags) {
            try {
              const tagsArray = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
              parsedTags = Array.isArray(tagsArray) ? tagsArray.join(', ') : '';
            } catch (err) {
              parsedTags = '';
            }
          }
          let formattedDeadline = '';
          if (p.deadline) {
            formattedDeadline = new Date(p.deadline).toISOString().substring(0, 10);
          }
          setNewPostData({
            title: p.title || '',
            summary: p.summary || '',
            body: p.body || '',
            type: p.type || t('type_find_partner'),
            category: p.category || '',
            sub_category: p.sub_category || '',
            source_url: p.source_url || '',
            tags: parsedTags,
            contact_info: p.contact_info || '',
            deadline: formattedDeadline,
            image_url: p.image_url || '',
            featured_requested: p.featured_requested || 0
          });
          setEditingPostId(id);
          setModalOpen(true);
        }
      } else {
        const err = await res.json();
        alert(err.error || t('error_load_post'));
      }
    } catch (e) {
      alert(t('error_occurred') + ': ' + e.message);
    }
  };

  const handleSubmitAction = async (isDraft) => {
    if (!newPostData.title) {
      alert(t('alert_enter_title'));
      return;
    }
    if (!newPostData.category) {
      alert('Vui lòng chọn Chuyên mục cho bài viết (bắt buộc).');
      return;
    }
    if (!newPostData.sub_category) {
      alert('Vui lòng chọn Lĩnh vực cho bài viết (bắt buộc).');
      return;
    }
    if (!newPostData.body) {
      alert(t('alert_enter_body'));
      return;
    }
    if (!newPostData.contact_info) {
      alert(t('alert_enter_contact'));
      return;
    }

    setCreatingPost(true);
    try {
      const tagsArray = newPostData.tags 
        ? newPostData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      const payload = {
        ...newPostData,
        tags: tagsArray,
        isDraft
      };

      const url = editingPostId ? `/api/posts/${editingPostId}` : '/api/posts';
      const method = editingPostId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('error_occurred'));
      }

      alert(isDraft ? t('save_draft_success') : t('publish_post_success'));
      setModalOpen(false);
      setEditingPostId(null);
      setNewPostData({
        title: '', summary: '', body: '', type: t('type_find_partner'),
        category: '', sub_category: '', source_url: '', tags: '', contact_info: '', deadline: '', image_url: '',
        featured_requested: 0
      });
      loadDashboardData();
    } catch (err) {
      alert(t('error_occurred') + ': ' + err.message);
    } finally {
      setCreatingPost(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', backgroundColor: '#0F172A', color: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <i className="ti ti-loader animate-spin" style={{ fontSize: '32px', marginBottom: '12px', color: '#1E88E5' }}></i>
        <div style={{ fontSize: '13px', color: '#64748B' }}>Đang tải dữ liệu Dashboard...</div>
      </div>
    );
  }

  const userStatus = profileData.status || user?.status || 'pending';
  const userTier = profileData.tier || user?.tier || 'Silver';

  return (
    <div className="public-body">
      <Navbar />

      <div className="dashboard-wrap">
        
        {/* Top Header Banner */}
        <div style={{ background: '#0C2340', borderBottom: '1px solid rgba(2,132,199,0.2)', padding: '2rem 0' }}>
          <div className="public-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {t('dashboard_title')}
                </h1>
                <span className={`badge ${userTier === 'Platinum' ? 'b-platinum' : userTier === 'Gold' ? 'b-gold' : 'b-silver'}`} style={{ marginRight: '8px' }}>
                  {userTier === 'Platinum' ? '💎 ' + t('tier_platinum') : userTier === 'Gold' ? '🏅 ' + t('tier_gold') : '🪙 ' + t('tier_silver')}
                </span>
                {profileData.tier_expires_at && userTier !== 'Silver' && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '4px', marginRight: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <i className="ti ti-calendar-event"></i> {t('tier_expiry_label')}: {new Date(profileData.tier_expires_at).toLocaleDateString('vi-VN')}
                  </span>
                )}
                {profileData.pending_tier_upgrade && (
                  <span style={{ fontSize: '11px', color: 'var(--amber)', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px dashed rgba(245,158,11,0.3)', padding: '4px 10px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <i className="ti ti-loader animate-spin" style={{ fontSize: '10px' }}></i> {t('pending_upgrade_status')(profileData.pending_tier_upgrade)}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                {t('manage_account_desc')(profileData.name)}
              </p>
            </div>
            
            <button 
              onClick={() => {
                setEditingPostId(null);
                setNewPostData({
                  title: '', summary: '', body: '', type: t('type_find_partner'),
                  category: '', sub_category: '', tags: '', contact_info: '', deadline: '', image_url: ''
                });
                setModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              disabled={userStatus !== 'approved'}
              title={userStatus !== 'approved' ? 'Tài khoản chưa được duyệt, không thể đăng tin bài.' : ''}
            >
              <i className="ti ti-plus"></i> {t('btn_create_new_post')}
            </button>
          </div>
        </div>

        <div className="dash-container" style={{ textAlign: 'left' }}>
          {/* Left Column: Edit profile */}
          <div>
            {userStatus === 'pending' && (
              <div className="status-banner pending">
                <i className="ti ti-clock status-icon"></i>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{t('pending_account_status_title')}</div>
                  <div style={{ fontSize: '12px', marginTop: '2px' }}>{t('pending_account_status_desc')}</div>
                </div>
              </div>
            )}

            {userStatus === 'approved' && (
              <div className="status-banner approved">
                <i className="ti ti-circle-check status-icon"></i>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{t('approved_account_status_title')}</div>
                  <div style={{ fontSize: '12px', marginTop: '2px' }}>{t('approved_account_status_desc')}</div>
                </div>
              </div>
            )}

            {userStatus === 'rejected' && (
              <div className="status-banner rejected">
                <i className="ti ti-circle-x status-icon"></i>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{t('rejected_account_status_title')}</div>
                  <div style={{ fontSize: '12px', marginTop: '2px' }}>{t('rejected_account_status_desc')}</div>
                </div>
              </div>
            )}

            <div className="dash-card">
              <div className="card-title">
                <i className="ti ti-edit"></i> {t('update_profile_title')}
              </div>

              {message.text && (
                <div style={{ 
                  background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
                  border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, 
                  color: message.type === 'success' ? '#A7F3D0' : '#FCA5A5',
                  padding: '10px 14px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '13px'
                }}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleProfileSubmit}>
                <div className="form-grid">
                  <div className="fg">
                    <label>{t('label_company_name')}</label>
                    <input type="text" id="name" value={profileData.name} onChange={handleProfileChange} required />
                  </div>
                  <div className="fg">
                    <label>{t('label_tax_code')}</label>
                    <input type="text" id="tax_code" value={profileData.tax_code} onChange={handleProfileChange} />
                  </div>
                  <div className="fg">
                    <label>{t('label_business_license')}</label>
                    <input type="text" id="license" value={profileData.license} onChange={handleProfileChange} />
                  </div>
                  <div className="fg">
                    <label>{t('label_industry')}</label>
                    <input type="text" id="industry" value={profileData.industry} onChange={handleProfileChange} />
                  </div>
                  <div className="fg">
                    <label>{t('label_employee_scale')}</label>
                    <input type="text" id="size" value={profileData.size} onChange={handleProfileChange} />
                  </div>
                  <div className="fg">
                    <label>{t('label_website')}</label>
                    <input type="text" id="website" value={profileData.website} onChange={handleProfileChange} />
                  </div>
                  <div className="fg">
                    <label>{t('label_address')}</label>
                    <input type="text" id="address" value={profileData.address} onChange={handleProfileChange} />
                  </div>
                  <div className="fg">
                    <label>{t('label_city')}</label>
                    <input type="text" id="city" list="cities-list" value={profileData.city || ''} onChange={handleProfileChange} placeholder={t('label_city')} />
                    <datalist id="cities-list">
                      <option value="An Giang" />
                      <option value="Bà Rịa - Vũng Tàu" />
                      <option value="Bắc Giang" />
                      <option value="Bắc Kạn" />
                      <option value="Bạc Liêu" />
                      <option value="Bắc Ninh" />
                      <option value="Bến Tre" />
                      <option value="Bình Định" />
                      <option value="Bình Dương" />
                      <option value="Bình Phước" />
                      <option value="Bình Thuận" />
                      <option value="Cà Mau" />
                      <option value="Cần Thơ" />
                      <option value="Cao Bằng" />
                      <option value="Đà Nẵng" />
                      <option value="Đắk Lắk" />
                      <option value="Đắk Nông" />
                      <option value="Điện Biên" />
                      <option value="Đồng Nai" />
                      <option value="Đồng Tháp" />
                      <option value="Gia Lai" />
                      <option value="Hà Giang" />
                      <option value="Hà Nam" />
                      <option value="Hà Nội" />
                      <option value="Hà Tĩnh" />
                      <option value="Hải Dương" />
                      <option value="Hải Phòng" />
                      <option value="Hậu Giang" />
                      <option value="Hòa Bình" />
                      <option value="Hưng Yên" />
                      <option value="Khánh Hòa" />
                      <option value="Kiên Giang" />
                      <option value="Kon Tum" />
                      <option value="Lai Châu" />
                      <option value="Lâm Đồng" />
                      <option value="Lạng Sơn" />
                      <option value="Lào Cai" />
                      <option value="Long An" />
                      <option value="Nam Định" />
                      <option value="Nghệ An" />
                      <option value="Ninh Bình" />
                      <option value="Ninh Thuận" />
                      <option value="Phú Thọ" />
                      <option value="Phú Yên" />
                      <option value="Quảng Bình" />
                      <option value="Quảng Nam" />
                      <option value="Quảng Ngãi" />
                      <option value="Quảng Ninh" />
                      <option value="Quảng Trị" />
                      <option value="Sóc Trăng" />
                      <option value="Sơn La" />
                      <option value="Tây Ninh" />
                      <option value="Thái Bình" />
                      <option value="Thái Nguyên" />
                      <option value="Thanh Hóa" />
                      <option value="Thừa Thiên Huế" />
                      <option value="Tiền Giang" />
                      <option value="TP Hồ Chí Minh" />
                      <option value="Trà Vinh" />
                      <option value="Tuyên Quang" />
                      <option value="Vĩnh Long" />
                      <option value="Vĩnh Phúc" />
                      <option value="Yên Bái" />
                    </datalist>
                  </div>
                  <div className="fg">
                    <label>{t('label_social_media')}</label>
                    <input type="text" id="social" value={profileData.social} onChange={handleProfileChange} />
                  </div>
                  <div className="fg">
                    <label>{t('label_contact_person')}</label>
                    <input type="text" id="contact_name" value={profileData.contact_name} onChange={handleProfileChange} />
                  </div>
                  <div className="fg">
                    <label>{t('label_contact_position')}</label>
                    <input type="text" id="contact_pos" value={profileData.contact_pos} onChange={handleProfileChange} />
                  </div>
                  <div className="fg">
                    <label>{t('label_phone_number')}</label>
                    <input type="text" id="phone" value={profileData.phone} onChange={handleProfileChange} />
                  </div>
                  <div className="fg" style={{ gridColumn: 'span 2' }}>
                    <label>{t('label_joining_goal')}</label>
                    <input type="text" id="goal" value={profileData.goal} onChange={handleProfileChange} />
                  </div>
                  <div className="fg" style={{ gridColumn: 'span 2' }}>
                    <label>{t('label_short_description')}</label>
                    <textarea id="description" value={profileData.description} onChange={handleProfileChange} style={{ height: '80px', resize: 'vertical' }} />
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={updatingProfile}>
                    {updatingProfile ? <><i className="ti ti-loader animate-spin"></i> {t('btn_saving')}</> : <><i className="ti ti-save"></i> {t('btn_save_profile')}</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Thẻ Đổi Mật Khẩu Riêng Biệt */}
            <div className="dash-card" style={{ marginTop: '1.5rem' }}>
              <div className="card-title">
                <i className="ti ti-key"></i> Đổi mật khẩu bảo mật
              </div>

              {passMessage.text && (
                <div style={{ 
                  background: passMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
                  border: `1px solid ${passMessage.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, 
                  color: passMessage.type === 'success' ? '#A7F3D0' : '#FCA5A5',
                  padding: '10px 14px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '13px'
                }}>
                  {passMessage.text}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="fg" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600 }}>Mật khẩu hiện tại (cũ) <span style={{ color: 'var(--rose)' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassMap.old ? "text" : "password"} 
                        value={passwordForm.oldPassword} 
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))} 
                        required 
                        style={{ width: '100%', padding: '9px 40px 9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassMap(prev => ({ ...prev, old: !prev.old }))}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', color: '#64748B', display: 'flex', alignItems: 'center' }}
                      >
                        <i className={showPassMap.old ? "ti ti-eye-off" : "ti ti-eye"} style={{ fontSize: '16px' }}></i>
                      </button>
                    </div>
                  </div>

                  <div className="fg" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600 }}>Mật khẩu mới <span style={{ color: 'var(--rose)' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassMap.new ? "text" : "password"} 
                        value={passwordForm.newPassword} 
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))} 
                        required 
                        placeholder="Tối thiểu 8 ký tự"
                        style={{ width: '100%', padding: '9px 40px 9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassMap(prev => ({ ...prev, new: !prev.new }))}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', color: '#64748B', display: 'flex', alignItems: 'center' }}
                      >
                        <i className={showPassMap.new ? "ti ti-eye-off" : "ti ti-eye"} style={{ fontSize: '16px' }}></i>
                      </button>
                    </div>
                  </div>

                  <div className="fg" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600 }}>Xác nhận mật khẩu mới <span style={{ color: 'var(--rose)' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassMap.confirm ? "text" : "password"} 
                        value={passwordForm.confirmNewPassword} 
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))} 
                        required 
                        placeholder="Nhập lại mật khẩu mới"
                        style={{ width: '100%', padding: '9px 40px 9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassMap(prev => ({ ...prev, confirm: !prev.confirm }))}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', color: '#64748B', display: 'flex', alignItems: 'center' }}
                      >
                        <i className={showPassMap.confirm ? "ti ti-eye-off" : "ti ti-eye"} style={{ fontSize: '16px' }}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={updatingPassword}>
                    {updatingPassword ? <><i className="ti ti-loader animate-spin"></i> Đang đổi...</> : <><i className="ti ti-key"></i> Đổi mật khẩu</>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Statistics & opportunities list */}
          <div>
            {userTier !== 'Platinum' && (
              <div className="dash-card" style={{ padding: '1.25rem', border: '1px solid rgba(245,158,11,0.2)', background: 'linear-gradient(to bottom, rgba(245,158,11,0.02), rgba(0,0,0,0))', marginBottom: '1rem' }}>
                <div className="card-title" style={{ color: 'var(--amber)', marginBottom: '0.75rem' }}>
                  <i className="ti ti-arrow-big-up-lines"></i> {t('upgrade_tier_title')}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
                  {t('upgrade_tier_desc')}
                </p>
                {profileData.pending_tier_upgrade ? (
                  <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.06)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)', fontSize: '11.5px', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="ti ti-clock"></i> {t('upgrade_request_pending_prefix')}: {profileData.pending_tier_upgrade === 'Platinum' ? '💎 ' + t('tier_platinum') : '🏅 ' + t('tier_gold')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {userTier === 'Silver' && (
                      <button 
                        onClick={() => handleRequestUpgrade('Gold')}
                        className="btn" 
                        style={{ flex: 1, fontSize: '11.5px', padding: '6px 10px', background: 'var(--amber)', borderColor: 'var(--amber)', color: '#000', fontWeight: 600 }}
                      >
                        🏅 {t('btn_upgrade_gold')}
                      </button>
                    )}
                    <button 
                      onClick={() => handleRequestUpgrade('Platinum')}
                      className="btn btn-primary" 
                      style={{ flex: 1, fontSize: '11.5px', padding: '6px 10px', fontWeight: 600 }}
                    >
                      💎 {t('btn_upgrade_platinum')}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="dash-card" style={{ padding: '1.25rem' }}>
              <div className="card-title" style={{ marginBottom: '1rem' }}>
                <i className="ti ti-chart-bar"></i> {t('posts_stats_title')}
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-val">{dbStats.total_posts}</div>
                  <div className="stat-lbl">{t('stat_total_posts')}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-val">{dbStats.approved_posts}</div>
                  <div className="stat-lbl">{t('stat_approved_posts')}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-val">{dbStats.total_views}</div>
                  <div className="stat-lbl">{t('stat_total_views')}</div>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="card-title">
                <i className="ti ti-list-details"></i> {t('my_published_posts_title')}
              </div>

              {memberPosts.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  {t('no_posts_published')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {memberPosts.map(p => (
                    <div className="post-item" key={p.id}>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span>{p.type}</span>
                          <span>·</span>
                          <span><i className="ti ti-eye"></i> {p.views || 0}</span>
                          <span>·</span>
                          <button 
                            onClick={() => handleStartEditPost(p.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', outline: 'none' }}
                          >
                            <i className="ti ti-edit"></i> {t('btn_edit')}
                          </button>
                          <span>·</span>
                          <button 
                            onClick={() => handleDeletePost(p.id, p.title)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', outline: 'none' }}
                          >
                            <i className="ti ti-trash"></i> {t('btn_delete')}
                          </button>
                        </div>
                      </div>
                      <span className={`badge ${(p.status === 'hidden' || (p.deadline && new Date(p.deadline) < new Date())) ? 'rejected' : p.status === 'approved' ? 'approved' : p.status === 'rejected' ? 'rejected' : p.status === 'draft' ? 'draft' : 'pending'}`}>
                        {(p.status === 'hidden' || (p.deadline && new Date(p.deadline) < new Date())) ? '❌ Đã bị ẩn (Hết hạn)' : p.status === 'approved' ? t('status_approved') : p.status === 'rejected' ? t('status_rejected') : p.status === 'draft' ? t('status_draft') : t('status_pending')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thẻ Card: Lịch sử Đăng ký Sự kiện & Vé Điện Tử */}
            <div className="dash-card" style={{ marginTop: '1.5rem' }}>
              <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ti ti-ticket" style={{ color: '#0D9488' }}></i>
                  <span>Lịch sử Đăng ký Sự kiện & Vé của tôi</span>
                </span>
                <Link to="/events" className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 10px', textDecoration: 'none' }}>
                  <i className="ti ti-calendar-plus"></i> Khám phá sự kiện
                </Link>
              </div>

              {loadingEvents ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <i className="ti ti-loader animate-spin" style={{ marginRight: '6px' }}></i> Đang tải danh sách vé...
                </div>
              ) : memberEvents.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <i className="ti ti-ticket-off" style={{ fontSize: '28px', opacity: 0.4, display: 'block', marginBottom: '8px' }}></i>
                  Bạn chưa đăng ký tham gia sự kiện nào.
                  <div style={{ marginTop: '6px' }}>
                    <Link to="/events" style={{ color: '#0D9488', fontWeight: '600', textDecoration: 'none' }}>
                      Xem lịch sự kiện kết nối doanh nghiệp →
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {memberEvents.map(evt => {
                    const isPaid = evt.payment_status === 'paid';
                    const isPending = evt.payment_status === 'pending';
                    const isFree = evt.payment_status === 'free';
                    const isCheckedIn = evt.checkin_status === 'checked_in';

                    return (
                      <div
                        key={evt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg-card)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {evt.event_title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                            <span><i className="ti ti-ticket"></i> Mã: <strong style={{ color: 'var(--text-primary)' }}>{evt.ticket_code}</strong></span>
                            <span>·</span>
                            <span>SL: <strong>{evt.quantity} vé</strong></span>
                            <span>·</span>
                            <span>
                              {isFree ? 'Miễn phí' : `${Number(evt.total_amount).toLocaleString('vi-VN')} đ`}
                            </span>
                            {evt.location && (
                              <>
                                <span>·</span>
                                <span><i className="ti ti-map-pin"></i> {evt.location}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: isCheckedIn ? '#D1FAE5' : isPaid ? '#DBEAFE' : isPending ? '#FEF3C7' : '#F1F5F9',
                              color: isCheckedIn ? '#065F46' : isPaid ? '#1E40AF' : isPending ? '#B45309' : '#475569'
                            }}
                          >
                            {isCheckedIn ? '✓ Đã Check-in' : isPaid ? 'Đã thanh toán' : isPending ? 'Chờ duyệt thanh toán' : 'Vé miễn phí'}
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedTicket(evt)}
                            className="btn btn-primary"
                            style={{
                              padding: '5px 12px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderRadius: '6px'
                            }}
                          >
                            <i className={isPending ? 'ti ti-file-info' : 'ti ti-qrcode'}></i>
                            {isPending ? 'Xem trạng thái' : 'Xem vé'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modal đăng cơ hội giao thương mới */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,14,30,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', borderColor: 'var(--border-strong)', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <i className="ti ti-plus" style={{ color: 'var(--neon-cyan)' }}></i> {editingPostId ? t('modal_edit_post_title') : t('modal_create_post_title')}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}><i className="ti ti-x"></i></button>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '6px' }}>
                <div className="fg">
                  <label>{t('modal_post_title_label')} <span style={{ color: 'var(--rose)' }}>*</span></label>
                  <input type="text" id="title" value={newPostData.title} onChange={handleNewPostChange} placeholder={t('modal_post_title_placeholder')} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="fg">
                    <label>Chuyên mục <span style={{ color: 'var(--rose)' }}>*</span></label>
                    <select 
                      id="category" 
                      value={newPostData.category} 
                      onChange={(e) => {
                        const cat = e.target.value;
                        setNewPostData(prev => ({ ...prev, category: cat, sub_category: '' }));
                      }}
                      required
                    >
                      <option value="">-- {currentLang === 'en' ? 'Select category' : 'Chọn Chuyên mục'} --</option>
                      {categoriesList.map(c => (
                        <option key={c.id || c.name} value={c.name}>{getCategoryLabel(c, currentLang)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="fg">
                    <label>Lĩnh vực <span style={{ color: 'var(--rose)' }}>*</span></label>
                    <select 
                      id="sub_category" 
                      value={newPostData.sub_category} 
                      onChange={(e) => setNewPostData(prev => ({ ...prev, sub_category: e.target.value }))}
                      disabled={!newPostData.category}
                      required
                    >
                      <option value="">-- {currentLang === 'en' ? 'Select sector' : 'Chọn Lĩnh vực'} --</option>
                      {((categoriesList.find(c => c.name === newPostData.category)?.subcategories || []).map(s => typeof s === 'string' ? s : s.name)).map(sub => (
                        <option key={sub} value={sub}>{getCategoryLabel(sub, currentLang)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="fg">
                    <label>{t('modal_post_type_label')}</label>
                    <select id="type" value={newPostData.type || 'Tin chung'} onChange={handleNewPostChange}>
                      <option value="Tin chung">{t('type_general_news')} (Mặc định)</option>
                      <option value="Tìm kiếm đối tác">{t('type_find_partner')}</option>
                      <option value="Cần mua / Cần bán">{t('type_buy_sell')}</option>
                      <option value="Thông báo sự kiện">{t('type_event_announcement')}</option>
                      <option value="Tuyển dụng">{t('type_recruitment')}</option>
                      <option value="Khác">{t('type_other')}</option>
                    </select>
                  </div>

                  <div className="fg">
                    <label>Từ khoá (phân tách bằng dấu phẩy)</label>
                    <input type="text" id="tags" value={newPostData.tags} onChange={handleNewPostChange} placeholder="Ví dụ: du lịch di sản, khách sạn Hội An, ẩm thực Huế" />
                  </div>
                </div>

                <div className="fg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>Tóm tắt bài đăng (Meta Description — Tối đa 160 ký tự)</label>
                    <span style={{ fontSize: '11px', color: (newPostData.summary || '').length >= 160 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                      {(newPostData.summary || '').length}/160 ký tự
                    </span>
                  </div>
                  <input 
                    type="text" 
                    id="summary" 
                    value={newPostData.summary} 
                    onChange={handleNewPostChange} 
                    maxLength={160}
                    placeholder="Mô tả tóm tắt ngắn gọn hiển thị trên Google Search & Zalo/FB preview (tối đa 160 ký tự)..." 
                  />
                </div>

                <div className="fg">
                  <label>{t('modal_post_body_label')} <span style={{ color: 'var(--rose)' }}>*</span></label>
                  <RichTextEditor 
                    value={newPostData.body} 
                    onChange={(val) => setNewPostData(prev => ({ ...prev, body: val }))} 
                    placeholder={t('modal_post_body_label')} 
                  />
                </div>

                <div className="fg">
                  <label>{t('modal_post_contact_label')} <span style={{ color: 'var(--rose)' }}>*</span></label>
                  <input type="text" id="contact_info" value={newPostData.contact_info} onChange={handleNewPostChange} placeholder={t('modal_post_contact_placeholder')} required />
                </div>

                <div className="fg">
                  <label>Hạn đăng bài (Tự động ẩn khi đến ngày cài đặt, để trống nếu hiển thị vĩnh viễn)</label>
                  <input type="date" id="deadline" value={newPostData.deadline} onChange={handleNewPostChange} />
                </div>

                <div className="fg">
                  <label>{t('modal_post_image_label')}</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      id="image_url" 
                      value={newPostData.image_url} 
                      onChange={handleNewPostChange} 
                      placeholder={t('modal_post_image_placeholder')} 
                      style={{ flex: 1 }} 
                    />
                    <label 
                      className="btn" 
                      style={{ 
                        fontSize: '11px', 
                        padding: '9px 12px', 
                        cursor: 'pointer', 
                        margin: 0, 
                        flexShrink: 0,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#FFF'
                      }}
                    >
                      <i className="ti ti-upload"></i> {t('btn_choose_file')}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                  {uploadingImage && <div style={{ fontSize: '11px', color: 'var(--primary-light)', marginTop: '2px' }}><i className="ti ti-loader animate-spin"></i> {t('status_uploading_image')}</div>}
                </div>

                {profileData.tier === 'Platinum' && (
                  <div className="fg" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px', background: 'rgba(245, 158, 11, 0.05)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <input 
                      type="checkbox" 
                      id="featured_requested" 
                      checked={newPostData.featured_requested === 1}
                      onChange={(e) => setNewPostData(prev => ({ ...prev, featured_requested: e.target.checked ? 1 : 0 }))} 
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="featured_requested" style={{ margin: 0, cursor: 'pointer', fontSize: '13px', fontWeight: 650, color: 'var(--amber)' }}>
                      <i className="ti ti-star-filled"></i> {t('modal_request_featured_label')}
                    </label>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <button type="button" className="btn" onClick={() => setModalOpen(false)}>{t('btn_cancel')}</button>
                <button 
                  type="button" 
                  onClick={() => handleSubmitAction(true)} 
                  className="btn" 
                  style={{ backgroundColor: 'rgba(12,35,64,0.06)', borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                  disabled={creatingPost || uploadingImage}
                >
                  {t('btn_save_draft')}
                </button>
                <button 
                  type="button" 
                  onClick={() => handleSubmitAction(false)} 
                  className="btn btn-primary" 
                  disabled={creatingPost || uploadingImage}
                >
                  {creatingPost ? <><i className="ti ti-loader animate-spin"></i> {t('btn_sending')}</> : (editingPostId ? <><i className="ti ti-save"></i> {t('btn_update_publish')}</> : <><i className="ti ti-plus"></i> {t('btn_publish')}</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Vé & QR Check-in */}
      {selectedTicket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,14,30,0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '0', borderColor: 'var(--border-strong)', textAlign: 'left', overflow: 'hidden', borderRadius: '16px', backgroundColor: '#ffffff', color: '#1E293B', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
            
            {/* Header Modal */}
            <div style={{ backgroundColor: '#064E3B', color: '#ffffff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#6EE7B7', fontWeight: '700' }}>
                  Vé Tham Dự Điện Tử
                </div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>
                  {selectedTicket.event_title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
              >
                <i className="ti ti-x"></i>
              </button>
            </div>

            {/* Body Vé */}
            <div style={{ padding: '1.5rem', maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Box Mã vé & QR HOẶC Thông báo chờ duyệt thanh toán */}
              {selectedTicket.payment_status === 'pending' && Number(selectedTicket.total_amount) > 0 ? (
                <div style={{ border: '2px dashed #F59E0B', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#FFFBEB', textAlign: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                    fontSize: '24px'
                  }}>
                    <i className="ti ti-clock"></i>
                  </div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#B45309', fontWeight: '800', letterSpacing: '0.6px' }}>
                    TRẠNG THÁI VÉ
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#92400E', margin: '4px 0 8px' }}>
                    Đang chờ duyệt thanh toán
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#78350F', lineHeight: 1.5, margin: '0 auto', maxWidth: '420px' }}>
                    Bạn đã đăng ký sự kiện có phí và gửi thông tin thanh toán. Ban tổ chức đang kiểm tra và đối soát chuyển khoản. Vé tham dự chính thức kèm mã QR check-in sẽ tự động hiển thị tại đây ngay khi thanh toán được chuyển sang trạng thái <strong>Đã thanh toán</strong>.
                  </div>

                  {selectedTicket.payment_proof && (
                    <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #FDE68A', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <i className="ti ti-receipt" style={{ color: '#D97706', fontSize: '18px' }}></i>
                      <span style={{ fontSize: '12px', color: '#451A03', fontWeight: '600' }}>Chứng từ thanh toán:</span>
                      <a href={selectedTicket.payment_proof} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#2563EB', fontWeight: '700', textDecoration: 'underline' }}>
                        Xem ảnh bill đã gửi
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ border: '2px dashed #0D9488', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#F0FDFA', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#0F766E', fontWeight: '700', letterSpacing: '0.6px' }}>
                    MÃ VÉ CHECK-IN CHÍNH THỨC
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '1px', margin: '4px 0 10px' }}>
                    {selectedTicket.ticket_code}
                  </div>

                  {selectedTicket.qr_image ? (
                    <div style={{ width: '180px', height: '180px', margin: '0 auto', backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <img
                        src={selectedTicket.qr_image}
                        alt="QR Check-in"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', color: '#64748B', fontSize: '12px' }}>
                      Mã QR sẽ hiển thị sau khi kích hoạt vé.
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '8px' }}>
                    Vui lòng xuất trình mã QR này tại cổng sự kiện để check-in.
                  </div>
                </div>
              )}

              {/* Thông tin vé */}
              <div style={{ fontSize: '12.5px', color: '#334155', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div><strong>Người đăng ký:</strong> {selectedTicket.full_name}</div>
                <div><strong>Số điện thoại:</strong> {selectedTicket.phone}</div>
                {selectedTicket.email && <div><strong>Email:</strong> {selectedTicket.email}</div>}
                <div><strong>Số lượng:</strong> {selectedTicket.quantity} vé</div>
                <div><strong>Tổng tiền:</strong> {Number(selectedTicket.total_amount) > 0 ? `${Number(selectedTicket.total_amount).toLocaleString('vi-VN')} VNĐ` : 'Miễn phí'}</div>
                <div>
                  <strong>Trạng thái thanh toán:</strong>{' '}
                  <span style={{ fontWeight: '700', color: selectedTicket.payment_status === 'paid' ? '#059669' : selectedTicket.payment_status === 'pending' ? '#D97706' : '#2563EB' }}>
                    {selectedTicket.payment_status === 'paid' ? 'Đã thanh toán' : selectedTicket.payment_status === 'pending' ? 'Chờ duyệt thanh toán' : 'Miễn phí'}
                  </span>
                </div>
                <div>
                  <strong>Trạng thái check-in:</strong>{' '}
                  <span style={{ fontWeight: '700', color: selectedTicket.checkin_status === 'checked_in' ? '#059669' : '#64748B' }}>
                    {selectedTicket.checkin_status === 'checked_in'
                      ? `✓ Đã Check-in (${selectedTicket.checkin_time ? formatVNDateTime(selectedTicket.checkin_time) : 'đã ghi nhận'})`
                      : 'Chưa check-in'}
                  </span>
                </div>
              </div>

              {/* VietQR nếu đang chờ thanh toán */}
              {selectedTicket.payment_status === 'pending' && Number(selectedTicket.total_amount) > 0 && selectedTicket.vietqr_url && (
                <div style={{ border: '1px solid #FCD34D', backgroundColor: '#FFFBEB', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ color: '#B45309', fontWeight: '800', fontSize: '13px', marginBottom: '6px' }}>
                    Quét mã VietQR để thanh toán chuyển khoản
                  </div>
                  <img
                    src={selectedTicket.vietqr_url}
                    alt="VietQR"
                    style={{ maxWidth: '220px', width: '100%', borderRadius: '8px', border: '1px solid #FDE68A', margin: '0 auto' }}
                  />
                  <div style={{ fontSize: '12px', color: '#451A03', marginTop: '8px' }}>
                    Cú pháp chuyển khoản: <code style={{ fontWeight: '800', color: '#B45309' }}>{selectedTicket.payment_note}</code>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Modal */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', backgroundColor: '#F8FAFC' }}>
              {selectedTicket.payment_status === 'paid' || Number(selectedTicket.total_amount) === 0 ? (
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#ffffff', color: '#334155', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="ti ti-printer"></i> In vé
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="ti ti-lock"></i> In vé sau khi duyệt
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: '#064E3B', color: '#ffffff', border: 'none', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
export default MemberDashboard;
