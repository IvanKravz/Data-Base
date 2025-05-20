import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';
import './index.css';

// Проверка при загрузке приложения
const isFirstLoad = !sessionStorage.getItem('appLoaded');
if (isFirstLoad) {
  // Очищаем аутентификацию если это первая загрузка
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  sessionStorage.setItem('appLoaded', 'true');
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);