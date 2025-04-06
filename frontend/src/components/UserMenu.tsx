import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { RootState } from '../store/store';
import { logoutUser } from '../store/thunks/authThunks';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <User className="h-5 w-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{user?.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="px-4 py-2">
            <p className="text-xs text-gray-500">Должность</p>
            <p className="text-sm text-gray-700">{user?.position}</p>
          </div>
          <div className="px-4 py-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">Подразделение</p>
            <p className="text-sm text-gray-700">
              {user?.division}
              {user?.subdivision && ` - ${user.subdivision}`}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Выйти</span>
          </button>
        </div>
      )}
    </div>
  );
}