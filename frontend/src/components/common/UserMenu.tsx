import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import { logoutUser } from '../../store/thunks/authThunks';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    try {
      dispatch(logoutUser());
      // Очищаем хранилище
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('persist:root'); // Если используете redux-persist
      // Перенаправляем на страницу авторизации
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="user-menu">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="user-menu-button"
        aria-label="Меню пользователя"
      >
        <User className="user-menu-icon" />
        <span className="user-menu-text">{user.username || 'Гость'}</span>
      </button>

      {isOpen && (
        <div className="user-dropdown">
          <button
            onClick={handleLogout}
            className="user-dropdown-logout"
            aria-label="Выйти из системы"
          >
            <LogOut className="user-dropdown-logout-icon" />
            <span>Выйти</span>
          </button>
        </div>
      )}
    </div>
  );
}