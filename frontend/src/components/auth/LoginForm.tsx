import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
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
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState<string[]>(['', '', '', '']);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (twoFARequired) {
      setStep(2);
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    } else {
      setStep(1);
    }
  }, [twoFARequired]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!username || !password) {
      setValidationError('Пожалуйста, заполните все поля');
      return;
    }

    if (!twoFARequired) {
      onSubmit(username, password);
      return;
    }

    setStep(2);
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
      onVerify2FA?.(tempToken, newCode.join(''));
    }
  };

  const handle2FAKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !twoFACode[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h2 className="step-title">Вход в систему</h2>

      {/* Отображение ошибок на первом шаге */}
      {(error || validationError) && (
        <div className="error-message">
          <AlertCircle size={18} />
          <span>{error || validationError}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="username" className="form-label">Логин</label>
        <input
          ref={usernameInputRef}
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="form-input step-input"
          placeholder="Введите логин"
          disabled={loading}
          autoComplete="username"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">Пароль</label>
        <div className="password-input-container">
          <input
            ref={passwordInputRef}
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input step-input"
            placeholder="Введите пароль"
            disabled={loading}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="toggle-password-button"
            disabled={loading}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="submit-button"
        disabled={loading}
        onClick={handleStep1Submit}
      >
        {loading ? 'Вход...' : (twoFARequired ? 'Далее' : 'Войти')}
        {!loading && <ArrowRight size={18} style={{ marginLeft: '8px' }} />}
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h2 className="step-title-fa">Введите 4-значный код</h2>

      {(twoFAError || error) && (
        <div className="error-message">
          <AlertCircle size={18} />
          <span>{twoFAError || error}</span>
        </div>
      )}

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
            className="twofa-digit step-input"
            disabled={twoFALoading}
            autoComplete="off"
          />
        ))}
      </div>
      {/* Кнопка удалена – отправка автоматическая */}
    </div>
  );

  return (
    <div className="form-container steps-container">
      {/* <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${step === 1 ? 50 : 100}%` }}
        />
      </div> */}
      <div className="steps-wrapper">
        {step === 1 ? renderStep1() : renderStep2()}
      </div>
    </div>
  );
}