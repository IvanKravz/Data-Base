// components/errors/NotFoundPage.tsx
import React from 'react';
import { Home, ArrowLeft } from 'lucide-react';
import './NotFoundPage.css';

const NotFoundPage: React.FC = () => {
    const handleGoHome = () => {
        window.location.href = '/';
    };

    const handleGoBack = () => {
        window.history.back();
    };

    // SVG иконка в минималистичном стиле
    const NotFoundIcon = () => (
        <svg className="not-found-icon" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Основной круг */}
            <circle cx="100" cy="100" r="80" fill="url(#gradient1)" stroke="url(#gradient2)" strokeWidth="2" />

            {/* Сетка */}
            <path d="M100 20V180M180 100H20" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
            <path d="M140 60L60 140M60 60L140 140" stroke="white" strokeWidth="2" strokeOpacity="0.3" />

            {/* Вопросительные знаки */}
            <g transform="translate(80, 80)">
                <circle cx="0" cy="0" r="8" fill="#667eea" opacity="0.8">
                    <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="40" cy="40" r="6" fill="#764ba2" opacity="0.6">
                    <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" begin="0.5s" />
                </circle>
                <circle cx="-40" cy="-40" r="5" fill="#667eea" opacity="0.4">
                    <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" begin="1s" />
                </circle>
            </g>

            {/* Декоративные элементы */}
            <circle cx="150" cy="50" r="3" fill="#667eea" opacity="0.3" />
            <circle cx="50" cy="150" r="3" fill="#764ba2" opacity="0.3" />
            <circle cx="30" cy="40" r="2" fill="#667eea" opacity="0.2" />
            <circle cx="170" cy="160" r="2" fill="#764ba2" opacity="0.2" />

            {/* Градиенты */}
            <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f5f7fa" />
                    <stop offset="100%" stopColor="#e4edf5" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
            </defs>
        </svg>
    );

    return (
        <div className="not-found-container">
            <div className="not-found-glow"></div>

            <div className="not-found-content">
                <div className="not-found-icon-container">
                    <NotFoundIcon />
                </div>

                <h1 className="not-found-title">
                    Страница не найдена
                </h1>

                <p className="not-found-subtitle">
                    Запрашиваемая страница не существует или была перемещена.
                    Возможно, вы перешли по устаревшей ссылке или ввели неверный адрес.
                </p>

                <div className="not-found-actions">
                    <button
                        className="not-found-button not-found-button-back"
                        onClick={handleGoBack}
                    >
                        <ArrowLeft size={20} />
                        Вернуться назад
                    </button>

                    <button
                        className="not-found-button not-found-button-home"
                        onClick={handleGoHome}
                    >
                        <Home size={20} />
                        На главную
                    </button>
                </div>

                <div className="not-found-footer">
                    <div className="not-found-code">
                        Ошибка 404
                    </div>
                    <div className="not-found-error-text">
                        Страница не найдена • Ресурс недоступен
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;