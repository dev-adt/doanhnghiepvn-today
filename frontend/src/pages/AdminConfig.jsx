import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';

export const AdminConfig = () => {
  const { getAuthHeaders } = useAuth();

  // States
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);

  // Knowledge base states
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Model suggestions for each provider
  const modelSuggestions = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-20240620',
    gemini: 'gemini-1.5-flash',
    deepseek: 'deepseek-chat',
    openrouter: 'google/gemini-2.0-flash-001',
    ollama: 'llama3'
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/get-config', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setProvider(data.provider || 'gemini');
        setModel(data.model || '');
        setSystemInstruction(data.system_instruction || '');
        setHasStoredKey(data.hasKey || false);
        if (data.hasKey) {
          setApiKey('**************************************');
        }
      }
    } catch (e) {
      console.error("Error loading AI config", e);
      setMessage({ text: 'Không thể tải cấu hình AI hiện tại.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const loadKnowledgeFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch('/api/admin/knowledge-files', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setKnowledgeFiles(data);
      }
    } catch (e) {
      console.error("Error loading knowledge files", e);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadConfig();
    loadKnowledgeFiles();
  }, []);

  const handleProviderChange = (e) => {
    const p = e.target.value;
    setProvider(p);
    setModel(modelSuggestions[p] || '');
    setApiKey('');
    setHasStoredKey(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/admin/save-config', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider, model, apiKey, system_instruction: systemInstruction })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lưu cấu hình thất bại.');
      }
      setMessage({ text: 'Đã lưu cấu hình AI và API Key thành công!', type: 'success' });
      loadConfig();
    } catch (err) {
      setMessage({ text: err.message, type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file extensions
    const allowedExtensions = /(\.txt|\.md|\.json)$/i;
    if (!allowedExtensions.exec(file.name)) {
      alert("Chỉ chấp nhận các tệp văn bản có đuôi .txt, .md hoặc .json");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target.result;
      try {
        const res = await fetch('/api/admin/upload-knowledge', {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ filename: file.name, content })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Tải lên thất bại");
        
        alert("Đã tải tài liệu kiến thức lên thành công!");
        loadKnowledgeFiles();
      } catch (err) {
        alert(err.message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleFileDelete = async (filename) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài liệu kiến thức "${filename}"?`)) return;

    try {
      const res = await fetch(`/api/admin/knowledge-file/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xóa thất bại");

      alert("Đã xóa tài liệu kiến thức thành công!");
      loadKnowledgeFiles();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <AdminLayout title="Cấu hình Trợ Lý AI">
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
        <div className="card-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <div className="card-title" style={{ marginBlockStart: 0 }}><i className="ti ti-settings"></i> Thiết lập AI Model & Key</div>
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

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light-muted)' }}>
            <i className="ti ti-loader animate-spin" style={{ fontSize: '24px', display: 'block', margin: '0 auto 10px' }}></i> Đang tải cấu hình AI...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="fg">
              <label>AI Provider (Nhà cung cấp)</label>
              <select value={provider} onChange={handleProviderChange} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#fff', outline: 'none' }}>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="gemini">Google Gemini</option>
                <option value="deepseek">DeepSeek AI</option>
                <option value="openrouter">OpenRouter (Multi-model proxy)</option>
                <option value="ollama">Ollama (Local Offline AI)</option>
              </select>
            </div>

            <div className="fg">
              <label>Model ID (Mã mô hình)</label>
              <input 
                type="text" 
                value={model} 
                onChange={(e) => setModel(e.target.value)} 
                placeholder="Ví dụ: gemini-1.5-flash..." 
                required 
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none' }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                Gợi ý cho {provider}: <strong>{modelSuggestions[provider]}</strong>
              </span>
            </div>

            <div className="fg">
              <label>System Instruction (Chỉ dẫn hệ thống)</label>
              <textarea 
                value={systemInstruction} 
                onChange={(e) => setSystemInstruction(e.target.value)} 
                placeholder="Ví dụ: Bạn là trợ lý AI thông thái và thân thiện, chuyên cung cấp thông tin du lịch và kinh doanh của hệ sinh thái số DoanhNghiepVN.today..." 
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                Chỉ dẫn đặc thù định hình vai trò, nhiệm vụ và phong cách trả lời của AI dành cho hội viên.
              </span>
            </div>

            <div className="fg">
              <label>API Key {hasStoredKey && <span style={{ color: 'var(--emerald)', fontSize: '11px' }}>(Đã cấu hình trước đó)</span>}</label>
              <input 
                type={hasStoredKey ? 'text' : 'password'}
                value={apiKey} 
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setHasStoredKey(false);
                }} 
                placeholder={hasStoredKey ? '**************************************' : 'Nhập API key mới...'} 
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none' }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                API key được lưu trữ mã hóa và proxy an toàn từ server. Không bao giờ hiển thị trực tiếp cho phía khách.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><i className="ti ti-loader animate-spin"></i> Đang lưu...</> : <><i className="ti ti-save"></i> Lưu cấu hình AI</>}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Knowledge Base Card */}
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto 0', textAlign: 'left' }}>
        <div className="card-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <div className="card-title" style={{ marginBlockStart: 0 }}><i className="ti ti-books"></i> Tài liệu Kiến thức bổ sung (Knowledge Base)</div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBlockStart: 0, marginBlockEnd: '1rem', lineHeight: 1.5 }}>
            Tải lên các tài liệu văn bản để bổ sung kiến thức về văn hóa, lịch sử, di sản, điểm đến du lịch và đối tác DoanhNghiepVN.today. AI sẽ đọc và sử dụng thông tin trong các tệp này để trả lời hội viên.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label className="btn btn-primary" style={{ cursor: 'pointer', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i className="ti ti-upload"></i> {uploading ? "Đang tải lên..." : "Tải tài liệu lên (.txt, .md, .json)"}
              <input 
                type="file" 
                accept=".txt,.md,.json" 
                onChange={handleFileUpload} 
                disabled={uploading} 
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {loadingFiles ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light-muted)', fontSize: '13px' }}>
            <i className="ti ti-loader animate-spin"></i> Đang tải danh sách tài liệu...
          </div>
        ) : knowledgeFiles.length > 0 ? (
          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Tên tài liệu</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Dung lượng</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {knowledgeFiles.map((file, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < knowledgeFiles.length - 1 ? '1px solid var(--border)' : 'none', color: 'var(--text-primary)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}><i className="ti ti-file-text" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>{file.filename}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{(file.size / 1024).toFixed(1)} KB</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleFileDelete(file.filename)} 
                        style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: '15px' }}
                        title="Xóa tài liệu"
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-light-muted)', border: '1px dashed var(--border)', borderRadius: '8px', fontSize: '13px' }}>
            <i className="ti ti-folder-open" style={{ fontSize: '20px', display: 'block', margin: '0 auto 8px', color: 'var(--text-light-muted)' }}></i>
            Chưa có tài liệu kiến thức bổ sung nào được tải lên.
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
export default AdminConfig;
