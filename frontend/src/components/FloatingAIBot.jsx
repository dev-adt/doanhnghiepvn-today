import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

export const FloatingAIBot = () => {
  const { currentLang, t } = useTranslation();

  return (
    <Link
      to="/ai-chat"
      className="floating-ai-bot"
      title={currentLang === 'en' ? 'Vietnam Enterprise AI Assistant' : 'Trợ lý AI DoanhNghiepVN.today'}
      style={{
        position: 'fixed',
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textDecoration: 'none',
        cursor: 'pointer'
      }}
    >
      <style>{`
        @keyframes breathingEffect {
          0% {
            transform: scale(1);
            filter: drop-shadow(0 4px 12px rgba(2, 132, 199, 0.4));
          }
          50% {
            transform: scale(1.12);
            filter: drop-shadow(0 8px 24px rgba(2, 132, 199, 0.75));
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(0 4px 12px rgba(2, 132, 199, 0.4));
          }
        }
        .ai-breathing-head {
          animation: breathingEffect 2.6s infinite ease-in-out;
          transition: transform 0.3s ease;
        }
        .ai-breathing-head:hover {
          transform: scale(1.18) !important;
        }
      `}</style>

      {/* Floating Robot Avatar without background */}
      <div
        className="ai-breathing-head"
        style={{
          width: '72px',
          height: '72px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent'
        }}
      >
        <img
          src="/ai_robot_avatar-removebg.png"
          alt="AI Assistant"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: 'transparent'
          }}
        />
      </div>

      {/* Label under robot */}
      <span
        style={{
          marginTop: '4px',
          backgroundColor: 'rgba(12, 35, 64, 0.9)',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap'
        }}
      >
        {currentLang === 'en' ? 'AI Assistant' : 'Trợ lý AI'}
      </span>
    </Link>
  );
};

export default FloatingAIBot;
