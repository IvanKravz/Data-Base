// components/errors/AccessDenied.tsx
import React from 'react';
import { Home, ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AccessDenied.css';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  
  const handleGoHome = () => {
    navigate('/');         
  };

  const handleGoBack = () => {
    navigate(-1);           
  };

  // SVG иконка в минималистичном стиле
  const AccessDeniedIcon = () => (
    <svg className="access-denied-icon" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Основной щит */}
      <path
        d="M100 30L30 60V90C30 140 70 170 100 185C130 170 170 140 170 90V60L100 30Z"
        fill="url(#shieldGradient)"
        stroke="url(#shieldBorder)"
        strokeWidth="3"
      />

      {/* Замок */}
      <rect x="80" y="110" width="40" height="40" rx="8" fill="white" stroke="#e53e3e" strokeWidth="2" />
      <rect x="85" y="120" width="30" height="20" rx="4" fill="#e53e3e" />
      <circle cx="100" cy="90" r="12" fill="#e53e3e">
        <animate attributeName="r" values="12;14;12" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* Защитные полосы */}
      <line x1="60" y1="70" x2="140" y2="70" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
      <line x1="65" y1="80" x2="135" y2="80" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
      <line x1="70" y1="90" x2="130" y2="90" stroke="white" strokeWidth="2" strokeOpacity="0.3" />

      {/* Перечеркивающая линия */}
      <line x1="60" y1="140" x2="140" y2="160" stroke="#e53e3e" strokeWidth="4" strokeLinecap="round">
        <animate
          attributeName="stroke-dasharray"
          values="0, 115; 115, 0"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-dashoffset"
          values="0; -115"
          dur="2s"
          repeatCount="indefinite"
        />
      </line>

      {/* Декоративные элементы */}
      <circle cx="50" cy="50" r="3" fill="#e53e3e" opacity="0.3" />
      <circle cx="150" cy="50" r="3" fill="#c53030" opacity="0.3" />
      <circle cx="40" cy="150" r="2" fill="#e53e3e" opacity="0.2" />
      <circle cx="160" cy="150" r="2" fill="#c53030" opacity="0.2" />
      <circle cx="100" cy="30" r="4" fill="white">
        <animate attributeName="fill" values="white;#ffeaea;white" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Градиенты */}
      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff5f5" />
          <stop offset="100%" stopColor="#ffeaea" />
        </linearGradient>
        <linearGradient id="shieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e53e3e" />
          <stop offset="100%" stopColor="#c53030" />
        </linearGradient>
      </defs>
    </svg>
  );

  return (
    <div className="access-denied-container">
      <div className="access-denied-glow"></div>

      <div className="access-denied-content">
        <div className="access-denied-icon-container">
          <AccessDeniedIcon />
        </div>

        <h1 className="access-denied-title">
          Доступ ограничен
        </h1>

        <p className="access-denied-subtitle">
          У вас недостаточно прав для просмотра этой страницы.
          Если вам необходим доступ к этому ресурсу, обратитесь к администратору системы.
        </p>

        <div className="access-denied-actions">
          <button
            className="access-denied-button access-denied-button-back"
            onClick={handleGoBack}
          >
            <ArrowLeft size={20} />
            Вернуться назад
          </button>

          <button
            className="access-denied-button access-denied-button-home"
            onClick={handleGoHome}
          >
            <Home size={20} />
            На главную
          </button>
        </div>

        <div className="access-denied-footer">
          <div className="access-denied-code">
            Ошибка 403
          </div>
          <div className="access-denied-error-text">
            Доступ запрещен • Недостаточно прав
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;