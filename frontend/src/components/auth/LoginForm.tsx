import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './style.css';

interface LoginFormProps {
  onSubmit: (username: string, password: string) => void;
  onVerify2FA?: (tempToken: string, code: string) => void;
  loading?: boolean;
  error?: string | null;
  twoFARequired?: boolean;
  tempToken?: string | null;
  twoFAError?: string | null;
  twoFALoading?: boolean;
}

export function LoginForm({
  onSubmit,
  onVerify2FA,
  loading = false,
  error = null,
  twoFARequired = false,
  tempToken = null,
  twoFAError = null,
  twoFALoading = false,
}: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState<string[]>(['', '', '', '']);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Автофокус на первое поле 2FA при появлении
  useEffect(() => {
    if (twoFARequired) {
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    }
  }, [twoFARequired]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!username || !password) {
      setValidationError('Пожалуйста, заполните все поля');
      return;
    }
    onSubmit(username, password);
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = twoFACode.join('');
    if (code.length !== 4) {
      return;
    }
    if (tempToken) {
      onVerify2FA(tempToken, code);
    }
  };

  const handle2FAChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...twoFACode];
    newCode[index] = value.slice(-1);
    setTwoFACode(newCode);
    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
    // Автоматическая отправка при заполнении всех 4 цифр
    if (newCode.every(digit => digit !== '') && tempToken) {
      onVerify2FA(tempToken, newCode.join(''));
    }
  };

  const handle2FAKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !twoFACode[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // Сброс 2FA кода при смене этапа
  const reset2FA = () => {
    setTwoFACode(['', '', '', '']);
  };

  // Если требуется 2FA – показываем поля ввода кода
  if (twoFARequired) {
    return (
      <div className="form-container">
        {(twoFAError || error) && (
          <div className="error-message">{twoFAError || error}</div>
        )}
        <form onSubmit={handle2FASubmit} className="form twofa-form">
          <div className="twofa-instruction">
            <p>Введите 4-значный код</p>
          </div>
          <div className="twofa-inputs">
            {twoFACode.map((digit, idx) => (
              <input
                key={idx}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handle2FAChange(idx, e.target.value)}
                onKeyDown={(e) => handle2FAKeyDown(idx, e)}
                ref={(el) => (inputsRef.current[idx] = el)}
                className="twofa-digit"
                disabled={twoFALoading}
                autoComplete="off"
              />
            ))}
          </div>
          <div className="submit-fa">
            <button
              type="submit"
              className="submit-button"
              disabled={twoFALoading || twoFACode.some(d => !d)}
            >
              {twoFALoading ? 'Проверка...' : 'Подтвердить'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Стандартная форма логина
  return (
    <div className="form-container">
      {(error || validationError) && (
        <div className="error-message">{error || validationError}</div>
      )}
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="username" className="form-label">Логин</label>
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
          <label htmlFor="password" className="form-label">Пароль</label>
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
              {showPassword ? <EyeOff className="icon-eye" /> : <Eye className="icon-eye" />}
            </button>
          </div>
        </div>
        <div className="submit-fa">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </div>
      </form>
    </div>
  );
}