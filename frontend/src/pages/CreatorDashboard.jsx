import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import RichTextEditor from '../components/RichTextEditor';
import { CATEGORIES_DATA, getCategoryLabel } from '../constants/categories';

export const CreatorDashboard = () => {
  const { role, user, token, getAuthHeaders } = useAuth();
  const { currentLang, t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatorProfile, setCreatorProfile] = useState(user);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ totalPosts: 0, approvedPosts: 0, totalViews: 0 });

  // Modal State cho tạo / sửa bài đăng
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [newPostData, setNewPostData] = useState({
    title: '', summary: '', body: '', type: 'Tin chung',
    category: '', sub_category: '', source_url: '', tags: '', contact_info: '', deadline: '',
    image_url: ''
  });
  const [creatingPost, setCreatingPost] = useState(false);
  const [categoriesList, setCategoriesList] = useState(CATEGORIES_DATA);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (role !== 'creator') {
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/creator/posts', {
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Không thể tải danh sách bài viết');
        const data = await res.json();
        if (data.success) {
          setPosts(data.data || []);
          setStats(data.stats || { totalPosts: 0, approvedPosts: 0, totalViews: 0 });
          if (data.creator) {
            setCreatorProfile(data.creator);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

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
        console.error("Lỗi tải danh mục:", err);
      }
    };

    loadData();
    fetchCategories();
  }, [role, navigate]);

  const loadPosts = async () => {
    try {
      const res = await fetch('/api/creator/posts', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPosts(data.data || []);
          setStats(data.stats || { totalPosts: 0, approvedPosts: 0, totalViews: 0 });
          if (data.creator) {
            setCreatorProfile(data.creator);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPostId(null);
    setNewPostData({
      title: '', summary: '', body: '', type: 'Tin chung',
      category: categoriesList[0]?.name || '',
      sub_category: categoriesList[0]?.subcategories?.[0] ? (typeof categoriesList[0].subcategories[0] === 'string' ? categoriesList[0].subcategories[0] : categoriesList[0].subcategories[0].name) : '',
      source_url: '', tags: '', contact_info: user?.name || '', deadline: '', image_url: ''
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (post) => {
    setEditingPostId(post.id);

    let tagStr = '';
    if (post.tags) {
      try {
        const parsed = typeof post.tags === 'string' && post.tags.startsWith('[') ? JSON.parse(post.tags) : post.tags;
        tagStr = Array.isArray(parsed) ? parsed.join(', ') : String(parsed);
      } catch (e) {
        tagStr = String(post.tags);
      }
    }

    setNewPostData({
      title: post.title || '',
      summary: post.summary || '',
      body: post.body || '',
      type: post.type || 'Tin chung',
      category: post.category || '',
      sub_category: post.sub_category || '',
      source_url: post.source_url || '',
      tags: tagStr,
      contact_info: post.contact_info || '',
      deadline: post.deadline ? post.deadline.split('T')[0] : '',
      image_url: post.image_url || ''
    });
    setModalOpen(true);
  };

  const handleNewPostChange = (e) => {
    const { id, value } = e.target;
    setNewPostData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('Dung lượng tệp vượt quá 50MB. Vui lòng chọn tệp nhỏ hơn.');
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
          alert(data.error || 'Tải ảnh lên không thành công.');
        }
      } catch (err) {
        alert('Lỗi khi tải ảnh lên: ' + err.message);
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateOrEditPost = async (isDraft = false) => {
    if (!newPostData.title.trim()) {
      alert('Vui lòng nhập tiêu đề bài đăng');
      return;
    }
    if (!newPostData.category) {
      alert('Vui lòng chọn Chuyên mục cho bài viết');
      return;
    }
    if (!newPostData.sub_category) {
      alert('Vui lòng chọn Lĩnh vực cho bài viết');
      return;
    }
    if (!newPostData.body.trim()) {
      alert('Vui lòng nhập nội dung chi tiết bài đăng');
      return;
    }

    let tagsArr = [];
    if (newPostData.tags) {
      tagsArr = newPostData.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const payload = {
      ...newPostData,
      tags: tagsArr,
      isDraft: isDraft
    };

    setCreatingPost(true);
    try {
      const url = editingPostId ? `/api/creator/posts/${editingPostId}` : '/api/creator/posts';
      const method = editingPostId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert(data.message || (editingPostId ? 'Đã cập nhật bài đăng thành công!' : 'Đã đăng bài thành công!'));
        setModalOpen(false);
        loadPosts();
      } else {
        alert('Có lỗi xảy ra: ' + (data.error || 'Không thể lưu bài viết.'));
      }
    } catch (err) {
      alert('Lỗi kết nối server: ' + err.message);
    } finally {
      setCreatingPost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.')) return;
    try {
      const res = await fetch(`/api/creator/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Đã xóa bài viết thành công.');
        loadPosts();
      } else {
        alert(data.error || 'Không thể xóa bài viết.');
      }
    } catch (err) {
      alert('Lỗi khi xóa bài viết: ' + err.message);
    }
  };

  const currentCreator = creatorProfile || user;

  return (
    <div className="public-body">
      <SEOHead title="Dashboard Biên tập viên | DoanhNghiepVN.today" description="Trang quản trị bài viết dành riêng cho Biên tập viên DoanhNghiepVN.today" />
      <Navbar />

      <div className="public-container" style={{ minHeight: '80vh', paddingBottom: '4rem', paddingTop: '2rem' }}>
        
        {/* Banner tiêu đề Dashboard */}
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', borderLeft: '4px solid var(--neon-cyan)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Dashboard Biên tập viên: <span style={{ color: 'var(--neon-cyan)' }}>{currentCreator?.name || currentCreator?.username}</span>
              </h1>
              <span style={{ 
                fontSize: '11px', 
                padding: '3px 10px', 
                borderRadius: '12px', 
                fontWeight: 700, 
                textTransform: 'uppercase',
                background: Number(currentCreator?.requires_approval) === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: Number(currentCreator?.requires_approval) === 0 ? '#10b981' : '#f59e0b',
                border: Number(currentCreator?.requires_approval) === 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                {Number(currentCreator?.requires_approval) === 0 ? '⚡ Duyệt bài tự động' : '⏳ Cần Admin duyệt'}
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
              Quản trị & xuất bản tin tức, bài viết truyền thông DoanhNghiepVN.today.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/guide?role=creator" target="_blank" className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '13.5px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ti ti-book"></i> Hướng dẫn BTV
            </Link>
            <button onClick={handleOpenCreateModal} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-plus" style={{ fontSize: '18px' }}></i> Đăng bài viết mới
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <i className="ti ti-loader animate-spin" style={{ fontSize: '32px', color: 'var(--primary)' }}></i>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Đang tải dữ liệu bài viết...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', textAlign: 'center' }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* 3 Thống kê chính */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Tổng tin bài</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary-dark)', fontFamily: 'var(--font-title)' }}>{stats.totalPosts}</div>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Đã xuất bản</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-title)' }}>{stats.approvedPosts}</div>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Tổng lượt xem</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--font-title)' }}>{stats.totalViews}</div>
              </div>
            </div>

            {/* Danh sách Bài viết đã đăng */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="ti ti-list-details" style={{ color: 'var(--primary)' }}></i> Bài viết đã đăng của bạn ({posts.length})
              </h2>

              {posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <i className="ti ti-news-off" style={{ fontSize: '48px', marginBottom: '12px', display: 'block', opacity: 0.5 }}></i>
                  <p style={{ margin: 0, fontSize: '14px' }}>Bạn chưa tạo bài viết nào. Hãy nhấn nút <strong>"Đăng bài viết mới"</strong> để bắt đầu!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {posts.map(post => (
                    <div 
                      key={post.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justify: 'space-between', 
                        padding: '1.25rem', 
                        borderRadius: '12px', 
                        background: 'var(--surface-1)', 
                        border: '1px solid var(--border)',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontWeight: 700, 
                            textTransform: 'uppercase',
                            background: (post.status === 'hidden' || (post.deadline && new Date(post.deadline) < new Date())) ? 'rgba(239,68,68,0.15)' : post.status === 'approved' ? 'rgba(16,185,129,0.1)' : post.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.1)',
                            color: (post.status === 'hidden' || (post.deadline && new Date(post.deadline) < new Date())) ? '#ef4444' : post.status === 'approved' ? '#10b981' : post.status === 'pending' ? 'var(--amber)' : 'var(--text-muted)'
                          }}>
                            {(post.status === 'hidden' || (post.deadline && new Date(post.deadline) < new Date())) ? '❌ Đã bị ẩn (Hết hạn)' : post.status === 'approved' ? 'Đã duyệt' : post.status === 'pending' ? 'Chờ duyệt' : 'Bản nháp'}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {post.category} • {post.sub_category}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                          {post.title}
                        </h3>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '16px' }}>
                          <span><i className="ti ti-calendar"></i> {new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                          <span><i className="ti ti-eye"></i> {post.views || 0} lượt xem</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link to={`/posts/${post.slug || post.id}`} target="_blank" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12.5px', borderRadius: '8px' }}>
                          <i className="ti ti-external-link"></i> Xem bài
                        </Link>
                        <button onClick={() => handleOpenEditModal(post)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12.5px', borderRadius: '8px', color: 'var(--primary)' }}>
                          <i className="ti ti-edit"></i> Sửa
                        </button>
                        <button onClick={() => handleDeletePost(post.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12.5px', borderRadius: '8px', color: '#ef4444' }}>
                          <i className="ti ti-trash"></i> Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Modal Đăng / Sửa bài viết */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,14,30,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '750px', padding: '2rem', borderColor: 'var(--border-strong)', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '17px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <i className="ti ti-plus" style={{ color: 'var(--neon-cyan)' }}></i> {editingPostId ? 'Chỉnh sửa bài viết' : 'Soạn bài viết mới'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}><i className="ti ti-x"></i></button>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '8px' }}>
                
                {/* Tiêu đề bài viết */}
                <div className="fg">
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Tiêu đề bài đăng <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" id="title" value={newPostData.title} onChange={handleNewPostChange} placeholder="Nhập tiêu đề bài viết chuẩn SEO..." required />
                </div>

                {/* Chuyên mục & Lĩnh vực */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="fg">
                    <label style={{ fontSize: '13px', fontWeight: 600 }}>Chuyên mục <span style={{ color: '#ef4444' }}>*</span></label>
                    <select 
                      id="category" 
                      value={newPostData.category} 
                      onChange={(e) => {
                        const cat = e.target.value;
                        setNewPostData(prev => ({ ...prev, category: cat, sub_category: '' }));
                      }}
                      required
                    >
                      <option value="">-- Chọn Chuyên mục --</option>
                      {categoriesList.map(c => (
                        <option key={c.id || c.name} value={c.name}>{getCategoryLabel(c, currentLang)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="fg">
                    <label style={{ fontSize: '13px', fontWeight: 600 }}>Lĩnh vực <span style={{ color: '#ef4444' }}>*</span></label>
                    <select 
                      id="sub_category" 
                      value={newPostData.sub_category} 
                      onChange={handleNewPostChange}
                      required
                    >
                      <option value="">-- Chọn Lĩnh vực --</option>
                      {((categoriesList.find(c => c.name === newPostData.category)?.subcategories || []).map(s => typeof s === 'string' ? s : s.name)).map(sub => (
                        <option key={sub} value={sub}>{getCategoryLabel(sub, currentLang)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Loại tin & Từ khóa Tags */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="fg">
                    <label style={{ fontSize: '13px', fontWeight: 600 }}>Loại tin bài</label>
                    <select id="type" value={newPostData.type || 'Tin chung'} onChange={handleNewPostChange}>
                      <option value="Tin chung">Tin chung (Mặc định)</option>
                      <option value="Tìm kiếm đối tác">Tìm kiếm đối tác</option>
                      <option value="Cần mua / Cần bán">Cần mua / Cần bán</option>
                      <option value="Thông báo sự kiện">Thông báo sự kiện</option>
                      <option value="Tuyển dụng">Tuyển dụng</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div className="fg">
                    <label style={{ fontSize: '13px', fontWeight: 600 }}>Từ khoá SEO (phân tách bằng dấu phẩy)</label>
                    <input type="text" id="tags" value={newPostData.tags} onChange={handleNewPostChange} placeholder="Ví dụ: du lịch di sản, văn hóa Đà Nẵng, lễ hội Huế" />
                  </div>
                </div>

                {/* Tóm tắt bài đăng (Meta Description max 160 ký tự) */}
                <div className="fg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Tóm tắt bài đăng (Meta Description — Tối đa 160 ký tự)</label>
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

                {/* Hạn đăng bài */}
                <div className="fg">
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Hạn đăng bài (Tự động ẩn khi đến ngày cài đặt, để trống nếu hiển thị vĩnh viễn)</label>
                  <input 
                    type="date" 
                    id="deadline" 
                    value={newPostData.deadline || ''} 
                    onChange={handleNewPostChange} 
                  />
                </div>

                {/* Nội dung chi tiết Rich Text */}
                <div className="fg">
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Nội dung chi tiết bài viết <span style={{ color: '#ef4444' }}>*</span></label>
                  <RichTextEditor 
                    value={newPostData.body} 
                    onChange={(val) => setNewPostData(prev => ({ ...prev, body: val }))} 
                    placeholder="Nhập nội dung chi tiết bài viết..." 
                  />
                </div>

                {/* Tải ảnh minh họa / Ảnh bìa */}
                <div className="fg">
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Ảnh bìa bài viết</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      id="image_url" 
                      value={newPostData.image_url} 
                      onChange={handleNewPostChange} 
                      placeholder="Dán URL link ảnh hoặc bấm nút bên để chọn tệp từ máy..." 
                    />
                    <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <i className="ti ti-upload"></i> {uploadingImage ? 'Đang tải...' : 'Chọn tệp'}
                      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploadingImage} />
                    </label>
                  </div>
                  {newPostData.image_url && (
                    <div style={{ marginTop: '8px' }}>
                      <img src={newPostData.image_url} alt="Cover Preview" style={{ maxHeight: '100px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                </div>

              </div>

              {/* Footer nút hành động */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary" style={{ padding: '8px 18px' }}>
                  Hủy
                </button>
                <button type="button" onClick={() => handleCreateOrEditPost(true)} className="btn btn-secondary" disabled={creatingPost} style={{ padding: '8px 18px' }}>
                  Lưu nháp
                </button>
                <button type="button" onClick={() => handleCreateOrEditPost(false)} className="btn btn-primary" disabled={creatingPost} style={{ padding: '8px 22px' }}>
                  {creatingPost ? <><i className="ti ti-loader animate-spin"></i> Đang gửi...</> : (Number(currentCreator?.requires_approval) === 0 ? '🚀 Xuất bản bài viết' : '📤 Đăng tin (Chờ duyệt)')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CreatorDashboard;
