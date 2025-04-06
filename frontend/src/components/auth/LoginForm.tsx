import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './style.css'

interface LoginFormProps {
  onSubmit: (username: string, password: string) => void;
  loading?: boolean;
  error?: string | null;
}

export function LoginForm({ onSubmit, loading, error }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!username || !password) {
      setValidationError('Пожалуйста, заполните все поля');
      return;
    }

    onSubmit(username, password);
  };

  return (
    <div className="form-container">
      {(error || validationError) && (
        <div className="error-message">
          {error || validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="username" className="form-label">
            Логин
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
            placeholder="Введите логин"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Пароль
          </label>
          <div className="password-input-container">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Введите пароль"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="toggle-password-button"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="icon-eye" />
              ) : (
                <Eye className="icon-eye" />
              )}
            </button>
          </div>
        </div>

        <div className="submit">
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </div>
      </form>
    </div>
  );
}