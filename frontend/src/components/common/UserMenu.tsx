import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './style.css'
import { logoutUser } from '../../store/thunks/authThunks';


export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    try {
      dispatch(logoutUser());
      navigate('/auth');
      localStorage.removeItem('user')
      location.reload()
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="user-menu">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="user-menu-button"
      >
        <User className="user-menu-icon" />
        <span className="user-menu-text">{user.username}</span>
      </button>

      {isOpen && (
        <div className="user-dropdown">
            <button
            onClick={handleLogout}
            className="user-dropdown-logout"
          >
            <LogOut className="user-dropdown-logout-icon" />
            <span>Выйти</span>
          </button>
        </div>
      )}
    </div>
  );
}